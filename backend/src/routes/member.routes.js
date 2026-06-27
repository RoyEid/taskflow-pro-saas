import express from "express";

import {
    addWorkspaceMember,
    getWorkspaceMembers,
    updateMemberRole,
} from "../controllers/member.controller.js";

import protect from "../middleware/auth.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";
import validate from "../middleware/validate.middleware.js";

import {
    addMemberValidator,
    updateMemberRoleValidator,
    workspaceIdValidator,
} from "../validators/member.validator.js";

const router = express.Router();

router.get(
    "/:workspaceId/members",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "manager"),
    getWorkspaceMembers
);

router.post(
    "/:workspaceId/members",
    protect,
    workspaceIdValidator,
    addMemberValidator,
    validate,
    checkWorkspaceRole("owner", "admin"),
    addWorkspaceMember
);

router.patch(
    "/:workspaceId/members/:memberId/role",
    protect,
    workspaceIdValidator,
    updateMemberRoleValidator,
    validate,
    checkWorkspaceRole("owner", "admin"),
    updateMemberRole
);

export default router;