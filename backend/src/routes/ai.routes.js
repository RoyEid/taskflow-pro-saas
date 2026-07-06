import express from "express";
import { body } from "express-validator";

import {
    askTaskFlowAssistant,
} from "../controllers/ai.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { assistantMessageRateLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

const assistantValidator = [
    body("message")
        .isString()
        .withMessage("Message must be text")
        .trim()
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ max: 1000 })
        .withMessage("Message cannot exceed 1000 characters"),
    body("history")
        .optional()
        .isArray({ max: 8 })
        .withMessage("Conversation history cannot exceed 8 messages"),
    body("history.*.role")
        .optional()
        .isIn(["user", "assistant"])
        .withMessage("History role must be user or assistant"),
    body("history.*.content")
        .optional()
        .isString()
        .withMessage("History content must be text")
        .isLength({ max: 1000 })
        .withMessage("History messages cannot exceed 1000 characters"),
    body("context")
        .optional()
        .isObject({ strict: true })
        .withMessage("Assistant context must be an object"),
    body("context.pathname")
        .optional()
        .isString()
        .withMessage("Pathname must be text")
        .isLength({ max: 200 })
        .withMessage("Pathname is too long"),
    body("context.pageName")
        .optional()
        .isString()
        .withMessage("Page name must be text")
        .isLength({ max: 80 })
        .withMessage("Page name is too long"),
    body("context.moduleName")
        .optional()
        .isString()
        .withMessage("Module name must be text")
        .isLength({ max: 80 })
        .withMessage("Module name is too long"),
    body("context.userRole")
        .optional()
        .isString()
        .withMessage("User role must be text")
        .isLength({ max: 60 })
        .withMessage("User role is too long"),
    body("context.workspaceRole")
        .optional()
        .isString()
        .withMessage("Workspace role must be text")
        .isLength({ max: 60 })
        .withMessage("Workspace role is too long"),
    body("context.themeMode")
        .optional()
        .isString()
        .withMessage("Theme mode must be text")
        .isLength({ max: 20 })
        .withMessage("Theme mode is too long"),
];

router.post("/assistant", protect, assistantMessageRateLimiter, assistantValidator, validate, askTaskFlowAssistant);

export default router;
