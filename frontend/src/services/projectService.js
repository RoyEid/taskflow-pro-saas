import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getProjects = async (wId) => {
  const res = await api.get(`/workspaces/${wId}/projects`);
  return d(res);
};

export const getProjectById = async (wId, projectId) => {
  const res = await api.get(`/workspaces/${wId}/projects/${projectId}`);
  return d(res);
};

export const createProject = async (wId, data) => {
  const res = await api.post(`/workspaces/${wId}/projects`, data);
  return d(res);
};

export const updateProject = async (wId, projectId, data) => {
  const res = await api.put(`/workspaces/${wId}/projects/${projectId}`, data);
  return d(res);
};

export const deleteProject = async (wId, projectId) => {
  const res = await api.delete(`/workspaces/${wId}/projects/${projectId}`);
  return d(res);
};
