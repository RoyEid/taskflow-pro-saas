import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recipient is required"],
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
        },
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String,
            enum: [
                "task_assigned",
                "task_commented",
                "task_status_changed",
                "task_overdue",
                "role_changed",
                "chat_message",
                "support_request_created",
                "support_status_changed",
                "system",
            ],
            required: [true, "Notification type is required"],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
        },
        message: {
            type: String,
            required: [true, "Message is required"],
        },
        link: {
            type: String,
        },
        read: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

// Index to quickly fetch a user's notifications sorted by creation date
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
