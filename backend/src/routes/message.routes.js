import express from "express";
import { body, param, query } from "express-validator";

import {
    getRecentWorkspaceMessages,
    getWorkspaceChatMeta,
    getWorkspaceChatUnreadCount,
    getWorkspaceMessageContext,
    markWorkspaceMessagesRead,
    removeWorkspaceMessage,
    searchWorkspaceChatMessages,
    startNewWorkspaceChat,
    updateWorkspaceMessage,
} from "../controllers/message.controller.js";
import protect from "../middleware/auth.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { CHAT_MESSAGE_MAX_LENGTH } from "../services/chat.service.js";
import { workspaceIdValidator } from "../validators/member.validator.js";

const router = express.Router();

const messageIdValidator = [
    param("messageId")
        .isMongoId()
        .withMessage("Invalid message ID"),
];

const editMessageValidator = [
    ...workspaceIdValidator,
    ...messageIdValidator,
    body("content")
        .trim()
        .notEmpty()
        .withMessage("Message content is required")
        .isLength({ max: CHAT_MESSAGE_MAX_LENGTH })
        .withMessage(`Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH} characters`),
];

const searchMessageValidator = [
    ...workspaceIdValidator,
    query("q")
        .trim()
        .notEmpty()
        .withMessage("Search text is required")
        .isLength({ max: 200 })
        .withMessage("Search text cannot exceed 200 characters"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
];

const messageContextValidator = [
    ...workspaceIdValidator,
    ...messageIdValidator,
    query("window")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("Window must be between 1 and 50"),
];

router.get(
    "/:workspaceId/messages/meta",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getWorkspaceChatMeta
);

router.get(
    "/:workspaceId/messages/unread-count",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getWorkspaceChatUnreadCount
);

router.patch(
    "/:workspaceId/messages/read",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    markWorkspaceMessagesRead
);

router.post(
    "/:workspaceId/messages/start-new",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner"),
    startNewWorkspaceChat
);

router.get(
    "/:workspaceId/messages/search",
    protect,
    searchMessageValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    searchWorkspaceChatMessages
);

router.get(
    "/:workspaceId/messages/context/:messageId",
    protect,
    messageContextValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getWorkspaceMessageContext
);

router.patch(
    "/:workspaceId/messages/:messageId",
    protect,
    editMessageValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    updateWorkspaceMessage
);

router.delete(
    "/:workspaceId/messages/:messageId",
    protect,
    workspaceIdValidator,
    messageIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    removeWorkspaceMessage
);

router.get(
    "/:workspaceId/messages",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getRecentWorkspaceMessages
);

export default router;
