import mongoose from "mongoose";
import Client from "../models/Client.model.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getWorkspaceDashboard = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { range } = req.query; // '7d', '30d', 'this_month', 'today', 'all'

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
    // LOGIC FOR DYNAMIC TRENDS BASED ON RANGE
    // ---------------------------------
    const currentDate = new Date();
    const startDate = new Date();
    
    let daysToSubtract = 30; // default to 30d
    
    if (range === '7d') daysToSubtract = 7;
    else if (range === 'today') daysToSubtract = 1;
    else if (range === 'this_month') {
        startDate.setDate(1); // Start of current month
        daysToSubtract = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
    } else if (range === 'all') {
        daysToSubtract = 3650; // 10 years roughly
    }
    
    if (range !== 'this_month') {
        startDate.setDate(startDate.getDate() - daysToSubtract);
    }

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysToSubtract);

    // Calculate Projects created in range vs prev range
    const projectsLastRange = await Project.countDocuments({ workspace: workspaceId, createdAt: { $gte: startDate } });
    const projectsPrevRange = await Project.countDocuments({ workspace: workspaceId, createdAt: { $gte: previousStartDate, $lt: startDate } });
    
    // Calculate New Tasks created in range vs prev range
    const newTasksLastRange = await Task.countDocuments({ workspace: workspaceId, createdAt: { $gte: startDate } });
    const newTasksPrevRange = await Task.countDocuments({ workspace: workspaceId, createdAt: { $gte: previousStartDate, $lt: startDate } });

    // Calculate Completed Tasks in range vs prev range
    const completedTasksLastRange = await Task.countDocuments({ workspace: workspaceId, status: "done", updatedAt: { $gte: startDate } });
    const completedTasksPrevRange = await Task.countDocuments({ workspace: workspaceId, status: "done", updatedAt: { $gte: previousStartDate, $lt: startDate } });

    // Active tasks change (all tasks not done)
    const activeTasksLastRange = await Task.countDocuments({ workspace: workspaceId, status: { $ne: "done" }, createdAt: { $gte: startDate } });
    const activeTasksPrevRange = await Task.countDocuments({ workspace: workspaceId, status: { $ne: "done" }, createdAt: { $gte: previousStartDate, $lt: startDate } });

    // Aggregation for chart based on range
    let trendFormat = 'daily';
    let groupFormat = "%Y-%m-%d";

    if (range === 'today') {
        trendFormat = 'status';
    } else if (range === 'this_month') {
        trendFormat = 'weekly';
        groupFormat = "%Y-%V";
    } else if (range === 'all') {
        trendFormat = 'monthly';
        groupFormat = "%Y-%m";
    }

    let tasksTrend = [];

    if (trendFormat === 'status') {
        const rawTasksTrend = await Task.aggregate([
            { 
                $match: { 
                    workspace: new mongoose.Types.ObjectId(workspaceId),
                    // If 'today', we probably want all active/recent tasks, 
                    // but since the user asked for "distribution by status" for "Today",
                    // we'll just show the current snapshot of all active/done tasks today.
                    // Actually, let's just group by status for all tasks created since startDate (which is today).
                    createdAt: { $gte: startDate }
                } 
            },
            { 
                $group: { 
                    _id: "$status", 
                    count: { $sum: 1 } 
                } 
            }
        ]);
        
        const allStatuses = ["todo", "in_progress", "review", "done", "blocked"];
        tasksTrend = allStatuses.map(status => {
            const found = rawTasksTrend.find(t => t._id === status);
            return { _id: status, count: found ? found.count : 0 };
        });
    } else {
        tasksTrend = await Task.aggregate([
            { 
                $match: { 
                    workspace: new mongoose.Types.ObjectId(workspaceId), 
                    createdAt: { $gte: startDate } 
                } 
            },
            { 
                $group: { 
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt" } }, 
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { "_id": 1 } }
        ]);
    }

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

    const myTasks = await Task.find({
        workspace: workspaceId,
        assignee: req.user._id,
        status: { $ne: "done" }
    })
        .populate("project", "name")
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(5);

    const next7Days = new Date(currentDate);
    next7Days.setDate(next7Days.getDate() + 7);
    
    const dueSoonTasks = await Task.find({
        workspace: workspaceId,
        status: { $ne: "done" },
        dueDate: { $gte: currentDate, $lte: next7Days }
    })
        .populate("project", "name")
        .populate("assignee", "name email")
        .sort({ dueDate: 1 })
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
                            last30: projectsLastRange,
                            prev30: projectsPrevRange,
                        },
                        tasks: {
                            total: totalTasks,
                            todo: todoTasks,
                            inProgress: inProgressTasks,
                            review: reviewTasks,
                            done: doneTasks,
                            blocked: blockedTasks,
                            overdue: overdueTasks,
                            activeLast30: activeTasksLastRange,
                            activePrev30: activeTasksPrevRange,
                            completedLast30: completedTasksLastRange,
                            completedPrev30: completedTasksPrevRange,
                            newLast30: newTasksLastRange,
                            newPrev30: newTasksPrevRange,
                        },
                    },
                    tasksTrend,
                    trendFormat,
                    recentProjects,
                    recentTasks,
                    myTasks,
                    dueSoonTasks,
                }
            )
        );
});

export const getWorkspaceActivity = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    // We will aggregate activity from Projects, Tasks, and Clients
    const recentProjects = await Project.find({ workspace: workspaceId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("createdBy", "name email avatar")
        .lean();

    const recentTasksCreated = await Task.find({ workspace: workspaceId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("createdBy", "name email avatar")
        .lean();

    const recentTasksCompleted = await Task.find({ workspace: workspaceId, status: "done" })
        .sort({ updatedAt: -1 })
        .limit(20)
        .populate("createdBy", "name email avatar") // Actually completedBy is better, but we use updatedAt
        .lean();

    const recentClients = await Client.find({ workspace: workspaceId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(); // clients might not have createdBy, fallback to generic

    // Transform to unified activity format
    let activities = [];

    recentProjects.forEach(p => {
        activities.push({
            _id: `proj_create_${p._id}`,
            type: "project_created",
            title: `Project Created: ${p.name}`,
            description: p.description || "A new project was started.",
            date: p.createdAt,
            user: p.createdBy,
            relatedId: p._id
        });
    });

    recentTasksCreated.forEach(t => {
        activities.push({
            _id: `task_create_${t._id}`,
            type: "task_created",
            title: `Task Created: ${t.title}`,
            description: `Priority: ${t.priority}`,
            date: t.createdAt,
            user: t.createdBy,
            relatedId: t._id
        });
    });

    recentTasksCompleted.forEach(t => {
        activities.push({
            _id: `task_complete_${t._id}`,
            type: "task_completed",
            title: `Task Completed: ${t.title}`,
            description: "Task was marked as done.",
            date: t.updatedAt,
            user: t.createdBy, // We'll just show creator if we don't track who completed
            relatedId: t._id
        });
    });

    recentClients.forEach(c => {
        activities.push({
            _id: `client_create_${c._id}`,
            type: "client_created",
            title: `Client Added: ${c.name}`,
            description: c.company || "A new client joined the workspace.",
            date: c.createdAt,
            user: null, // If client doesn't track createdBy
            relatedId: c._id
        });
    });

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to latest 50 for MVP
    activities = activities.slice(0, 50);

    return res.status(200).json(
        new ApiResponse(200, "Workspace activity fetched successfully", activities)
    );
});