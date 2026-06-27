import { body, param } from "express-validator";


export const workspaceIdValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),

];


export const addMemberValidator = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("role")
        .optional()
        .isIn(["admin", "manager", "member", "client"])
        .withMessage("Role must be admin, manager, member, or client"),
];

export const updateMemberRoleValidator = [
    param("memberId")
        .isMongoId()
        .withMessage("Invalid member ID"),

    body("role")
        .notEmpty()
        .withMessage("Role is required")
        .isIn(["admin", "manager", "member", "client"])
        .withMessage("Role must be admin, manager, member, or client"),
];
