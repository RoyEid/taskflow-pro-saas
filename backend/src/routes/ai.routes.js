import express from "express";
import { body } from "express-validator";

import { askTaskFlowAssistant } from "../controllers/ai.controller.js";
import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";

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

router.post("/assistant", protect, assistantValidator, validate, askTaskFlowAssistant);

export default router;

