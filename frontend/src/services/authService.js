import api from "./api";

const getResponseData = (response) => response.data?.data || response.data;

export const changePassword = async (currentPassword, newPassword) => {
  const res = await api.patch("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return getResponseData(res);
};

export const updateProfile = async (data) => {
  const res = await api.patch("/auth/profile", data);
  return getResponseData(res);
};
