import Comment from "../models/Comment.model.js";
import Task from "../models/Task.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notification.service.js";

const checkTaskExists = async (workspaceId, projectId, taskId) => {
    const task = await Task.findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found in this workspace and project");
    }

    return task;
};

const canModifyComment = (comment, req) => {
    const isCommentOwner = comment.createdBy.toString() === req.user._id.toString();

    const isWorkspaceOwnerOrAdmin =
        req.workspaceMember &&
        ["owner", "admin"].includes(req.workspaceMember.role);

    return isCommentOwner || isWorkspaceOwnerOrAdmin;
};

export const createComment = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;
    const { content } = req.body;

    const task = await checkTaskExists(workspaceId, projectId, taskId);

    const comment = await Comment.create({
        workspace: workspaceId,
        project: projectId,
        task: taskId,
        content,
        createdBy: req.user._id,
    });

    const notifyUsers = [task.assignee?.toString(), task.createdBy?.toString()].filter(Boolean);
    const uniqueUsers = [...new Set(notifyUsers)];

    for (const userId of uniqueUsers) {
        await createNotification({
            recipient: userId,
            workspace: workspaceId,
            actor: req.user._id,
            type: "task_commented",
            title: "New comment",
            message: `${req.user.name} commented on ${task.title}`,
            link: `/tasks/${taskId}?project=${projectId}`,
        });
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Comment created successfully",
                { comment }
            )
        );
});

export const getComments = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId } = req.params;

    await checkTaskExists(workspaceId, projectId, taskId);

    const comments = await Comment.find({
        workspace: workspaceId,
        project: projectId,
        task: taskId,
    })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comments fetched successfully",
                { comments }
            )
        );
});

export const getCommentById = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId, commentId } = req.params;

    await checkTaskExists(workspaceId, projectId, taskId);

    const comment = await Comment.findOne({
        _id: commentId,
        workspace: workspaceId,
        project: projectId,
        task: taskId,
    }).populate("createdBy", "name email");

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment fetched successfully",
                { comment }
            )
        );
});

export const updateComment = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId, commentId } = req.params;
    const { content } = req.body;

    await checkTaskExists(workspaceId, projectId, taskId);

    const comment = await Comment.findOne({
        _id: commentId,
        workspace: workspaceId,
        project: projectId,
        task: taskId,
    });

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!canModifyComment(comment, req)) {
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content = content;
    comment.editedAt = new Date();

    await comment.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment updated successfully",
                { comment }
            )
        );
});

export const deleteComment = asyncHandler(async (req, res) => {
    const { workspaceId, projectId, taskId, commentId } = req.params;

    await checkTaskExists(workspaceId, projectId, taskId);

    const comment = await Comment.findOne({
        _id: commentId,
        workspace: workspaceId,
        project: projectId,
        task: taskId,
    });

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (!canModifyComment(comment, req)) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await comment.deleteOne();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment deleted successfully",
                {}
            )
        );
});