import { param } from "express-validator";

export const dashboardValidator = [
    param("workspaceId")
        .isMongoId()
        .withMessage("Invalid workspace ID"),
];