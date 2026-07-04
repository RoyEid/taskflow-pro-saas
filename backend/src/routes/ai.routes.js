import express from "express";
import { body } from "express-validator";

import {
    askTaskFlowAssistant,
    confirmAssistantActionController,
} from "../controllers/ai.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { ASSISTANT_ACTION_TYPES } from "../services/ai.service.js";
import { assistantMessageRateLimiter, confirmedActionRateLimiter } from "../middleware/rateLimiter.middleware.js";

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
    body("workspaceId")
        .optional({ checkFalsy: true, nullable: true })
        .isMongoId()
        .withMessage("Invalid workspace ID"),
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
];

const confirmActionValidator = [
    body("actionType")
        .isString()
        .withMessage("Action type is required")
        .bail()
        .isIn(ASSISTANT_ACTION_TYPES)
        .withMessage("Unsupported assistant action"),
    body("workspaceId")
        .optional({ checkFalsy: true, nullable: true })
        .isMongoId()
        .withMessage("Invalid workspace ID"),
    body("payload")
        .exists({ values: "null" })
        .withMessage("Payload is required")
        .bail()
        .isObject({ strict: true })
        .withMessage("Payload must be an object"),
];

router.post("/assistant", protect, assistantMessageRateLimiter, assistantValidator, validate, askTaskFlowAssistant);
router.post("/actions/confirm", protect, confirmedActionRateLimiter, confirmActionValidator, validate, confirmAssistantActionController);

export default router;
