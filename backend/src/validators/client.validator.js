import { body, param } from "express-validator";

export const createClientValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    body("name")
        .notEmpty()
        .withMessage("Client name is required")
        .bail()
        .isLength({ min: 2, max: 100 })
        .withMessage("Client name must be between 2 and 100 characters"),

    body("email")
        .notEmpty()
        .withMessage("Client email is required")
        .bail()
        .isEmail()
        .withMessage("Please provide a valid client email")
        .normalizeEmail(),

    body("companyName")
        .optional()
        .isLength({ max: 100 })
        .withMessage("Company name cannot be more than 100 characters"),

    body("phone")
        .optional()
        .isLength({ max: 30 })
        .withMessage("Phone number cannot be more than 30 characters"),

    body("notes")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Notes cannot be more than 1000 characters"),
];

export const updateClientValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("clientId")
        .isMongoId()
        .withMessage("Invalid client ID"),

    body("name")
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage("Client name must be between 2 and 100 characters"),

    body("email")
        .optional()
        .isEmail()
        .withMessage("Please provide a valid client email")
        .normalizeEmail(),

    body("companyName")
        .optional()
        .isLength({ max: 100 })
        .withMessage("Company name cannot be more than 100 characters"),

    body("phone")
        .optional()
        .isLength({ max: 30 })
        .withMessage("Phone number cannot be more than 30 characters"),

    body("notes")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Notes cannot be more than 1000 characters"),

    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Invalid client status"),
];

export const clientIdValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("clientId")
        .isMongoId()
        .withMessage("Invalid client ID"),
];