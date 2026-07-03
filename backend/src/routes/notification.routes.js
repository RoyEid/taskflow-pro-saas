import express from "express";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    getPreferences,
    updatePreferences,
} from "../controllers/notification.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);
router.patch("/read-all", markAllAsRead);
router.delete("/clear-read", clearReadNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
