const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).populate('role');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // 5) Check if user is active
    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated.', 401));
    }

    // Convert role to lowercased code — MUST use .toObject() so Mongoose's
    // schema field getter doesn't block the plain-string override
    const userRoleCode = currentUser.role?.code?.toLowerCase() || String(currentUser.role);

    // Convert to plain JS object so we can freely set role as a string
    req.user = {
      ...currentUser.toObject(),
      role: userRoleCode,         // lowercase string code: 'superadmin', 'd.s', etc.
      id: currentUser._id,        // convenience alias
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }

    console.error('Auth middleware error:', error);
    return next(new AppError('Invalid token or authorization error', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return next(new AppError('You are not logged in to access this resource', 401));
    }

    // Check if user role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      // Get role names for error message
      const roleNames = {
        'superadmin': 'Super Administrator',
        'admin': 'Administrator',
        'd.s': 'Department Sales',
        'd.i': 'Department Information',
        'd.c': 'Department Content',
        'd.d': 'Department Design',
        'd.it': 'Department IT'
      };

      const userRoleName = roleNames[req.user.role] || req.user.role;
      const requiredRoles = roles.map(role => roleNames[role] || role).join(', ');

      return next(
        new AppError(
          `Access denied. Your role (${userRoleName}) does not have permission to perform this action. Required role(s): ${requiredRoles}`,
          403
        )
      );
    }

    next();
  };
};

const restrictTo = (...roles) => {  // Changed from authorize to restrictTo
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return next(new AppError('You are not logged in to access this resource', 401));
    }

    // Check if user role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      // Get role names for error message
      const roleNames = {
        'superadmin': 'Super Administrator',
        'admin': 'Administrator',
        'd.s': 'Department Sales',
        'd.i': 'Department Information',
        'd.c': 'Department Content',
        'd.d': 'Department Design',
        'd.it': 'Department IT'
      };

      const userRoleName = roleNames[req.user.role] || req.user.role;
      const requiredRoles = roles.map(role => roleNames[role] || role).join(', ');

      return next(
        new AppError(
          `Access denied. Your role (${userRoleName}) does not have permission to perform this action. Required role(s): ${requiredRoles}`,
          403
        )
      );
    }

    next();
  };
};

module.exports = { protect, authorize, restrictTo };