import express from "express";

import { getWorkspaceDashboard, getWorkspaceActivity } from "../controllers/dashboard.controller.js";

import { dashboardValidator } from "../validators/dashboard.validator.js";

import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";

const router = express.Router();

router.get(
    "/:workspaceId/dashboard",
    protect,
    dashboardValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getWorkspaceDashboard
);

router.get(
    "/:workspaceId/activity",
    protect,
    dashboardValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "member"),
    getWorkspaceActivity
);

export default router;