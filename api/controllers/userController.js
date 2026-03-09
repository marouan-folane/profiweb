const User = require("../models/user.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// Get all active users (filtered list for dropdowns etc)
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find({ isActive: true })
        .select('firstName lastName email username role department')
        .populate('role', 'name code');

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});

// Get user by ID
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id)
        .populate('role', 'name code');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        data: user
    });
});
