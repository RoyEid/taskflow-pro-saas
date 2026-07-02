import express from "express";
import{
    addWorkspaceMember,
    getWorkspaceMembers,
    updateMemberRole,
    removeWorkspaceMember,
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
    checkWorkspaceRole("owner", "admin", "member"),
    getWorkspaceMembers
);

router.post(
    "/:workspaceId/members",
    protect,
    workspaceIdValidator,
    addMemberValidator,
    validate,
    checkWorkspaceRole("owner"),
    addWorkspaceMember
);

router.patch(
    "/:workspaceId/members/:memberId/role",
    protect,
    workspaceIdValidator,
    updateMemberRoleValidator,
    validate,
    checkWorkspaceRole("owner"),
    updateMemberRole
);

router.delete(
    "/:workspaceId/members/:memberId",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner"),
    removeWorkspaceMember
);

export default router;