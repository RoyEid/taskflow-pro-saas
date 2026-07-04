import mongoose from "mongoose";

const chatReadStateSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        unreadCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        lastReadAt: {
            type: Date,
            default: null,
        },

        lastUnreadMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        missedEmailSent: {
            type: Boolean,
            default: false,
        },

        notificationSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

chatReadStateSchema.index({ workspace: 1, user: 1 }, { unique: true });
chatReadStateSchema.index({ user: 1, unreadCount: 1 });

const ChatReadState = mongoose.model("ChatReadState", chatReadStateSchema);

export default ChatReadState;
