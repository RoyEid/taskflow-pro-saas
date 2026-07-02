import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getDashboard = async (wId) => {
  const res = await api.get(`/workspaces/${wId}/dashboard`);
  return d(res);
};
