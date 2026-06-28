import Project from "../models/Project.model.js";
import Client from "../models/Client.model.js";
import Task from "../models/Task.model.js";
import Comment from "../models/Comment.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createProject = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const {
        client,
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
    } = req.body;

    const existingClient = await Client.findOne({
        _id: client,
        workspace: workspaceId,
        status: "active",
    });

    if (!existingClient) {
        throw new ApiError(404, "Client not found in this workspace");
    }

    const project = await Project.create({
        workspace: workspaceId,
        client,
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { project },
                "Project created successfully"
            )
        );
});

export const getProjects = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const projects = await Project.find({
        workspace: workspaceId,
    })
        .populate("client", "name email companyName")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { projects },
                "Projects fetched successfully"
            )
        );
});

export const getProjectById = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    })
        .populate("client", "name email companyName")
        .populate("createdBy", "name email");

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { project },
                "Project fetched successfully"
            )
        );
});

export const updateProject = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    const {
        client,
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
    } = req.body;

    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    if (client) {
        const existingClient = await Client.findOne({
            _id: client,
            workspace: workspaceId,
            status: "active",
        });

        if (!existingClient) {
            throw new ApiError(404, "Client not found in this workspace");
        }

        project.client = client;
    }

    if (name !== undefined) {
        project.name = name;
    }

    if (description !== undefined) {
        project.description = description;
    }

    if (status !== undefined) {
        project.status = status;
    }

    if (priority !== undefined) {
        project.priority = priority;
    }

    if (startDate !== undefined) {
        project.startDate = startDate;
    }

    if (dueDate !== undefined) {
        project.dueDate = dueDate;
    }

    await project.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { project },
                "Project updated successfully"
            )
        );
});

export const deleteProject = asyncHandler(async (req, res) => {
    const { workspaceId, projectId } = req.params;

    const project = await Project.findOne({
        _id: projectId,
        workspace: workspaceId,
    });

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    await Comment.deleteMany({
        workspace: workspaceId,
        project: projectId,
    });

    await Task.deleteMany({
        workspace: workspaceId,
        project: projectId,
    });

    await project.deleteOne();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Project, related tasks, and related comments deleted successfully"
            )
        );
});