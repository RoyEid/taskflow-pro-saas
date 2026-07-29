import api from "./api";

/**
 * Search across the entire active workspace
 * @param {string} workspaceId - The active workspace ID
 * @param {string} query - The search term
 * @returns {Promise<Object>} Search results grouped by category
 */
export const searchWorkspace = async (workspaceId, query) => {
    if (!workspaceId || !query || !query.trim()) {
        return { projects: [], tasks: [], clients: [], members: [] };
    }

    try {
        const response = await api.get(`/search`, {
            params: {
                workspaceId,
                q: query.trim()
            }
        });
        
        const rawData = response.data?.data || response.data || {};
        return {
            projects: Array.isArray(rawData.projects) ? rawData.projects : [],
            tasks: Array.isArray(rawData.tasks) ? rawData.tasks : [],
            clients: Array.isArray(rawData.clients) ? rawData.clients : [],
            members: Array.isArray(rawData.members) ? rawData.members : [],
        };
    } catch (error) {
        console.error("Search failed:", error);
        return { projects: [], tasks: [], clients: [], members: [] };
    }
};
