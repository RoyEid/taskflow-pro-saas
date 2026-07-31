import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import ActivityLog from "../models/ActivityLog.model.js";
import ChatReadState from "../models/ChatReadState.model.js";
import Client from "../models/Client.model.js";
import Comment from "../models/Comment.model.js";
import Feedback from "../models/Feedback.model.js";
import Message from "../models/Message.model.js";
import Notification from "../models/Notification.model.js";
import Project from "../models/Project.model.js";
import SupportRequest from "../models/SupportRequest.model.js";
import Task from "../models/Task.model.js";
import Workspace from "../models/Workspace.model.js";
import WorkspaceInvitation from "../models/WorkspaceInvitation.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import ApiError from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../../uploads");
const attachmentBucketName = "chatAttachments";

const getQueryWithSession = (query, session) =>
    session ? query.session(session) : query;

const getDeleteOptions = (session) => (session ? { session } : {});

const getAttachmentFilename = (fileUrl) => {
    const cleanUrl = String(fileUrl || "").split("?")[0].split("#")[0];
    const filename = path.basename(cleanUrl);

    return filename && filename !== "." ? filename : null;
};

const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const collectDeletionReferences = async (workspaceId) => {
    const [memberUserIds, invitedUserIds, messages] = await Promise.all([
        WorkspaceMember.distinct("user", { workspace: workspaceId }),
        WorkspaceInvitation.distinct("invitedUser", { workspace: workspaceId }),
        Message.find({
            workspace: workspaceId,
            fileUrl: { $nin: [null, ""] },
        })
            .select("fileUrl")
            .lean(),
    ]);

    const legacyAttachmentFilenames = [
        ...new Set(
            messages
                .map((message) => getAttachmentFilename(message.fileUrl))
                .filter(Boolean)
        ),
    ];

    return {
        affectedUserIds: [
            ...new Set(
                [...memberUserIds, ...invitedUserIds]
                    .filter(Boolean)
                    .map((id) => String(id))
            ),
        ],
        legacyAttachmentFilenames,
    };
};

const deleteWorkspaceDocuments = async ({ workspaceId, ownerId, session }) => {
    const workspaceQuery = Workspace.findById(workspaceId).select("owner");
    const workspace = await getQueryWithSession(workspaceQuery, session);

    if (!workspace) {
        throw new ApiError(404, "Workspace not found");
    }

    if (String(workspace.owner) !== String(ownerId)) {
        throw new ApiError(403, "Only the workspace owner can delete this workspace");
    }

    const options = getDeleteOptions(session);
    const deletionCounts = {};

    // Delete leaf/dependent records first. User documents are deliberately
    // excluded because accounts are shared across workspaces.
    deletionCounts.comments = (
        await Comment.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.tasks = (
        await Task.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.projects = (
        await Project.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.clients = (
        await Client.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.chatReadStates = (
        await ChatReadState.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.messages = (
        await Message.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.notifications = (
        await Notification.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.supportRequests = (
        await SupportRequest.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.feedback = (
        await Feedback.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.activityLogs = (
        await ActivityLog.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;
    deletionCounts.invitations = (
        await WorkspaceInvitation.deleteMany(
            { workspace: workspaceId },
            options
        )
    ).deletedCount;
    deletionCounts.members = (
        await WorkspaceMember.deleteMany({ workspace: workspaceId }, options)
    ).deletedCount;

    const workspaceDeletion = await Workspace.deleteOne(
        { _id: workspaceId, owner: ownerId },
        options
    );

    if (workspaceDeletion.deletedCount !== 1) {
        throw new ApiError(409, "Workspace deletion could not be completed");
    }

    deletionCounts.workspaces = workspaceDeletion.deletedCount;
    return deletionCounts;
};

const supportsTransactions = async () => {
    try {
        const hello = await mongoose.connection.db.admin().command({ hello: 1 });
        return Boolean(hello.setName || hello.msg === "isdbgrid");
    } catch (error) {
        console.warn(
            "[Workspace deletion] Could not inspect transaction support:",
            error.message
        );
        return false;
    }
};

const isUnsupportedTransactionError = (error) =>
    error?.code === 20 ||
    error?.codeName === "IllegalOperation" ||
    /transaction numbers are only allowed|replica set|does not support transactions/i.test(
        error?.message || ""
    );

const deleteDatabaseRecords = async ({ workspaceId, ownerId }) => {
    const canUseTransactions = await supportsTransactions();

    if (!canUseTransactions) {
        console.warn(
            "[Workspace deletion] MongoDB transactions are unavailable; " +
                "using ordered deletion with the Workspace document deleted last."
        );

        return {
            deletionCounts: await deleteWorkspaceDocuments({
                workspaceId,
                ownerId,
                session: null,
            }),
            transactionUsed: false,
        };
    }

    const session = await mongoose.startSession();

    try {
        let deletionCounts;

        try {
            await session.withTransaction(async () => {
                deletionCounts = await deleteWorkspaceDocuments({
                    workspaceId,
                    ownerId,
                    session,
                });
            });
        } catch (error) {
            if (!isUnsupportedTransactionError(error)) {
                throw error;
            }

            console.warn(
                "[Workspace deletion] Transactions were rejected by MongoDB; " +
                    "retrying with ordered deletion and deleting the Workspace last."
            );

            deletionCounts = await deleteWorkspaceDocuments({
                workspaceId,
                ownerId,
                session: null,
            });

            return { deletionCounts, transactionUsed: false };
        }

        return { deletionCounts, transactionUsed: true };
    } finally {
        await session.endSession();
    }
};

const deleteGridFsAttachments = async (workspaceId, warnings) => {
    if (!mongoose.connection.db) {
        warnings.push("GridFS attachment storage was unavailable");
        return 0;
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: attachmentBucketName,
    });
    const storedFiles = await bucket
        .find({ "metadata.workspaceId": String(workspaceId) })
        .toArray();
    let deletedCount = 0;

    for (const storedFile of storedFiles) {
        try {
            await bucket.delete(storedFile._id);
            deletedCount += 1;
        } catch (error) {
            warnings.push(
                `GridFS attachment ${storedFile.filename || storedFile._id} could not be removed: ${error.message}`
            );
        }
    }

    return deletedCount;
};

const deleteLegacyAttachments = async (filenames, warnings) => {
    let deletedCount = 0;

    for (const filename of filenames) {
        const fileSuffix = `/messages/attachments/${filename}`;
        const stillReferenced = await Message.exists({
            fileUrl: {
                $regex: new RegExp(`${escapeRegex(fileSuffix)}$`),
            },
        });

        if (stillReferenced) {
            continue;
        }

        const filePath = path.resolve(uploadDir, path.basename(filename));
        const relativePath = path.relative(uploadDir, filePath);

        if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
            warnings.push(`Unsafe legacy attachment path skipped: ${filename}`);
            continue;
        }

        try {
            await fs.promises.unlink(filePath);
            deletedCount += 1;
        } catch (error) {
            if (error.code !== "ENOENT") {
                warnings.push(
                    `Legacy attachment ${filename} could not be removed: ${error.message}`
                );
            }
        }
    }

    return deletedCount;
};

export const deleteWorkspacePermanently = async ({ workspaceId, ownerId }) => {
    const workspace = await Workspace.findById(workspaceId).select("owner");

    if (!workspace) {
        throw new ApiError(404, "Workspace not found");
    }

    if (String(workspace.owner) !== String(ownerId)) {
        throw new ApiError(403, "Only the workspace owner can delete this workspace");
    }

    const references = await collectDeletionReferences(workspaceId);
    const databaseResult = await deleteDatabaseRecords({ workspaceId, ownerId });
    const cleanupWarnings = [];
    const gridFsAttachmentsDeleted = await deleteGridFsAttachments(
        workspaceId,
        cleanupWarnings
    );
    const legacyAttachmentsDeleted = await deleteLegacyAttachments(
        references.legacyAttachmentFilenames,
        cleanupWarnings
    );

    for (const warning of cleanupWarnings) {
        console.error(`[Workspace deletion] ${warning}`);
    }

    return {
        deletedWorkspaceId: String(workspaceId),
        affectedUserIds: references.affectedUserIds,
        transactionUsed: databaseResult.transactionUsed,
        deletionCounts: databaseResult.deletionCounts,
        attachmentCleanup: {
            gridFsAttachmentsDeleted,
            legacyAttachmentsDeleted,
            warningCount: cleanupWarnings.length,
        },
    };
};
