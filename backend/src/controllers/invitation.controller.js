import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import WorkspaceInvitation from "../models/WorkspaceInvitation.model.js";
import Workspace from "../models/Workspace.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";
import { createNotification } from "../services/notification.service.js";

// Helper to hash token
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Send Invitation
export const sendInvitation = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { email, role = "member" } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    // Verify if the current requester is a member of the workspace and has permission to invite others
    const requesterMembership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
        status: "active"
    });

    if (!requesterMembership) {
        return res.status(403).json({
            message: "You are not a member of this workspace"
        });
    }

    const requesterRole = String(requesterMembership.role || "").toLowerCase();

    // Only owners and admins are permitted to issue new workspace invitations
    if (!["owner", "admin"].includes(requesterRole)) {
        return res.status(403).json({
            message: "You do not have permission to invite members"
        });
    }
    
    // Verify the user being invited exists in the system database
    const userToAdd = await User.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
    }).select("_id name email status");

    if (!userToAdd) {
        return res.status(404).json({
            message: "User not found. The user must register first."
        });
    }

    if (userToAdd.status === "disabled") {
        return res.status(403).json({
            message: "This user account is disabled."
        });
    }

    // Verify not already a member
    const existingMember = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: userToAdd._id,
        status: "active"
    });

    if (existingMember) {
        return res.status(400).json({
            message: "This user is already a member of this workspace."
        });
    }

    // Verify no pending invite
    const pendingInvite = await WorkspaceInvitation.findOne({
        workspace: workspaceId,
        invitedUser: userToAdd._id,
        status: "pending"
    });

    if (pendingInvite) {
        return res.status(400).json({
            message: "An invitation is already pending for this user."
        });
    }

    // Fetch workspace info
    const workspace = await Workspace.findById(workspaceId).select("name");

    // Generate token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create Invite
    const invitation = await WorkspaceInvitation.create({
        workspace: workspaceId,
        invitedUser: userToAdd._id,
        invitedEmail: userToAdd.email,
        invitedBy: req.user._id,
        role: role.toLowerCase(),
        tokenHash,
        expiresAt,
    });

    // Send email
    const inviterName = req.user.name || "A team member";

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const invitationLink = `${frontendUrl.replace(/\/$/, "")}/invitations/${rawToken}`;

    await sendEmail({
        email: userToAdd.email,
        subject: "You have a pending workspace invitation in TaskFlow Pro",
        badge: "Workspace Invitation",
        title: "Workspace Invitation",
        subtitle: `${inviterName} invited you to join a workspace`,
        contentHtml: `
            <p>Hello <strong>${userToAdd.name}</strong>,</p>
            <p>You have been invited to join the workspace <strong>${workspace.name}</strong> in TaskFlow Pro.</p>
            <p><strong>Role:</strong> <span style="text-transform: capitalize; font-weight: bold; color: #4f46e5;">${role}</span></p>
            <p>You can review and respond to this invitation by clicking the button below.</p>
            <div style="margin: 28px 0; text-align: center;">
                <a href="${invitationLink}" target="_blank" style="display: inline-block; background-color: #171717; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                    Review Invitation
                </a>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">This invitation will expire in 7 days.</p>
        `,
        message: `Hello ${userToAdd.name},\n\nYou have been invited to join the workspace "${workspace.name}" as a ${role} in TaskFlow Pro.\n\nPlease open the link below to review and accept the invitation:\n${invitationLink}\n\nThis invitation will expire in 7 days.`
    });

    // Send in-app notification
    await createNotification({
        recipient: userToAdd._id,
        workspace: workspaceId,
        actor: req.user._id,
        type: "workspace_invite",
        title: "New Workspace Invitation",
        message: `${inviterName} invited you to join ${workspace.name}`,
        link: `/workspaces`,
    });

    res.status(201).json(
        new ApiResponse(201, "Invitation sent successfully", {
            invitation: {
                _id: invitation._id,
                workspace: invitation.workspace,
                invitedUser: invitation.invitedUser,
                invitedEmail: invitation.invitedEmail,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
            }
        })
    );
});

// Get Pending Invitations for Workspace
export const getWorkspaceInvitations = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const invitations = await WorkspaceInvitation.find({ workspace: workspaceId })
        .populate("invitedUser", "name email avatar")
        .populate("invitedBy", "name email avatar")
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, "Invitations fetched successfully", {
            invitations,
        })
    );
});

// Cancel Invitation
export const cancelInvitation = asyncHandler(async (req, res) => {
    const { workspaceId, inviteId } = req.params;

    const invitation = await WorkspaceInvitation.findOne({
        _id: inviteId,
        workspace: workspaceId
    });

    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(400, "Only pending invitations can be cancelled");
    }

    invitation.status = "cancelled";
    invitation.cancelledAt = new Date();
    await invitation.save();

    res.status(200).json(
        new ApiResponse(200, "Invitation cancelled successfully")
    );
});

// Get Invitation Details by Token (Public / Semi-public)
export const getInvitationByToken = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const invitation = await WorkspaceInvitation.findOne({ tokenHash })
        .populate("workspace", "name logo")
        .populate("invitedBy", "name email avatar")
        .populate("invitedUser", "name email avatar");

    if (!invitation) {
        throw new ApiError(404, "Invitation not found or invalid token");
    }

    // Do not leak raw tokenHash, just return safe details
    res.status(200).json(
        new ApiResponse(200, "Invitation fetched successfully", {
            invitation: {
                _id: invitation._id,
                workspace: invitation.workspace,
                invitedBy: invitation.invitedBy,
                invitedUser: invitation.invitedUser,
                invitedEmail: invitation.invitedEmail,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
            }
        })
    );
});

// Accept Invitation
export const acceptInvitation = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const invitation = await WorkspaceInvitation.findOne({ tokenHash })
        .populate("workspace", "name");

    if (!invitation) {
        throw new ApiError(404, "Invalid invitation link");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(400, `This invitation is already ${invitation.status}`);
    }

    if (new Date() > invitation.expiresAt) {
        invitation.status = "expired";
        await invitation.save();
        throw new ApiError(400, "This invitation has expired");
    }

    // Security check: Must be authenticated and match the invited user
    if (String(invitation.invitedUser) !== String(req.user._id) && invitation.invitedEmail !== req.user.email) {
        throw new ApiError(403, "This invitation belongs to another user");
    }

    // Update invite status
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Add to workspace members
    let member = await WorkspaceMember.findOne({
        workspace: invitation.workspace._id,
        user: req.user._id
    });

    if (member) {
        member.status = "active";
        member.role = invitation.role;
        member.joinedAt = new Date();
        await member.save();
    } else {
        member = await WorkspaceMember.create({
            workspace: invitation.workspace._id,
            user: req.user._id,
            role: invitation.role,
            status: "active",
            invitedBy: invitation.invitedBy,
            joinedAt: new Date()
        });
    }

    // Notify inviter
    await createNotification({
        recipient: invitation.invitedBy,
        workspace: invitation.workspace._id,
        actor: req.user._id,
        type: "invite_accepted",
        title: "Invitation Accepted",
        message: `${req.user.name} accepted your invitation to workspace ${invitation.workspace.name}`,
    });

    res.status(200).json(
        new ApiResponse(200, "Invitation accepted successfully", {
            workspace: invitation.workspace
        })
    );
});

// Decline Invitation
export const declineInvitation = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const tokenHash = hashToken(token);

    const invitation = await WorkspaceInvitation.findOne({ tokenHash })
        .populate("workspace", "name");

    if (!invitation) {
        throw new ApiError(404, "Invalid invitation link");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(400, `This invitation is already ${invitation.status}`);
    }

    // Security check
    if (String(invitation.invitedUser) !== String(req.user._id) && invitation.invitedEmail !== req.user.email) {
        throw new ApiError(403, "This invitation belongs to another user");
    }

    invitation.status = "declined";
    invitation.declinedAt = new Date();
    await invitation.save();

    // Notify inviter
    await createNotification({
        recipient: invitation.invitedBy,
        workspace: invitation.workspace._id,
        actor: req.user._id,
        type: "invite_declined",
        title: "Invitation Declined",
        message: `${req.user.name} declined your invitation to workspace ${invitation.workspace.name}`,
    });

    res.status(200).json(
        new ApiResponse(200, "Invitation declined successfully")
    );
});

// Get My Pending Invitations
export const getMyInvitations = asyncHandler(async (req, res) => {
    const invitations = await WorkspaceInvitation.find({
        invitedUser: req.user._id,
        status: "pending",
        expiresAt: { $gt: new Date() }
    })
    .populate("workspace", "name logo")
    .populate("invitedBy", "name email avatar")
    .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, "Pending invitations fetched successfully", {
            invitations
        })
    );
});

// Accept Invitation by ID
export const acceptInvitationById = asyncHandler(async (req, res) => {
    const { invitationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
        throw new ApiError(400, "Invalid invitation ID format");
    }

    const invitation = await WorkspaceInvitation.findOne({ _id: invitationId })
        .populate("workspace", "name");

    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(400, `This invitation is already ${invitation.status}`);
    }

    if (new Date() > invitation.expiresAt) {
        invitation.status = "expired";
        await invitation.save();
        throw new ApiError(400, "This invitation has expired");
    }

    if (String(invitation.invitedUser) !== String(req.user._id)) {
        throw new ApiError(403, "This invitation belongs to another user");
    }

    // Update invite status
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Add to workspace members
    let member = await WorkspaceMember.findOne({
        workspace: invitation.workspace._id,
        user: req.user._id
    });

    if (member) {
        member.status = "active";
        member.role = invitation.role;
        member.joinedAt = new Date();
        await member.save();
    } else {
        await WorkspaceMember.create({
            workspace: invitation.workspace._id,
            user: req.user._id,
            role: invitation.role,
            status: "active",
            invitedBy: invitation.invitedBy,
            joinedAt: new Date()
        });
    }

    // Notify inviter
    await createNotification({
        recipient: invitation.invitedBy,
        workspace: invitation.workspace._id,
        actor: req.user._id,
        type: "invite_accepted",
        title: "Invitation Accepted",
        message: `${req.user.name} accepted your invitation to workspace ${invitation.workspace.name}`,
    });

    res.status(200).json(
        new ApiResponse(200, "Invitation accepted successfully", {
            workspace: invitation.workspace
        })
    );
});

// Decline Invitation by ID
export const declineInvitationById = asyncHandler(async (req, res) => {
    const { invitationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(invitationId)) {
        throw new ApiError(400, "Invalid invitation ID format");
    }

    const invitation = await WorkspaceInvitation.findOne({ _id: invitationId })
        .populate("workspace", "name");

    if (!invitation) {
        throw new ApiError(404, "Invitation not found");
    }

    if (invitation.status !== "pending") {
        throw new ApiError(400, `This invitation is already ${invitation.status}`);
    }

    if (String(invitation.invitedUser) !== String(req.user._id)) {
        throw new ApiError(403, "This invitation belongs to another user");
    }

    invitation.status = "declined";
    invitation.declinedAt = new Date();
    await invitation.save();

    // Notify inviter
    await createNotification({
        recipient: invitation.invitedBy,
        workspace: invitation.workspace._id,
        actor: req.user._id,
        type: "invite_declined",
        title: "Invitation Declined",
        message: `${req.user.name} declined your invitation to workspace ${invitation.workspace.name}`,
    });

    res.status(200).json(
        new ApiResponse(200, "Invitation declined successfully")
    );
});
