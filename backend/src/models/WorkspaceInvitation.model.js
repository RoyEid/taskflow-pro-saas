import mongoose from "mongoose";

const workspaceInvitationSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        invitedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        invitedEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member",
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined", "expired", "cancelled"],
            default: "pending",
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        acceptedAt: {
            type: Date,
        },
        declinedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

// Ensure only one pending invitation per workspace and user combination
workspaceInvitationSchema.index({ workspace: 1, invitedUser: 1, status: 1 });

const WorkspaceInvitation = mongoose.model(
    "WorkspaceInvitation",
    workspaceInvitationSchema
);

export default WorkspaceInvitation;
