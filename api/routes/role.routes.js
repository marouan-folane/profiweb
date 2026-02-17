const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const roleController = require('../controllers/roleController');

// All routes require authentication
router.use(protect);

// Get all roles
router.get('/', roleController.getAllRoles);

module.exports = router;