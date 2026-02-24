const fs = require('fs');
const path = require('path');
const catchAsync = require("../utils/catchAsync");
const Project = require("../models/project.model");
const Client = require("../models/client.model");
const Question = require("../models/question.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const Template = require("../models/template.model");




const createProject = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    clientId,
    category,
    startDate,
    endDate,
    budget,
    cost,
    priority = "standard",
    tags,
    note
  } = req.body;

  // Validate required fields
  if (!title || !description || !clientId || !category || !startDate || !endDate || !budget) {
    return next(new AppError("Please provide all required fields", 400));
  }

  // Check if client exists
  const client = await Client.findById(clientId);
  if (!client) {
    return next(new AppError("Client not found", 404));
  }

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set start date to beginning of day
  start.setHours(0, 0, 0, 0);

  // Set end date to end of day
  end.setHours(23, 59, 59, 999);

  // Validate dates
  if (start >= end) {
    return next(new AppError("End date must be after start date", 400));
  }

  // Create project
  const project = await Project.create({
    title,
    description,
    client: {
      name: client.name,
      id: client._id,
      contactPerson: client.contactPerson
    },
    category,
    status: 'planning',
    priority,
    startDate: start,
    endDate: end,
    budget,
    currency: 'MAD',
    projectManager: req.user.id,
    progress: 0,
    cost: cost || {
      estimated: budget,
      actual: 0,
      expenses: []
    },
    createdBy: req.user.id,
    isActive: true,
    tags,
    note,

    activeDepartments: ['info'],
    // Sales department is completed when project is created
    completedDepartments: ['sales'],

    infoStatus: 'pending'
  });

  // Add project to client's projects list
  await Client.findByIdAndUpdate(clientId, {
    $push: { projects: project._id }
  });

  // Get populated project for response
  const populatedProject = await Project.findById(project._id)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name email');

  res.status(201).json({
    status: 'success',
    message: 'Project created successfully',
    data: {
      project: populatedProject
    }
  });
});




const getProjectById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find project by ID with selective population
  const project = await Project.findById(id)
    .select('-__v')
    .populate({
      path: 'projectManager',
      select: 'name email role avatar'
    })
    .populate({
      path: 'client.id',
      select: 'name email company phone address contactPerson'
    })
    .populate({
      path: 'documents'
    })

  // Check if project exists
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Role-based access control for Designers (d.d)
  // Designers can access once: Content is completed AND IT Setup is validated (integration phase not required)
  if (req.user.role === 'd.d' && (project.contentStatus !== 'completed' || project.itStatus === 'pending')) {
    return next(new AppError('Not authorized to access this project yet. Designers can only access projects after Content is completed and IT Setup is validated.', 403));
  }

  // Calculate additional project metrics
  const projectData = project.toObject();

  // Add virtual fields if not already included
  projectData.duration = project.duration;
  projectData.isOverdue = project.isOverdue;
  projectData.daysRemaining = project.daysRemaining;

  // Calculate completion rate of milestones
  if (projectData.milestones && projectData.milestones.length > 0) {
    const completedMilestones = projectData.milestones.filter(m => m.status === 'completed').length;
    projectData.milestoneCompletionRate = Math.round((completedMilestones / projectData.milestones.length) * 100);
  }

  res.status(200).json({
    status: 'success',
    data: {
      project: projectData
    }
  });
});





const archiveProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Find the project
  const project = await Project.findById(id);

  // Check if project exists
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if already archived
  if (project.status === 'archived') {
    return next(new AppError('Project is already archived', 400));
  }

  // Archive the project by changing status to 'archived'
  project.status = 'archived';
  project.updatedBy = req.user.id;
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Project archived successfully',
    data: {
      project
    }
  });
});





const getArchivedProjects = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    category,
    client,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query for archived projects
  const query = {
    status: 'archived',
  };

  if (category) query.category = category;
  if (client) query['client.id'] = client;

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const projects = await Project.find(query)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name company')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Project.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects,
      pagination: {
        currentPage: page * 1,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit * 1
      }
    }
  });
});






const restoreProject = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Get project ID from URL parameter
  const { status = 'planning' } = req.body; // Default status after restore

  // Validate status (cannot restore to archived status)
  const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  // Check if project exists and is archived
  const project = await Project.findOne({
    _id: id,
    status: 'archived'
  });

  if (!project) {
    return res.status(404).json({
      status: 'fail',
      message: 'Project not found or not archived'
    });
  }

  // Restore the project
  const restoredProject = await Project.findByIdAndUpdate(
    id,
    {
      $set: {
        status: status,
        isActive: true,
        updatedAt: Date.now(),
        updatedBy: req.user.id
      }
    },
    { new: true, runValidators: true }
  )
    .populate('projectManager', 'name email')
    .populate('client.id', 'name company')
    .populate('createdBy', 'name email');

  res.status(200).json({
    status: 'success',
    message: 'Project restored successfully',
    data: {
      project: restoredProject
    }
  });
});






const getQuestionsByProject = catchAsync(async (req, res, next) => {
  const { id: projectId } = req.params;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Get all questions for this project
  const questions = await Question.find({ project: projectId })
    .sort({ order: 1, createdAt: 1 }) // Sort by order then by creation date
    .select('-__v'); // Exclude version key

  // If no questions found, return empty array
  if (!questions || questions.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No questions found for this project',
      data: {
        questions: [],
        project: {
          id: project._id,
          title: project.title,
          questionsStatus: project.questionsStatus || 'pending'
        }
      }
    });
  }

  // Group questions by section for better organization
  const groupedQuestions = questions.reduce((acc, question) => {
    const section = question.section || 'general';
    const sectionName = question.sectionName || 'General Information';

    if (!acc[section]) {
      acc[section] = {
        sectionName,
        questions: []
      };
    }

    acc[section].questions.push(question);
    return acc;
  }, {});

  // Convert to array for easier frontend consumption
  const sections = Object.keys(groupedQuestions).map(section => ({
    section,
    sectionName: groupedQuestions[section].sectionName,
    questions: groupedQuestions[section].questions
  }));

  // Calculate completion statistics
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.status === 'answered').length;
  const pendingQuestions = questions.filter(q => q.status === 'pending').length;
  const completionPercentage = totalQuestions > 0
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0;

  // Get required questions statistics
  const requiredQuestions = questions.filter(q => q.isRequired);
  const requiredAnswered = requiredQuestions.filter(q => q.status === 'answered').length;
  const requiredCompletion = requiredQuestions.length > 0
    ? Math.round((requiredAnswered / requiredQuestions.length) * 100)
    : 100;

  res.status(200).json({
    status: 'success',
    data: {
      questions,
      sections,
      statistics: {
        total: totalQuestions,
        answered: answeredQuestions,
        pending: pendingQuestions,
        completionPercentage,
        required: {
          total: requiredQuestions.length,
          answered: requiredAnswered,
          completionPercentage: requiredCompletion
        }
      },
      project: {
        id: project._id,
        title: project.title,
        description: project.description,
        questionsStatus: project.questionsStatus || 'pending',
        questionsCompletedAt: project.questionsCompletedAt,
        projectType: project.projectType || 'wordpress'
      },
      metadata: {
        lastUpdated: new Date(),
        count: questions.length,
        customFieldsCount: questions.filter(q => q.isCustom).length,
        standardFieldsCount: questions.filter(q => !q.isCustom).length
      }
    }
  });
});




const deleteProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const project = await Project.findOneAndUpdate(
    { _id: id }, // Wrap id in a query object
    {
      isDeleted: true,
      isActive: false
    },
    { new: true }
  );

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Optional: Check if project was already deleted
  if (project.isDeleted) {
    return res.status(200).json({
      status: 'success',
      message: 'Project was already deleted',
      data: {
        project
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      project
    }
  });
});





const updateProject = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    title,
    description,
    clientId,
    category,
    startDate,
    endDate,
    budget,
    cost,
    priority,
    tags,
    note,
    status,
    progress,
    subcategory,
    actualStartDate,
    actualEndDate,
    currency,
    isPublic
  } = req.body;

  // // console.log("note ===> ", req.body);

  // Find project
  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // HARD LOCK: Block questionnaire-related field updates when questionnaire is locked
  const QUESTIONNAIRE_FIELDS = [
    'title', 'description', 'shortDescription', 'client',
    'category', 'tags', 'selectedTemplateId', 'templateName',
    'questionsStatus', 'clientId'
  ];
  const isQuestionnaireUpdate = QUESTIONNAIRE_FIELDS.some(f => req.body[f] !== undefined);
  if (project.infoStatus === 'completed' && isQuestionnaireUpdate) {
    return next(new AppError('Questionnaire is locked and cannot be modified.', 403));
  }

  // Check if client exists if clientId is being updated
  if (clientId && clientId !== project.client.id.toString()) {
    const client = await Client.findById(clientId);
    if (!client) {
      return next(new AppError('Client not found', 404));
    }

    // Remove project from old client's projects list
    await Client.findByIdAndUpdate(project.client.id, {
      $pull: { projects: project._id }
    });

    // Add project to new client's projects list
    await Client.findByIdAndUpdate(clientId, {
      $push: { projects: project._id }
    });

    // Update project's client info
    project.client = {
      name: client.name,
      id: client._id,
      contactPerson: client.contactPerson
    };
  }

  // Handle date validation and updates
  if (startDate !== undefined || endDate !== undefined) {
    // Permission check: only superadmin and d.s can update dates
    if (!['superadmin', 'd.s'].includes(req.user.role)) {
      return next(new AppError('You do not have permission to update project dates', 403));
    }

    if (startDate !== undefined) {
      if (startDate === null) {
        project.startDate = null;
      } else {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        project.startDate = start;
      }
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        project.endDate = null;
      } else {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        project.endDate = end;
      }
    }

    // Validate dates if both exist
    if (project.startDate && project.endDate && project.startDate >= project.endDate) {
      return next(new AppError('End date must be after start date', 400));
    }
  }

  // Update other fields
  if (title) project.title = title;
  if (description) project.description = description;
  if (category) project.category = category;
  if (subcategory !== undefined) project.subcategory = subcategory;
  if (budget !== undefined) project.budget = budget;
  if (currency) project.currency = currency;
  if (priority) project.priority = priority;
  if (tags !== undefined) project.tags = tags;
  if (note !== undefined) project.note = note;
  if (status) project.status = status;
  if (progress !== undefined) project.progress = progress;
  if (actualStartDate) project.actualStartDate = actualStartDate;
  if (actualEndDate) project.actualEndDate = actualEndDate;
  if (isPublic !== undefined) project.isPublic = isPublic;

  // Update cost if provided
  if (cost) {
    project.cost = {
      ...project.cost,
      ...cost
    };
  }

  // Set updatedBy
  project.updatedBy = req.user.id;

  // Save the project
  await project.save();

  // Get populated project for response
  const populatedProject = await Project.findById(project._id)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name email company')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  res.status(200).json({
    status: 'success',
    message: 'Project updated successfully',
    data: {
      project: populatedProject
    }
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
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeArchived = false
  } = req.query;

  // Get current user from request (assuming user is attached to req by auth middleware)
  const currentUser = req.user;
  const userRole = currentUser.role;

  // Build query - always exclude archived unless explicitly requested
  const query = { isActive: true, isDeleted: false };

  // Handle status and archived logic
  if (status) {
    if (status === 'archived') {
      query.status = 'archived';
    } else {
      query.status = status;
      // Exclude archived for non-archived status queries unless explicitly included
      if (!includeArchived) {
        query.status = { $eq: status, $ne: 'archived' };
      }
    }
  } else {
    // Default: exclude archived if not explicitly included
    if (!includeArchived) {
      query.status = { $ne: 'archived' };
    }
  }

  if (category) query.category = category;
  if (client) query['client.id'] = client;

  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Sorting
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  let projects = await Project.find(query)
    .populate('projectManager', 'name email')
    .populate('client.id', 'name company')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Filter projects based on user role and departments
  const filteredProjects = projects.filter((project) => {
    const { activeDepartments = [], completedDepartments = [] } = project;

    // Superadmin can see all projects
    if (userRole === 'superadmin') {
      return true;
    }

    // Admin can see all projects
    if (userRole === 'admin') {
      return true;
    }

    // Map user roles to department codes
    const roleToDepartmentMap = {
      'd.s': 'sales',
      'd.i': 'info',
      'd.c': 'content',
      'd.d': 'design',
      'd.it': 'it',
      'd.in': 'integration'
    };

    // Get user's department from role
    const userDepartment = roleToDepartmentMap[userRole];

    // Special rule for Designers (d.d):
    // They can see projects once Content is completed AND IT Setup is validated.
    // IT Integration phase is NOT required for Designer visibility.
    if (userRole === 'd.d' && (project.contentStatus !== 'completed' || project.itStatus === 'pending')) {
      return false;
    }

    // If user role doesn't map to a department or is not in the map, show all projects
    if (!userDepartment) {
      return true;
    }

    // Check if user's department is in activeDepartments
    const isInActiveDepartments = activeDepartments.includes(userDepartment);

    // If user's department is in activeDepartments, display the project
    if (isInActiveDepartments) {
      return true;
    }

    // If user's department is not in activeDepartments, check completedDepartments
    const isInCompletedDepartments = completedDepartments.includes(userDepartment);

    // If user's department is in completedDepartments, display the project
    if (isInCompletedDepartments) {
      return true;
    }

    // User's department is not in activeDepartments or completedDepartments
    // Check if any of the activeDepartments are in the same "group" as user's department
    // (This handles cases like IT user with ["sales", "info"] in activeDepartments)

    // Define department groups (if needed for more complex logic)
    // For now, just check if user's department is specifically excluded
    // In your example: if user is d.it (IT) and activeDepartments contains ["sales", "info"]
    // then IT is NOT included, so don't display

    // Since user's department is not in activeDepartments or completedDepartments,
    // and we already checked for inclusion above, we should exclude this project
    return false;
  });

  const total = await Project.countDocuments(query);

  // Calculate stats (using the filtered projects if needed, or original query)
  const stats = await Project.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: filteredProjects.length,
    data: {
      projects: filteredProjects,
      pagination: {
        currentPage: page * 1,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit * 1
      },
      stats
    }
  });
});







const createOrUpdateQuestions = catchAsync(async (req, res, next) => {
  const { id: projectId } = req.params;
  const { questions, projectType, generatePDFs = true } = req.body;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // HARD LOCK: Reject all writes once questionnaire is completed
  if (project.infoStatus === 'completed') {
    return next(new AppError('Questionnaire is locked and cannot be modified.', 403));
  }

  // Validate that questions array exists
  if (!questions || !Array.isArray(questions)) {
    return next(new AppError('Questions array is required', 400));
  }

  // Process each question
  const savedQuestions = [];
  let templateStructure;
  const Template = require('../models/template.model');
  const Question = require('../models/question.model');

  for (const questionData of questions) {
    const {
      questionKey,
      question,
      type,
      answer,
      section,
      sectionName,
      order,
      isRequired,
      options,
      placeholder,
      settings,
      isCustom
    } = questionData;

    if (question === "Selected Template") {
      // Robust lookup: try ID first, then title
      let template = null;
      if (answer && typeof answer === 'string' && answer.match(/^[0-9a-fA-F]{24}$/)) {
        template = await Template.findById(answer);
      }
      if (!template && answer) {
        template = await Template.findOne({ title: answer });
      }

      if (template) {
        templateStructure = template.structure;
        console.log("✅ Found template structure in request:", answer);
      }
    }

    // Handle array answers for multiselect/checkbox types
    let processedAnswer = answer;
    if ((type === 'multiselect' || type === 'checkbox') && Array.isArray(answer)) {
      processedAnswer = answer.join(', ');
    }

    // Determine status based on whether answer exists
    const status = processedAnswer && processedAnswer.toString().trim() !== ''
      ? 'answered'
      : 'pending';

    // Process options
    let processedOptions = [];
    if (options && Array.isArray(options)) {
      processedOptions = options.map(option => {
        if (typeof option === 'string') {
          return { value: option, label: option };
        } else if (option && typeof option === 'object') {
          let value = option.value;
          let label = option.label || option.value;

          if (value && typeof value === 'object' && value.value !== undefined) {
            value = value.value;
          }
          if (label && typeof label === 'object' && label.label !== undefined) {
            label = label.label;
          }

          if (value !== null && value !== undefined) {
            value = String(value);
          }
          if (label !== null && label !== undefined) {
            label = String(label);
          }

          return { value: value || '', label: label || '' };
        }
        return { value: '', label: '' };
      }).filter(opt => opt.value !== undefined && opt.value !== null);
    }

    // Use findOneAndUpdate with upsert to create or update
    const savedQuestion = await Question.findOneAndUpdate(
      { project: projectId, questionKey: questionKey },
      {
        project: projectId,
        questionKey,
        question,
        type,
        answer: processedAnswer,
        section: section || 'general',
        sectionName: sectionName || 'General',
        order: order || 0,
        isRequired: isRequired || false,
        projectType: projectType || 'wordpress',
        status,
        ...(options && { options: processedOptions }),
        ...(placeholder && { placeholder }),
        ...(settings && { settings }),
        ...(isCustom !== undefined && { isCustom: Boolean(isCustom) })
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    savedQuestions.push(savedQuestion);
  }

  // Update project's questionsStatus
  const allAnswered = savedQuestions.every(q => q.status === 'answered');
  const anyAnswered = savedQuestions.some(q => q.status === 'answered');

  let questionsStatus = 'pending';
  if (allAnswered) {
    questionsStatus = 'completed';
  } else if (anyAnswered) {
    questionsStatus = 'in-progress';
  }

  // Get existing departments
  const existingActiveDepartments = project.activeDepartments || [];
  const existingCompletedDepartments = project.completedDepartments || [];

  // Define new departments to add
  const newActiveDepartments = ["design", "content", "it"];
  const newCompletedDepartments = ["info"];

  console.log("completedDepartments: ", [...new Set([...existingCompletedDepartments, ...newCompletedDepartments])]);

  // Create the update object correctly
  const updateObj = {
    questionsStatus,
    activeDepartments: newActiveDepartments,
    completedDepartments: [...new Set([...existingCompletedDepartments, ...newCompletedDepartments])]
  };

  // Add questionsCompletedAt if all answered
  if (allAnswered) {
    updateObj.questionsCompletedAt = new Date();
  }

  // Update the project with new departments
  await Project.findByIdAndUpdate(
    projectId,
    updateObj,
    { new: true, runValidators: true }
  );

  // ===== PDF GENERATION ===== 
  let pdfResult = null;
  let createdFile = null;
  let createdFolder = null;
  let folderExisted = false;
  let fileExisted = false;

  if (generatePDFs && savedQuestions.length > 0) {
    try {
      const AIStructorPDFGenerator = require('../utils/aistructorpdfgenerator');
      const File = require("../models/file.model");
      const Folder = require("../models/folder.model");

      console.log('🔍 Starting PDF generation process...');

      // 1. Fetch ALL questions for this project to ensure a complete PDF
      const allProjectQuestions = await Question.find({ project: projectId }).sort({ order: 1 });

      // 2. Find template structure from ALL questions if not already set in this request
      if (!templateStructure) {
        const templateQuestion = allProjectQuestions.find(q => q.question === "Selected Template");
        if (templateQuestion && templateQuestion.answer) {
          const answer = templateQuestion.answer;
          let template = null;

          // Robust lookup: try ID first, then title
          if (typeof answer === 'string' && answer.match(/^[0-9a-fA-F]{24}$/)) {
            template = await Template.findById(answer);
          }
          if (!template) {
            template = await Template.findOne({ title: answer });
          }

          if (template) {
            templateStructure = template.structure;
            console.log("✅ Found template structure from database:", answer);
          }
        }
      }

      // 3. Generate AI Structor PDF with ALL questions
      const aiPdf = await AIStructorPDFGenerator.generateAiInstructions(
        project,
        allProjectQuestions,
        templateStructure
      );

      console.log('✅ PDF generated:', aiPdf.filename);

      // Get all existing file IDs from the project to delete them
      const existingFileIds = project.documents || [];

      // Delete ALL existing files from File collection
      if (existingFileIds.length > 0) {
        console.log(`🗑️ Deleting ${existingFileIds.length} old files...`);
        await File.deleteMany({ _id: { $in: existingFileIds } });
        console.log('✅ Old files deleted');
      }

      // ===== FOLDER MANAGEMENT =====
      const folderName = "Generated instructions pdf";
      const userId = req.user.id;

      console.log(`🔍 Looking for folder: "${folderName}" for project ${projectId}`);

      // Try to find existing folder with same name and project
      let pdfFolder = await Folder.findOne({
        name: folderName,
        project: projectId,
      });

      // If folder doesn't exist, create it
      if (!pdfFolder) {
        console.log('📁 Creating new folder...');
        pdfFolder = await Folder.create({
          name: folderName,
          user: userId,
          project: projectId,
          description: "Folder for generated PDF instructions"
        });
        console.log(`✅ Created new folder with ID: ${pdfFolder._id}`);
        folderExisted = false;
      } else {
        console.log(`✅ Found existing folder with ID: ${pdfFolder._id}`);
        folderExisted = true;
      }

      // Store the folder reference
      createdFolder = pdfFolder;

      // ===== FILE MANAGEMENT =====
      console.log(`🔍 Looking for existing file in folder ${pdfFolder._id}...`);

      // Check if file exists with same project and folder
      let existingFile = await File.findOne({
        project: projectId,
        folder: pdfFolder._id,
      });

      // Create or update file
      if (!existingFile) {
        console.log('📄 Creating new file...');
        createdFile = await File.create({
          filename: aiPdf.filename,
          originalName: aiPdf.filename,
          path: aiPdf.path || `uploads/pdfs/${aiPdf.filename}`,
          size: aiPdf.size || '0',
          project: projectId,
          user: userId,
          folder: pdfFolder._id,
        });
        console.log(`✅ Created new file with ID: ${createdFile._id}`);
        fileExisted = false;
      } else {
        console.log('📝 Updating existing file...');
        existingFile.filename = aiPdf.filename;
        existingFile.originalName = aiPdf.filename;
        existingFile.path = aiPdf.path || `uploads/pdfs/${aiPdf.filename}`;
        existingFile.updatedAt = new Date();
        createdFile = await existingFile.save();
        console.log(`✅ Updated file with ID: ${createdFile._id}`);
        fileExisted = true;
      }

      // ===== UPDATE PROJECT DOCUMENTS =====
      console.log('📋 Updating project documents array...');
      await Project.findByIdAndUpdate(
        projectId,
        {
          $set: {
            documents: [createdFile._id] // ONLY the new file, remove ALL others
          }
        },
        { new: true }
      );
      console.log('✅ Project documents updated');

      // Simple document object for response
      const document = {
        filename: aiPdf.filename,
        url: aiPdf.url || `/uploads/pdfs/${aiPdf.filename}`,
        type: 'ai-structured',
        generatedAt: new Date(),
        documentId: aiPdf.documentId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      pdfResult = {
        success: true,
        document: document,
        file: {
          id: createdFile._id,
          filename: createdFile.filename,
          path: createdFile.path,
          folder: createdFile.folder,
          existed: fileExisted
        },
        folder: {
          id: createdFolder._id,
          name: createdFolder.name,
          existed: folderExisted
        },
        removedFiles: existingFileIds.length,
        message: `PDF generated successfully. ${fileExisted ? 'Updated' : 'Created'} file in ${folderExisted ? 'existing' : 'new'} folder. Removed ${existingFileIds.length} old files.`
      };

      console.log('✅ PDF generation process completed successfully');

    } catch (pdfError) {
      console.error('❌ Error generating PDF or creating file:', pdfError);
      pdfResult = {
        success: false,
        error: pdfError.message,
        stack: process.env.NODE_ENV === 'development' ? pdfError.stack : undefined
      };
    }
  }

  // Prepare response
  const response = {
    status: 'success',
    message: 'Project questions updated successfully',
    data: {
      questions: savedQuestions,
      questionsStatus,
      count: savedQuestions.length,
      customFieldsCount: savedQuestions.filter(q => q.isCustom).length,
      standardFieldsCount: savedQuestions.filter(q => !q.isCustom).length,
      projectInfo: {
        id: project._id,
        title: project.title,
        clientName: project.client?.name,
        questionsCompletedAt: allAnswered ? new Date() : null,
        pdfsGenerated: pdfResult ? pdfResult.success : false,
        documentsCount: pdfResult && pdfResult.success ? 1 : (project.documents?.length || 0),
        activeDepartments: newActiveDepartments,
        completedDepartments: [...new Set([...existingCompletedDepartments, ...newCompletedDepartments])]
      }
    }
  };

  // Add PDF info if generated
  if (pdfResult) {
    response.data.pdf = pdfResult.success ? {
      success: true,
      document: pdfResult.document,
      file: pdfResult.file,
      folder: pdfResult.folder,
      removedFiles: pdfResult.removedFiles,
      message: pdfResult.message,
      debugging: {
        folderExisted,
        fileExisted,
        folderId: createdFolder?._id?.toString(),
        fileId: createdFile?._id?.toString(),
        linkedCorrectly: createdFile?.folder?.toString() === createdFolder?._id?.toString()
      }
    } : {
      success: false,
      error: pdfResult.error,
      stack: pdfResult.stack
    };
  }

  res.status(200).json(response);
});



const saveContentDraft = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { contentDraftText } = req.body;

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // HARD LOCK: reject writes once content workflow is completed
  if (project.contentStatus === 'completed') {
    return next(new AppError('Content workflow is completed and locked.', 403));
  }

  project.contentDraftText = contentDraftText || "";
  project.updatedBy = req.user.id;
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Draft saved successfully',
    data: { project }
  });
});

const submitContent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let { contentJson, contentText } = req.body;

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // HARD LOCK: reject writes once content workflow is completed
  if (project.contentStatus === 'completed') {
    return next(new AppError('Content workflow is completed and locked.', 403));
  }

  // Use draft if contentText is not provided
  if (!contentText && project.contentDraftText) {
    contentText = project.contentDraftText;
  }

  if (!contentJson) {
    return next(new AppError('JSON content is required', 400));
  }

  if (!contentText || contentText.trim() === '') {
    return next(new AppError('Text content is required', 400));
  }

  // Validate JSON if it's a string
  try {
    if (typeof contentJson === 'string') {
      JSON.parse(contentJson);
    }
  } catch (e) {
    return next(new AppError('Invalid JSON content', 400));
  }

  // Format text content
  const formattedText = contentText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .join('\n\n');

  project.contentJson = contentJson;
  project.contentText = formattedText;
  project.isContentReady = true;
  project.contentSubmittedAt = new Date();
  project.contentDraftText = ""; // Clear draft upon success

  // Workflow transition
  if (!project.completedDepartments.includes('content')) {
    project.completedDepartments.push('content');
  }

  if (!project.activeDepartments.includes('integration')) {
    project.activeDepartments.push('integration');
  }

  project.updatedBy = req.user.id;
  await project.save();

  // ===== PDF GENERATION FOR CONTENT =====
  try {
    const AIStructorPDFGenerator = require('../utils/aistructorpdfgenerator');
    const File = require("../models/file.model");
    const Folder = require("../models/folder.model");

    console.log('🔍 Starting Content PDF generation...');

    // Generate the PDF
    const contentPdf = await AIStructorPDFGenerator.generateFormattedContentPdf(
      project,
      formattedText
    );

    // FOLDER MANAGEMENT
    const folderName = "Formatted content pdf";
    let pdfFolder = await Folder.findOne({
      name: folderName,
      project: project._id,
    });

    if (!pdfFolder) {
      pdfFolder = await Folder.create({
        name: folderName,
        user: req.user.id,
        project: project._id,
        description: "Folder for formatted content PDFs"
      });
    }

    // FILE MANAGEMENT
    let existingFile = await File.findOne({
      project: project._id,
      folder: pdfFolder._id,
    });

    let createdFile;
    if (!existingFile) {
      createdFile = await File.create({
        filename: contentPdf.filename,
        originalName: contentPdf.filename,
        path: contentPdf.path || `uploads/pdfs/${contentPdf.filename}`,
        size: contentPdf.size || '0',
        project: project._id,
        user: req.user.id,
        folder: pdfFolder._id,
      });
    } else {
      existingFile.filename = contentPdf.filename;
      existingFile.originalName = contentPdf.filename;
      existingFile.path = contentPdf.path || `uploads/pdfs/${contentPdf.filename}`;
      existingFile.updatedAt = new Date();
      createdFile = await existingFile.save();
    }

    // Add to project documents if not already there
    const ProjectModel = require("../models/project.model");
    await ProjectModel.findByIdAndUpdate(id, {
      $addToSet: { documents: createdFile._id }
    });

    console.log('✅ Content PDF generated and saved');

    // ===== JSON FILE PERSISTENCE FOR CONTENT =====
    try {
      console.log('🔍 Starting Content JSON persistence...');

      const jsonFilename = `content-${project._id}-${Date.now()}.json`;
      const jsonDir = path.join(__dirname, '../uploads/others');
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
      }
      const jsonPath = path.join(jsonDir, jsonFilename);

      // Save JSON to file
      fs.writeFileSync(jsonPath, JSON.stringify(contentJson, null, 2));

      // FOLDER MANAGEMENT for JSON
      const Folder = require("../models/folder.model");
      const jsonFolderName = "Structured content json";
      let jsonFolder = await Folder.findOne({
        name: jsonFolderName,
        project: project._id,
      });

      if (!jsonFolder) {
        jsonFolder = await Folder.create({
          name: jsonFolderName,
          user: req.user.id,
          project: project._id,
          description: "Folder for structured content JSON files"
        });
      }

      // FILE MANAGEMENT for JSON
      const File = require("../models/file.model");
      let existingJsonFile = await File.findOne({
        project: project._id,
        folder: jsonFolder._id,
      });

      let createdJsonFile;
      const stats = fs.statSync(jsonPath);

      if (!existingJsonFile) {
        createdJsonFile = await File.create({
          filename: jsonFilename,
          originalName: jsonFilename,
          path: `uploads/others/${jsonFilename}`,
          size: stats.size.toString(),
          project: project._id,
          user: req.user.id,
          folder: jsonFolder._id,
        });
      } else {
        existingJsonFile.filename = jsonFilename;
        existingJsonFile.originalName = jsonFilename;
        existingJsonFile.path = `uploads/others/${jsonFilename}`;
        existingJsonFile.size = stats.size.toString();
        existingJsonFile.updatedAt = new Date();
        createdJsonFile = await existingJsonFile.save();
      }

      // Add to project documents if not already there
      const ProjectModel = require("../models/project.model");
      await ProjectModel.findByIdAndUpdate(id, {
        $addToSet: { documents: createdJsonFile._id }
      });

      console.log('✅ Content JSON persisted and saved');
    } catch (jsonError) {
      console.error('❌ Error persisting content JSON:', jsonError);
    }
  } catch (pdfError) {
    console.error('❌ Error generating content PDF:', pdfError);
  }

  res.status(200).json({
    status: 'success',
    message: 'Content submitted successfully and ready for integration',
    data: { project }
  });
});

const completeInfoQuestionnaire = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Check permissions: only d.i or superadmin can complete the questionnaire
  if (!['superadmin', 'd.i'].includes(req.user.role)) {
    return next(new AppError('Only the Info Department or a Super Admin can complete this questionnaire', 403));
  }

  const project = await Project.findById(id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.infoStatus === 'completed') {
    return next(new AppError('Questionnaire is already completed', 400));
  }

  project.infoStatus = 'completed';
  project.infoCompletedBy = req.user.id;
  project.infoCompletedAt = Date.now();
  project.updatedBy = req.user.id;

  // Update department workflow
  project.activeDepartments = project.activeDepartments.filter(dept => dept !== 'info');
  if (!project.completedDepartments.includes('info')) {
    project.completedDepartments.push('info');
  }

  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Questionnaire marked as completed successfully',
    data: { project }
  });
});

// ===============================================================
// CONTENT DEPARTMENT — PHASE 1: Validate & Lock Checklist
// ===============================================================
const validateContentChecklist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!['superadmin', 'd.c'].includes(req.user.role)) {
    return next(new AppError('Only the Content Department or a Super Admin can validate the checklist', 403));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.contentStatus === 'checklist_validated' || project.contentStatus === 'completed') {
    return next(new AppError('Checklist is already validated and locked', 400));
  }

  // Update status
  project.contentStatus = 'checklist_validated';
  project.contentChecklistValidatedAt = new Date();
  project.contentChecklistValidatedBy = req.user.id;
  project.updatedBy = req.user.id;
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Checklist validated and locked successfully',
    data: { project }
  });
});

// ===============================================================
// CONTENT DEPARTMENT — PHASE 2: Final Completion Lock
// ===============================================================
const completeContentWorkflow = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!['superadmin', 'd.c'].includes(req.user.role)) {
    return next(new AppError('Only the Content Department or a Super Admin can complete the content workflow', 403));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.contentStatus === 'completed') {
    return next(new AppError('Content workflow is already completed', 400));
  }

  // Prerequisites: checklist must be validated AND content must be submitted
  if (project.contentStatus !== 'checklist_validated') {
    return next(new AppError('Checklist must be validated before completing the content workflow', 400));
  }

  if (!project.isContentReady) {
    return next(new AppError('Structured content (JSON + text) must be submitted before completing the content workflow', 400));
  }

  // Update status
  project.contentStatus = 'completed';
  project.contentCompletedBy = req.user.id;
  project.contentCompletedAt = new Date();
  project.updatedBy = req.user.id;

  // Department workflow — ensure content is in completedDepartments
  project.activeDepartments = project.activeDepartments.filter(dept => dept !== 'content');
  if (!project.completedDepartments.includes('content')) {
    project.completedDepartments.push('content');
  }

  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Content workflow marked as completed successfully',
    data: { project }
  });
});

// ===============================================================
// IT DEPARTMENT — PHASE 1: Validate & Lock Setup Checklist
// ===============================================================
const validateITSetupChecklist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!['superadmin', 'd.it'].includes(req.user.role)) {
    return next(new AppError('Only the IT Department or a Super Admin can validate the setup checklist', 403));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.itStatus === 'setup_validated') {
    return next(new AppError('IT setup checklist is already validated and locked', 400));
  }

  // Update status
  project.itStatus = 'setup_validated';
  project.itSetupValidatedAt = new Date();
  project.itSetupValidatedBy = req.user.id;
  project.updatedBy = req.user.id;
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'IT setup checklist validated and locked successfully',
    data: { project }
  });
});

// ===============================================================
// IT DEPARTMENT — PHASE 2: Complete Integration
// ===============================================================
const completeITIntegration = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check: Integration or IT or Admin
  if (!['superadmin', 'd.in', 'd.it'].includes(req.user.role)) {
    return next(new AppError('Only the Integration Department or a Super Admin can finalize integration', 403));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.itStatus === 'integration_completed') {
    return next(new AppError('Integration is already marked as completed', 400));
  }

  // Guard: Content department must be completed before IT can finalize integration
  if (project.contentStatus !== 'completed') {
    return next(new AppError('Cannot finalize integration until the Content Department has completed their work.', 403));
  }

  // Update status
  project.itStatus = 'integration_completed';
  project.updatedBy = req.user.id;
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Integration completed and finalized successfully',
    data: { project }
  });
});

// ===============================================================
// DESIGN OFFICE — PHASE 1: Validate & Lock Checklist
// ===============================================================
const validateDesignChecklist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!['superadmin', 'd.d'].includes(req.user.role)) {
    return next(new AppError('Only the Design Department or a Super Admin can validate the checklist', 403));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.designStatus === 'checklist_validated' || project.designStatus === 'completed') {
    return next(new AppError('Checklist is already validated and locked', 400));
  }

  // Update status
  project.designStatus = 'checklist_validated';
  project.designChecklistValidatedAt = new Date();
  project.designChecklistValidatedBy = req.user.id;
  project.updatedBy = req.user.id;
  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Design checklist validated and locked successfully',
    data: { project }
  });
});

// ===============================================================
// DESIGN OFFICE — PHASE 2: Final Completion Lock
// ===============================================================
const completeDesignWorkflow = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Permission check
  if (!['superadmin', 'd.d'].includes(req.user.role)) {
    return next(new AppError('Only the Design Department or a Super Admin can complete the design workflow', 403));
  }

  const project = await Project.findById(id);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (project.designStatus === 'completed') {
    return next(new AppError('Design workflow is already completed', 400));
  }

  // Prerequisites: checklist must be validated
  if (project.designStatus !== 'checklist_validated') {
    return next(new AppError('Checklist must be validated before completing the design workflow', 400));
  }

  // Update status
  project.designStatus = 'completed';
  project.designCompletedBy = req.user.id;
  project.designCompletedAt = new Date();
  project.updatedBy = req.user.id;

  // Department workflow
  project.activeDepartments = project.activeDepartments.filter(dept => dept !== 'design');
  if (!project.completedDepartments.includes('design')) {
    project.completedDepartments.push('design');
  }

  await project.save();

  res.status(200).json({
    status: 'success',
    message: 'Design workflow marked as completed successfully',
    data: { project }
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
  completeDesignWorkflow
};