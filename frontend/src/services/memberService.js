import api from "./api";

const d = (r) => r.data?.data || r.data;

export const getMembers = async (wId) => {
  const res = await api.get(`/workspaces/${wId}/members`);
  return d(res);
};

export const addMember = async (wId, data) => {
  const res = await api.post(`/workspaces/${wId}/invitations`, data);
  return d(res);
};

export const getInvitations = async (wId) => {
  const res = await api.get(`/workspaces/${wId}/invitations`);
  return d(res);
};

export const cancelInvite = async (wId, inviteId) => {
  const res = await api.patch(`/workspaces/${wId}/invitations/${inviteId}/cancel`);
  return d(res);
};

export const getInviteByToken = async (token) => {
  const res = await api.get(`/invitations/${token}`);
  return d(res);
};

export const acceptInvite = async (token) => {
  const res = await api.post(`/invitations/${token}/accept`);
  return d(res);
};

export const declineInvite = async (token) => {
  const res = await api.post(`/invitations/${token}/decline`);
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

export const getMyInvitations = async () => {
  const res = await api.get(`/invitations/my`);
  return d(res);
};

export const acceptInvitationById = async (id) => {
  const res = await api.post(`/invitations/my/${id}/accept`);
  return d(res);
};

export const declineInvitationById = async (id) => {
  const res = await api.post(`/invitations/my/${id}/decline`);
  return d(res);
};