import ActivityLog from "../models/ActivityLog.model.js";

/**
 * Creates a new activity/audit log entry.
 * Sanitizes input to prevent saving sensitive credentials/tokens/passwords.
 */
export const logActivity = async ({
    workspaceId = null,
    actorUserId,
    actorName,
    action,
    entityType,
    entityId = null,
    entityName = null,
    source = "manual",
    metadata = {},
}) => {
    try {
        // Sanitize metadata to remove any potential passwords/tokens/keys
        const cleanMetadata = { ...metadata };
        const sensitiveKeys = ["password", "token", "token_secret", "secret", "apiKey", "api_key", "key", "authorization", "auth", "email_pass"];
        
        for (const k of Object.keys(cleanMetadata)) {
            if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
                cleanMetadata[k] = "[REDACTED]";
            }
        }

        return await ActivityLog.create({
            workspace: workspaceId,
            actorUser: actorUserId,
            actorName,
            action,
            entityType,
            entityId,
            entityName,
            source,
            metadata: cleanMetadata,
        });
    } catch (error) {
        console.error("Failed to create activity log:", error);
        return null;
    }
};
