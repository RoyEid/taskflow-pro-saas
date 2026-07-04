import Client from "../models/Client.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logActivity } from "../services/activityLog.service.js";

export const createClient = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const {
        name,
        email,
        companyName,
        phone,
        notes,
    } = req.body;

    const existingClient = await Client.findOne({
        workspace: workspaceId,
        email,
    });

    if (existingClient) {
        throw new ApiError(400, "Client with this email already exists in this workspace");
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

    await logActivity({
        workspaceId,
        actorUserId: req.user._id,
        actorName: req.user.name,
        action: "created",
        entityType: "Client",
        entityId: client._id,
        entityName: client.name,
        source: "manual",
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                "Client created successfully",
                { client }
            )
        );
});

export const getClients = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const clients = await Client.find({
        workspace: workspaceId,
        status: "active",
    })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Clients fetched successfully",
                { clients }
            )
        );
});

export const getClientById = asyncHandler(async (req, res) => {
    const { workspaceId, clientId } = req.params;

    const client = await Client.findOne({
        _id: clientId,
        workspace: workspaceId,
    }).populate("createdBy", "name email");

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Client fetched successfully",
                { client }
            )
        );
});

export const updateClient = asyncHandler(async (req, res) => {
    const { workspaceId, clientId } = req.params;

    const {
        name,
        email,
        companyName,
        phone,
        notes,
        status,
    } = req.body;

    const client = await Client.findOne({
        _id: clientId,
        workspace: workspaceId,
    });

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    if (email && email !== client.email) {
        const existingClient = await Client.findOne({
            workspace: workspaceId,
            email,
        });

        if (existingClient) {
            throw new ApiError(400, "Client with this email already exists in this workspace");
        }

        client.email = email;
    }

    if (name !== undefined) {
        client.name = name;
    }

    if (companyName !== undefined) {
        client.companyName = companyName;
    }

    if (phone !== undefined) {
        client.phone = phone;
    }

    if (notes !== undefined) {
        client.notes = notes;
    }

    if (status !== undefined) {
        client.status = status;
    }

    await client.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Client updated successfully",
                { client }
            )
        );
});

export const deleteClient = asyncHandler(async (req, res) => {
    const { workspaceId, clientId } = req.params;

    const client = await Client.findOne({
        _id: clientId,
        workspace: workspaceId,
    });

    if (!client) {
        throw new ApiError(404, "Client not found");
    }

    client.status = "inactive";

    await client.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Client deleted successfully",
                { client }
            )
        );
});