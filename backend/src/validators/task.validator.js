import { body, param } from "express-validator";

export const createTaskValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    body("title")
        .notEmpty()
        .withMessage("Task title is required")
        .bail()
        .isLength({ min: 2, max: 150 })
        .withMessage("Task title must be between 2 and 150 characters"),

    body("description")
        .optional()
        .isLength({ max: 2000 })
        .withMessage("Description cannot be more than 2000 characters"),

    body("assignee")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Invalid assigned user ID"),

    body("status")
        .optional()
        .isIn(["todo", "in_progress", "review", "done", "blocked"])
        .withMessage("Invalid task status"),

    body("priority")
        .optional()
        .isIn(["low", "medium", "high"])
        .withMessage("Invalid task priority"),

    body("dueDate")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Due date must be a valid date"),
];

export const updateTaskValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isMongoId()
        .withMessage("Invalid task ID"),

    body("title")
        .optional()
        .isLength({ min: 2, max: 150 })
        .withMessage("Task title must be between 2 and 150 characters"),

    body("description")
        .optional()
        .isLength({ max: 2000 })
        .withMessage("Description cannot be more than 2000 characters"),

    body("assignee")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Invalid assigned user ID"),

    body("status")
        .optional()
        .isIn(["todo", "in_progress", "review", "done", "blocked"])
        .withMessage("Invalid task status"),

    body("priority")
        .optional()
        .isIn(["low", "medium", "high"])
        .withMessage("Invalid task priority"),

    body("dueDate")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Due date must be a valid date"),
];

export const taskIdValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isMongoId()
        .withMessage("Invalid task ID"),
];

export const updateTaskStatusValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),

    param("taskId")
        .isMongoId()
        .withMessage("Invalid task ID"),

    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .bail()
        .isIn(["todo", "in_progress", "review", "done", "blocked"])
        .withMessage("Invalid task status"),
];