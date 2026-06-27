import Client from "../models/Client.model.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getWorkspaceDashboard = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const totalClients = await Client.countDocuments({
        workspace: workspaceId,
        status: "active",
    });

    const totalProjects = await Project.countDocuments({
        workspace: workspaceId,
    });

    const activeProjects = await Project.countDocuments({
        workspace: workspaceId,
        status: "active",
    });

    const completedProjects = await Project.countDocuments({
        workspace: workspaceId,
        status: "completed",
    });

    const totalTasks = await Task.countDocuments({
        workspace: workspaceId,
    });

    const todoTasks = await Task.countDocuments({
        workspace: workspaceId,
        status: "todo",
    });

    const inProgressTasks = await Task.countDocuments({
        workspace: workspaceId,
        status: "in_progress",
    });

    const reviewTasks = await Task.countDocuments({
        workspace: workspaceId,
        status: "review",
    });

    const doneTasks = await Task.countDocuments({
        workspace: workspaceId,
        status: "done",
    });

    const blockedTasks = await Task.countDocuments({
        workspace: workspaceId,
        status: "blocked",
    });

    const overdueTasks = await Task.countDocuments({
        workspace: workspaceId,
        dueDate: { $lt: new Date() },
        status: { $ne: "done" },
    });

    const recentProjects = await Project.find({
        workspace: workspaceId,
    })
        .populate("client", "name companyName")
        .sort({ createdAt: -1 })
        .limit(5);

    const recentTasks = await Task.find({
        workspace: workspaceId,
    })
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .limit(5);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    stats: {
                        clients: {
                            total: totalClients,
                        },
                        projects: {
                            total: totalProjects,
                            active: activeProjects,
                            completed: completedProjects,
                        },
                        tasks: {
                            total: totalTasks,
                            todo: todoTasks,
                            inProgress: inProgressTasks,
                            review: reviewTasks,
                            done: doneTasks,
                            blocked: blockedTasks,
                            overdue: overdueTasks,
                        },
                    },
                    recentProjects,
                    recentTasks,
                },
                "Dashboard data fetched successfully"
            )
        );
});