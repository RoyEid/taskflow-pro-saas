/*
name exists
name is not too short
name is not too long
description is not too long
*/

import { body } from "express-validator";

export const createWorkspaceValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Workspace name is required")
        .isLength({ min: 2, max: 80 })
        .withMessage("Workspace name must be between 2 and 80 characters"),


    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters"),
];