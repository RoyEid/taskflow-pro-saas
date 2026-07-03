import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getDashboard = async (wId, range = '30d') => {
  const res = await api.get(`/workspaces/${wId}/dashboard`, { params: { range } });
  return d(res);
};

export const getDashboardActivity = async (wId) => {
  const res = await api.get(`/workspaces/${wId}/activity`);
  return d(res);
};
