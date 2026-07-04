import mongoose from "mongoose";

import ChatReadState from "../models/ChatReadState.model.js";
import Message from "../models/Message.model.js";
import Workspace from "../models/Workspace.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import { createNotification } from "./notification.service.js";
import ApiError from "../utils/ApiError.js";
import sendEmail from "../utils/sendEmail.js";

export const CHAT_MESSAGE_MAX_LENGTH = 2000;
export const CHAT_MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
export const CHAT_MESSAGE_DELETE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const DELETED_CHAT_MESSAGE_CONTENT = "This message was deleted.";
export const CHAT_SEARCH_MAX_LIMIT = 100;
export const CHAT_CONTEXT_WINDOW_SIZE = 25;

export const serializeUser = (user) => {
    if (!user) return null;

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
    };
};

export const serializeMessage = (message) => {
    const isDeleted = Boolean(message.isDeleted);
    const messageType = message.messageType || "text";
    const fileUrl = isDeleted ? null : message.fileUrl;

    return {
        _id: message._id,
        workspace: message.workspace,
        sender: message.sender,
        type: messageType,
        messageType,
        content: isDeleted ? DELETED_CHAT_MESSAGE_CONTENT : message.content,
        fileUrl,
        audioUrl: messageType === "audio" ? fileUrl : null,
        imageUrl: messageType === "image" ? fileUrl : null,
        fileName: isDeleted ? null : message.fileName,
        fileSize: isDeleted ? null : message.fileSize,
        mimeType: isDeleted ? null : message.mimeType,
        stickerId: isDeleted ? null : message.stickerId,
        audioDuration: isDeleted ? null : message.audioDuration,
        duration: !isDeleted && messageType === "audio" ? message.audioDuration : null,
        readBy: (message.readBy || []).map((read) => ({
            user: read.user,
            readAt: read.readAt,
        })),
        editedAt: message.editedAt,
        isDeleted,
        deletedAt: message.deletedAt,
        deletedBy: message.deletedBy,
        archivedAt: message.archivedAt,
        archivedBy: message.archivedBy,
        archiveBatchId: message.archiveBatchId,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
    };
};

const getObjectIdString = (value) => {
    if (!value) return null;
    return (value._id || value).toString();
};

const isOwnMessage = (message, userId) => {
    return getObjectIdString(message.sender) === getObjectIdString(userId);
};

const getActiveMembershipOrThrow = async (workspaceId, userId, membership) => {
    const activeMembership = membership || await findActiveMembership(workspaceId, userId);

    if (!activeMembership) {
        throw new ApiError(403, "You are not a member of this workspace");
    }

    return activeMembership;
};

const getEditableMessageOrThrow = async (workspaceId, messageId) => {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        throw new ApiError(400, "Invalid message ID");
    }

    const message = await Message.findOne({
        _id: messageId,
        workspace: workspaceId,
        archivedAt: null,
    });

    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    return message;
};

const isWithinWindow = (date, windowMs) => {
    const timestamp = date ? new Date(date).getTime() : null;

    if (!timestamp || Number.isNaN(timestamp)) {
        return false;
    }

    return Date.now() - timestamp <= windowMs;
};

const populateMessageSender = async (message) => {
    await message.populate("sender", "name email avatar");
    return message;
};

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const findActiveMembership = async (workspaceId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return null;
    }

    return WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userId,
        status: "active",
    });
};

export const getActiveWorkspaceMembers = async (workspaceId) => {
    return WorkspaceMember.find({
        workspace: workspaceId,
        status: "active",
    })
        .populate("user", "name email avatar status")
        .sort({ createdAt: -1 });
};

const getMessageCursorDate = async ({ workspaceId, beforeDate, beforeMessageId }) => {
    if (beforeMessageId && mongoose.Types.ObjectId.isValid(beforeMessageId)) {
        const cursorMessage = await Message.findOne({
            _id: beforeMessageId,
            workspace: workspaceId,
            archivedAt: null,
        }).select("createdAt");

        if (cursorMessage?.createdAt) {
            return cursorMessage.createdAt;
        }
    }

    const date = beforeDate ? new Date(beforeDate) : null;

    if (date && !Number.isNaN(date.getTime())) {
        return date;
    }

    return null;
};

export const getRecentWorkspaceMessages = async ({
    workspaceId,
    limit = 50,
    beforeDate,
    beforeMessageId,
}) => {
    const query = {
        workspace: workspaceId,
        archivedAt: null,
    };

    const cursorDate = await getMessageCursorDate({
        workspaceId,
        beforeDate,
        beforeMessageId,
    });

    if (cursorDate) {
        query.createdAt = { $lt: cursorDate };
    }

    const messages = await Message.find(query)
        .populate("sender", "name email avatar")
        .sort({ createdAt: -1 })
        .limit(limit + 1);

    const hasMore = messages.length > limit;
    const pageMessages = messages.slice(0, limit).reverse();

    return {
        messages: pageMessages,
        hasMore,
        nextBeforeDate: pageMessages[0]?.createdAt || null,
    };
};

export const searchWorkspaceMessages = async ({
    workspaceId,
    search,
    limit = 50,
}) => {
    const searchText = String(search || "").trim();

    if (!searchText) {
        return {
            results: [],
            total: 0,
        };
    }

    const normalizedLimit = Math.min(Math.max(Number(limit) || 50, 1), CHAT_SEARCH_MAX_LIMIT);
    const searchQuery = {
        workspace: workspaceId,
        messageType: "text",
        archivedAt: null,
        isDeleted: { $ne: true },
        content: {
            $regex: escapeRegex(searchText),
            $options: "i",
        },
    };

    const [total, messages] = await Promise.all([
        Message.countDocuments(searchQuery),
        Message.find(searchQuery)
            .select("_id createdAt content")
            .sort({ createdAt: 1 })
            .limit(normalizedLimit),
    ]);

    return {
        results: messages.map((message) => ({
            _id: message._id,
            createdAt: message.createdAt,
            content: message.content,
        })),
        total,
    };
};

export const getMessagesAroundMessage = async ({
    workspaceId,
    messageId,
    windowSize = CHAT_CONTEXT_WINDOW_SIZE,
}) => {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        throw new ApiError(400, "Invalid message ID");
    }

    const normalizedWindow = Math.min(Math.max(Number(windowSize) || CHAT_CONTEXT_WINDOW_SIZE, 1), 50);

    const targetMessage = await Message.findOne({
        _id: messageId,
        workspace: workspaceId,
        archivedAt: null,
    }).select("createdAt");

    if (!targetMessage) {
        throw new ApiError(404, "Message not found");
    }

    const [olderMessages, newerMessages] = await Promise.all([
        Message.find({
            workspace: workspaceId,
            archivedAt: null,
            createdAt: { $lt: targetMessage.createdAt },
        })
            .populate("sender", "name email avatar")
            .sort({ createdAt: -1 })
            .limit(normalizedWindow),
        Message.find({
            workspace: workspaceId,
            archivedAt: null,
            createdAt: { $gte: targetMessage.createdAt },
        })
            .populate("sender", "name email avatar")
            .sort({ createdAt: 1 })
            .limit(normalizedWindow + 1),
    ]);

    const messages = [...olderMessages.reverse(), ...newerMessages];
    const oldestLoaded = messages[0];
    const hasMoreBefore = await Message.exists({
        workspace: workspaceId,
        archivedAt: null,
        createdAt: { $lt: oldestLoaded?.createdAt },
    });

    return {
        messages,
        targetMessageId: messageId,
        hasMoreBefore: Boolean(hasMoreBefore),
        nextBeforeDate: oldestLoaded?.createdAt || null,
    };
};

export const getWorkspaceUnreadCount = async (workspaceId, userId) => {
    const state = await ChatReadState.findOne({
        workspace: workspaceId,
        user: userId,
    });

    return state?.unreadCount || 0;
};

export const markWorkspaceChatRead = async (workspaceId, userId) => {
    const readAt = new Date();

    await Message.updateMany(
        {
            workspace: workspaceId,
            archivedAt: null,
            sender: { $ne: userId },
            "readBy.user": { $ne: userId },
        },
        {
            $push: {
                readBy: {
                    user: userId,
                    readAt,
                },
            },
        }
    );

    await ChatReadState.findOneAndUpdate(
        {
            workspace: workspaceId,
            user: userId,
        },
        {
            $set: {
                unreadCount: 0,
                lastReadAt: readAt,
                lastUnreadMessage: null,
                missedEmailSent: false,
                notificationSent: false,
            },
        },
        {
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    return {
        readAt,
        unreadCount: 0,
    };
};

export const createWorkspaceMessage = async ({
    workspaceId,
    senderId,
    messageType = "text",
    content,
    fileUrl,
    fileName,
    fileSize,
    mimeType,
    stickerId,
    audioDuration,
    readUserIds = [],
}) => {
    const readAt = new Date();
    const uniqueReadUserIds = [...new Set([senderId.toString(), ...readUserIds.map((id) => id.toString())])];

    const message = await Message.create({
        workspace: workspaceId,
        sender: senderId,
        messageType,
        content,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        stickerId,
        audioDuration,
        readBy: uniqueReadUserIds.map((userId) => ({
            user: userId,
            readAt,
        })),
    });

    await message.populate("sender", "name email avatar");

    return message;
};

export const editWorkspaceMessage = async ({
    workspaceId,
    messageId,
    userId,
    content,
    membership,
}) => {
    const trimmedContent = String(content || "").trim();

    if (!trimmedContent) {
        throw new ApiError(400, "Message content is required");
    }

    if (trimmedContent.length > CHAT_MESSAGE_MAX_LENGTH) {
        throw new ApiError(400, `Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH} characters`);
    }

    await getActiveMembershipOrThrow(workspaceId, userId, membership);

    const message = await getEditableMessageOrThrow(workspaceId, messageId);

    if (message.messageType && message.messageType !== "text") {
        throw new ApiError(400, "Only text messages can be edited");
    }

    if (message.isDeleted || message.deletedAt) {
        throw new ApiError(400, "Deleted messages cannot be edited");
    }

    if (!isOwnMessage(message, userId)) {
        throw new ApiError(403, "You can only edit your own messages");
    }

    if (!isWithinWindow(message.createdAt, CHAT_MESSAGE_EDIT_WINDOW_MS)) {
        throw new ApiError(403, "Messages can only be edited for 15 minutes");
    }

    message.content = trimmedContent;
    message.editedAt = new Date();

    await message.save();

    return populateMessageSender(message);
};

export const deleteWorkspaceMessage = async ({
    workspaceId,
    messageId,
    userId,
    membership,
}) => {
    const activeMembership = await getActiveMembershipOrThrow(workspaceId, userId, membership);
    const message = await getEditableMessageOrThrow(workspaceId, messageId);

    if (message.isDeleted || message.deletedAt) {
        throw new ApiError(400, "Message is already deleted");
    }

    const role = String(activeMembership.role || "").toLowerCase();
    const isOwner = role === "owner";
    const isSender = isOwnMessage(message, userId);

    if (!isOwner) {
        if (!isSender) {
            throw new ApiError(403, "You can only delete your own messages");
        }

        if (!isWithinWindow(message.createdAt, CHAT_MESSAGE_DELETE_WINDOW_MS)) {
            throw new ApiError(403, "Messages can only be deleted for 7 days");
        }
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;

    await message.save();

    return populateMessageSender(message);
};

const sendMissedChatEmail = async ({ recipient, workspace }) => {
    try {
        await sendEmail({
            email: recipient.email,
            subject: `New unread messages in ${workspace.name}`,
            message: `Hello ${recipient.name},\n\nYou have new unread messages in the ${workspace.name} workspace on TaskFlow Pro.\n\nPlease open TaskFlow Pro and check your workspace chat when you are available.\n\nThank you,\nTaskFlow Pro`,
        });
    } catch (error) {
        console.error("Failed to send missed chat email:", {
            user: recipient._id,
            workspace: workspace._id,
            message: error.message,
        });
    }
};

export const updateUnreadForInactiveMembers = async ({
    workspaceId,
    sender,
    message,
    viewingUserIds = [],
}) => {
    const workspace = await Workspace.findById(workspaceId).select("name");
    const members = await getActiveWorkspaceMembers(workspaceId);
    const senderId = sender._id.toString();
    const viewingSet = new Set(viewingUserIds.map((id) => id.toString()));

    for (const member of members) {
        const memberUser = member.user;
        const memberUserId = memberUser?._id?.toString();

        if (!memberUserId || memberUserId === senderId || viewingSet.has(memberUserId)) {
            continue;
        }

        let state = await ChatReadState.findOne({
            workspace: workspaceId,
            user: memberUserId,
        });

        if (!state) {
            state = new ChatReadState({
                workspace: workspaceId,
                user: memberUserId,
            });
        }

        const shouldNotify = !state.notificationSent;
        const shouldEmail = !state.missedEmailSent;

        state.unreadCount += 1;
        state.lastUnreadMessage = message._id;
        state.notificationSent = true;
        state.missedEmailSent = true;

        await state.save();

        if (shouldNotify) {
            await createNotification({
                recipient: memberUserId,
                workspace: workspaceId,
                actor: sender._id,
                type: "chat_message",
                title: `New message in ${workspace?.name || "Workspace"}`,
                message: `${sender.name} sent a message in ${workspace?.name || "this workspace"}`,
                link: "/chat",
                metadata: {
                    workspace: workspaceId,
                    message: message._id,
                    unreadBatch: true,
                },
            });
        }

        if (shouldEmail && memberUser.email && workspace) {
            void sendMissedChatEmail({
                recipient: memberUser,
                workspace,
            });
        }
    }
};

export const archiveWorkspaceChat = async ({ workspaceId, archivedBy }) => {
    const archivedAt = new Date();
    const archiveBatchId = new mongoose.Types.ObjectId();

    const result = await Message.updateMany(
        {
            workspace: workspaceId,
            archivedAt: null,
        },
        {
            $set: {
                archivedAt,
                archivedBy,
                archiveBatchId,
            },
        }
    );

    await ChatReadState.updateMany(
        {
            workspace: workspaceId,
        },
        {
            $set: {
                unreadCount: 0,
                lastUnreadMessage: null,
            },
        }
    );

    return {
        archivedAt,
        archivedBy,
        archiveBatchId,
        archivedCount: result.modifiedCount || 0,
    };
};
