import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["planning", "active", "on_hold", "completed", "cancelled"],
            default: "planning",
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        startDate: {
            type: Date,
            default: null,
        },

        dueDate: {
            type: Date,
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

projectSchema.index({ workspace: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ workspace: 1, status: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;