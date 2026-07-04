import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        messageType: {
            type: String,
            enum: ["text", "image", "file", "sticker", "audio"],
            default: "text",
            required: true,
        },

        content: {
            type: String,
            required: function () {
                return !this.messageType || this.messageType === "text";
            },
            trim: true,
            maxlength: [2000, "Message cannot exceed 2000 characters"],
        },

        fileUrl: {
            type: String,
            default: null,
        },

        fileName: {
            type: String,
            default: null,
        },

        fileSize: {
            type: Number,
            default: null,
        },

        mimeType: {
            type: String,
            default: null,
        },

        stickerId: {
            type: String,
            default: null,
        },

        audioDuration: {
            type: Number,
            default: null,
        },

        editedAt: {
            type: Date,
            default: null,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },

        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        readBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        archivedAt: {
            type: Date,
            default: null,
        },

        archivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        archiveBatchId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ workspace: 1, createdAt: -1 });
messageSchema.index({ workspace: 1, archivedAt: 1, createdAt: -1 });
messageSchema.index({ workspace: 1, isDeleted: 1, createdAt: -1 });
messageSchema.index({ workspace: 1, archivedAt: 1, isDeleted: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ "readBy.user": 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
