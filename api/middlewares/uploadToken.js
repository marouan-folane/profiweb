const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Project = require('../models/project.model');

/**
 * Middleware to verify temporary upload tokens
 * Expected in header: Authorization: Bearer <temp_token>
 * OR in query: ?token=<temp_token>
 */
const verifyUploadToken = catchAsync(async (req, res, next) => {
    let token;

    if (req.query.token) {
        token = req.query.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('No upload token provided. Access denied.', 401));
    }

    try {
        // 1) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2) Check if token is for upload (type check)
        if (decoded.type !== 'temporary_upload') {
            return next(new AppError('Invalid token type.', 401));
        }

        // 3) Check if project exists
        const project = await Project.findById(decoded.projectId);
        if (!project) {
            return next(new AppError('Project no longer exists.', 404));
        }

        // 4) Grant access and set project context
        req.projectId = decoded.projectId;
        req.isTempUpload = true;

        // Simulate a "user" context for the controller if needed
        // We can attribute the upload to the project manager
        req.user = {
            id: project.projectManager,
            role: 'project_manager_proxy'
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Upload link has expired. Please request a new one.', 401));
        }
        return next(new AppError('Invalid upload token.', 401));
    }
});

module.exports = { verifyUploadToken };
