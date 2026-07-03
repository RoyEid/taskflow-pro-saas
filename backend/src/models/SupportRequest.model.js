import mongoose from "mongoose";

const supportRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
        },
        role: {
            type: String,
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
        },
        category: {
            type: String,
            enum: [
                "Account/Login",
                "Workspace",
                "Members/Roles",
                "Clients/Projects",
                "Tasks",
                "Billing/Plans",
                "Bug",
                "Other"
            ],
            required: [true, "Category is required"],
        },
        otherCategory: {
            type: String,
            trim: true,
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
        },
        pageUrl: {
            type: String,
        },
        status: {
            type: String,
            enum: ["open", "in_progress", "closed"],
            default: "open",
        },
    },
    {
        timestamps: true,
    }
);

const SupportRequest = mongoose.model("SupportRequest", supportRequestSchema);

export default SupportRequest;
