import { getTaskFlowAssistantAnswer } from "../services/ai.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const askTaskFlowAssistant = asyncHandler(async (req, res) => {
    try {
        const { answer } = await getTaskFlowAssistantAnswer({
            message: req.body.message,
            history: req.body.history,
            workspaceId: req.body.workspaceId,
            userId: req.user._id,
        });

        res.status(200).json({
            success: true,
            answer,
        });
    } catch (error) {
        if (error instanceof ApiError && error.statusCode < 500) {
            throw error;
        }

        if (error instanceof ApiError && error.message.includes("AI_API_KEY")) {
            throw error;
        }

        throw new ApiError(503, "Assistant is temporarily unavailable.");
    }
});

