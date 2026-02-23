const express = require("express");
const {
    createProject,
    getProjectById,
    archiveProject,
    getAllProjects,
    getArchivedProjects,
    restoreProject,
    createOrUpdateQuestions,
    getQuestionsByProject,
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
} = require("../controllers/projectController");
const { protect } = require("../middlewares/auth");

const router = express.Router({ mergeParams: true });

router.use(protect);

// Public routes
router.route("/")
    .get(getAllProjects)
    .post(createProject);

router.route("/archived")
    .get(getArchivedProjects);

// These specific routes should come BEFORE the general :id route
router.route("/:id/archived")
    .patch(archiveProject);

router.route("/:id/restore")
    .patch(restoreProject);

router.route("/:id/submit-content")
    .patch(submitContent);

router.route("/:id/save-content-draft")
    .patch(saveContentDraft);

router.route("/:id/complete-info-questionnaire")
    .patch(completeInfoQuestionnaire);

router.route("/:id/validate-content-checklist")
    .patch(validateContentChecklist);

router.route("/:id/complete-content-workflow")
    .patch(completeContentWorkflow);

router.route("/:id/validate-it-setup-checklist")
    .patch(validateITSetupChecklist);

router.route("/:id/complete-integration")
    .patch(completeITIntegration);

router.route("/:id/validate-design-checklist")
    .patch(validateDesignChecklist);

router.route("/:id/complete-design-workflow")
    .patch(completeDesignWorkflow);
// Question routes should also come before the general :id route
router.route("/:id/questions")
    .get(getQuestionsByProject)
    .patch(createOrUpdateQuestions);

// General project CRUD routes - should come LAST
router.route("/:id")
    .get(getProjectById)
    .patch(updateProject)
    .delete(deleteProject);

module.exports = router;