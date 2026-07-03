import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
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
        category: {
            type: String,
            enum: ["Bug", "Feature Request", "General Feedback", "UI/UX", "Other"],
            required: [true, "Category is required"],
        },
        otherCategory: {
            type: String,
            trim: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
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
            enum: ["new", "reviewed", "resolved"],
            default: "new",
        },
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
