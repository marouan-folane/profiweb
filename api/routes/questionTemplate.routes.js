const express = require('express');
const {
    getAllQuestionTemplates,
    createQuestionTemplate,
    updateQuestionTemplate,
    deleteQuestionTemplate,
    seedQuestionTemplates,
    reorderSections,
    createSection,
    updateSectionOrder
} = require('../controllers/questionTemplateController');
const { protect } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roles');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getAllQuestionTemplates)
    .post(isAdmin, createQuestionTemplate);

router.post('/seed', isAdmin, seedQuestionTemplates);

// Section management routes
router.post('/reorder-sections', isAdmin, reorderSections);
router.post('/create-section', isAdmin, createSection);
router.patch('/sections/:sectionId/order', isAdmin, updateSectionOrder);

router.route('/:questionKey')
    .patch(isAdmin, updateQuestionTemplate)
    .delete(isAdmin, deleteQuestionTemplate);

module.exports = router;
