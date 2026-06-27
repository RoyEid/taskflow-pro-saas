import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        editedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

commentSchema.index({ workspace: 1 });
commentSchema.index({ project: 1 });
commentSchema.index({ task: 1 });
commentSchema.index({ createdBy: 1 });
commentSchema.index({ task: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;