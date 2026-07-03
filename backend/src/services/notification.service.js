import Notification from "../models/Notification.model.js";
import NotificationPreference from "../models/NotificationPreference.model.js";

/**
 * Safely create a notification without breaking the main execution flow.
 * 
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.recipient - Target user ID (required)
 * @param {string|mongoose.Types.ObjectId} [options.workspace] - Workspace ID
 * @param {string|mongoose.Types.ObjectId} [options.actor] - User who triggered the action
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification body
 * @param {string} [options.link] - Frontend route link
 * @param {Object} [options.metadata] - Extra data
 * @returns {Promise<Object|null>} The created notification or null if skipped/failed
 */
export const createNotification = async ({
    recipient,
    workspace,
    actor,
    type,
    title,
    message,
    link,
    metadata
}) => {
    try {
        if (!recipient) return null;

        // Do not ping the actor themselves (unless explicitly bypassed, but usually not)
        if (actor && recipient.toString() === actor.toString()) {
            return null;
        }

        const prefs = await NotificationPreference.findOne({ user: recipient });
        if (prefs) {
            // Keep in-app notifications working (do not return null to block them completely)
            // (The system handles in-app read/unread status separately)
        }

        const notification = await Notification.create({
            recipient,
            workspace,
            actor,
            type,
            title,
            message,
            link,
            metadata
        });


        // ----------------------------------------------------

        return notification;
    } catch (error) {
        // We log the error safely so it doesn't crash the main route (e.g. task creation)
        console.error("Failed to create notification:", error);
        return null;
    }
};
