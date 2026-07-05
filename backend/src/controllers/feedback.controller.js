import Feedback from "../models/Feedback.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendEmail from "../utils/sendEmail.js";
import { logActivity } from "../services/activityLog.service.js";

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

    await logActivity({
        workspaceId: validWorkspaceId || null,
        actorUserId: userId,
        actorName: req.user.name,
        action: "submitted",
        entityType: "Feedback",
        entityId: feedback._id,
        entityName: category,
        source: "manual",
        metadata: { rating },
    });

    if (process.env.FEEDBACK_NOTIFY_EMAIL) {
        try {
            const displayCategory = category === "Other" ? `Other: ${otherCategory}` : category;
            const htmlMessage = `
                <p><strong>Category:</strong> ${displayCategory}</p>
                <p><strong>Rating:</strong> <span style="font-weight: bold; color: #4f46e5;">${rating ? rating + '/5' : 'None'}</span></p>
                <p><strong>Message:</strong></p>
                <blockquote style="border-left: 4px solid #4f46e5; padding-left: 12px; margin-left: 0; font-style: italic; color: #4b5563;">
                    ${message}
                </blockquote>
                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
                <p style="font-size: 13px; color: #6b7280; margin: 4px 0;"><strong>User:</strong> ${req.user.name} (${req.user.email})</p>
                <p style="font-size: 13px; color: #6b7280; margin: 4px 0;"><strong>Workspace Role:</strong> ${role || 'None'}</p>
                <p style="font-size: 13px; color: #6b7280; margin: 4px 0;"><strong>Page URL:</strong> ${pageUrl || 'None'}</p>
            `;
            const plainMessage = `New Feedback:\nCategory: ${displayCategory}\nRating: ${rating || 'None'}\nMessage: ${message}\nUser: ${req.user.name}`;

            sendEmail({
                email: process.env.FEEDBACK_NOTIFY_EMAIL,
                subject: `New TaskFlow Pro Feedback: ${category}`,
                badge: "Feedback Admin",
                title: "New User Feedback",
                subtitle: `Feedback submitted by ${req.user.name}`,
                contentHtml: htmlMessage,
                message: plainMessage,
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
            <p>Hi <strong>${req.user.name}</strong>,</p>
            <p>We have successfully received your feedback regarding <strong>${displayCategory}</strong>.</p>
            <p>Our team reads every piece of feedback to help improve TaskFlow Pro. While we may not be able to respond to every submission individually, we sincerely appreciate you taking the time to share your thoughts.</p>
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
            <h3 style="font-size: 15px; margin: 0 0 10px; color: #111827; font-weight: bold;">Your Submission Summary:</h3>
            <p><strong>Category:</strong> ${displayCategory}</p>
            ${rating ? `<p><strong>Rating:</strong> ${rating}/5</p>` : ''}
            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 4px solid #4f46e5; padding-left: 12px; margin-left: 0; font-style: italic; color: #4b5563;">
                ${message}
            </blockquote>
        `;
        const plainAutoReply = `Hi ${req.user.name},\n\nThank you for your feedback regarding ${displayCategory}. We appreciate it!`;

        sendEmail({
            email: req.user.email,
            subject: "Thank you for your feedback — TaskFlow Pro",
            badge: "Feedback Auto-Reply",
            title: "Thank You for Your Feedback",
            subtitle: "We appreciate your input!",
            contentHtml: autoReplyHtml,
            message: plainAutoReply,
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
