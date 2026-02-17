// routes/stats.routes.js
const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth');
const { getAdminDashboardStats } = require('../controllers/statsController');

const router = express.Router();

router.use(protect);
router.use(restrictTo('superadmin'));

router.get('/admin-dashboard', getAdminDashboardStats);

module.exports = router;
