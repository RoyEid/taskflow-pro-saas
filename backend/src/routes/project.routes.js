import express from "express";

import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
} from "../controllers/project.controller.js";

import {
    createProjectValidator,
    updateProjectValidator,
    projectIdValidator,
} from "../validators/project.validator.js";

import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";

const router = express.Router();

router
    .route("/:workspaceId/projects")
    .post(
        protect,
        createProjectValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        createProject
    )
    .get(
        protect,
        checkWorkspaceRole("owner", "admin", "member"),
        getProjects
    );

router
    .route("/:workspaceId/projects/:projectId")
    .get(
        protect,
        projectIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        getProjectById
    )
    .put(
        protect,
        updateProjectValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        updateProject
    )
    .delete(
        protect,
        projectIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin"),
        deleteProject
    );

export default router;