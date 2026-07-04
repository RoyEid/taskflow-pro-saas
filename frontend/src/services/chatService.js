import { io } from "socket.io-client";
import api from "./api";
import { getToken } from "../utils/tokenStorage";

const d = (r) => r.data?.data || r.data;

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api\/?$/, "");
export const CHAT_PAGE_SIZE = 50;
export const CHAT_SEARCH_MAX_LIMIT = 100;

const normalizeLimit = (limit, max = CHAT_PAGE_SIZE) => {
  const numericLimit = Number(limit) || CHAT_PAGE_SIZE;
  return Math.min(Math.max(numericLimit, 1), max);
};

export const getRecentMessages = async (workspaceId, options = {}) => {
  const params =
    typeof options === "number"
      ? { limit: normalizeLimit(options) }
      : {
          limit: normalizeLimit(options.limit),
          beforeDate: options.beforeDate,
          beforeMessageId: options.beforeMessageId,
        };

  const res = await api.get(`/workspaces/${workspaceId}/messages`, {
    params,
  });

  return d(res);
};

export const searchMessages = async (workspaceId, query, limit = 50) => {
  const res = await api.get(`/workspaces/${workspaceId}/messages/search`, {
    params: {
      q: query,
      limit: normalizeLimit(limit, CHAT_SEARCH_MAX_LIMIT),
    },
  });

  return d(res);
};

export const getMessageContext = async (workspaceId, messageId, windowSize = 25) => {
  const res = await api.get(`/workspaces/${workspaceId}/messages/context/${messageId}`, {
    params: {
      window: normalizeLimit(windowSize, 50),
    },
  });

  return d(res);
};

export const getChatMeta = async (workspaceId) => {
  const res = await api.get(`/workspaces/${workspaceId}/messages/meta`);
  return d(res);
};

export const getChatUnreadCount = async (workspaceId) => {
  const res = await api.get(`/workspaces/${workspaceId}/messages/unread-count`);
  return d(res);
};

export const markChatRead = async (workspaceId) => {
  const res = await api.patch(`/workspaces/${workspaceId}/messages/read`);
  return d(res);
};

export const editMessage = async (workspaceId, messageId, content) => {
  const res = await api.patch(`/workspaces/${workspaceId}/messages/${messageId}`, {
    content,
  });
  return d(res);
};

export const deleteMessage = async (workspaceId, messageId) => {
  const res = await api.delete(`/workspaces/${workspaceId}/messages/${messageId}`);
  return d(res);
};

export const startNewChat = async (workspaceId) => {
  const res = await api.post(`/workspaces/${workspaceId}/messages/start-new`);
  return d(res);
};

export const uploadChatFile = async (workspaceId, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/workspaces/${workspaceId}/messages/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });

  return d(res);
};

export const createChatSocket = () => {
  return io(socketUrl, {
    autoConnect: false,
    auth: {
      token: getToken() || "",
    },
    transports: ["websocket", "polling"],
  });
};
