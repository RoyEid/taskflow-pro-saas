import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import Comment from "../models/Comment.model.js";

import ApiError from "../utils/ApiError.js";
import { createNotification } from "../services/notification.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const checkProjectExists = async (projectId, workspaceId) => {
    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    }).populate("workspace", "name");

    if (!project) {
        throw new ApiError(404, "Project not found in this workspace");
    }

    return project;
};

const checkAssignedUser = async (assignee, workspaceId) => {
    if (!assignee) {
        return;
    }

    const workspaceMember = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: assignee,
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
        assignee,
        status,
        priority,
        dueDate,
    } = req.body;

    const project = await checkProjectExists(projectId, workspaceId);

    let finalAssignee = assignee || null;

    if (req.workspaceMember && req.workspaceMember.role === "member") {
        finalAssignee = req.user._id;
    }

    if (finalAssignee && String(finalAssignee) !== String(req.user._id) || req.workspaceMember?.role !== "member") {
        // Only strictly check if it's not the default override, or if it's admin/owner assigning
        await checkAssignedUser(finalAssignee, workspaceId);
    }

    const task = await Task.create({
        workspace: workspaceId,
        project: projectId,
        title,
        description,
        assignee: finalAssignee,
        status,
        priority,
        dueDate,
        completedAt: status === "done" ? new Date() : null,
        createdBy: req.user._id,
    });

    if (finalAssignee) {
        await createNotification({
            recipient: finalAssignee,
            workspace: workspaceId,
            actor: req.user._id,
            type: "task_assigned",
            title: "New task assigned",
            message: `${req.user.name} assigned you to ${task.title}`,
            link: `/tasks/${task._id}?project=${projectId}`,
            metadata: {
                taskTitle: task.title,
                projectName: project.name,
                workspaceName: project.workspace?.name,
                assignedByName: req.user.name,
                priority: task.priority,
                dueDate: task.dueDate
            }
        });
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Task created successfully",
                { task }
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
        .populate("assignee", "name email avatar")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Tasks fetched successfully",
                { tasks }
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
        .populate("assignee", "name email avatar")
        .populate("createdBy", "name email");

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Task fetched successfully",
                { task }
            )
        );
});

export const updateTask = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;

    const {
        title,
        description,
        assignee,
        status,
        priority,
        dueDate,
    } = req.body;

    const project = await checkProjectExists(projectId, workspaceId);

    const task = await Task.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const oldAssignee = task.assignee ? task.assignee.toString() : null;
    const oldStatus = task.status;

    if (assignee !== undefined) {
        if (assignee === null) {
            task.assignee = null;
        } else {
            await checkAssignedUser(assignee, workspaceId);
            task.assignee = assignee;
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

    if (assignee !== undefined && String(assignee) !== oldAssignee && assignee !== null) {
        await createNotification({
            recipient: assignee,
            workspace: workspaceId,
            actor: req.user._id,
            type: "task_assigned",
            title: "Task assigned",
            message: `${req.user.name} assigned you to ${task.title}`,
            link: `/tasks/${task._id}?project=${projectId}`,
            metadata: {
                taskTitle: task.title,
                projectName: project.name,
                workspaceName: project.workspace?.name,
                assignedByName: req.user.name,
                priority: task.priority,
                dueDate: task.dueDate
            }
        });
    }

    if (status !== undefined && status !== oldStatus) {
        const notifyUsers = [task.assignee?.toString(), task.createdBy?.toString()].filter(Boolean);
        const uniqueUsers = [...new Set(notifyUsers)];

        for (const userId of uniqueUsers) {
            await createNotification({
                recipient: userId,
                workspace: workspaceId,
                actor: req.user._id,
                type: "task_status_changed",
                title: "Task status updated",
                message: `${task.title} was moved to ${status.replace("_", " ")}`,
                link: `/tasks/${task._id}?project=${projectId}`,
            });
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Task updated successfully",
                { task }
            )
        );
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;
    const { status } = req.body;

    await checkProjectExists(projectId, workspaceId);

    const task = await Task.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const oldStatus = task.status;

    if (status !== undefined) {
        task.status = status;
        if (status === "done") {
            task.completedAt = new Date();
        } else {
            task.completedAt = null;
        }
    }

    await task.save();

    if (status !== undefined && status !== oldStatus) {
        const notifyUsers = [task.assignee?.toString(), task.createdBy?.toString()].filter(Boolean);
        const uniqueUsers = [...new Set(notifyUsers)];

        for (const userId of uniqueUsers) {
            await createNotification({
                recipient: userId,
                workspace: workspaceId,
                actor: req.user._id,
                type: "task_status_changed",
                title: "Task status updated",
                message: `${task.title} was moved to ${status.replace("_", " ")}`,
                link: `/tasks/${task._id}?project=${projectId}`,
            });
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Task status updated successfully",
                { task }
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
                "Task and related comments deleted successfully",
                {}
            )
        );
});