const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Role = require('../models/role.model');

/**
 * Central Notification Service
 * Triggered by status changes in ProjectWorkflowService.
 */
class NotificationService {
    /**
     * Notify all users with specific roles about a project event.
     * @param {Object} params
     * @param {string|ObjectId} params.projectId
     * @param {string[]} params.targetRoles  - e.g. ['d.c', 'd.it', 'd.d']
     * @param {string}   params.message
     * @param {string}   params.type         - e.g. 'project_handover' | 'phase_complete'
     */
    static async notifyRoles({ projectId, targetRoles, message, type = 'project_handover' }) {
        try {
            // 1. Resolve role code strings (d.c, d.it) to Role ObjectIDs
            // Role codes are stored as Uppercase in the DB (e.g. 'D.C')
            const roles = await Role.find({
                code: { $in: targetRoles.map(r => r.toUpperCase()) }
            }).select('_id code');

            if (roles.length === 0) {
                console.log(`[Notification] No Roles found for codes: ${targetRoles.join(', ')}`);
                return [];
            }

            const roleIds = roles.map(r => r._id);

            // 2. Find all non-deleted users belonging to these Role IDs
            const users = await User.find({
                role: { $in: roleIds },
                isDeleted: false
            }).select('_id role username');

            console.log(`[Notification DEBUG] Sending to ${users.length} users:`, users.map(u => u.username).join(', '));

            if (users.length === 0) {
                console.log(`[Notification] No users found for roles: ${targetRoles.join(', ')}`);
                return [];
            }

            // 3. Build notification documents
            const docs = users.map(user => ({
                userId: user._id,
                projectId,
                message,
                type,
                role: roles.find(r => r._id.toString() === user.role.toString())?.code || 'unknown',
                isRead: false
            }));

            const created = await Notification.insertMany(docs);
            console.log(`[Notification SUCCESS] Created ${created.length} notifications in DB: [${targetRoles.join(', ')}]`);
            return created;
        } catch (error) {
            // Non-critical: log but don't throw so workflow is not blocked
            console.error('[NotificationService] Error creating notifications:', error.message);
            return [];
        }
    }

    /**
     * Fetch unread notifications for a user, newest first.
     */
    static async getUnread(userId) {
        return Notification.find({ userId, isRead: false })
            .sort({ createdAt: -1 })
            .populate('projectId', 'title slug')
            .limit(50);
    }

    /**
     * Fetch all notifications for a user (paginated).
     */
    static async getAll(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            Notification.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('projectId', 'title slug'),
            Notification.countDocuments({ userId })
        ]);
        return { notifications, total, page, pages: Math.ceil(total / limit) };
    }

    /**
     * Mark a specific notification as read.
     */
    static async markRead(notificationId, userId) {
        return Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
    }

    /**
     * Mark ALL unread notifications for a user as read.
     */
    static async markAllRead(userId) {
        return Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );
    }

    /**
     * Count unread notifications for a user.
     */
    static async countUnread(userId) {
        return Notification.countDocuments({ userId, isRead: false });
    }
}

module.exports = NotificationService;
