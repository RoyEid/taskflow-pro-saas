import Notification from "../models/Notification.model.js";
import NotificationPreference from "../models/NotificationPreference.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit);

    res.status(200).json({
        success: true,
        data: notifications,
    });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user._id,
        read: false,
    });

    res.status(200).json({
        success: true,
        data: count,
    });
});

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission for this action");
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
        success: true,
        data: notification,
    });
});

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { $set: { read: true } }
    );

    res.status(200).json({
        success: true,
        data: {},
    });
});

/**
 * @desc    Clear all read notifications
 * @route   DELETE /api/notifications/clear-read
 * @access  Private
 */
export const clearReadNotifications = asyncHandler(async (req, res) => {
    await Notification.deleteMany({
        recipient: req.user._id,
        read: true,
    });

    res.status(200).json({
        success: true,
        data: {},
    });
});

/**
 * @desc    Get user notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
export const getPreferences = asyncHandler(async (req, res) => {
    let preferences = await NotificationPreference.findOne({ user: req.user._id });

    if (!preferences) {
        preferences = await NotificationPreference.create({ user: req.user._id });
    }

    res.status(200).json({
        success: true,
        data: preferences,
    });
});

/**
 * @desc    Update user notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req, res) => {
    const {
        taskAssigned,
        taskCommented,
        taskStatusChanged,
        roleChanged,
        support,
        emailWorkspaceInvites,
        emailTaskAssigned,
        emailTaskComments,
        emailTaskStatusChanged,
        emailMentions,
        emailSupportUpdates
    } = req.body;

    let preferences = await NotificationPreference.findOne({ user: req.user._id });

    if (!preferences) {
        preferences = new NotificationPreference({ user: req.user._id });
    }

    if (taskAssigned !== undefined) preferences.taskAssigned = taskAssigned;
    if (taskCommented !== undefined) preferences.taskCommented = taskCommented;
    if (taskStatusChanged !== undefined) preferences.taskStatusChanged = taskStatusChanged;
    if (roleChanged !== undefined) preferences.roleChanged = roleChanged;
    if (support !== undefined) preferences.support = support;

    if (emailWorkspaceInvites !== undefined) preferences.emailWorkspaceInvites = emailWorkspaceInvites;
    if (emailTaskAssigned !== undefined) preferences.emailTaskAssigned = emailTaskAssigned;
    if (emailTaskComments !== undefined) preferences.emailTaskComments = emailTaskComments;
    if (emailTaskStatusChanged !== undefined) preferences.emailTaskStatusChanged = emailTaskStatusChanged;
    if (emailMentions !== undefined) preferences.emailMentions = emailMentions;
    if (emailSupportUpdates !== undefined) preferences.emailSupportUpdates = emailSupportUpdates;

    await preferences.save();

    res.status(200).json({
        success: true,
        data: preferences,
    });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission for this action");
    }

    await notification.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});
