import express from "express";
import { createWorkspace, getMyWorkspaces, getMyWorkspaceById, updateWorkspace, deleteWorkspace, getActivityLogs } from "../controllers/workspace.controller.js"
import protect from "../middleware/auth.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js"
import validate from "../middleware/validate.middleware.js"
import { createWorkspaceValidator, updateWorkspaceValidator } from "../validators/workspace.validator.js";


const router = express.Router();

router.post("/", protect, createWorkspaceValidator, validate, createWorkspace);
router.get("/", protect, getMyWorkspaces);
router.get("/:workspaceId", protect, checkWorkspaceRole("owner", "admin", "member"), getMyWorkspaceById);
router.get("/:workspaceId/activity", protect, checkWorkspaceRole("owner", "admin", "member"), getActivityLogs);
router.patch("/:workspaceId", protect, checkWorkspaceRole("owner"), updateWorkspaceValidator, validate, updateWorkspace);
router.delete("/:workspaceId", protect, checkWorkspaceRole("owner"), deleteWorkspace);
export default router;