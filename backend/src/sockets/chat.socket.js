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
const getUserRoom = (userId) => `user:${userId}`;

const getClientMessageId = (value) => {
    const clientMessageId = String(value || "").trim();

    if (
        !clientMessageId ||
        clientMessageId.length > 128 ||
        !/^[a-zA-Z0-9:_-]+$/.test(clientMessageId)
    ) {
        return null;
    }

    return clientMessageId;
};

const getWorkspacePresence = (workspaceId) => {
    const key = workspaceId.toString();

    if (!workspacePresence.has(key)) {
        workspacePresence.set(key, new Map());
    }

    return workspacePresence.get(key);
};

const getOnlineUsers = (workspaceId) => {
    const presence = workspacePresence.get(String(workspaceId));

    return presence
        ? [...presence.values()].map((entry) => serializeUser(entry.user))
        : [];
};

const getViewingUserIds = (workspaceId) => {
    const presence = workspacePresence.get(String(workspaceId));

    return presence ? [...presence.keys()] : [];
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

export const broadcastWorkspaceDeleted = async ({
    io,
    workspaceId,
    affectedUserIds = [],
    deletedBy,
}) => {
    const normalizedWorkspaceId = String(workspaceId);
    const workspaceRoom = getWorkspaceRoom(normalizedWorkspaceId);
    const payload = {
        workspaceId: normalizedWorkspaceId,
        deletedWorkspaceId: normalizedWorkspaceId,
        deletedBy: deletedBy ? String(deletedBy) : null,
        message: "This workspace no longer exists.",
    };
    const workspaceSockets = await io.in(workspaceRoom).fetchSockets();

    io.to(workspaceRoom).emit("workspaceDeleted", payload);

    for (const socket of workspaceSockets) {
        removePresence(normalizedWorkspaceId, socket);
        socket.data.joinedWorkspaceMemberships?.delete(normalizedWorkspaceId);
        socket.data.joinedWorkspaceIds?.delete(normalizedWorkspaceId);
        socket.data.joinRequests?.delete(normalizedWorkspaceId);
        await socket.leave(workspaceRoom);
    }

    workspacePresence.delete(normalizedWorkspaceId);

    for (const userId of new Set(affectedUserIds.map(String))) {
        io.to(getUserRoom(userId)).emit("workspaceDeleted", payload);
    }
};

// Presence is keyed by live socket ids, so anything the disconnect handler
// missed is dropped here before the list is published or read.
const prunePresence = (io, workspaceId) => {
    const key = workspaceId.toString();
    const presence = workspacePresence.get(key);

    if (!presence) {
        return;
    }

    for (const [userId, entry] of presence) {
        for (const socketId of entry.socketIds) {
            if (!io.sockets.sockets.has(socketId)) {
                entry.socketIds.delete(socketId);
            }
        }

        if (entry.socketIds.size === 0) {
            presence.delete(userId);
        }
    }

    if (presence.size === 0) {
        workspacePresence.delete(key);
    }
};

const emitPresence = (io, workspaceId) => {
    prunePresence(io, workspaceId);

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

const getJoinedMembership = (socket, workspaceId) => {
    return socket.data.joinedWorkspaceMemberships?.get(String(workspaceId)) || null;
};

// Socket.IO stops reconnecting after a middleware error, so the client can only
// recover by reconnecting by hand. Tagging the error lets the client tell a real
// credential problem (stop) from a transient backend problem (retry) instead of
// silently staying offline until the page is refreshed.
const buildAuthError = (message, { retryable }) => {
    const error = new Error(message);
    error.data = { retryable };
    return error;
};

const registerChatSocket = (io) => {
    io.use(async (socket, next) => {
        const token = getTokenFromSocket(socket);

        if (!token || token === "null" || token === "undefined") {
            return next(buildAuthError("Not authorized, token missing", { retryable: false }));
        }

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return next(buildAuthError("Not authorized, token failed", { retryable: false }));
        }

        try {
            const user = await User.findById(decoded.userId).select("name email avatar status");

            if (!user) {
                return next(buildAuthError("User no longer exists", { retryable: false }));
            }

            if (user.status === "disabled") {
                return next(buildAuthError("Your account is disabled", { retryable: false }));
            }

            socket.user = user;
            return next();
        } catch (error) {
            // A database hiccup is not an authentication failure. Reporting it as
            // one used to kill the socket permanently for a fully valid session.
            console.error("Socket authentication lookup failed:", error.message);
            return next(buildAuthError("Chat is temporarily unavailable", { retryable: true }));
        }
    });

    // A reconnect produces a new server-side socket that belongs to no workspace
    // room. The Chat page explicitly joins again after each connection.
    const runJoinWorkspace = async (socket, workspaceId) => {
        const membership = await findActiveMembership(workspaceId, socket.user._id);

        if (!membership) {
            return null;
        }

        if (!socket.connected) {
            return null;
        }

        const key = String(workspaceId);

        socket.join(getWorkspaceRoom(workspaceId));
        socket.data.joinedWorkspaceMemberships =
            socket.data.joinedWorkspaceMemberships || new Map();
        socket.data.joinedWorkspaceMemberships.set(key, membership);

        socket.data.joinedWorkspaceIds = socket.data.joinedWorkspaceIds || new Set();
        socket.data.joinedWorkspaceIds.add(key);

        /*
         * Joining the Socket.IO room means the Chat page is mounted and can
         * receive messages. It does not mean the browser window is currently
         * focused or that the user has read the chat.
         */
        return membership;
    };

    // Reconnects and explicit joins can race. Share one in-flight join per
    // workspace so room membership is restored only once.
    const joinWorkspace = (socket, workspaceId) => {
        const key = String(workspaceId);

        socket.data.joinRequests = socket.data.joinRequests || new Map();

        const existing = socket.data.joinRequests.get(key);

        if (existing) {
            return existing;
        }

        const pending = runJoinWorkspace(socket, workspaceId)
            .then((membership) => {
                // Only a successful join is worth remembering; a rejection must
                // stay retryable, for instance once membership is granted.
                if (!membership) {
                    socket.data.joinRequests.delete(key);
                }

                return membership;
            })
            .catch((error) => {
                socket.data.joinRequests.delete(key);
                throw error;
            });

        socket.data.joinRequests.set(key, pending);

        return pending;
    };

    io.on("connection", (socket) => {
        socket.join(getUserRoom(socket.user._id));

        socket.on("joinWorkspaceChat", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const membership = await joinWorkspace(socket, workspaceId);

                if (!membership) {
                    emitError(socket, callback, "You are not a member of this workspace", 403);
                    return;
                }

                const unreadCount = await getWorkspaceUnreadCount(
                    workspaceId,
                    socket.user._id
                );

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        workspaceId,
                        onlineUsers: getOnlineUsers(workspaceId),
                        unreadCount,
                    });
                }
            } catch (error) {
                console.error("Failed to join workspace chat:", error.message);
                emitError(socket, callback, "Failed to join workspace chat", 500);
            }
        });

        socket.on("setWorkspaceChatViewing", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const isViewing = Boolean(payload.isViewing);

                let membership = getJoinedMembership(socket, workspaceId);

                if (!membership) {
                    membership = await joinWorkspace(socket, workspaceId);
                }

                if (!membership) {
                    emitError(socket, callback, "You are not a member of this workspace", 403);
                    return;
                }

                if (!isViewing) {
                    emitTyping(socket, workspaceId, false);
                    removePresence(workspaceId, socket);
                    emitPresence(io, workspaceId);

                    if (typeof callback === "function") {
                        callback({
                            success: true,
                            workspaceId,
                            isViewing: false,
                        });
                    }

                    return;
                }

                addPresence(workspaceId, socket);

                const readState = await markWorkspaceChatRead(
                    workspaceId,
                    socket.user._id
                );

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
                        isViewing: true,
                        unreadCount: 0,
                    });
                }
            } catch (error) {
                console.error("Failed to update chat viewing state:", error.message);
                emitError(socket, callback, "Failed to update chat viewing state", 500);
            }
        });

        socket.on("leaveWorkspaceChat", async (payload = {}, callback) => {
            try {
                const workspaceId = String(payload.workspaceId || "");

                if (!workspaceId) {
                    emitError(socket, callback, "Workspace ID is required", 400);
                    return;
                }

                emitTyping(socket, workspaceId, false);
                removePresence(workspaceId, socket);
                socket.leave(getWorkspaceRoom(workspaceId));

                socket.data.joinedWorkspaceMemberships?.delete(workspaceId);
                socket.data.joinedWorkspaceIds?.delete(workspaceId);
                socket.data.joinRequests?.delete(workspaceId);

                emitPresence(io, workspaceId);

                if (typeof callback === "function") {
                    callback({ success: true, workspaceId });
                }
            } catch (error) {
                console.error("Failed to leave workspace chat:", error.message);
                emitError(socket, callback, "Failed to leave workspace chat", 500);
            }
        });

        socket.on("typing", async (payload = {}, callback) => {
            try {
                const workspaceId = payload.workspaceId;
                const isTyping = Boolean(payload.isTyping);
                const membership = getJoinedMembership(socket, workspaceId);

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
                const clientMessageId = getClientMessageId(payload.clientMessageId);

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

                prunePresence(io, workspaceId);
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

                const serializedMessage = {
                    ...serializeMessage(message, socket.user),
                    ...(clientMessageId ? { clientMessageId } : {}),
                };

                io.to(getWorkspaceRoom(workspaceId)).emit("receiveMessage", serializedMessage);
                emitTyping(socket, workspaceId, false);

                socket.emit("chatUnreadCount", {
                    workspaceId,
                    unreadCount: 0,
                });

                if (typeof callback === "function") {
                    callback({
                        success: true,
                        message: serializedMessage,
                    });
                }

                // Offline unread state, notifications, and email fan-out are
                // secondary work. The saved message has already been broadcast,
                // so none of this should hold the sender's acknowledgement open.
                void updateUnreadForInactiveMembers({
                    workspaceId,
                    sender: socket.user,
                    message,
                    viewingUserIds,
                    isUserOnline: (userId) => {
                        const room = io.sockets.adapter.rooms.get(`user:${userId}`);
                        return room && room.size > 0;
                    },
                })
                    .then((updates) => {
                        if (updates && updates.length > 0) {
                            for (const update of updates) {
                                io.to(getUserRoom(update.userId)).emit("chatUnreadCount", {
                                    workspaceId,
                                    unreadCount: update.unreadCount,
                                });
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Failed to update offline chat recipients:", {
                            workspaceId,
                            messageId: message._id,
                            message: error.message,
                        });
                    });
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
