const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // BASIC INFORMATION
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username must be less than 30 characters'],
    immutable: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email address'],
    immutable: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords do not match'
    },
    select: false
  },

  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name must be less than 50 characters']
  },

  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name must be less than 50 characters']
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function (v) {
        return /^\+?[\d\s\-\(\)]{8,20}$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },

  // ROLE SYSTEM
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'd.s', 'd.i', 'd.c', 'd.d', 'd.it', 'd.in'],
    default: null
  },

  // IS DELETED
  isDeleted: {
    type: Boolean,
    default: false
  },

  // DEPARTMENT (Required for users, optional for admins)
  department: {
    type: String,
    enum: ['informations', null],
    default: null,
    validate: {
      validator: function (value) {
        // Users must have a department, admins/superadmins can be null
        if (this.role === 'user') {
          return value !== null;
        }
        return true;
      },
      message: 'Users must be assigned to a department'
    }
  },

  // ACCOUNT STATUS
  isActive: {
    type: Boolean,
    default: true
  },

  lastLogin: {
    type: Date
  },

  passwordChangedAt: Date,

  failedLoginAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  lockUntil: {
    type: Date,
    select: false
  },

  // AUDIT TRAIL
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Activated By 
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Date 
  activatedAt: {
    type: Date,
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // PROFILE
  profileImage: {
    type: String,
    default: null
  },

  bio: {
    type: String,
    maxlength: [500, 'Bio must be less than 500 characters'],
    default: ''
  },

  // VERIFICATION
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  pendingEmail: String

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.passwordConfirm;
      delete ret.__v;
      delete ret.failedLoginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// INDEXES
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// VIRTUALS
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('departmentName').get(function () {
  if (!this.department) return 'Not Assigned';

  const names = {
    'integration': 'Integration Department',
    'design': 'Design Department',
    'it': 'IT Department',
    'informations': 'Information Department'
  };

  return names[this.department] || this.department;
});

userSchema.virtual('roleName').get(function () {
  const names = {
    'superadmin': 'Super Administrator',
    'admin': 'Administrator',
    'user': 'User'
  };

  return names[this.role] || this.role;
});

// PRE-SAVE MIDDLEWARE
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  // Set passwordChangedAt
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

// INSTANCE METHODS
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// ADD THIS METHOD: Record failed login attempt and lock account if needed
userSchema.methods.recordFailedLogin = async function () {
  // Increment failed login attempts
  this.failedLoginAttempts += 1;

  // Configuration for account locking
  const MAX_FAILED_ATTEMPTS = 5; // Lock after 5 failed attempts
  const LOCK_TIME_MINUTES = 15; // Lock for 15 minutes
  const LOCK_TIME_MS = LOCK_TIME_MINUTES * 60 * 1000; // Convert to milliseconds

  // If attempts exceed threshold, lock the account
  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
  }

  // Save the user with updated failed attempts and lock status
  // Use validateBeforeSave: false to avoid password validation on login attempts
  await this.save({ validateBeforeSave: false });

  return this;
};

// Helper method to check if account is locked
userSchema.methods.isAccountLocked = function () {
  // If lockUntil is set and it's in the future, account is locked
  if (this.lockUntil) {
    return this.lockUntil > new Date();
  }
  return false;
};

// Method to reset failed login attempts (used after successful login)
userSchema.methods.resetFailedLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save({ validateBeforeSave: false });
  return this;
};

// Method to get lock status information
userSchema.methods.getLockStatus = function () {
  if (!this.lockUntil || this.lockUntil <= new Date()) {
    return { locked: false, remainingTime: null };
  }

  const remainingTimeMs = this.lockUntil - new Date();
  const remainingMinutes = Math.ceil(remainingTimeMs / (1000 * 60));

  return {
    locked: true,
    remainingTime: remainingMinutes,
    lockUntil: this.lockUntil,
    failedAttempts: this.failedLoginAttempts
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;