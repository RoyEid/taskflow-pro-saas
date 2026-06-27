import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Workspace name is required"],
            trim: true,
            minlength: [2, "Workspace name must be at least 2 characters"],
            maxlength: [80, "Workspace name cannot exceed 80 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
            default: "",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Workspace owner is required"],
        },
        logo: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);
const Workspace = mongoose.model("Workspace", workspaceSchema);

export default Workspace;