const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');
const crypto = require('crypto');
const { processImage } = require('../middlewares/uploadImage');

// Helper to generate a 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Update personal details
exports.updateProfile = catchAsync(async (req, res, next) => {
    const { firstName, lastName, phone, bio } = req.body;

    // We don't update email here, that needs a separate verification flow
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user
    });
});

// Update Avatar
exports.updateAvatar = catchAsync(async (req, res, next) => {
    if (!req.files || !req.files['profileImage']) {
        return next(new AppError('Please upload an image', 400));
    }

    const file = req.files['profileImage'][0];
    const result = await processImage(file, {
        folder: 'profiles',
        prefix: 'avatar',
        width: 300,
        height: 300,
        fit: 'cover'
    });

    const user = await User.findByIdAndUpdate(req.user.id,
        { profileImage: result.url },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        profileImage: result.url,
        user
    });
});

// Request Email Change
exports.requestEmailChange = catchAsync(async (req, res, next) => {
    const { newEmail } = req.body;

    if (!newEmail) {
        return next(new AppError('Please provide a new email address', 400));
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
        return next(new AppError('Email is already in use', 400));
    }

    // Generate 6-digit code
    const verificationCode = generateVerificationCode();

    // Hash code for storage
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    // Save to user
    req.user.emailVerificationToken = hashedCode;
    req.user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    req.user.pendingEmail = newEmail;
    await req.user.save({ validateBeforeSave: false });

    // Send email
    try {
        await new Email(req.user).sendVerificationCode(verificationCode);

        res.status(200).json({
            success: true,
            message: 'Verification code sent to your current email'
        });
    } catch (err) {
        req.user.emailVerificationToken = undefined;
        req.user.emailVerificationExpires = undefined;
        req.user.pendingEmail = undefined;
        await req.user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later.', 500));
    }
});

// Verify Email Change
exports.verifyEmailChange = catchAsync(async (req, res, next) => {
    const { code } = req.body;

    if (!code) {
        return next(new AppError('Please provide the verification code', 400));
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
        _id: req.user.id,
        emailVerificationToken: hashedCode,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user || !user.pendingEmail) {
        return next(new AppError('Code is invalid or has expired', 400));
    }

    // Update email
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: 'Email updated successfully',
        user
    });
});

// Change Password
exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, passwordConfirm, code } = req.body;

    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
        return next(new AppError('Incorrect current password', 401));
    }

    // 3) Check if code is required/provided (if user wants email verification for password too)
    // For now, let's just do standard password change but allow the code flow if requested
    if (code) {
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        if (user.emailVerificationToken !== hashedCode || user.emailVerificationExpires < Date.now()) {
            return next(new AppError('Verification code is invalid or expired', 400));
        }
    }

    // 4) Update password
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password updated successfully'
    });
});

// Request Password Change Verification (Optional but good for security)
exports.requestPasswordChangeVerification = catchAsync(async (req, res, next) => {
    const verificationCode = generateVerificationCode();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    req.user.emailVerificationToken = hashedCode;
    req.user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    await req.user.save({ validateBeforeSave: false });

    try {
        await new Email(req.user).sendVerificationCode(verificationCode);
        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email'
        });
    } catch (err) {
        req.user.emailVerificationToken = undefined;
        req.user.emailVerificationExpires = undefined;
        await req.user.save({ validateBeforeSave: false });
        return next(new AppError('Error sending email', 500));
    }
});
