import api from "./api";

/**
 * Get all notifications for current user
 */
export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

/**
 * Clear all read notifications
 */
export const clearReadNotifications = async () => {
  const response = await api.delete("/notifications/clear-read");
  return response.data;
};

/**
 * Get notification preferences
 */
export const getPreferences = async () => {
  const response = await api.get("/notifications/preferences");
  return response.data;
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (preferences) => {
  const response = await api.put("/notifications/preferences", preferences);
  return response.data;
};
