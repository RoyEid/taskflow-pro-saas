import User from "../models/User.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import ApiError from "../utils/ApiError.js";
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

    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
        throw new ApiError(404, "User not found. The user must register first");
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

    const member = await WorkspaceMember.findOne({
        _id: memberId,
        workspace: workspaceId,
    });

    if (!member) {
        throw new ApiError(404, "Workspace member not found");
    }

    if (member.role === "owner") {
        throw new ApiError(403, "Owner role cannot be changed");
    }

    member.role = role;

    await member.save();

    res.status(200).json(
        new ApiResponse(200, "Workspace member role updated successfully", {
            member,
        })
    );
});

export const removeWorkspaceMember = asyncHandler(async (req, res) => {
    const { workspaceId, memberId } = req.params;

    const member = await WorkspaceMember.findOne({
        _id: memberId,
        workspace: workspaceId,
    });

    if (!member) {
        throw new ApiError(404, "Workspace member not found");
    }

    if (member.role === "owner") {
        throw new ApiError(403, "Owner cannot be removed");
    }

    member.status = "inactive";
    await member.save();

    res.status(200).json(
        new ApiResponse(200, "Workspace member removed successfully")
    );
});