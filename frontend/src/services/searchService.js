import api from "./api";

/**
 * Search across the entire active workspace
 * @param {string} workspaceId - The active workspace ID
 * @param {string} query - The search term
 * @returns {Promise<Object>} Search results grouped by category
 */
export const searchWorkspace = async (workspaceId, query) => {
    if (!workspaceId || !query) return { projects: [], tasks: [], clients: [], members: [] };

    try {
        const response = await api.get(`/search`, {
            params: {
                workspaceId,
                q: query
            }
        });
        
        return response.data.data;
    } catch (error) {
        console.error("Search failed:", error);
        throw error;
    }
};
