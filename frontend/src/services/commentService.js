import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getComments = async (wId, projectId, taskId) => {
  const res = await api.get(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}/comments`);
  return d(res);
};

export const createComment = async (wId, projectId, taskId, data) => {
  const res = await api.post(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}/comments`, data);
  return d(res);
};

export const updateComment = async (wId, projectId, taskId, commentId, data) => {
  const res = await api.put(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, data);
  return d(res);
};

export const deleteComment = async (wId, projectId, taskId, commentId) => {
  const res = await api.delete(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
  return d(res);
};
