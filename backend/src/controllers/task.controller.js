import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import Comment from "../models/Comment.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const checkProjectExists = async (projectId, workspaceId) => {
    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new ApiError(404, "Project not found in this workspace");
    }

    return project;
};

const checkAssignedUser = async (assignedTo, workspaceId) => {
    if (!assignedTo) {
        return;
    }

    const workspaceMember = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: assignedTo,
        status: "active",
    });

    if (!workspaceMember) {
        throw new ApiError(404, "Assigned user is not an active member of this workspace");
    }
};

export const createTask = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    const {
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate,
    } = req.body;

    await checkProjectExists(projectId, workspaceId);

    await checkAssignedUser(assignedTo, workspaceId);

    const task = await Task.create({
        workspace: workspaceId,
        project: projectId,
        title,
        description,
        assignedTo: assignedTo || null,
        status,
        priority,
        dueDate,
        completedAt: status === "done" ? new Date() : null,
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { task },
                "Task created successfully"
            )
        );
});

export const getTasks = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    await checkProjectExists(projectId, workspaceId);

    const tasks = await Task.find({
        workspace: workspaceId,
        project: projectId,
    })
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { tasks },
                "Tasks fetched successfully"
            )
        );
});

export const getTaskById = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;

    await checkProjectExists(projectId, workspaceId);

    const task = await Task.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    })
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { task },
                "Task fetched successfully"
            )
        );
});

export const updateTask = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;

    const {
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate,
    } = req.body;

    await checkProjectExists(projectId, workspaceId);

    const task = await Task.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    if (assignedTo !== undefined) {
        if (assignedTo === null) {
            task.assignedTo = null;
        } else {
            await checkAssignedUser(assignedTo, workspaceId);
            task.assignedTo = assignedTo;
        }
    }

    if (title !== undefined) {
        task.title = title;
    }

    if (description !== undefined) {
        task.description = description;
    }

    if (status !== undefined) {
        task.status = status;

        if (status === "done") {
            task.completedAt = new Date();
        } else {
            task.completedAt = null;
        }
    }

    if (priority !== undefined) {
        task.priority = priority;
    }

    if (dueDate !== undefined) {
        task.dueDate = dueDate;
    }

    await task.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { task },
                "Task updated successfully"
            )
        );
});

export const deleteTask = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;

    await checkProjectExists(projectId, workspaceId);

    const task = await Task.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    await Comment.deleteMany({
        workspace: workspaceId,
        project: projectId,
        task: taskId,
    });

    await task.deleteOne();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Task and related comments deleted successfully"
            )
        );
});