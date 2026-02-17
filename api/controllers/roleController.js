const AppError = require('../utils/AppError');
const Role = require('../models/role.model');
const catchAsync = require('../utils/catchAsync');

// Get all roles
const getAllRoles = catchAsync(async (req, res, next) => {
    const roles = await Role.find();

    res.status(200).json({
        status: 'success',
        results: roles.length,
        data: { roles }
    });
});

module.exports = {
    getAllRoles,
};