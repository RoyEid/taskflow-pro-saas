import { getTaskFlowAssistantAnswer } from "../services/ai.service.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const sendAssistantResult = (res, result) => {
    const body = {
        success: true,
        type: result.type || "answer",
        answer: result.answer,
    };

    if (result.metadata) body.metadata = result.metadata;

    return res.status(200).json(body);
};

export const askTaskFlowAssistant = asyncHandler(async (req, res) => {
    try {
        const result = await getTaskFlowAssistantAnswer({
            message: req.body.message,
            history: req.body.history,
            context: req.body.context,
            user: req.user,
        });

        return sendAssistantResult(res, result);
    } catch (error) {
        if (error instanceof ApiError && error.statusCode < 500) {
            throw error;
        }
        if (error instanceof ApiError && (error.message.includes("AI_API_KEY") || error.message.includes("configured") || error.message.includes("Configured"))) {
            throw error;
        }
        throw new ApiError(503, "AI Assistant is temporarily unavailable. Please try again later.");
    }
});

