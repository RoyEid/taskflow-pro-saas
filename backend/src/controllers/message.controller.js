import {
    archiveWorkspaceChat,
    deleteWorkspaceMessage as deleteMessage,
    editWorkspaceMessage as editMessage,
    getActiveWorkspaceMembers,
    getMessagesAroundMessage,
    getRecentWorkspaceMessages as getRecentMessages,
    getWorkspaceUnreadCount,
    markWorkspaceChatRead,
    searchWorkspaceMessages,
    serializeMessage,
} from "../services/chat.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logActivity } from "../services/activityLog.service.js";

const MESSAGE_PAGE_SIZE = 50;
const SEARCH_PAGE_SIZE = 50;
const getWorkspaceRoom = (workspaceId) => `workspace:${workspaceId}`;

const emitMessageUpdate = (req, eventName, workspaceId, message) => {
    const io = req.app.get("io");

    if (!io) {
        return;
    }

    io.to(getWorkspaceRoom(workspaceId)).emit(eventName, message);
};

export const getRecentWorkspaceMessages = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const rawLimit = Number(req.query.limit) || MESSAGE_PAGE_SIZE;
    const limit = Math.min(Math.max(rawLimit, 1), MESSAGE_PAGE_SIZE);
    const beforeDate = req.query.beforeDate || req.query.before;
    const { beforeMessageId } = req.query;

    const result = await getRecentMessages({
        workspaceId,
        limit,
        beforeDate,
        beforeMessageId,
    });

    res.status(200).json(
        new ApiResponse(200, "Messages fetched successfully", {
            messages: result.messages.map((message) => serializeMessage(message)),
            hasMore: result.hasMore,
            nextBeforeDate: result.nextBeforeDate,
        })
    );
});

export const getWorkspaceChatMeta = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const [members, unreadCount] = await Promise.all([
        getActiveWorkspaceMembers(workspaceId),
        getWorkspaceUnreadCount(workspaceId, req.user._id),
    ]);

    res.status(200).json(
        new ApiResponse(200, "Chat metadata fetched successfully", {
            unreadCount,
            memberCount: members.length,
            members,
        })
    );
});

export const searchWorkspaceChatMessages = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const rawLimit = Number(req.query.limit) || SEARCH_PAGE_SIZE;
    const limit = Math.min(Math.max(rawLimit, 1), 100);
    const search = req.query.q || req.query.search || "";

    const { results, total } = await searchWorkspaceMessages({
        workspaceId,
        search,
        limit,
    });

    res.status(200).json(
        new ApiResponse(200, "Messages searched successfully", {
            results,
            total,
        })
    );
});

export const getWorkspaceMessageContext = asyncHandler(async (req, res) => {
    const { workspaceId, messageId } = req.params;
    const rawWindow = Number(req.query.window) || 25;
    const windowSize = Math.min(Math.max(rawWindow, 1), 50);

    const result = await getMessagesAroundMessage({
        workspaceId,
        messageId,
        windowSize,
    });

    res.status(200).json(
        new ApiResponse(200, "Message context fetched successfully", {
            messages: result.messages.map((message) => serializeMessage(message)),
            targetMessageId: result.targetMessageId,
            hasMoreBefore: result.hasMoreBefore,
            nextBeforeDate: result.nextBeforeDate,
        })
    );
});

export const getWorkspaceChatUnreadCount = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const unreadCount = await getWorkspaceUnreadCount(workspaceId, req.user._id);

    res.status(200).json(
        new ApiResponse(200, "Chat unread count fetched successfully", {
            unreadCount,
        })
    );
});

export const markWorkspaceMessagesRead = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const readState = await markWorkspaceChatRead(workspaceId, req.user._id);

    res.status(200).json(
        new ApiResponse(200, "Messages marked as read", readState)
    );
});

export const startNewWorkspaceChat = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const archive = await archiveWorkspaceChat({
        workspaceId,
        archivedBy: req.user._id,
    });

    await logActivity({
        workspaceId,
        actorUserId: req.user._id,
        actorName: req.user.name,
        action: "archived_and_started_new_chat",
        entityType: "Chat",
        entityId: null,
        entityName: "Workspace Chat",
        source: "manual",
    });

    res.status(200).json(
        new ApiResponse(200, "Workspace chat archived successfully", {
            archive,
        })
    );
});

export const updateWorkspaceMessage = asyncHandler(async (req, res) => {
    const { workspaceId, messageId } = req.params;

    const message = await editMessage({
        workspaceId,
        messageId,
        userId: req.user._id,
        content: req.body.content,
        membership: req.workspaceMember,
    });
    const serializedMessage = serializeMessage(message);

    emitMessageUpdate(req, "messageEdited", workspaceId, serializedMessage);

    res.status(200).json(
        new ApiResponse(200, "Message updated successfully", {
            message: serializedMessage,
        })
    );
});

export const removeWorkspaceMessage = asyncHandler(async (req, res) => {
    const { workspaceId, messageId } = req.params;

    const message = await deleteMessage({
        workspaceId,
        messageId,
        userId: req.user._id,
        membership: req.workspaceMember,
    });
    const serializedMessage = serializeMessage(message);

    emitMessageUpdate(req, "messageDeleted", workspaceId, serializedMessage);

    res.status(200).json(
        new ApiResponse(200, "Message deleted successfully", {
            message: serializedMessage,
        })
    );
});
