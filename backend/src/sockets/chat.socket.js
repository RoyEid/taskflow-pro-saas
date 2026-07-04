import jwt from "jsonwebtoken";

import User from "../models/User.model.js";
import {
    archiveWorkspaceChat,
    CHAT_MESSAGE_MAX_LENGTH,
    createWorkspaceMessage,
    deleteWorkspaceMessage,
    editWorkspaceMessage,
    findActiveMembership,
    getWorkspaceUnreadCount,
    markWorkspaceChatRead,
    serializeMessage,
    serializeUser,
    updateUnreadForInactiveMembers,
} from "../services/chat.service.js";

const workspacePresence = new Map();
const allowedMessageTypes = new Set(["text", "image", "file", "sticker", "audio"]);
const imageMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const audioExtensions = new Set(["webm", "ogg", "mp3", "m4a", "mp4", "wav", "aac"]);
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const normalizeMimeType = (mimeType = "") =>
    String(mimeType).split(";")[0].trim().toLowerCase();

const getFileExtension = (value = "") => {
    const cleanValue = String(value).split("?")[0].split("#")[0];
    const extension = cleanValue.includes(".") ? cleanValue.split(".").pop() : "";
    return extension.toLowerCase();
};

const resolveMessageFileUrl = (payload = {}) =>
    payload.fileUrl || payload.audioUrl || payload.imageUrl || null;

const isImagePayload = (payload = {}) => {
    const mimeType = normalizeMimeType(payload.mimeType);
    const fileNameExtension = getFileExtension(payload.fileName);
    const fileUrlExtension = getFileExtension(resolveMessageFileUrl(payload));

    return (
        imageMimeTypes.has(mimeType) ||
        imageExtensions.has(fileNameExtension) ||
        imageExtensions.has(fileUrlExtension)
    );
};

const isAudioPayload = (payload = {}) => {
    const mimeType = normalizeMimeType(payload.mimeType);
    const fileNameExtension = getFileExtension(payload.fileName);
    const fileUrlExtension = getFileExtension(resolveMessageFileUrl(payload));

    return (
        mimeType.startsWith("audio/") ||
        audioExtensions.has(fileNameExtension) ||
        audioExtensions.has(fileUrlExtension)
    );
};

const resolveMessageType = (payload = {}) => {
    const requestedType = String(payload.messageType || payload.type || "text").toLowerCase();

    if (requestedType === "audio" || isAudioPayload(payload)) {
        return "audio";
    }

    if (requestedType === "image" || isImagePayload(payload)) {
        return "image";
    }

    if (requestedType === "file" || resolveMessageFileUrl(payload)) {
        return "file";
    }

    return allowedMessageTypes.has(requestedType) ? requestedType : "text";
};

const getTokenFromSocket = (socket) => {
    const authToken = socket.handshake.auth?.token;

    if (authToken) {
        return authToken;
    }

    const authorization = socket.handshake.headers?.authorization;

    if (authorization?.startsWith("Bearer ")) {
        return authorization.split(" ")[1];
    }

    return null;
};

const getWorkspaceRoom = (workspaceId) => `workspace:${workspaceId}`;

const getWorkspacePresence = (workspaceId) => {
    const key = workspaceId.toString();

    if (!workspacePresence.has(key)) {
        workspacePresence.set(key, new Map());
    }

    return workspacePresence.get(key);
};

const getOnlineUsers = (workspaceId) => {
    const presence = getWorkspacePresence(workspaceId);

    return [...presence.values()].map((entry) => serializeUser(entry.user));
};

const getViewingUserIds = (workspaceId) => {
    const presence = getWorkspacePresence(workspaceId);

    return [...presence.keys()];
};

const addPresence = (workspaceId, socket) => {
    const key = workspaceId.toString();
    const userId = socket.user._id.toString();
    const presence = getWorkspacePresence(key);
    const entry = presence.get(userId) || {
        user: socket.user,
        socketIds: new Set(),
    };

    entry.user = socket.user;
    entry.socketIds.add(socket.id);
    presence.set(userId, entry);

    socket.data.joinedWorkspaceIds = socket.data.joinedWorkspaceIds || new Set();
    socket.data.joinedWorkspaceIds.add(key);
};

const removePresence = (workspaceId, socket) => {
    const key = workspaceId.toString();
    const userId = socket.user?._id?.toString();

    if (!userId || !workspacePresence.has(key)) {
        return;
    }

    const presence = workspacePresence.get(key);
    const entry = presence.get(userId);

    if (!entry) {
        return;
    }

    entry.socketIds.delete(socket.id);

    if (entry.socketIds.size === 0) {
        presence.delete(userId);
    }

    if (presence.size === 0) {
        workspacePresence.delete(key);
    }
};

const emitPresence = (io, workspaceId) => {
    io.to(getWorkspaceRoom(workspaceId)).emit("workspaceChatPresence", {
        workspaceId,
        onlineUsers: getOnlineUsers(workspaceId),
    });
};

const emitError = (socket, callback, message, statusCode = 400) => {
    const error = {
        success: false,
        statusCode,
        message,
    };

    if (typeof callback === "function") {
        callback(error);
    }

    socket.emit("chatError", error);
};

const emitTyping = (socket, workspaceId, isTyping) => {
    socket.to(getWorkspaceRoom(workspaceId)).emit("workspaceChatTyping", {
        workspaceId,
        user: serializeUser(socket.user),
        isTyping,
    });
};

const registerChatSocket = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = getTokenFromSocket(socket);

            if (!token || token === "null" || token === "undefined") {
                return next(new Error("Not authorized, token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select("name email avatar status");

            if (!user) {
                return next(new Error("User no longer exists"));
            }

            if (user.status === "disabled") {
                return next(new Error("Your account is disabled"));
            }

            socket.user = user;
            return next();
        } catch {
            return next(new Error("Not authorized, token failed"));
        }
    });

    io.on("connection", (socket) => {
        socket.on("joinWorkspaceChat", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const membership = await findActiveMembership(workspaceId, socket.user._id);

                if (!membership) {
                    emitError(socket, callback, "You are not a member of this workspace", 403);
                    return;
                }

                socket.join(getWorkspaceRoom(workspaceId));
                addPresence(workspaceId, socket);

                const readState = await markWorkspaceChatRead(workspaceId, socket.user._id);

                io.to(getWorkspaceRoom(workspaceId)).emit("messagesRead", {
                    workspaceId,
                    user: serializeUser(socket.user),
                    readAt: readState.readAt,
                });

                socket.emit("chatUnreadCount", {
                    workspaceId,
                    unreadCount: 0,
                });

                emitPresence(io, workspaceId);

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        workspaceId,
                        onlineUsers: getOnlineUsers(workspaceId),
                        unreadCount: 0,
                    });
                }
            } catch {
                emitError(socket, callback, "Failed to join workspace chat", 500);
            }
        });

        socket.on("typing", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const isTyping = Boolean(payload.isTyping);
                const membership = await findActiveMembership(workspaceId, socket.user._id);

                if (!membership) {
                    emitError(socket, callback, "You are not a member of this workspace", 403);
                    return;
                }

                emitTyping(socket, workspaceId, isTyping);

                if (typeof callback === "function") {
                    callback({ success: true });
                }
            } catch {
                emitError(socket, callback, "Failed to update typing status", 500);
            }
        });

        socket.on("markMessagesRead", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const membership = await findActiveMembership(workspaceId, socket.user._id);

                if (!membership) {
                    emitError(socket, callback, "You are not a member of this workspace", 403);
                    return;
                }

                const readState = await markWorkspaceChatRead(workspaceId, socket.user._id);

                io.to(getWorkspaceRoom(workspaceId)).emit("messagesRead", {
                    workspaceId,
                    user: serializeUser(socket.user),
                    readAt: readState.readAt,
                });

                socket.emit("chatUnreadCount", {
                    workspaceId,
                    unreadCount: 0,
                });

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        unreadCount: 0,
                    });
                }
            } catch {
                emitError(socket, callback, "Failed to mark messages as read", 500);
            }
        });

        socket.on("sendMessage", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const messageType = resolveMessageType(payload);
                const content = String(payload.content || "").trim();
                const fileUrl = resolveMessageFileUrl(payload);
                const fileSize = Number(payload.fileSize) || null;
                const mimeType = normalizeMimeType(payload.mimeType);

                if (!allowedMessageTypes.has(messageType)) {
                    emitError(socket, callback, "Unsupported message type");
                    return;
                }

                if (messageType === "text" && !content) {
                    emitError(socket, callback, "Message content is required");
                    return;
                }

                if (["image", "file", "audio"].includes(messageType) && !fileUrl) {
                    emitError(socket, callback, "Attachment URL is required");
                    return;
                }

                if (messageType === "image" && !isImagePayload({ ...payload, fileUrl })) {
                    emitError(socket, callback, "Unsupported image attachment");
                    return;
                }

                if (messageType === "audio" && !isAudioPayload({ ...payload, fileUrl })) {
                    emitError(socket, callback, "Unsupported audio attachment");
                    return;
                }

                if (content && content.length > CHAT_MESSAGE_MAX_LENGTH) {
                    emitError(socket, callback, `Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH} characters`);
                    return;
                }

                const membership = await findActiveMembership(workspaceId, socket.user._id);

                if (!membership) {
                    emitError(socket, callback, "You are not a member of this workspace", 403);
                    return;
                }

                const viewingUserIds = getViewingUserIds(workspaceId);
                const message = await createWorkspaceMessage({
                    workspaceId,
                    senderId: socket.user._id,
                    messageType,
                    content: messageType === "text" ? content : undefined,
                    fileUrl,
                    fileName: payload.fileName,
                    fileSize,
                    mimeType,
                    stickerId: payload.stickerId,
                    audioDuration: Number(payload.audioDuration ?? payload.duration) || null,
                    readUserIds: viewingUserIds,
                });

                const serializedMessage = serializeMessage(message);

                io.to(getWorkspaceRoom(workspaceId)).emit("receiveMessage", serializedMessage);
                emitTyping(socket, workspaceId, false);

                await updateUnreadForInactiveMembers({
                    workspaceId,
                    sender: socket.user,
                    message,
                    viewingUserIds,
                });

                const senderUnreadCount = await getWorkspaceUnreadCount(workspaceId, socket.user._id);
                socket.emit("chatUnreadCount", {
                    workspaceId,
                    unreadCount: senderUnreadCount,
                });

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        message: serializedMessage,
                    });
                }
            } catch {
                emitError(socket, callback, "Failed to send message", 500);
            }
        });

        socket.on("editMessage", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const messageId = payload.messageId;
                const content = payload.content;

                const message = await editWorkspaceMessage({
                    workspaceId,
                    messageId,
                    userId: socket.user._id,
                    content,
                });
                const serializedMessage = serializeMessage(message);

                io.to(getWorkspaceRoom(workspaceId)).emit("messageEdited", serializedMessage);

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        message: serializedMessage,
                    });
                }
            } catch (error) {
                emitError(socket, callback, error.message || "Failed to edit message", error.statusCode || 500);
            }
        });

        socket.on("deleteMessage", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const messageId = payload.messageId;

                const message = await deleteWorkspaceMessage({
                    workspaceId,
                    messageId,
                    userId: socket.user._id,
                });
                const serializedMessage = serializeMessage(message);

                io.to(getWorkspaceRoom(workspaceId)).emit("messageDeleted", serializedMessage);

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        message: serializedMessage,
                    });
                }
            } catch (error) {
                emitError(socket, callback, error.message || "Failed to delete message", error.statusCode || 500);
            }
        });

        socket.on("startNewChat", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const membership = await findActiveMembership(workspaceId, socket.user._id);

                if (!membership || String(membership.role).toLowerCase() !== "owner") {
                    emitError(socket, callback, "Only the workspace owner can start a new chat", 403);
                    return;
                }

                const archive = await archiveWorkspaceChat({
                    workspaceId,
                    archivedBy: socket.user._id,
                });

                io.to(getWorkspaceRoom(workspaceId)).emit("workspaceChatArchived", {
                    workspaceId,
                    archive,
                    archivedBy: serializeUser(socket.user),
                });

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        archive,
                    });
                }
            } catch {
                emitError(socket, callback, "Failed to start a new chat", 500);
            }
        });

        socket.on("disconnect", () => {
            const joinedWorkspaceIds = socket.data.joinedWorkspaceIds || new Set();

            for (const workspaceId of joinedWorkspaceIds) {
                emitTyping(socket, workspaceId, false);
                removePresence(workspaceId, socket);
                emitPresence(io, workspaceId);
            }
        });
    });
};

export default registerChatSocket;
