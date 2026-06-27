import express from "express";

import {
    createComment,
    getComments,
    getCommentById,
    updateComment,
    deleteComment,
} from "../controllers/comment.controller.js";

import {
    createCommentValidator,
    updateCommentValidator,
    commentIdValidator,
} from "../validators/comment.validator.js";

import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";

const router = express.Router();

router
    .route("/:workspaceId/projects/:projectId/tasks/:taskId/comments")
    .post(
        protect,
        createCommentValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        createComment
    )
    .get(
        protect,
        checkWorkspaceRole("owner", "admin", "member"),
        getComments
    );

router
    .route("/:workspaceId/projects/:projectId/tasks/:taskId/comments/:commentId")
    .get(
        protect,
        commentIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        getCommentById
    )
    .put(
        protect,
        updateCommentValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        updateComment
    )
    .delete(
        protect,
        commentIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        deleteComment
    );

export default router;