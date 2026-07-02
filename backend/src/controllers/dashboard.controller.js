import mongoose from "mongoose";
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

    // ---------------------------------
    // NEW LOGIC FOR DYNAMIC TRENDS
    // ---------------------------------
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date(thirtyDaysAgo);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

    // Calculate Projects created in last 30 vs prev 30
    const projectsLast30 = await Project.countDocuments({ workspace: workspaceId, createdAt: { $gte: thirtyDaysAgo } });
    const projectsPrev30 = await Project.countDocuments({ workspace: workspaceId, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });
    
    // Calculate New Tasks created in last 30 vs prev 30
    const newTasksLast30 = await Task.countDocuments({ workspace: workspaceId, createdAt: { $gte: thirtyDaysAgo } });
    const newTasksPrev30 = await Task.countDocuments({ workspace: workspaceId, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    // Calculate Completed Tasks in last 30 vs prev 30
    const completedTasksLast30 = await Task.countDocuments({ workspace: workspaceId, status: "done", updatedAt: { $gte: thirtyDaysAgo } });
    const completedTasksPrev30 = await Task.countDocuments({ workspace: workspaceId, status: "done", updatedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    // Active tasks change (all tasks not done)
    const activeTasksLast30 = await Task.countDocuments({ workspace: workspaceId, status: { $ne: "done" }, createdAt: { $gte: thirtyDaysAgo } });
    const activeTasksPrev30 = await Task.countDocuments({ workspace: workspaceId, status: { $ne: "done" }, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    // Aggregation for chart (tasks created per day in last 30 days)
    const tasksTrend = await Task.aggregate([
        { 
            $match: { 
                workspace: new mongoose.Types.ObjectId(workspaceId), 
                createdAt: { $gte: thirtyDaysAgo } 
            } 
        },
        { 
            $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                count: { $sum: 1 } 
            } 
        },
        { $sort: { "_id": 1 } }
    ]);

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
        .populate("assignee", "name email")
        .sort({ createdAt: -1 })
        .limit(5);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Dashboard data fetched successfully",
                {
                    stats: {
                        clients: {
                            total: totalClients,
                        },
                        projects: {
                            total: totalProjects,
                            active: activeProjects,
                            completed: completedProjects,
                            last30: projectsLast30,
                            prev30: projectsPrev30,
                        },
                        tasks: {
                            total: totalTasks,
                            todo: todoTasks,
                            inProgress: inProgressTasks,
                            review: reviewTasks,
                            done: doneTasks,
                            blocked: blockedTasks,
                            overdue: overdueTasks,
                            activeLast30: activeTasksLast30,
                            activePrev30: activeTasksPrev30,
                            completedLast30: completedTasksLast30,
                            completedPrev30: completedTasksPrev30,
                            newLast30: newTasksLast30,
                            newPrev30: newTasksPrev30,
                        },
                    },
                    tasksTrend,
                    recentProjects,
                    recentTasks,
                }
            )
        );
});