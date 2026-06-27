import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: [true, "Workspace is required"],
        },

        name: {
            type: String,
            required: [true, "Client name is required"],
            trim: true,
            minlength: [2, "Client name must be at least 2 characters"],
            maxlength: [80, "Client name cannot exceed 80 characters"],
        },

        email: {
            type: String,
            required: [true, "Client email is required"],
            lowercase: true,
            trim: true,
        },

        companyName: {
            type: String,
            trim: true,
            maxlength: [100, "Company name cannot exceed 100 characters"],
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            maxlength: [30, "Phone number cannot exceed 30 characters"],
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            maxlength: [1000, "Notes cannot exceed 1000 characters"],
            default: "",
        },

        portalUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Creator is required"],
        },

        status: {
            type: String,
            enum: ["active", "inactive", "archived"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

clientSchema.index(
    { workspace: 1, email: 1 },
    { unique: true }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;