import { body, param } from "express-validator";

export const workspaceIdValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),
];

export const createClientValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Client name is required")
        .isLength({ min: 2, max: 80 })
        .withMessage("Client name must be between 2 and 80 characters"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Client email is required")
        .isEmail()
        .withMessage("Please provide a valid client email")
        .normalizeEmail(),

    body("companyName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Company name cannot exceed 100 characters"),

    body("phone")
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage("Phone number cannot exceed 30 characters"),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Notes cannot exceed 1000 characters"),
];

export const updateClientValidator = [
    param("clientId")
        .isMongoId()
        .withMessage("Invalid client ID"),

    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 80 })
        .withMessage("Client name must be between 2 and 80 characters"),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please provide a valid client email")
        .normalizeEmail(),

    body("companyName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Company name cannot exceed 100 characters"),

    body("phone")
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage("Phone number cannot exceed 30 characters"),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Notes cannot exceed 1000 characters"),

    body("status")
        .optional()
        .isIn(["active", "inactive", "archived"])
        .withMessage("Status must be active, inactive, or archived"),
];