import { body } from "express-validator";

export const supportValidator = [
    body("subject")
        .trim()
        .notEmpty()
        .withMessage("Subject is required")
        .isLength({ max: 200 })
        .withMessage("Subject is too long (maximum 200 characters)"),

    body("category")
        .trim()
        .notEmpty()
        .withMessage("Category is required")
        .isIn([
            "Account/Login",
            "Workspace",
            "Members/Roles",
            "Clients/Projects",
            "Tasks",
            "Billing/Plans",
            "Bug",
            "Other"
        ])
        .withMessage("Invalid support category"),

    body("otherCategory")
        .custom((value, { req }) => {
            if (req.body.category === "Other" && (!value || !value.trim())) {
                throw new Error("Please specify the other category");
            }
            return true;
        }),

    body("priority")
        .optional({ checkFalsy: true })
        .isIn(["Low", "Medium", "High"])
        .withMessage("Invalid priority"),

    body("message")
        .trim()
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ max: 3000 })
        .withMessage("Message is too long (maximum 3000 characters)"),

    body("workspaceId")
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    body("pageUrl")
        .optional()
        .trim()
        .isString(),
];
