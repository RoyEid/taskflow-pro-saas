import { body } from "express-validator";

export const feedbackValidator = [
    body("category")
        .trim()
        .notEmpty()
        .withMessage("Category is required")
        .isIn(["Bug", "Feature Request", "General Feedback", "UI/UX", "Other"])
        .withMessage("Invalid feedback category"),

    body("otherCategory")
        .custom((value, { req }) => {
            if (req.body.category === "Other" && (!value || !value.trim())) {
                throw new Error("Please specify the other category");
            }
            return true;
        }),

    body("message")
        .trim()
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ max: 2000 })
        .withMessage("Message is too long (maximum 2000 characters)"),

    body("rating")
        .optional({ checkFalsy: true, nullable: true })
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be an integer between 1 and 5"),

    body("workspaceId")
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage("Invalid workspace ID"),

    body("pageUrl")
        .optional()
        .trim()
        .isString(),
];
