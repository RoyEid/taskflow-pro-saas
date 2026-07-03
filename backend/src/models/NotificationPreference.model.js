import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        taskAssigned: {
            type: Boolean,
            default: true,
        },
        taskCommented: {
            type: Boolean,
            default: true,
        },
        taskStatusChanged: {
            type: Boolean,
            default: true,
        },
        roleChanged: {
            type: Boolean,
            default: true,
        },
        support: {
            type: Boolean,
            default: true,
        },
        // NEW EMAIL FLAGS
        emailWorkspaceInvites: {
            type: Boolean,
            default: true, // Always true or required
        },
        emailTaskAssigned: {
            type: Boolean,
            default: false,
        },
        emailTaskComments: {
            type: Boolean,
            default: false,
        },
        emailTaskStatusChanged: {
            type: Boolean,
            default: false,
        },
        emailMentions: {
            type: Boolean,
            default: false,
        },
        emailSupportUpdates: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const NotificationPreference = mongoose.model(
    "NotificationPreference",
    notificationPreferenceSchema
);

export default NotificationPreference;
