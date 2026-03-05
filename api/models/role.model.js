const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true
  },

  code: {
    type: String,
    required: [true, 'Role code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },

  description: {
    type: String,
    maxlength: [500, 'Description must be less than 500 characters'],
    default: ''
  },

  // Department association - OPTIONAL for now
  department: {
    type: String,
    enum: ['integration', 'design', 'it', 'informations', null],
    default: null
  },

  // Simple permissions array - we'll add permissions later
  // For now, just store permission names as strings
  permissions: [{
    type: String,
    trim: true
  }],

  // System roles cannot be modified
  isSystemRole: {
    type: Boolean,
    default: false
  },

  // Basic level for sorting
  level: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true
  },

  // Created by (track who created this role)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Updated by
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true
});

// Indexes
roleSchema.index({ code: 1 }, { unique: true });
roleSchema.index({ department: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ level: 1 });

// Virtual for display name
roleSchema.virtual('displayName').get(function () {
  if (this.department) {
    return `${this.name} (${this.department.toUpperCase()})`;
  }
  return this.name;
});

module.exports = mongoose.model('Role', roleSchema);