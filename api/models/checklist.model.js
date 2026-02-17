const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  checked: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  sectionId: {
    type: String,
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique item per project
checklistItemSchema.index({ itemId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('ChecklistItem', checklistItemSchema);