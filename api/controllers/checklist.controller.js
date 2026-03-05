const ChecklistService = require('../services/checklistService');
const catchAsync = require('../utils/catchAsync');

// Create or update checklist item
const createOrUpdateItem = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const item = await ChecklistService.createOrUpdateItem(projectId, req.user._id, req.body);

    res.status(200).json({
        status: 'success',
        data: { item }
    });
});

// Get all checklist items for a project
const getProjectChecklist = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const sections = await ChecklistService.getProjectChecklist(projectId, req.user._id);

    res.status(200).json({
        status: 'success',
        data: { sections }
    });
});

// Toggle item checked status (Reuse createOrUpdate logic or specific toggle)
const toggleItem = catchAsync(async (req, res) => {
    const { projectId, itemId } = req.params;
    const { checked } = req.body;

    const item = await ChecklistService.createOrUpdateItem(projectId, req.user._id, {
        itemId,
        checked
    });

    res.status(200).json({
        status: 'success',
        data: { item }
    });
});

// Delete custom item
const deleteItem = catchAsync(async (req, res) => {
    const { projectId, itemId } = req.params;
    await ChecklistService.deleteCustomItem(projectId, itemId, req.user._id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Bulk update checklist items
const bulkUpdate = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    await ChecklistService.bulkUpdate(projectId, req.user._id, req.body.items);

    res.status(200).json({
        status: 'success',
        message: 'Checklist updated successfully'
    });
});


module.exports = {
    createOrUpdateItem,
    getProjectChecklist,
    toggleItem,
    deleteItem,
    bulkUpdate
}