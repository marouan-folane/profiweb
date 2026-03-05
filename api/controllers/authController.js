const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Send response with token
const sendTokenResponse = (user, statusCode, res) => {
  // Use code level for role in token and response to match frontend expectations
  const roleCode = user.role?.code?.toLowerCase() || user.role;
  const token = generateToken(user._id, roleCode);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: roleCode,
      department: user.department,
      fullName: user.fullName,
      departmentName: user.departmentName,
      roleName: user.roleName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profileImage: user.profileImage
    }
  });
};

// LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { emailOrUsername, password } = req.body;

  // console.log(" =========> ", emailOrUsername, password);

  // Check required fields
  if (!emailOrUsername || !password) {
    return next(new AppError("Please provide email/username and password", 400));
  }

  // Find user with password and populate role
  const user = await User.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername }
    ]
  }).select('+password +failedLoginAttempts +lockUntil').populate('role');

  // Check if user exists
  if (!user) {
    return next(new AppError("Invalid email/username or password", 401));
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    await user.recordFailedLogin();
    return next(new AppError("Invalid email/username or password", 401));
  }

  // Update last login and reset failed attempts using updateOne to avoid validation issues
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLogin: new Date(),
        failedLoginAttempts: 0
      },
      $unset: { lockUntil: '' }
    }
  );

  // Send response with token
  sendTokenResponse(user, 200, res);
});

// REGISTER (Public - creates regular users only)
exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password, passwordConfirm, firstName, lastName, phone, department } = req.body;

  // Basic validation
  if (!username || !email || !password || !passwordConfirm || !firstName || !lastName || !phone) {
    return next(new AppError("All fields are required including department", 400));
  }

  // Validate department
  const validDepartments = ['informations'];
  if (!validDepartments.includes(department)) {
    return next(new AppError(`Invalid department. Must be one of: ${validDepartments.join(', ')}`, 400));
  }

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }]
  });

  if (existingUser) {
    return next(new AppError("User with this email or username already exists", 400));
  }

  // Create regular user (role defaults to 'user')
  const Role = require("../models/role.model");
  const userRole = await Role.findOne({ code: 'USER' });

  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password,
    passwordConfirm,
    firstName,
    lastName,
    phone,
    department,
    role: userRole ? userRole._id : null
  });

  // Re-fetch user to get populated role for sendTokenResponse
  const populatedUser = await User.findById(user._id).populate('role');

  // Send response with token
  sendTokenResponse(populatedUser, 201, res);
});

// GET CURRENT USER (Protected)
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('role');

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const roleCode = user.role?.code?.toLowerCase() || user.role;

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: roleCode,
      department: user.department,
      fullName: user.fullName,
      roleName: user.roleName,
      isActive: user.isActive,
      profileImage: user.profileImage,
      bio: user.bio,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

// UPDATE PROFILE (Protected - users can update their own info)
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { firstName, lastName, phone, bio } = req.body;

  // Fields that users can update
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone) updateData.phone = phone;
  if (bio !== undefined) updateData.bio = bio;

  // Update user
  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      bio: user.bio,
      profileImage: user.profileImage
    }
  });
});

// LOGOUT
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};