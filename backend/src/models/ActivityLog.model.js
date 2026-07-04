import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            default: null,
        },
        actorUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        actorName: {
            type: String,
            required: true,
            trim: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        entityType: {
            type: String,
            required: true,
            trim: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        entityName: {
            type: String,
            default: null,
            trim: true,
        },
        source: {
            type: String,
            enum: ["manual", "ai_assistant"],
            default: "manual",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

activityLogSchema.index({ workspace: 1, createdAt: -1 });
activityLogSchema.index({ actorUser: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
