const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true
  },
  
  code: {
    type: String,
    required: [true, 'Permission code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  category: {
    type: String,
    required: true,
    enum: [
      'user_management',
      'department',
      'content',
      'reports',
      'system',
      'role_management'
    ]
  },
  
  description: {
    type: String,
    required: true,
    maxlength: [200, 'Description must be less than 200 characters']
  },
  
  module: {
    type: String,
    required: true,
    enum: [
      'users',
      'departments',
      'roles',
      'content',
      'reports',
      'settings'
    ]
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  departmentSpecific: {
    type: Boolean,
    default: false
  },
  
  // For department-specific permissions
  applicableDepartments: {
    type: [{
      type: String,
      enum: ['integration', 'design', 'it', 'informations']
    }],
    default: []
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

permissionSchema.index({ code: 1 }, { unique: true });
permissionSchema.index({ category: 1 });
permissionSchema.index({ module: 1 });
permissionSchema.index({ isDefault: true });

module.exports = mongoose.model('Permission', permissionSchema);