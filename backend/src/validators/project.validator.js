import { body, param } from "express-validator";

export const createProjectValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    body("client")
        .notEmpty()
        .withMessage("Client ID is required")
        .bail()
        .isMongoId()
        .withMessage("Invalid client ID"),

    body("name")
        .notEmpty()
        .withMessage("Project name is required")
        .bail()
        .isLength({ min: 2, max: 100 })
        .withMessage("Project name must be between 2 and 100 characters"),

    body("description")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Description cannot be more than 1000 characters"),

    body("status")
        .optional()
        .isIn(["planning", "active", "on_hold", "completed", "cancelled"])
        .withMessage("Invalid project status"),

    body("priority")
        .optional()
        .isIn(["low", "medium", "high"])
        .withMessage("Invalid project priority"),

    body("startDate")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Start date must be a valid date"),

    body("dueDate")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Due date must be a valid date"),
];

export const updateProjectValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    body("client")
        .optional()
        .isMongoId()
        .withMessage("Invalid client ID"),

    body("name")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Project name must be between 2 and 100 characters"),

    body("description")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Description cannot be more than 1000 characters"),

    body("status")
        .optional()
        .isIn(["planning", "active", "on_hold", "completed", "cancelled"])
        .withMessage("Invalid project status"),

    body("priority")
        .optional()
        .isIn(["low", "medium", "high"])
        .withMessage("Invalid project priority"),

    body("startDate")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Start date must be a valid date"),

    body("dueDate")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Due date must be a valid date"),
];

export const projectIdValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),
];