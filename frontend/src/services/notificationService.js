import api from "./api";

const extractData = (response) => response.data?.data ?? response.data;

/**
 * Get all notifications for current user
 */
export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return extractData(response);
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return extractData(response);
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return extractData(response);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return extractData(response);
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return extractData(response);
};

/**
 * Clear all read notifications
 */
export const clearReadNotifications = async () => {
  const response = await api.delete("/notifications/clear-read");
  return extractData(response);
};

/**
 * Get notification preferences
 */
export const getPreferences = async () => {
  const response = await api.get("/notifications/preferences");
  return extractData(response);
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (preferences) => {
  const response = await api.put("/notifications/preferences", preferences);
  return extractData(response);
};

