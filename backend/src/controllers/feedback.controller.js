import Feedback from "../models/Feedback.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * @desc    Submit new feedback
 * @route   POST /api/feedback
 * @access  Private
 */
export const createFeedback = asyncHandler(async (req, res) => {
    const { category, otherCategory, message, rating, pageUrl, workspaceId } = req.body;
    const userId = req.user._id;

    let role = undefined;
    let validWorkspaceId = undefined;

    // Verify workspace membership if workspaceId is provided
    if (workspaceId) {
        const membership = await WorkspaceMember.findOne({
            workspace: workspaceId,
            user: userId,
            status: "active",
        });

        if (membership) {
            validWorkspaceId = membership.workspace;
            role = membership.role;
        }
    }

    const feedback = await Feedback.create({
        user: userId,
        workspace: validWorkspaceId,
        role: role,
        category,
        otherCategory: category === "Other" ? otherCategory : undefined,
        message,
        rating,
        pageUrl,
    });

    if (process.env.FEEDBACK_NOTIFY_EMAIL) {
        try {
            const displayCategory = category === "Other" ? `Other: ${otherCategory}` : category;
            const htmlMessage = `
                <h3>New TaskFlow Pro Feedback</h3>
                <p><strong>Category:</strong> ${displayCategory}</p>
                <p><strong>Rating:</strong> ${rating ? rating + '/5' : 'None'}</p>
                <p><strong>Message:</strong></p>
                <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">
                    ${message}
                </blockquote>
                <hr />
                <p><strong>User:</strong> ${req.user.name} (${req.user.email})</p>
                <p><strong>Workspace Role:</strong> ${role || 'None'}</p>
                <p><strong>Page URL:</strong> ${pageUrl || 'None'}</p>
            `;

            sendEmail({
                email: process.env.FEEDBACK_NOTIFY_EMAIL,
                subject: `New TaskFlow Pro Feedback: ${category}`,
                message: htmlMessage,
            }).catch((err) => {
                console.error("Failed to send feedback email notification:", err);
            });
        } catch (error) {
            console.error("Error setting up feedback email notification:", error);
        }
    }

    try {
        const displayCategory = category === "Other" ? `Other: ${otherCategory}` : category;
        const autoReplyHtml = `
            <h3>Thank you for your feedback!</h3>
            <p>Hi ${req.user.name},</p>
            <p>We have successfully received your feedback regarding <strong>${displayCategory}</strong>.</p>
            <p>Our team reads every piece of feedback to help improve TaskFlow Pro. While we may not be able to respond to every submission individually, we sincerely appreciate you taking the time to share your thoughts.</p>
            <hr />
            <h4>Your Submission Summary:</h4>
            <p><strong>Category:</strong> ${displayCategory}</p>
            ${rating ? `<p><strong>Rating:</strong> ${rating}/5</p>` : ''}
            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">
                ${message}
            </blockquote>
        `;

        sendEmail({
            email: req.user.email,
            subject: "Thank you for your feedback — TaskFlow Pro",
            message: autoReplyHtml,
        }).catch((err) => {
            console.error("Failed to send auto-reply email:", err);
        });
    } catch (error) {
        console.error("Error setting up auto-reply email:", error);
    }

    res.status(201).json({
        success: true,
        data: feedback,
    });
});

/**
 * @desc    Get current user's recent feedback
 * @route   GET /api/feedback/my
 * @access  Private
 */
export const getMyFeedback = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const feedback = await Feedback.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);

    res.status(200).json({
        success: true,
        data: feedback,
    });
});

/**
 * @desc    Update feedback
 * @route   PUT /api/feedback/:id
 * @access  Private
 */
export const updateFeedback = asyncHandler(async (req, res) => {
    const { category, otherCategory, message, rating } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
        throw new ApiError(404, "Feedback not found");
    }

    if (feedback.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission for this action");
    }

    if (feedback.status !== "new") {
        throw new ApiError(403, "Reviewed feedback can no longer be changed");
    }

    feedback.category = category || feedback.category;
    if (feedback.category === "Other") {
        feedback.otherCategory = otherCategory || feedback.otherCategory;
    } else {
        feedback.otherCategory = undefined;
    }
    feedback.message = message || feedback.message;
    if (rating === null) {
        feedback.rating = undefined;
    } else if (rating !== undefined) {
        feedback.rating = rating;
    }

    await feedback.save();

    res.status(200).json({
        success: true,
        data: feedback,
    });
});

/**
 * @desc    Delete feedback
 * @route   DELETE /api/feedback/:id
 * @access  Private
 */
export const deleteFeedback = asyncHandler(async (req, res) => {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
        throw new ApiError(404, "Feedback not found");
    }

    if (feedback.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission for this action");
    }

    if (feedback.status !== "new") {
        throw new ApiError(403, "Reviewed feedback can no longer be changed");
    }

    await feedback.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});
