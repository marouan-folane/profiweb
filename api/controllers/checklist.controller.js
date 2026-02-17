const ChecklistItem = require('../models/checklist.model');
const catchAsync = require('../utils/catchAsync');

// Create or update checklist item
const createOrUpdateItem = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const { itemId, label, checked, isCustom, sectionId } = req.body;
    const userId = req.user._id; // Assuming you have user authentication

    // Check if item already exists
    const existingItem = await ChecklistItem.findOne({
        itemId,
        projectId
    });

    if (existingItem) {
        // Update existing item
        existingItem.checked = checked;
        existingItem.label = label || existingItem.label;
        await existingItem.save();

        return res.status(200).json({
            status: 'success',
            data: {
                item: existingItem
            }
        });
    }

    // Create new item
    const newItem = await ChecklistItem.create({
        itemId,
        label,
        checked: checked || false,
        isCustom: isCustom || false,
        sectionId,
        projectId,
        userId
    });

    res.status(201).json({
        status: 'success',
        data: {
            item: newItem
        }
    });
});

// Get all checklist items for a project
const getProjectChecklist = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user._id;

    const checklistItems = await ChecklistItem.find({
        projectId,
        userId
    });

    // Group items by section
    const sections = {};
    checklistItems.forEach(item => {
        if (!sections[item.sectionId]) {
            sections[item.sectionId] = {
                id: item.sectionId,
                items: []
            };
        }

        sections[item.sectionId].items.push({
            id: item.itemId,
            label: item.label,
            checked: item.checked,
            isCustom: item.isCustom
        });
    });

    // Convert to array and add default sections if they don't exist
    const result = Object.values(sections);

    res.status(200).json({
        status: 'success',
        data: {
            sections: result
        }
    });
});

// Toggle item checked status
const toggleItem = catchAsync(async (req, res) => {
    const { projectId, itemId } = req.params;
    const { checked } = req.body;
    const userId = req.user._id;

    const item = await ChecklistItem.findOne({
        itemId,
        projectId,
        userId
    });

    if (!item) {
        return res.status(404).json({
            status: 'error',
            message: 'Checklist item not found'
        });
    }

    item.checked = checked;
    await item.save();

    res.status(200).json({
        status: 'success',
        data: {
            item
        }
    });
});

// Delete custom item
const deleteItem = catchAsync(async (req, res) => {
    const { projectId, itemId } = req.params;
    const userId = req.user._id;

    const item = await ChecklistItem.findOne({
        itemId,
        projectId,
        userId,
        isCustom: true // Only allow deletion of custom items
    });

    if (!item) {
        return res.status(404).json({
            status: 'error',
            message: 'Custom checklist item not found'
        });
    }

    await item.deleteOne();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Bulk update checklist items
const bulkUpdate = catchAsync(async (req, res) => {
    const { projectId } = req.params;
    const { items } = req.body; // Array of { itemId, checked, label, sectionId, isCustom }
    const userId = req.user._id;

    const operations = items.map(item => ({
        updateOne: {
            filter: {
                itemId: item.itemId,
                projectId,
                userId
            },
            update: {
                $set: {
                    checked: item.checked,
                    label: item.label,
                    sectionId: item.sectionId,
                    isCustom: item.isCustom || false,
                    projectId,
                    userId
                }
            },
            upsert: true
        }
    }));

    await ChecklistItem.bulkWrite(operations);

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