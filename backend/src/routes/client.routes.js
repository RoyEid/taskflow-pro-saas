import express from "express";

import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
} from "../controllers/client.controller.js";

import {
    createClientValidator,
    updateClientValidator,
    clientIdValidator,
} from "../validators/client.validator.js";

import protect from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";

const router = express.Router();

router
    .route("/:workspaceId/clients")
    .post(
        protect,
        createClientValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        createClient
    )
    .get(
        protect,
        checkWorkspaceRole("owner", "admin", "member"),
        getClients
    );

router
    .route("/:workspaceId/clients/:clientId")
    .get(
        protect,
        clientIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        getClientById
    )
    .put(
        protect,
        updateClientValidator,
        validate,
        checkWorkspaceRole("owner", "admin", "member"),
        updateClient
    )
    .delete(
        protect,
        clientIdValidator,
        validate,
        checkWorkspaceRole("owner", "admin"),
        deleteClient
    );

export default router;