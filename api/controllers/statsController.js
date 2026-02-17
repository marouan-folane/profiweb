// controllers/statsController.js
const User = require("../models/user.model");
const Project = require("../models/project.model");
const Client = require("../models/client.model");
const Template = require("../models/template.model");
const catchAsync = require("../utils/catchAsync");

exports.getAdminDashboardStats = catchAsync(async (req, res, next) => {
    // 1. Basic Stats (Totals)
    const totalUsers = await User.countDocuments({ role: { $ne: 'superadmin' } });
    const totalProjects = await Project.countDocuments({ isDeleted: false });
    const totalClients = await Client.countDocuments();
    const totalTemplates = await Template.countDocuments();

    // 2. Project Status Distribution
    const projectStats = await Project.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 3. User Growth (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: sixMonthsAgo },
                role: { $ne: 'superadmin' }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 4. Project Distribution by Category
    const categoryStats = await Project.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);

    res.status(200).json({
        success: true,
        data: {
            summary: {
                totalUsers,
                totalProjects,
                totalClients,
                totalTemplates
            },
            projectByStatus: projectStats,
            userGrowth,
            projectsByCategory: categoryStats
        }
    });
});
