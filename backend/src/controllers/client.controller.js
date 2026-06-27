import Client from "../models/Client.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createClient = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { name, email, companyName, phone, notes } = req.body;

    const existingClient = await Client.findOne({
        workspace: workspaceId,
        email,
    });

    if (existingClient) {
        throw new ApiError(400, "Client already exists with this email");
    }

    const client = await Client.create({
        workspace: workspaceId,
        name,
        email,
        companyName,
        phone,
        notes,
        createdBy: req.user._id,
    });

    res.status(201).json(
        new ApiResponse(201, "Client created successfully", {
            client,
        })
    );
});

export const getWorkspaceClients = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const clients = await Client.find({
        workspace: workspaceId,
        status: { $ne: "archived" },
    })
        .populate("createdBy", "name email")
        .populate("portalUser", "name email avatar status")
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, "Clients fetched successfully", {
            clients,
        })
    );
});

export const getClientById = asyncHandler(async (req, res) => {
    const { workspaceId, clientId } = req.params;

    const client = await Client.findOne({
        _id: clientId,
        workspace: workspaceId,
    })
        .populate("createdBy", "name email")
        .populate("portalUser", "name email avatar status");

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    res.status(200).json(
        new ApiResponse(200, "Client fetched successfully", {
            client,
        })
    );
});

export const updateClient = asyncHandler(async (req, res) => {
    const { workspaceId, clientId } = req.params;
    const { name, email, companyName, phone, notes, status } = req.body;

    const client = await Client.findOne({
        _id: clientId,
        workspace: workspaceId,
    });

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    if (email && email !== client.email) {
        const emailExists = await Client.findOne({
            workspace: workspaceId,
            email,
        });

        if (emailExists) {
            throw new ApiError(400, "Another client already uses this email");
        }

        client.email = email;
    }

    if (name !== undefined) client.name = name;
    if (companyName !== undefined) client.companyName = companyName;
    if (phone !== undefined) client.phone = phone;
    if (notes !== undefined) client.notes = notes;
    if (status !== undefined) client.status = status;

    await client.save();

    res.status(200).json(
        new ApiResponse(200, "Client updated successfully", {
            client,
        })
    );
});