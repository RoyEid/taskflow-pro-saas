import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import Client from "../models/Client.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import User from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * @desc    Global search across workspace entities
 * @route   GET /api/search?workspaceId=...&q=...
 * @access  Private
 */
export const globalSearch = asyncHandler(async (req, res) => {
    const { workspaceId, q } = req.query;
    const userId = req.user._id;

    if (!workspaceId) {
        throw new ApiError(400, "Workspace ID is required for search");
    }

    if (!q || q.trim() === "") {
        return res.status(200).json({
            success: true,
            data: {
                projects: [],
                tasks: [],
                clients: [],
                members: [],
            },
        });
    }

    // Security Check: Ensure user belongs to the workspace they are searching in
    const isMember = await WorkspaceMember.exists({
        workspace: workspaceId,
        user: userId,
        status: "active",
    });

    if (!isMember) {
        throw new ApiError(403, "You do not have permission for this action");
    }

    const regex = new RegExp(q.trim(), "i");

    // Two-step query for tasks: Find matching users first to match assignees
    const matchingUsers = await User.find({
        $or: [{ name: regex }, { email: regex }],
    }).select("_id");
    const matchingUserIds = matchingUsers.map((u) => u._id);

    // Perform queries in parallel
    const [projects, tasks, clients, workspaceMembers] = await Promise.all([
        // Projects
        Project.find({
            workspace: workspaceId,
            $or: [
                { name: regex },
                { description: regex },
                { status: regex },
                { priority: regex },
            ],
        })
            .select("_id name description status priority")
            .limit(5)
            .lean(),

        // Tasks
        Task.find({
            workspace: workspaceId,
            $or: [
                { title: regex },
                { description: regex },
                { status: regex },
                { priority: regex },
                { assignee: { $in: matchingUserIds } },
            ],
        })
            .select("_id title description status priority project")
            .populate("assignee", "name email")
            .limit(5)
            .lean(),

        // Clients
        Client.find({
            workspace: workspaceId,
            $or: [
                { name: regex },
                { email: regex },
                { company: regex },
                { phone: regex },
            ],
        })
            .select("_id name email company phone")
            .limit(5)
            .lean(),

        // Members (Query members of the workspace and populate user details)
        WorkspaceMember.find({
            workspace: workspaceId,
            status: "active",
        })
            .populate("user", "name email avatar")
            .lean(),
    ]);

    // Filter members in javascript since they are populated refs
    // For large workspaces this might need an aggregation pipeline, but for MVP it's perfectly fine
    const matchedMembers = workspaceMembers
        .filter((member) => {
            const mRole = member.role || "";
            const mName = member.user?.name || "";
            const mEmail = member.user?.email || "";

            return (
                regex.test(mRole) ||
                regex.test(mName) ||
                regex.test(mEmail)
            );
        })
        .slice(0, 5)
        .map((member) => ({
            _id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            avatar: member.user.avatar,
            role: member.role,
        }));

    res.status(200).json({
        success: true,
        data: {
            projects,
            tasks,
            clients,
            members: matchedMembers,
        },
    });
});
