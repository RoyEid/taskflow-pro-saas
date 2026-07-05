import WorkspaceMember from "../models/WorkspaceMember.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const checkWorkspaceRole = (...allowedRoles) =>
    asyncHandler(async (req, res, next) => {
        const { workspaceId } = req.params;

        if (!req.user) {
            throw new ApiError(401, "Not authorized, user missing");
        }

        if (!workspaceId) {
            throw new ApiError(400, "Workspace ID is required");
        }

        const membership = await WorkspaceMember.findOne({
            workspace: workspaceId,
            user: req.user._id,
            status: "active",
        });

        if (!membership) {
            throw new ApiError(403, "You are not a member of this workspace");
        }

        const normalizedRole = String(membership.role || "").toLowerCase();
        if (!allowedRoles.includes(normalizedRole)) {
            console.error("PERMISSION FAILED:", {
                user: req.user._id,
                workspace: workspaceId,
                role: membership.role,
                allowed: allowedRoles
            });
            throw new ApiError(403, "You do not have permission for this action");
        }

        req.workspaceMember = membership;

        next();
    });
    