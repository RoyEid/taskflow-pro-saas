import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getMembers = async (wId) => {
  const res = await api.get(`/workspaces/${wId}/members`);
  return d(res);
};

export const addMember = async (wId, data) => {
  const res = await api.post(`/workspaces/${wId}/members`, data);
  return d(res);
};

export const updateMemberRole = async (wId, memberId, data) => {
  const res = await api.patch(
    `/workspaces/${wId}/members/${memberId}/role`,
    data
  );

  return d(res);
};

export const removeWorkspaceMember = async (wId, memberId) => {
  const res = await api.delete(`/workspaces/${wId}/members/${memberId}`);
  return d(res);
};

/*
  Compatibility exports:
  These allow different pages to use different function names
  without crashing the app.
*/

export const addWorkspaceMember = addMember;

export const updateWorkspaceMemberRole = async (wId, memberId, role) => {
  return updateMemberRole(wId, memberId, { role });
};