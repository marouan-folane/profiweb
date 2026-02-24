const mongoose = require('mongoose');

const controlChecklistItemSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    sectionId: {
        type: String,
        required: true
    },
    checked: {
        type: Boolean,
        default: false
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Unique item per project
controlChecklistItemSchema.index({ itemId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('ControlChecklistItem', controlChecklistItemSchema);
