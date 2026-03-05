const catchAsync = require('../utils/catchAsync');
const NotificationService = require('../services/notificationService');

/**
 * GET /api/v1/notifications
 * Fetch ALL notifications for logged-in user (paginated)
 */
const getNotifications = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await NotificationService.getAll(req.user.id, Number(page), Number(limit));
    res.status(200).json({ status: 'success', data: result });
});

/**
 * GET /api/v1/notifications/unread
 * Fetch UNREAD notifications for logged-in user
 */
const getUnreadNotifications = catchAsync(async (req, res) => {
    const notifications = await NotificationService.getUnread(req.user.id);
    const count = notifications.length;
    res.status(200).json({ status: 'success', data: { notifications, count } });
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
const markNotificationRead = catchAsync(async (req, res) => {
    const notification = await NotificationService.markRead(req.params.id, req.user.id);
    if (!notification) {
        return res.status(404).json({ status: 'fail', message: 'Notification not found' });
    }
    res.status(200).json({ status: 'success', data: { notification } });
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark ALL notifications as read
 */
const markAllRead = catchAsync(async (req, res) => {
    await NotificationService.markAllRead(req.user.id);
    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
});

module.exports = { getNotifications, getUnreadNotifications, markNotificationRead, markAllRead };
