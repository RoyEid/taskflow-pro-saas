import api from "./api";

/**
 * Submit a new feedback entry
 * @param {Object} data - Feedback data (category, message, rating, pageUrl, workspaceId)
 * @returns {Promise<Object>} The created feedback
 */
export const submitFeedback = async (data) => {
  const response = await api.post("/feedback", data);
  return response.data;
};

/**
 * Get current user's recent feedback
 * @returns {Promise<Array>} Array of feedback entries
 */
export const getMyFeedback = async () => {
  const response = await api.get("/feedback/my");
  return response.data;
};

/**
 * Update an existing feedback entry
 * @param {String} id - Feedback ID
 * @param {Object} data - Feedback data (category, message, rating)
 * @returns {Promise<Object>} The updated feedback
 */
export const updateFeedback = async (id, data) => {
  const response = await api.put(`/feedback/${id}`, data);
  return response.data;
};

/**
 * Delete a feedback entry
 * @param {String} id - Feedback ID
 * @returns {Promise<Object>} Success status
 */
export const deleteFeedback = async (id) => {
  const response = await api.delete(`/feedback/${id}`);
  return response.data;
};
