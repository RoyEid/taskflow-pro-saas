import {
    confirmAssistantAction,
    getTaskFlowAssistantAnswer,
} from "../services/ai.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const sendAssistantResult = (res, result) => {
    const body = {
        success: true,
        type: result.type || "answer",
        answer: result.answer,
    };

    if (result.proposal) body.proposal = result.proposal;
    if (result.missingFields) body.missingFields = result.missingFields;
    if (result.missingFieldDetails) body.missingFieldDetails = result.missingFieldDetails;
    if (result.options) body.options = result.options;
    if (result.pendingAction) body.pendingAction = result.pendingAction;

    return res.status(200).json(body);
};

export const askTaskFlowAssistant = asyncHandler(async (req, res) => {
    try {
        const result = await getTaskFlowAssistantAnswer({
            message: req.body.message,
            history: req.body.history,
            workspaceId: req.body.workspaceId,
            userId: req.user._id,
            pendingAction: req.body.pendingAction,
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

export const confirmAssistantActionController = asyncHandler(async (req, res) => {
    const result = await confirmAssistantAction({
        actionType: req.body.actionType,
        workspaceId: req.body.workspaceId,
        payload: req.body.payload,
        user: req.user,
    });

    res.status(201).json(
        new ApiResponse(201, result.message || "Assistant action completed successfully.", {
            created: result.created,
            createdItems: result.createdItems || [],
        })
    );
});
