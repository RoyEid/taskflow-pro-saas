import express from "express";
import { createWorkspace, getMyWorkspaces, getMyWorkspaceById } from "../controllers/workspace.controller.js"
import protect from "../middleware/auth.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js"
import validate from "../middleware/validate.middleware.js"
import { createWorkspaceValidator } from "../validators/workspace.validator.js";


const router = express.Router();

router.post("/", protect, createWorkspaceValidator, validate, createWorkspace);
router.get("/", protect, getMyWorkspaces);
router.get("/:workspaceId", protect, checkWorkspaceRole("owner", "admin", "member"), getMyWorkspaceById,

);
export default router;