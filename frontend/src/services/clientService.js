import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getClients = async (wId) => {
  const res = await api.get(`/workspaces/${wId}/clients`);
  return d(res);
};

export const getClientById = async (wId, clientId) => {
  const res = await api.get(`/workspaces/${wId}/clients/${clientId}`);
  return d(res);
};

export const createClient = async (wId, data) => {
  const res = await api.post(`/workspaces/${wId}/clients`, data);
  return d(res);
};

export const updateClient = async (wId, clientId, data) => {
  const res = await api.put(`/workspaces/${wId}/clients/${clientId}`, data);
  return d(res);
};

export const deleteClient = async (wId, clientId) => {
  const res = await api.delete(`/workspaces/${wId}/clients/${clientId}`);
  return d(res);
};
