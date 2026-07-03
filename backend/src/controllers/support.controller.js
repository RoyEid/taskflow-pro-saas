import SupportRequest from "../models/SupportRequest.model.js";
import WorkspaceMember from "../models/WorkspaceMember.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendEmail from "../utils/sendEmail.js";
import { createNotification } from "../services/notification.service.js";

/**
 * @desc    Submit new support request
 * @route   POST /api/support
 * @access  Private
 */
export const createSupportRequest = asyncHandler(async (req, res) => {
    const { subject, category, otherCategory, priority, message, pageUrl, workspaceId } = req.body;
    const userId = req.user._id;

    let role = undefined;
    let validWorkspaceId = undefined;

    // Verify workspace membership if workspaceId is provided
    if (workspaceId) {
        const membership = await WorkspaceMember.findOne({
            workspace: workspaceId,
            user: userId,
            status: "active",
        }).populate("workspace");

        if (membership) {
            validWorkspaceId = membership.workspace._id;
            role = membership.role;
        }
    }

    const supportRequest = await SupportRequest.create({
        user: userId,
        workspace: validWorkspaceId,
        role: role,
        subject,
        category,
        otherCategory: category === "Other" ? otherCategory : undefined,
        priority: priority || "Medium",
        message,
        pageUrl,
    });

    if (process.env.SUPPORT_NOTIFY_EMAIL) {
        try {
            const displayCategory = category === "Other" ? `Other: ${otherCategory}` : category;
            
            // Re-fetch workspace name for email if validWorkspaceId exists
            let workspaceName = "None";
            if (validWorkspaceId) {
                const membership = await WorkspaceMember.findOne({
                    workspace: validWorkspaceId,
                    user: userId
                }).populate("workspace");
                
                if (membership && membership.workspace) {
                    workspaceName = membership.workspace.name;
                }
            }

            const htmlMessage = `
                <h3>New TaskFlow Pro Support Request</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Priority:</strong> ${priority || "Medium"}</p>
                <p><strong>Category:</strong> ${displayCategory}</p>
                <p><strong>Message:</strong></p>
                <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">
                    ${message}
                </blockquote>
                <hr />
                <p><strong>User:</strong> ${req.user.name} (${req.user.email})</p>
                <p><strong>Workspace:</strong> ${workspaceName}</p>
                <p><strong>Workspace Role:</strong> ${role || 'None'}</p>
                <p><strong>Page URL:</strong> ${pageUrl || 'None'}</p>
                <p><strong>Date:</strong> ${new Date().toISOString()}</p>
            `;

            sendEmail({
                email: process.env.SUPPORT_NOTIFY_EMAIL,
                subject: `New TaskFlow Pro Support Request: ${subject}`,
                message: htmlMessage,
            }).catch((err) => {
                console.error("Failed to send support email notification:", err);
            });
        } catch (error) {
            console.error("Error setting up support email notification:", error);
        }
    }

    try {
        const displayCategory = category === "Other" ? `Other: ${otherCategory}` : category;
        const autoReplyHtml = `
            <h3>We received your support request!</h3>
            <p>Hi ${req.user.name},</p>
            <p>Thank you for reaching out to TaskFlow Pro support. We have successfully received your request regarding <strong>${subject}</strong>.</p>
            <p>Our team will review your request and get back to you as soon as possible. In the meantime, you can review the details of your submission below.</p>
            <hr />
            <h4>Your Request Summary:</h4>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Category:</strong> ${displayCategory}</p>
            <p><strong>Priority:</strong> ${priority || "Medium"}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0;">
                ${message}
            </blockquote>
        `;

        sendEmail({
            email: req.user.email,
            subject: "We received your support request — TaskFlow Pro",
            message: autoReplyHtml,
        }).catch((err) => {
            console.error("Failed to send support auto-reply email:", err);
        });
    } catch (error) {
        console.error("Error setting up support auto-reply email:", error);
    }

    await createNotification({
        recipient: userId,
        workspace: validWorkspaceId,
        type: "support_request_created",
        title: "Support request received",
        message: `We received your support request "${subject}"`,
        link: "/help",
    });

    res.status(201).json({
        success: true,
        data: supportRequest,
    });
});

/**
 * @desc    Get current user's recent support requests
 * @route   GET /api/support/my
 * @access  Private
 */
export const getMySupportRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const requests = await SupportRequest.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);

    res.status(200).json({
        success: true,
        data: requests,
    });
});

/**
 * @desc    Update support request
 * @route   PUT /api/support/:id
 * @access  Private
 */
export const updateSupportRequest = asyncHandler(async (req, res) => {
    const { subject, category, otherCategory, priority, message } = req.body;
    const supportRequest = await SupportRequest.findById(req.params.id);

    if (!supportRequest) {
        throw new ApiError(404, "Support request not found");
    }

    if (supportRequest.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission for this action");
    }

    if (supportRequest.status !== "open") {
        throw new ApiError(403, "This request can no longer be changed");
    }

    supportRequest.subject = subject || supportRequest.subject;
    supportRequest.category = category || supportRequest.category;
    if (supportRequest.category === "Other") {
        supportRequest.otherCategory = otherCategory || supportRequest.otherCategory;
    } else {
        supportRequest.otherCategory = undefined;
    }
    supportRequest.priority = priority || supportRequest.priority;
    supportRequest.message = message || supportRequest.message;

    await supportRequest.save();

    res.status(200).json({
        success: true,
        data: supportRequest,
    });
});

/**
 * @desc    Delete support request
 * @route   DELETE /api/support/:id
 * @access  Private
 */
export const deleteSupportRequest = asyncHandler(async (req, res) => {
    const supportRequest = await SupportRequest.findById(req.params.id);

    if (!supportRequest) {
        throw new ApiError(404, "Support request not found");
    }

    if (supportRequest.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission for this action");
    }

    if (supportRequest.status !== "open") {
        throw new ApiError(403, "This request can no longer be changed");
    }

    await supportRequest.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});
