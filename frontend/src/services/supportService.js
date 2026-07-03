import api from "./api";

/**
 * Submit a new support request
 * @param {Object} data - Support request data
 * @returns {Promise<Object>} The created support request
 */
export const submitSupportRequest = async (data) => {
  const response = await api.post("/support", data);
  return response.data;
};

/**
 * Get current user's recent support requests
 * @returns {Promise<Array>} Array of support requests
 */
export const getMySupportRequests = async () => {
  const response = await api.get("/support/my");
  return response.data;
};

/**
 * Update a support request
 * @param {string} id - Support request ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} The updated support request
 */
export const updateSupportRequest = async (id, data) => {
  const response = await api.put(`/support/${id}`, data);
  return response.data;
};

/**
 * Delete a support request
 * @param {string} id - Support request ID
 * @returns {Promise<Object>} Empty object on success
 */
export const deleteSupportRequest = async (id) => {
  const response = await api.delete(`/support/${id}`);
  return response.data;
};
