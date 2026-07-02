import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getTasks = async (wId, projectId) => {
  const res = await api.get(`/workspaces/${wId}/projects/${projectId}/tasks`);
  return d(res);
};

export const getTaskById = async (wId, projectId, taskId) => {
  const res = await api.get(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}`);
  return d(res);
};

export const createTask = async (wId, projectId, data) => {
  const res = await api.post(`/workspaces/${wId}/projects/${projectId}/tasks`, data);
  return d(res);
};

export const updateTask = async (wId, projectId, taskId, data) => {
  const res = await api.put(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}`, data);
  return d(res);
};

export const updateTaskStatus = async (wId, projectId, taskId, status) => {
  const res = await api.patch(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}/status`, { status });
  return d(res);
};

export const deleteTask = async (wId, projectId, taskId) => {
  const res = await api.delete(`/workspaces/${wId}/projects/${projectId}/tasks/${taskId}`);
  return d(res);
};
