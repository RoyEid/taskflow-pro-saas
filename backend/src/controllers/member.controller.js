import User from "../models/User.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import ApiError from "../utils/ApiError.js";
import { createNotification } from "../services/notification.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getWorkspaceMembers = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const members = await WorkspaceMember.find({
        workspace: workspaceId,
        status: "active",
    })
        .populate("user", "name email avatar status")
        .populate("invitedBy", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, "Workspace members fetched successfully", {
            members,
        })
    );
});

export const addWorkspaceMember = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { email, role = "member" } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    
    const userToAdd = await User.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
    }).select("_id name email status");

    if (!userToAdd) {
        throw new ApiError(404, "User not found. The user must register first.");
    }

    if (userToAdd.status === "disabled") {
        throw new ApiError(403, "This user account is disabled");
    }

    const existingMember = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userToAdd._id,
    });

    if (existingMember && existingMember.status === "active") {
        throw new ApiError(400, "User is already a member of this workspace");
    }

    if (existingMember && existingMember.status !== "active") {
        existingMember.role = role;
        existingMember.status = "active";
        existingMember.invitedBy = req.user._id;
        existingMember.joinedAt = new Date();

        await existingMember.save();

        return res.status(200).json(
            new ApiResponse(200, "Workspace member reactivated successfully", {
                member: existingMember,
            })
        );
    }

    const member = await WorkspaceMember.create({
        workspace: workspaceId,
        user: userToAdd._id,
        role,
        status: "active",
        invitedBy: req.user._id,
    });

    res.status(201).json(
        new ApiResponse(201, "Workspace member added successfully", {
            member,
        })
    );
});

export const updateMemberRole = asyncHandler(async (req, res) => {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const normalizedRole = String(role || "").toLowerCase();

    // 1. Check current logged-in user's role in this workspace
    const currentMembership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        status: "active"
    });

    if (!currentMembership || String(currentMembership.role).toLowerCase() !== "owner") {
        console.error("ROLE UPDATE FAILED: User is not owner", {
            requesterId: req.user._id,
            workspaceId,
            foundRole: currentMembership?.role
        });
        return res.status(403).json({
            message: "You do not have permission for this action"
        });
    }

    // 2. Find target membership by user ID
    const targetMembership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: memberId,
        status: "active"
    });

    if (!targetMembership) {
        throw new ApiError(404, "Workspace member not found");
    }

    console.log("ROLE UPDATE DEBUG", {
        workspaceId,
        requesterId: req.user._id,
        targetUserId: memberId,
        newRole: normalizedRole,
        requesterMembership: currentMembership,
        targetMembership
    });

    if (String(targetMembership.role).toLowerCase() === "owner") {
        throw new ApiError(403, "Owner role cannot be changed");
    }

    if (String(targetMembership.user?._id || targetMembership.user) === String(req.user._id)) {
        throw new ApiError(403, "You cannot change your own role");
    }

    const oldRole = targetMembership.role;
    targetMembership.role = normalizedRole;

    await targetMembership.save();

    if (oldRole !== normalizedRole) {
        await createNotification({
            recipient: targetMembership.user,
            workspace: workspaceId,
            actor: req.user._id,
            type: "role_changed",
            title: "Workspace role updated",
            message: `Your role in the workspace was changed to ${normalizedRole}`,
            link: `/members`,
        });
    }

    res.status(200).json(
        new ApiResponse(200, "Workspace member role updated successfully", {
            member: targetMembership,
        })
    );
});

export const removeWorkspaceMember = asyncHandler(async (req, res) => {
    const { workspaceId, memberId } = req.params;

    const member = await WorkspaceMember.findOne({
        user: memberId,
        workspace: workspaceId,
    });

    if (!member) {
        throw new ApiError(404, "Workspace member not found");
    }

    if (String(member.role).toLowerCase() === "owner") {
        const ownerCount = await WorkspaceMember.countDocuments({
            workspace: workspaceId,
            role: "owner",
            status: "active"
        });
        if (ownerCount <= 1) {
            throw new ApiError(403, "Cannot remove the last owner of the workspace");
        }
    }

    if (String(member.user?._id || member.user) === String(req.user._id)) {
        throw new ApiError(403, "You cannot remove yourself");
    }

    await WorkspaceMember.findOneAndDelete({
        user: memberId,
        workspace: workspaceId,
    });

    res.status(200).json(
        new ApiResponse(200, "Workspace member removed successfully")
    );
});