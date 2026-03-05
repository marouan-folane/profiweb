const ChecklistItem = require('../models/checklist.model');
const AppError = require('../utils/AppError');

/**
 * Service to handle project checklist operations
 */
class ChecklistService {
    /**
     * Create or update a single checklist item
     */
    static async createOrUpdateItem(projectId, userId, data) {
        const { itemId, label, checked, isCustom, sectionId } = data;

        const existingItem = await ChecklistItem.findOne({
            itemId,
            projectId
        });

        if (existingItem) {
            existingItem.checked = checked !== undefined ? checked : existingItem.checked;
            existingItem.label = label || existingItem.label;
            return await existingItem.save();
        }

        return await ChecklistItem.create({
            itemId,
            label,
            checked: checked || false,
            isCustom: isCustom || false,
            sectionId,
            projectId,
            userId
        });
    }

    /**
     * Get all checklist items for a project, grouped by section
     */
    static async getProjectChecklist(projectId, userId) {
        const checklistItems = await ChecklistItem.find({
            projectId,
            userId
        });

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

        return Object.values(sections);
    }

    /**
     * Delete a custom checklist item
     */
    static async deleteCustomItem(projectId, itemId, userId) {
        const item = await ChecklistItem.findOne({
            itemId,
            projectId,
            userId,
            isCustom: true
        });

        if (!item) {
            throw new AppError('Custom checklist item not found', 404);
        }

        await item.deleteOne();
        return true;
    }

    /**
     * Bulk update checklist items
     */
    static async bulkUpdate(projectId, userId, items) {
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

        return await ChecklistItem.bulkWrite(operations);
    }
}

module.exports = ChecklistService;
