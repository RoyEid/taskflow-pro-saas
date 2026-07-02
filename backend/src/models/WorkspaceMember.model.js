import mongoose from "mongoose";

const workspaceMemberSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: [true, "Workspace is required"],
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },

        role: {
            type: String,
            enum: ["owner", "admin", "member"],
            default: "member",
        },

        status: {
            type: String,
            enum: ["active", "invited", "disabled"],
            default: "active",
        },

        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

workspaceMemberSchema.index(
    { workspace: 1, user: 1 },
    { unique: true }
);

const WorkspaceMember = mongoose.model(
    "WorkspaceMember",
    workspaceMemberSchema
);

export default WorkspaceMember;