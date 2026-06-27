import express from "express";

import {
    createClient,
    getClientById,
    getWorkspaceClients,
    updateClient,
} from "../controllers/client.controller.js";

import protect from "../middleware/auth.middleware.js";
import { checkWorkspaceRole } from "../middleware/permission.middleware.js";
import validate from "../middleware/validate.middleware.js";

import {
    createClientValidator,
    updateClientValidator,
    workspaceIdValidator,
} from "../validators/client.validator.js";

const router = express.Router();

router.post(
    "/:workspaceId/clients",
    protect,
    workspaceIdValidator,
    createClientValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "manager"),
    createClient
);

router.get(
    "/:workspaceId/clients",
    protect,
    workspaceIdValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "manager"),
    getWorkspaceClients
);

router.get(
    "/:workspaceId/clients/:clientId",
    protect,
    workspaceIdValidator,
    updateClientValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "manager"),
    getClientById
);

router.put(
    "/:workspaceId/clients/:clientId",
    protect,
    workspaceIdValidator,
    updateClientValidator,
    validate,
    checkWorkspaceRole("owner", "admin", "manager"),
    updateClient
);

export default router;