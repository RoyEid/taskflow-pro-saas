import express from "express";
import { param } from "express-validator";
import protect from "../middleware/auth.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { workspaceIdValidator } from "../validators/member.validator.js";
import {
    getAttachmentSecurely,
    uploadAttachment,
    uploadMiddleware,
} from "../controllers/attachment.controller.js";

const router = express.Router();

const attachmentFilenameValidator = [
    param("filename")
        .trim()
        .notEmpty()
        .withMessage("Filename is required"),
];

router.post(
    "/:workspaceId/messages/upload",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    uploadMiddleware,
    uploadAttachment
);

router.get(
    "/:workspaceId/messages/attachments/:filename",
    protect,
    workspaceIdValidator,
    attachmentFilenameValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getAttachmentSecurely
);

export default router;
