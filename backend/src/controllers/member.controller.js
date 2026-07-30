import User from "../models/User.model.js";
import Workspace from "../models/Workspace.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import NotificationPreference from "../models/NotificationPreference.model.js";
import ApiError from "../utils/ApiError.js";
import { createNotification } from "../services/notification.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const formatRole = (role = "") => {
    const normalizedRole = String(role).trim().toLowerCase();
    return normalizedRole
        ? `${normalizedRole.charAt(0).toUpperCase()}${normalizedRole.slice(1)}`
        : "";
};

const sanitizeEmailSubjectValue = (value = "") =>
    String(value).replace(/[\r\n]+/g, " ").trim();

const getSafeRoleEmailError = (error) => {
    const code = String(error?.code || "")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 40);

    return code ? `Email delivery error (${code})` : "Email delivery error";
};

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

    // 2. Find target membership by user ID and populate the recipient details
    // needed after the role has been saved.
    const targetMembership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: memberId,
        status: "active"
    }).populate("user", "name email");

    if (!targetMembership) {
        throw new ApiError(404, "Workspace member not found");
    }

    const targetUserId = targetMembership.user?._id || targetMembership.user;

    // A user cannot change their own role to prevent lockout or privilege self-demotion.
    if (String(targetUserId) === String(req.user._id)) {
        throw new ApiError(403, "You cannot change your own role");
    }

    // Owners' roles cannot be changed (a workspace must always have at least one active owner)
    if (String(targetMembership.role).toLowerCase() === "owner") {
        throw new ApiError(403, "Owner role cannot be changed");
    }

    const oldRole = String(targetMembership.role).toLowerCase();

    // A no-op is still a successful request, but must not save again or create
    // duplicate in-app/email notifications.
    if (oldRole === normalizedRole) {
        return res.status(200).json(
            new ApiResponse(200, "Workspace member role is already up to date", {
                member: targetMembership,
            })
        );
    }

    targetMembership.role = normalizedRole;

    // Notifications are intentionally after this awaited save. Validation,
    // permission, and database failures therefore cannot send a false update.
    await targetMembership.save();

    await createNotification({
        recipient: targetUserId,
        workspace: workspaceId,
        actor: req.user._id,
        type: "role_changed",
        title: "Workspace role updated",
        message: `Your role was changed from ${oldRole} to ${normalizedRole}`,
        link: "/members",
        metadata: {
            previousRole: oldRole,
            newRole: normalizedRole,
        },
    });

    // Email preparation and delivery are isolated from the persisted role
    // change. Any lookup, preference, or SMTP failure is logged but cannot roll
    // back the role or turn this successful request into an error response.
    try {
        const [recipient, workspace, preferences] = await Promise.all([
            targetMembership.user?.email
                ? targetMembership.user
                : User.findById(targetUserId).select("name email"),
            Workspace.findById(workspaceId).select("name"),
            NotificationPreference.findOne({ user: targetUserId }).select("emailRoleChanged"),
        ]);

        if (!recipient?.email || !workspace?.name) {
            throw new Error("Role email details unavailable");
        }

        if (preferences?.emailRoleChanged === false) {
            console.log("[Role Email] skipped because preference disabled");
        } else {
            const recipientName = recipient.name || "Workspace member";
            const ownerName = req.user.name || "Workspace owner";
            const previousRole = formatRole(oldRole);
            const newRole = formatRole(normalizedRole);
            const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173")
                .replace(/\/+$/, "");
            const membersUrl = `${frontendUrl}/members`;

            await sendEmail({
                email: recipient.email,
                subject: `Your role in ${sanitizeEmailSubjectValue(workspace.name)} was updated`,
                badge: "Workspace Role Updated",
                title: "Your workspace role was updated",
                subtitle: `Your access in ${escapeHtml(workspace.name)} has changed`,
                contentHtml: `
                    <p style="margin:0 0 16px;">Hello <strong>${escapeHtml(recipientName)}</strong>,</p>
                    <p style="margin:0 0 16px;">
                        <strong>${escapeHtml(ownerName)}</strong> updated your role in
                        <strong>${escapeHtml(workspace.name)}</strong>.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; background:#0f172a; border:1px solid #334155; border-radius:10px;">
                        <tr>
                            <td style="padding:14px 16px; color:#94a3b8;">Previous role</td>
                            <td style="padding:14px 16px; color:#f8fafc; font-weight:700; text-align:right;">${escapeHtml(previousRole)}</td>
                        </tr>
                        <tr>
                            <td style="padding:14px 16px; color:#94a3b8; border-top:1px solid #334155;">New role</td>
                            <td style="padding:14px 16px; color:#f8fafc; font-weight:700; text-align:right; border-top:1px solid #334155;">${escapeHtml(newRole)}</td>
                        </tr>
                    </table>
                    <div style="margin:28px 0; text-align:center;">
                        <a href="${escapeHtml(membersUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#4f46e5; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px 28px; border-radius:8px;">
                            View Members
                        </a>
                    </div>
                `,
                message: `Hello ${recipientName},\n\n${ownerName} updated your role in "${workspace.name}" from ${previousRole} to ${newRole}.\n\nOpen the Members page: ${membersUrl}`,
            });

            console.log("[Role Email] successfully sent");
        }
    } catch (error) {
        console.error(`[Role Email] failed: ${getSafeRoleEmailError(error)}`);
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
