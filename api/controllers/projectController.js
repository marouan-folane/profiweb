const fs = require("fs");
const path = require("path");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
const Project = require("../models/project.model");
const Client = require("../models/client.model");
const Question = require("../models/question.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const Template = require("../models/template.model");

const createProject = catchAsync(async (req, res, next) => {
  const ProjectService = require("../services/projectService");
  const project = await ProjectService.createProject(req.body, req.user.id);

  // Get populated project for response
  const populatedProject = await Project.findById(project._id)
    .populate("projectManager", "name email")
    .populate("client.id", "name email");

  res.status(201).json({
    status: "success",
    message: "Project created successfully",
    data: {
      project: populatedProject,
    },
  });
});

const getProjectById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ProjectService = require("../services/projectService");
  const ProjectWorkflowService = require("../services/projectWorkflowService");

  const project = await ProjectService.getProjectById(id);

  // RBAC Access Verification
  ProjectWorkflowService.verifyProjectAccess(project, req.user.role);

  // Calculate additional project metrics
  const projectData = project.toObject();
  projectData.duration = project.duration;
  projectData.isOverdue = project.isOverdue;
  projectData.daysRemaining = project.daysRemaining;

  // Calculate completion rate of milestones
  if (projectData.milestones && projectData.milestones.length > 0) {
    const completedMilestones = projectData.milestones.filter(
      (m) => m.status === "completed",
    ).length;
    projectData.milestoneCompletionRate = Math.round(
      (completedMilestones / projectData.milestones.length) * 100,
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      project: projectData,
    },
  });
});

const archiveProject = catchAsync(async (req, res, next) => {
  const ProjectService = require("../services/projectService");
  const project = await ProjectService.archiveProject(req.params.id, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Project archived successfully",
    data: { project },
  });
});

const getArchivedProjects = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    category,
    client,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = { status: "archived" };
  if (category) query.category = category;
  if (client) query["client.id"] = client;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  const ProjectService = require("../services/projectService");
  const result = await ProjectService.listProjects({ query, page, limit, sortBy, sortOrder });

  res.status(200).json({
    status: "success",
    results: result.projects.length,
    data: result,
  });
});

const restoreProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status = "planning" } = req.body;

  const validStatuses = ["planning", "active", "on-hold", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400));
  }

  const ProjectService = require("../services/projectService");
  const project = await ProjectService.restoreProject(id, status, req.user.id);

  // Get populated project for response
  const populatedProject = await Project.findById(project._id)
    .populate("projectManager", "name email")
    .populate("client.id", "name company")
    .populate("createdBy", "name email");

  res.status(200).json({
    status: "success",
    message: "Project restored successfully",
    data: { project: populatedProject },
  });
});

const getQuestionsByProject = catchAsync(async (req, res, next) => {
  const { id: projectId } = req.params;
  const userRole = req.user.role;

  const QuestionService = require("../services/questionService");

  // 1. Get questions (handles existence check, template sync, and RBAC filtering)
  const { questions, project } = await QuestionService.getProjectQuestions(projectId, userRole);

  // 2. Group by section
  const sections = QuestionService.groupQuestionsBySection(questions);

  // 3. Calculate statistics
  const statistics = QuestionService.calculateStatistics(questions);

  res.status(200).json({
    status: "success",
    data: {
      questions,
      sections,
      statistics,
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        questionsStatus: project.questionsStatus || "pending",
        questionsCompletedAt: project.questionsCompletedAt,
        projectType: project.projectType || "wordpress",
      },
      metadata: {
        lastUpdated: new Date(),
        count: questions.length,
        customFieldsCount: questions.filter((q) => q.isCustom).length,
        standardFieldsCount: questions.filter((q) => !q.isCustom).length,
      },
    },
  });
});

const deleteProject = catchAsync(async (req, res, next) => {
  const ProjectService = require("../services/projectService");
  const project = await ProjectService.deleteProject(req.params.id);

  res.status(200).json({
    status: "success",
    data: { project },
  });
});

const updateProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const ProjectService = require("../services/projectService");

  const project = await ProjectService.updateProject(id, req.body, req.user.id);

  // Get populated project for response
  const populatedProject = await Project.findById(project._id)
    .populate("projectManager", "name email")
    .populate("client.id", "name email company")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  res.status(200).json({
    status: "success",
    message: "Project updated successfully",
    data: {
      project: populatedProject,
    },
  });
});

const getAllProjects = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    client,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    includeArchived = false,
  } = req.query;

  const userRole = req.user.role;

  // 1. Build Base Query
  const query = { isActive: true, isDeleted: false };

  // Status Logic
  if (status) {
    if (status === "archived") {
      query.status = "archived";
    } else {
      query.status = status;
      if (!includeArchived) query.status = { $eq: status, $ne: "archived" };
    }
  } else if (!includeArchived) {
    query.status = { $ne: "archived" };
  }

  if (category) query.category = category;
  if (client) query["client.id"] = client;

  // Search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  // 2. Call Service
  const ProjectService = require("../services/projectService");
  const result = await ProjectService.listProjects({
    query,
    page,
    limit,
    sortBy,
    sortOrder,
    userRole
  });

  res.status(200).json({
    status: "success",
    results: result.projects.length,
    data: result,
  });
});

const createOrUpdateQuestions = catchAsync(async (req, res, next) => {
  const ProjectQuestionService = require("../services/projectQuestionService");
  const result = await ProjectQuestionService.createOrUpdateQuestions(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body
  );

  const { savedQuestions, questionsStatus, pdfResult } = result;

  // Prepare response
  const response = {
    status: "success",
    message: "Project questions updated successfully",
    data: {
      questions: savedQuestions,
      questionsStatus,
      count: savedQuestions.length,
      customFieldsCount: savedQuestions.filter((q) => q.isCustom).length,
      standardFieldsCount: savedQuestions.filter((q) => !q.isCustom).length,
    },
  };

  if (pdfResult) {
    response.data.pdf = pdfResult;
  }

  res.status(200).json(response);
});

const saveContentDraft = catchAsync(async (req, res, next) => {
  const ProjectContentService = require("../services/projectContentService");
  const project = await ProjectContentService.saveDraft(
    req.params.id,
    req.user.id,
    req.body.contentDraftText,
  );

  res.status(200).json({
    status: "success",
    message: "Draft saved successfully",
    data: { project },
  });
});

const submitContent = catchAsync(async (req, res, next) => {
  const ProjectContentService = require("../services/projectContentService");
  const project = await ProjectContentService.submitContent(
    req.params.id,
    req.user.id,
    req.body,
  );

  res.status(200).json({
    status: "success",
    message: "Content submitted successfully and ready for integration",
    data: { project },
  });
});

const completeInfoQuestionnaire = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Check permissions: only d.i or superadmin can complete the questionnaire
  if (!["superadmin", "d.i"].includes(req.user.role)) {
    return next(
      new AppError(
        "Only the Info Department or a Super Admin can complete this questionnaire",
        403,
      ),
    );
  }

  const project = await Project.findById(id);

  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ProjectWorkflowService = require("../services/projectWorkflowService");
  await ProjectWorkflowService.completeInfoPhase(project, req.user.id);

  // Trigger Professional PDF Generation upon completion
  try {
    const ProjectPDFService = require("../services/projectPDFService");
    const pdfs = await ProjectPDFService.generateAllProjectPDFs(id, req.user.id);

    if (pdfs && pdfs.aiStructured) {
      const ProjectFileService = require("../services/projectFileService");
      const File = require("../models/file.model");

      await ProjectFileService.saveFileToProjectFolder(
        id,
        req.user.id,
        {
          name: "Generated instructions pdf",
          description: "Folder for generated PDF instructions"
        },
        {
          filename: pdfs.aiStructured.filename,
          path: pdfs.aiStructured.url, // url in pdfResults is the relative path
          size: "0"
        },
        { clearExistingDocuments: true }
      );

      // Also update project model directly for quick access
      project.instructionsPdf = {
        filename: pdfs.aiStructured.filename,
        path: pdfs.aiStructured.url,
        generatedAt: new Date()
      };
      await project.save();
    }
  } catch (pdfError) {
    console.error("Error generating PDF during completion:", pdfError);
  }

  res.status(200).json({
    status: "success",
    message: "Questionnaire marked as completed successfully",
    data: { project },
  });
});

// ===============================================================
// CONTENT DEPARTMENT — PHASE 1: Validate & Lock Checklist
// ===============================================================
const validateContentChecklist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!["superadmin", "d.c"].includes(req.user.role)) {
    return next(
      new AppError(
        "Only the Content Department or a Super Admin can validate the checklist",
        403,
      ),
    );
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ProjectWorkflowService = require("../services/projectWorkflowService");
  await ProjectWorkflowService.validateContentChecklist(project, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Checklist validated and locked successfully",
    data: { project },
  });
});

// ===============================================================
// CONTENT DEPARTMENT — PHASE 2: Final Completion Lock
// ===============================================================
const completeContentWorkflow = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!["superadmin", "d.c"].includes(req.user.role)) {
    return next(
      new AppError(
        "Only the Content Department or a Super Admin can complete the content workflow",
        403,
      ),
    );
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ProjectWorkflowService = require("../services/projectWorkflowService");
  await ProjectWorkflowService.completeContentPhase(project, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Content workflow marked as completed successfully",
    data: { project },
  });
});

// ===============================================================
// IT DEPARTMENT — PHASE 1: Validate & Lock Setup Checklist
// ===============================================================
const validateITSetupChecklist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!["superadmin", "d.it"].includes(req.user.role)) {
    return next(
      new AppError(
        "Only the IT Department or a Super Admin can validate the setup checklist",
        403,
      ),
    );
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ProjectWorkflowService = require("../services/projectWorkflowService");
  await ProjectWorkflowService.validateITChecklist(project, req.user.id);

  res.status(200).json({
    status: "success",
    message: "IT setup checklist validated and locked successfully",
    data: { project },
  });
});

// ===============================================================
// IT DEPARTMENT — PHASE 2: Complete Integration
// ===============================================================
const completeITIntegration = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check: Integration or IT or Admin
  if (!["superadmin", "d.in", "d.it"].includes(req.user.role)) {
    return next(
      new AppError(
        "Only the Integration Department or a Super Admin can finalize integration",
        403,
      ),
    );
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ProjectWorkflowService = require("../services/projectWorkflowService");
  await ProjectWorkflowService.completeITPhase(project, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Integration completed and finalized successfully",
    data: { project },
  });
});

// ===============================================================
// DESIGN OFFICE — PHASE 1: Validate & Lock Checklist
// ===============================================================
const validateDesignChecklist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!["superadmin", "d.d"].includes(req.user.role)) {
    return next(
      new AppError(
        "Only the Design Department or a Super Admin can validate the checklist",
        403,
      ),
    );
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ProjectWorkflowService = require("../services/projectWorkflowService");
  await ProjectWorkflowService.validateDesignChecklist(project, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Design checklist validated and locked successfully",
    data: { project },
  });
});

// ===============================================================
// DESIGN OFFICE — PHASE 2: Final Completion Lock
// ===============================================================
const completeDesignWorkflow = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!["superadmin", "d.d"].includes(req.user.role)) {
    return next(
      new AppError(
        "Only the Design Department or a Super Admin can complete the design workflow",
        403,
      ),
    );
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  const ProjectWorkflowService = require("../services/projectWorkflowService");
  await ProjectWorkflowService.completeDesignPhase(project, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Design workflow marked as completed successfully",
    data: { project },
  });
});

// ─── Admin: Toggle visibility of a section or individual question ───────────
const toggleQuestionsVisibility = catchAsync(async (req, res, next) => {
  const { id: projectId } = req.params;
  const { section, questionKey, isVisible } = req.body;

  // Only admin-level roles can control visibility
  const ALLOWED_ROLES = ['superadmin', 'admin'];
  if (!ALLOWED_ROLES.includes(req.user.role)) {
    return next(new AppError('Not authorized to change questionnaire visibility.', 403));
  }

  if (isVisible === undefined || isVisible === null) {
    return next(new AppError('isVisible (boolean) is required.', 400));
  }

  const Question = require('../models/question.model');
  const filter = { project: projectId };
  const update = {};

  if (questionKey) {
    // Toggle a single question's own visibility
    filter.questionKey = questionKey;
    update.isVisible = Boolean(isVisible);
  } else if (section) {
    // Toggle an entire section: all questions inside it
    filter.section = section;
    update.isSectionVisible = Boolean(isVisible);
  } else {
    return next(new AppError('Either section or questionKey is required.', 400));
  }

  const result = await Question.updateMany(filter, { $set: update });

  // --- SYNC WITH GLOBAL TEMPLATES ---
  const QuestionTemplateService = require('../services/questionTemplateService');
  await QuestionTemplateService.syncVisibility(filter, update);
  // -----------------------------------

  res.status(200).json({
    status: 'success',
    message: `Visibility updated for ${questionKey ? `question "${questionKey}"` : `section "${section}"`
      } (Synced globally)`,
    data: {
      modifiedCount: result.modifiedCount,
      isVisible: Boolean(isVisible),
      target: questionKey ? 'question' : 'section',
      identifier: questionKey || section,
    },
  });
});

// ─── Admin: Update question metadata (label / placeholder / isRequired) ──────
const updateQuestionMeta = catchAsync(async (req, res, next) => {
  const { id: projectId, questionKey } = req.params;
  const { label, placeholder, isRequired, translations } = req.body;

  const ALLOWED_ROLES = ['superadmin', 'admin'];
  if (!ALLOWED_ROLES.includes(req.user.role)) {
    return next(new AppError('Not authorized to edit question metadata.', 403));
  }

  if (!questionKey) {
    return next(new AppError('questionKey param is required.', 400));
  }

  const Question = require('../models/question.model');
  const update = {};
  if (label !== undefined) update.question = label;
  if (placeholder !== undefined) update.placeholder = placeholder;
  if (isRequired !== undefined) update.isRequired = Boolean(isRequired);
  if (translations !== undefined) update.translations = translations;

  if (Object.keys(update).length === 0) {
    return next(new AppError('Nothing to update — supply label, placeholder, isRequired, or translations.', 400));
  }

  const question = await Question.findOneAndUpdate(
    { project: projectId, questionKey },
    { $set: update },
    { new: true }
  );

  if (!question) {
    return next(new AppError('Question not found in this project.', 404));
  }

  // --- SYNC WITH GLOBAL TEMPLATES ---
  const QuestionTemplateService = require('../services/questionTemplateService');
  const globalPatch = {};
  if (label !== undefined) globalPatch.question = label;
  if (placeholder !== undefined) globalPatch.placeholder = placeholder;
  if (isRequired !== undefined) globalPatch.isRequired = Boolean(isRequired);
  if (translations !== undefined) globalPatch.translations = translations;

  await QuestionTemplateService.syncMetadata(questionKey, globalPatch);
  // -----------------------------------

  res.status(200).json({
    status: 'success',
    message: 'Question settings updated and synced globally.',
    data: {
      question
    }
  });
});

module.exports = {
  createProject,
  getProjectById,
  archiveProject,
  getArchivedProjects,
  getAllProjects,
  restoreProject,
  getQuestionsByProject,
  createOrUpdateQuestions,
  toggleQuestionsVisibility,
  updateQuestionMeta,
  deleteProject,
  updateProject,
  submitContent,
  saveContentDraft,
  completeInfoQuestionnaire,
  validateContentChecklist,
  completeContentWorkflow,
  validateITSetupChecklist,
  completeITIntegration,
  validateDesignChecklist,
  completeDesignWorkflow,
};
