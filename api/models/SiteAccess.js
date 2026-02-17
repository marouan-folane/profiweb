// models/SiteAccess.js
const mongoose = require('mongoose');

const passwordHistorySchema = new mongoose.Schema({
  password: {
    type: String,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const siteAccessSchema = new mongoose.Schema({
  // Associated project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },

  // Hosting Information
  hosting: {
    service: {
      type: String,
      required: [true, 'Hosting service is required'],
      trim: true
    },
    provider: {
      type: String,
      enum: ['siteground', 'bluehost', 'hostgator', 'godaddy', 'cloudways', 'other'],
      default: 'other'
    },
    email: {
      type: String,
      required: [true, 'Hosting email is required'],
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Hosting password is required']
    },
    username: {
      type: String,
      trim: true
    },
    controlPanelUrl: {
      type: String,
      trim: true
    },
    hostingPasswordHistory: [passwordHistorySchema]
  },

  // WordPress Information
  wordpress: {
    adminEmail: {
      type: String,
      required: [true, 'WordPress admin email is required'],
      trim: true,
      lowercase: true
    },
    adminPassword: {
      type: String,
      required: [true, 'WordPress admin password is required']
    },
    adminUsername: {
      type: String,
      default: 'admin',
      trim: true
    },
    loginUrl: {
      type: String,
      trim: true
    },
    wordpressPasswordHistory: [passwordHistorySchema]
  },

  // Domain Information
  domain: {
    name: {
      type: String,
      required: [true, 'Domain name is required'],
      trim: true,
      lowercase: true
    },
    registrar: {
      type: String,
      trim: true
    },
    expiryDate: {
      type: Date
    },
    dnsNameservers: [{
      type: String,
      trim: true
    }]
  },

  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  // FTP/SFTP Access
  ftp: {
    host: {
      type: String,
      trim: true
    },
    port: {
      type: Number,
      default: 21
    },
    username: {
      type: String,
      trim: true
    },
    password: {
      type: String
    },
    protocol: {
      type: String,
      enum: ['ftp', 'sftp', 'ftps'],
      default: 'ftp'
    }
  },

  // Database Access
  database: {
    host: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      trim: true
    },
    password: {
      type: String
    },
    port: {
      type: Number,
      default: 3306
    }
  },

  // SSL Information
  ssl: {
    issuedBy: {
      type: String,
      trim: true
    },
    expiryDate: {
      type: Date
    },
    type: {
      type: String,
      enum: ['letsencrypt', 'comodo', 'digicert', 'other'],
      default: 'letsencrypt'
    }
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'archived'],
    default: 'active'
  },

  // Security
  lastAccessed: {
    type: Date
  },
  accessCount: {
    type: Number,
    default: 0
  },

  // Created by
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
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove passwords from JSON output by default
      delete ret.hosting.password;
      delete ret.wordpress.adminPassword;
      delete ret.ftp.password;
      delete ret.database.password;
      delete ret.hosting.hostingPasswordHistory;
      delete ret.wordpress.wordpressPasswordHistory;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for faster queries
siteAccessSchema.index({ project: 1 });
siteAccessSchema.index({ 'domain.name': 1 });
siteAccessSchema.index({ status: 1 });
siteAccessSchema.index({ createdBy: 1 });
siteAccessSchema.index({ createdAt: -1 });

// Virtual for formatted domain
siteAccessSchema.virtual('domain.fullUrl').get(function() {
  return `https://${this.domain.name}`;
});

// Virtual for days until domain expiry
siteAccessSchema.virtual('domain.daysUntilExpiry').get(function() {
  if (!this.domain.expiryDate) return null;
  const now = new Date();
  const expiry = new Date(this.domain.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to encrypt passwords (optional - you can use bcrypt)
siteAccessSchema.pre('save', async function(next) {
  // Track password changes in history
  if (this.isModified('hosting.password')) {
    this.hosting.hostingPasswordHistory.push({
      password: this.hosting.password,
      changedBy: this.updatedBy || this.createdBy
    });
    
    // Keep only last 10 password changes
    if (this.hosting.hostingPasswordHistory.length > 10) {
      this.hosting.hostingPasswordHistory = this.hosting.hostingPasswordHistory.slice(-10);
    }
  }

  if (this.isModified('wordpress.adminPassword')) {
    this.wordpress.wordpressPasswordHistory.push({
      password: this.wordpress.adminPassword,
      changedBy: this.updatedBy || this.createdBy
    });
    
    // Keep only last 10 password changes
    if (this.wordpress.wordpressPasswordHistory.length > 10) {
      this.wordpress.wordpressPasswordHistory = this.wordpress.wordpressPasswordHistory.slice(-10);
    }
  }

  next();
});

// Instance method to get credentials (with passwords)
siteAccessSchema.methods.getCredentials = function() {
  return {
    hosting: {
      service: this.hosting.service,
      email: this.hosting.email,
      password: this.hosting.password,
      username: this.hosting.username,
      controlPanelUrl: this.hosting.controlPanelUrl
    },
    wordpress: {
      adminEmail: this.wordpress.adminEmail,
      adminPassword: this.wordpress.adminPassword,
      adminUsername: this.wordpress.adminUsername,
      loginUrl: this.wordpress.loginUrl
    },
    domain: this.domain,
    ftp: this.ftp,
    database: this.database,
    ssl: this.ssl
  };
};

// Instance method to update access count
siteAccessSchema.methods.incrementAccessCount = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Static method to find by project
siteAccessSchema.statics.findByProject = function(projectId) {
  return this.findOne({ project: projectId });
};

const SiteAccess = mongoose.model('SiteAccess', siteAccessSchema);

module.exports = SiteAccess;