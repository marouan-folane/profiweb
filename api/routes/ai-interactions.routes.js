// routes/ai-interactions.routes.js
const express = require('express');
const router = express.Router();
const {
    getGlobalInstructions,
    updateGlobalInstructions,
    getInstructionHistory
} = require('../controllers/ai-interactionsController');
const { protect } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/roles');

// Only superadmin can access these routes
router.get('/', protect, isSuperAdmin, getGlobalInstructions);
router.put('/', protect, isSuperAdmin, updateGlobalInstructions);
router.get('/history', protect, isSuperAdmin, getInstructionHistory);

module.exports = router;