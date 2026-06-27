import { body, param } from "express-validator";

export const createCommentValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isMongoId()
        .withMessage("Invalid task ID"),

    body("content")
        .notEmpty()
        .withMessage("Comment content is required")
        .bail()
        .isLength({ min: 2, max: 2000 })
        .withMessage("Comment content must be between 2 and 2000 characters"),
];

export const updateCommentValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isMongoId()
        .withMessage("Invalid task ID"),

    param("commentId")
        .isMongoId()
        .withMessage("Invalid comment ID"),

    body("content")
        .notEmpty()
        .withMessage("Comment content is required")
        .bail()
        .isLength({ min: 2, max: 2000 })
        .withMessage("Comment content must be between 2 and 2000 characters"),
];

export const commentIdValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isMongoId()
        .withMessage("Invalid task ID"),

    param("commentId")
        .isMongoId()
        .withMessage("Invalid comment ID"),
];