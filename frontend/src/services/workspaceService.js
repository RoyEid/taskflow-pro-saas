import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getWorkspaces = async () => {
  const res = await api.get("/workspaces");
  return d(res);
};

export const getWorkspaceById = async (workspaceId) => {
  const res = await api.get(`/workspaces/${workspaceId}`);
  return d(res);
};

export const createWorkspace = async (data) => {
  const res = await api.post("/workspaces", data);
  return d(res);
};
