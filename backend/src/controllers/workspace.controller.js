import Workspace from "../models/Workspace.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import ActivityLog from "../models/ActivityLog.model.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import Client from "../models/Client.model.js";
import Comment from "../models/Comment.model.js";
import ChatReadState from "../models/ChatReadState.model.js";
import Message from "../models/Message.model.js";
import Notification from "../models/Notification.model.js";
import SupportRequest from "../models/SupportRequest.model.js";
import Feedback from "../models/Feedback.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logActivity } from "../services/activityLog.service.js";

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

    await logActivity({
        workspaceId: workspace._id,
        actorUserId: req.user._id,
        actorName: req.user.name,
        action: "created",
        entityType: "Workspace",
        entityId: workspace._id,
        entityName: workspace.name,
        source: "manual",
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

export const updateWorkspace = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new ApiError(404, "Workspace not found");
    }

    workspace.name = name;
    if (description !== undefined) {
        workspace.description = description;
    }

    await workspace.save();

    res.status(200).json(
        new ApiResponse(200, "Workspace updated successfully", {
            workspace,
        })
    );
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
        throw new ApiError(404, "Workspace not found");
    }

    // Check if user has other workspaces before deleting this one
    const userWorkspacesCount = await WorkspaceMember.countDocuments({
        user: req.user._id,
        status: "active",
    });

    if (userWorkspacesCount <= 1) {
        throw new ApiError(400, "You cannot delete your only workspace. Create or join another workspace first.");
    }

    // Perform safe cascading delete
    await Promise.all([
        Project.deleteMany({ workspace: workspaceId }),
        Task.deleteMany({ workspace: workspaceId }),
        Client.deleteMany({ workspace: workspaceId }),
        Comment.deleteMany({ workspace: workspaceId }),
        ChatReadState.deleteMany({ workspace: workspaceId }),
        Message.deleteMany({ workspace: workspaceId }),
        Notification.deleteMany({ workspace: workspaceId }),
        SupportRequest.deleteMany({ workspace: workspaceId }),
        Feedback.deleteMany({ workspace: workspaceId }),
        WorkspaceMember.deleteMany({ workspace: workspaceId }),
    ]);

    await Workspace.findByIdAndDelete(workspaceId);

    res.status(200).json(
        new ApiResponse(200, "Workspace deleted successfully", {})
    );
});

export const getActivityLogs = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    const logs = await ActivityLog.find({ workspace: workspaceId })
        .sort({ createdAt: -1 })
        .limit(limit);

    res.status(200).json(
        new ApiResponse(200, "Activity logs fetched successfully", { logs })
    );
});
