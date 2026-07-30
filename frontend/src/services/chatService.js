import { io } from "socket.io-client";

import api from "./api";
import { getToken } from "../utils/tokenStorage";

const extractData = (response) => response.data?.data || response.data;

const normalizeUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const apiBaseUrl = normalizeUrl(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : ""),
);

const socketUrl = normalizeUrl(
  import.meta.env.VITE_SOCKET_URL ||
  apiBaseUrl.replace(/\/api$/i, ""),
);

export const CHAT_PAGE_SIZE = 50;
export const CHAT_SEARCH_MAX_LIMIT = 100;

const normalizeLimit = (limit, max = CHAT_PAGE_SIZE) => {
  const numericLimit = Number(limit) || CHAT_PAGE_SIZE;

  return Math.min(Math.max(numericLimit, 1), max);
};

export const getRecentMessages = async (
  workspaceId,
  options = {},
) => {
  const params =
    typeof options === "number"
      ? {
        limit: normalizeLimit(options),
      }
      : {
        limit: normalizeLimit(options.limit),
        beforeDate: options.beforeDate,
        beforeMessageId: options.beforeMessageId,
      };

  const response = await api.get(
    `/workspaces/${workspaceId}/messages`,
    {
      params,
    },
  );

  return extractData(response);
};

export const searchMessages = async (
  workspaceId,
  query,
  limit = 50,
) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/messages/search`,
    {
      params: {
        q: query,
        limit: normalizeLimit(limit, CHAT_SEARCH_MAX_LIMIT),
      },
    },
  );

  return extractData(response);
};

export const getMessageContext = async (
  workspaceId,
  messageId,
  windowSize = 25,
) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/messages/context/${messageId}`,
    {
      params: {
        window: normalizeLimit(windowSize, 50),
      },
    },
  );

  return extractData(response);
};

export const getChatMeta = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/messages/meta`,
  );

  return extractData(response);
};

export const getChatUnreadCount = async (workspaceId) => {
  const response = await api.get(
    `/workspaces/${workspaceId}/messages/unread-count`,
  );

  return extractData(response);
};

export const markChatRead = async (workspaceId) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/messages/read`,
  );

  return extractData(response);
};

export const editMessage = async (
  workspaceId,
  messageId,
  content,
) => {
  const response = await api.patch(
    `/workspaces/${workspaceId}/messages/${messageId}`,
    {
      content,
    },
  );

  return extractData(response);
};

export const deleteMessage = async (
  workspaceId,
  messageId,
) => {
  const response = await api.delete(
    `/workspaces/${workspaceId}/messages/${messageId}`,
  );

  return extractData(response);
};

export const startNewChat = async (workspaceId) => {
  const response = await api.post(
    `/workspaces/${workspaceId}/messages/start-new`,
  );

  return extractData(response);
};

export const uploadChatFile = async (
  workspaceId,
  file,
  onUploadProgress,
) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    `/workspaces/${workspaceId}/messages/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    },
  );

  return extractData(response);
};

export const createChatSocket = (workspaceId) => {
  if (!socketUrl) {
    throw new Error(
      "Socket server URL is missing. Set VITE_SOCKET_URL in the frontend environment variables.",
    );
  }

  const socket = io(socketUrl, {
    autoConnect: false,

    /*
     * The authentication callback is executed on every connection attempt.
     * This ensures reconnections use the newest stored token instead of a
     * token captured when the socket was first created.
     */
    auth: (callback) => {
      callback({
        token: getToken() || "",
        workspaceId: String(workspaceId || ""),
      });
    },

    withCredentials: true,

    /*
     * Connect using WebSocket when available and fall back to polling when
     * the host, browser, or proxy does not support the WebSocket upgrade.
     */
    transports: ["websocket", "polling"],

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });

  return socket;
};