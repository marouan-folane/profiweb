const catchAsync = require("../utils/catchAsync");
const QuestionTemplate = require("../models/questionTemplate.model");
const QuestionService = require("../services/questionService");
const AppError = require("../utils/AppError");

exports.getAllQuestionTemplates = catchAsync(async (req, res, next) => {
    const templates = await QuestionTemplate.find().sort({ sectionOrder: 1, section: 1, order: 1 });

    res.status(200).json({
        status: "success",
        results: templates.length,
        data: {
            templates
        }
    });
});

exports.createQuestionTemplate = catchAsync(async (req, res, next) => {
    const template = await QuestionTemplate.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            template
        }
    });
});

exports.updateQuestionTemplate = catchAsync(async (req, res, next) => {
    const template = await QuestionTemplate.findOneAndUpdate(
        { questionKey: req.params.questionKey },
        req.body,
        { new: true, runValidators: true }
    );

    if (!template) {
        return next(new AppError('No template found with that key', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            template
        }
    });
});

exports.deleteQuestionTemplate = catchAsync(async (req, res, next) => {
    const questionKey = req.params.questionKey;

    // 1. Delete the global template (if it exists)
    const template = await QuestionTemplate.findOneAndDelete({ questionKey });

    // 2. ALSO delete from ALL projects to ensure it's gone everywhere
    // This handles the "Global sync" requirement and ensures even custom fields
    // that might have matched this key are removed.
    const Question = require('../models/question.model');
    const result = await Question.deleteMany({ questionKey });

    res.status(200).json({
        status: "success",
        message: "Question deleted globally and from all projects",
        data: {
            templateDeleted: !!template,
            projectsAffected: result.deletedCount
        }
    });
});

// Seed from static file
exports.seedQuestionTemplates = catchAsync(async (req, res, next) => {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
        return next(new AppError('Questions array is required for seeding', 400));
    }

    // console.log("--- SEEDING DATA ---");
    // console.log("Received sample:", JSON.stringify(questions[0], null, 2));

    // Clear existing
    await QuestionTemplate.deleteMany({});

    // Filter out any IDs to allow mongo to generate new ones if they exist in the incoming data
    const cleanQuestions = questions.map(({ _id, ...rest }) => rest);

    // Insert new
    const templates = await QuestionTemplate.insertMany(cleanQuestions);

    res.status(200).json({
        status: "success",
        message: "Question templates seeded successfully",
        results: templates.length
    });
});

// Section Management Endpoints
exports.reorderSections = catchAsync(async (req, res, next) => {
    const { sectionIds } = req.body;

    if (!sectionIds || !Array.isArray(sectionIds)) {
        return next(new AppError('Section IDs array is required', 400));
    }

    await QuestionService.reorderSections(sectionIds);

    res.status(200).json({
        status: "success",
        message: "Sections reordered successfully"
    });
});

exports.createSection = catchAsync(async (req, res, next) => {
    const { sectionId, sectionName, insertAfterSection } = req.body;

    if (!sectionId || !sectionName) {
        return next(new AppError('Section ID and name are required', 400));
    }

    const result = await QuestionService.createSection(sectionId, sectionName, insertAfterSection);

    res.status(201).json({
        status: "success",
        data: {
            section: result
        }
    });
});

exports.updateSectionOrder = catchAsync(async (req, res, next) => {
    const { sectionId } = req.params;
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number') {
        return next(new AppError('New order must be a number', 400));
    }

    await QuestionService.updateSectionOrder(sectionId, newOrder);

    res.status(200).json({
        status: "success",
        message: "Section order updated successfully"
    });
});
