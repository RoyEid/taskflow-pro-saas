import Workspace from "../models/Workspace.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createWorkspace = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const workspace = await Workspace.create({
        name,
        description,
        owner: req.user._id,
    });

    await WorkspaceMember.create({
        workspace: workspace._id,
        user: req.user._id,
        role: "owner",
        status: "active",
    });

    res.status(201).json(
        new ApiResponse(201, "Workspace created successfully", {
            workspace,
        })
    );
});

export const getMyWorkspaces = asyncHandler(async (req, res) => {
    const memberships = await WorkspaceMember.find({
        user: req.user._id,
        status: "active",
    })
        .populate("workspace")
        .sort({ createdAt: -1 });

    const workspaces = memberships
        .filter((membership) => membership.workspace)
        .map((membership) => ({
            workspace: membership.workspace,
            role: membership.role,
            joinedAt: membership.joinedAt,
        }));

    res.status(200).json(
        new ApiResponse(200, "Workspaces fetched successfully", {
            workspaces,
        })
    );
});

export const getMyWorkspaceById = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new ApiError(404, "Workspace not found");
    }

    res.status(200).json(
        new ApiResponse(200, "Workspace fetched successfully", {
            workspace,
            member: req.workspaceMember,
        })
    );
});