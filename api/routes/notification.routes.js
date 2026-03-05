const express = require('express');
const {
    getNotifications,
    getUnreadNotifications,
    markNotificationRead,
    markAllRead
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
