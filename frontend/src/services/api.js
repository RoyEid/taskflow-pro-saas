import axios from "axios";
import { getToken } from "../utils/tokenStorage";
import {
  dispatchWorkspaceAccessLost,
  getWorkspaceIdFromRequestUrl,
} from "../utils/workspaceEvents";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 403 || status === 404) {
      const workspaceId = getWorkspaceIdFromRequestUrl(error?.config?.url);

      if (workspaceId) {
        dispatchWorkspaceAccessLost({
          workspaceId,
          status,
          message:
            error?.response?.data?.message ||
            "This workspace no longer exists.",
        });
      }
    }

    return Promise.reject(error);
  },
);

export default api;
