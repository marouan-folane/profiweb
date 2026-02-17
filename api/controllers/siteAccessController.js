// controllers/siteAccessController.js
const SiteAccess = require('../models/SiteAccess');
const Project = require('../models/project.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get site access for a project
// @route   GET /api/v1/site-access/:projectId
// @access  Private
const getSiteAccess = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  // Check if user has access to this project
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  const siteAccess = await SiteAccess.findOne({ project: projectId })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    data: siteAccess
  });
});

// @desc    Create or update site access for a project
// @route   POST /api/v1/site-access/:projectId
// @access  Private
const createOrUpdateSiteAccess = catchAsync(async (req, res, next) => {

  console.log(`
  ==================================
  ==================================
  ==================================
  ==================================
  `);

  const { projectId } = req.params;
  const {
    hosting,
    wordpress,
    domain,
    notes,
    ftp,
    database,
    ssl
  } = req.body;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Debug: Check project structure
  console.log('DEBUG Project:', {
    projectId,
    hasUser: !!project.user,
    userType: typeof project.user,
    userValue: project.user,
    projectData: project.toObject ? project.toObject() : project
  });

  // Check for required fields
  if (!hosting || !hosting.service || !hosting.email || !hosting.password) {
    return next(new AppError('Hosting information is required', 400));
  }

  if (!wordpress || !wordpress.adminEmail || !wordpress.adminPassword) {
    return next(new AppError('WordPress information is required', 400));
  }

  if (!domain || !domain.name) {
    return next(new AppError('Domain information is required', 400));
  }

  // Find existing site access or create new
  let siteAccess = await SiteAccess.findOne({ project: projectId });

  if (siteAccess) {
    // Update existing
    siteAccess.hosting = { ...siteAccess.hosting, ...hosting };
    siteAccess.wordpress = { ...siteAccess.wordpress, ...wordpress };
    siteAccess.domain = { ...siteAccess.domain, ...domain };
    siteAccess.notes = notes || siteAccess.notes;

    if (ftp) siteAccess.ftp = ftp;
    if (database) siteAccess.database = database;
    if (ssl) siteAccess.ssl = ssl;

    // if (req.user.id) {
    //   console.log("req.user.id role: ", req.user.id);
    // }

    siteAccess.updatedBy = req.user.id;

    await siteAccess.save();
  } else {
    // Create new
    siteAccess = await SiteAccess.create({
      project: projectId,
      hosting,
      wordpress,
      domain,
      notes,
      ftp,
      database,
      ssl,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
  }

  // Populate user information
  await siteAccess.populate('createdBy', 'name email');
  await siteAccess.populate('updatedBy', 'name email');

  res.status(siteAccess.isNew ? 201 : 200).json({
    success: true,
    message: siteAccess.isNew ? 'Site access created successfully' : 'Site access updated successfully',
    data: siteAccess
  });
});

// @desc    Get full credentials (including passwords) for a project
// @route   GET /api/v1/site-access/:projectId/credentials
// @access  Private (Admin/Superadmin only)
const getCredentials = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  // Only admin/superadmin can get full credentials
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized to view credentials', 403));
  }

  const siteAccess = await SiteAccess.findOne({ project: projectId })
    .select('+hosting.password +wordpress.adminPassword +ftp.password +database.password')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!siteAccess) {
    return next(new AppError('Site access not found for this project', 404));
  }

  // Increment access count
  await siteAccess.incrementAccessCount();

  res.status(200).json({
    success: true,
    data: siteAccess.getCredentials()
  });
});

// @desc    Delete site access for a project
// @route   DELETE /api/v1/site-access/:projectId
// @access  Private (Admin/Superadmin only)
const deleteSiteAccess = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  // Only admin/superadmin can delete
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized to delete site access', 403));
  }

  const siteAccess = await SiteAccess.findOneAndDelete({ project: projectId });

  if (!siteAccess) {
    return next(new AppError('Site access not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Site access deleted successfully'
  });
});

// @desc    Get site access history (password changes)
// @route   GET /api/v1/site-access/:projectId/history
// @access  Private (Admin/Superadmin only)
const getAccessHistory = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized to view access history', 403));
  }

  const siteAccess = await SiteAccess.findOne({ project: projectId })
    .select('hosting.hostingPasswordHistory wordpress.wordpressPasswordHistory')
    .populate('hosting.hostingPasswordHistory.changedBy', 'name email')
    .populate('wordpress.wordpressPasswordHistory.changedBy', 'name email');

  if (!siteAccess) {
    return next(new AppError('Site access not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      hostingPasswordHistory: siteAccess.hosting.hostingPasswordHistory,
      wordpressPasswordHistory: siteAccess.wordpress.wordpressPasswordHistory
    }
  });
});

// @desc    Update only specific fields
// @route   PATCH /api/v1/site-access/:projectId
// @access  Private
const updateSiteAccess = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const updateData = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user has permission
  if (
    project.user.toString() !== req.user.id &&
    !['admin', 'superadmin'].includes(req.user.role)
  ) {
    return next(new AppError('Not authorized to update this project', 403));
  }

  const siteAccess = await SiteAccess.findOne({ project: projectId });

  if (!siteAccess) {
    return next(new AppError('Site access not found', 404));
  }

  // Update only provided fields
  Object.keys(updateData).forEach(key => {
    if (key === 'hosting' || key === 'wordpress' || key === 'domain') {
      siteAccess[key] = { ...siteAccess[key], ...updateData[key] };
    } else if (key !== 'project') {
      siteAccess[key] = updateData[key];
    }
  });

  siteAccess.updatedBy = req.user.id;
  await siteAccess.save();

  await siteAccess.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Site access updated successfully',
    data: siteAccess
  });
});

module.exports = {
  getSiteAccess,
  createOrUpdateSiteAccess,
  getCredentials,
  deleteSiteAccess,
  getAccessHistory,
  updateSiteAccess
};