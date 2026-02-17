// routes/siteAccess.routes.js
const express = require('express');
const router = express.Router();
const {
  getSiteAccess,
  createOrUpdateSiteAccess,
  getCredentials,
  deleteSiteAccess,
  getAccessHistory,
  updateSiteAccess
} = require('../controllers/siteAccessController');
const { protect, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Get site access for project (project owner, admin, superadmin)
router.get('/:projectId', getSiteAccess);

// Create or update site access (project owner, admin, superadmin)
router.post('/:projectId', authorize('d.it'), createOrUpdateSiteAccess);

// Update specific fields (project owner, admin, superadmin)
router.patch('/:projectId', authorize('d.it'), updateSiteAccess);

// Get full credentials (admin/superadmin only)
router.get('/:projectId/credentials', authorize('d.it'), getCredentials);

// Get access history (admin/superadmin only)
router.get('/:projectId/history', authorize('d.it'), getAccessHistory);

// Delete site access (admin/superadmin only)
router.delete('/:projectId', authorize('d.it'), deleteSiteAccess);

module.exports = router;