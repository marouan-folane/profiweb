const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklist.controller');
const auth = require('../middlewares/auth');
const { protect, authorize } = require("../middlewares/auth");

// Protect all routes
router.use(auth.protect);

// Create or update checklist item
router.post('/:projectId/items', protect, authorize("d.it", "d.c", "d.d"), checklistController.createOrUpdateItem);

// Get all checklist items for a project
router.get('/:projectId/items', protect, authorize("d.it", "d.c", "d.d"), checklistController.getProjectChecklist);

// Toggle item status
router.patch('/:projectId/items/:itemId/toggle', protect, authorize("d.it", "d.c", "d.d"), checklistController.toggleItem);

// Delete custom item
router.delete('/:projectId/items/:itemId', protect, authorize("d.it", "d.c", "d.d"), checklistController.deleteItem);

// Bulk update
router.put('/:projectId/items/bulk', protect, authorize("d.it", "d.c", "d.d"), checklistController.bulkUpdate);

module.exports = router;