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
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

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


  if (!wordpress || !wordpress.adminEmail || !wordpress.adminPassword) {
    return next(new AppError('WordPress information is required', 400));
  }

  if (!domain || !domain.name) {
    return next(new AppError('Domain information is required', 400));
  }

  // Check if user has permission (Only IT, Integration, Admin, or the Project Manager can set credentials)
  const isAuthorized = [
    'admin', 'superadmin', 'd.it', 'd.in'
  ].includes(req.user.role) || (project.projectManager && project.projectManager.toString() === req.user.id);

  if (!isAuthorized) {
    return next(new AppError('Not authorized to manage site access for this project', 403));
  }

  // Find existing site access or create new
  let siteAccess = await SiteAccess.findOne({ project: projectId });

  if (siteAccess) {
    // Update existing
    // Use .toObject() or just assign fields to avoid spreading Mongoose internal properties
    const existingHosting = siteAccess.hosting ? siteAccess.hosting.toObject() : {};
    const existingWordpress = siteAccess.wordpress ? siteAccess.wordpress.toObject() : {};
    const existingDomain = siteAccess.domain ? siteAccess.domain.toObject() : {};

    siteAccess.hosting = { ...existingHosting, ...hosting };
    siteAccess.wordpress = { ...existingWordpress, ...wordpress };
    siteAccess.domain = { ...existingDomain, ...domain };
    siteAccess.notes = notes || siteAccess.notes;

    if (ftp) siteAccess.ftp = { ...(siteAccess.ftp ? siteAccess.ftp.toObject() : {}), ...ftp };
    if (database) siteAccess.database = { ...(siteAccess.database ? siteAccess.database.toObject() : {}), ...database };
    if (ssl) siteAccess.ssl = { ...(siteAccess.ssl ? siteAccess.ssl.toObject() : {}), ...ssl };

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
  await siteAccess.populate('createdBy', 'firstName lastName email');
  await siteAccess.populate('updatedBy', 'firstName lastName email');

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

  // admin, superadmin, d.it, d.in, d.c, and d.d can get full credentials
  if (!['admin', 'superadmin', 'd.it', 'd.in', 'd.c', 'd.d'].includes(req.user.role)) {
    return next(new AppError('Not authorized to view credentials', 403));
  }

  const siteAccess = await SiteAccess.findOne({ project: projectId })
    .select('+hosting.password +wordpress.adminPassword +ftp.password +database.password')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

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
    .populate('hosting.hostingPasswordHistory.changedBy', 'firstName lastName email')
    .populate('wordpress.wordpressPasswordHistory.changedBy', 'firstName lastName email');

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
    project.projectManager.toString() !== req.user.id &&
    !['admin', 'superadmin', 'd.it', 'd.in'].includes(req.user.role)
  ) {
    return next(new AppError('Not authorized to update this project', 403));
  }

  const siteAccess = await SiteAccess.findOne({ project: projectId });

  if (!siteAccess) {
    return next(new AppError('Site access not found', 404));
  }

  // Update only provided fields
  Object.keys(updateData).forEach(key => {
    if (key === 'hosting' || key === 'wordpress' || key === 'domain' || key === 'ftp' || key === 'database' || key === 'ssl') {
      const existing = siteAccess[key] && typeof siteAccess[key].toObject === 'function'
        ? siteAccess[key].toObject()
        : siteAccess[key] || {};
      siteAccess[key] = { ...existing, ...updateData[key] };
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