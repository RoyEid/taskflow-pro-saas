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

/*
 * helmet() defaults to `Cross-Origin-Resource-Policy: same-origin`, and the
 * controller only relaxes it on the success path. That meant a 401/403/404 on
 * this route was blocked by the browser before the app could read it: an <img>
 * whose file is missing failed with ERR_BLOCKED_BY_RESPONSE.NotSameOrigin
 * instead of a plain 404, so the UI could never tell "not found" from "not
 * allowed". Setting the header up front makes every response - success or
 * error - legible to the frontend on the Vite origin.
 *
 * This does not widen access: `protect` and `checkWorkspaceRole` still gate
 * the bytes. CORP only controls whether a cross-origin document may embed the
 * response it already successfully requested with credentials.
 */
const allowCrossOriginEmbedding = (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
};

router.get(
    "/:workspaceId/messages/attachments/:filename",
    allowCrossOriginEmbedding,
    protect,
    workspaceIdValidator,
    attachmentFilenameValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getAttachmentSecurely
);

export default router;
