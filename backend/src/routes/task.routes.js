import express from "express";

import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from "../controllers/task.controller.js";

import {
    createTaskValidator,
    updateTaskValidator,
    taskIdValidator,
} from "../validators/task.validator.js";

import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";

const router = express.Router();

router
    .route("/:workspaceId/projects/:projectId/tasks")
    .post(
        protect,
        createTaskValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        createTask
    )
    .get(
        protect,
        checkWorkspaceRole("owner", "admin", "member"),
        getTasks
    );

router
    .route("/:workspaceId/projects/:projectId/tasks/:taskId")
    .get(
        protect,
        taskIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        getTaskById
    )
    .put(
        protect,
        updateTaskValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        updateTask
    )
    .delete(
        protect,
        taskIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin"),
        deleteTask
    );

export default router;