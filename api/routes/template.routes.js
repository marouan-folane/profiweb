const express = require("express");
const {
    createTemplate,
    getAllTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
} = require("../controllers/templateController");
const { protect, restrictTo } = require("../middlewares/auth");

const router = express.Router({ mergeParams: true });

router.use(protect);

// Public routes
router.route("/")
    .post(createTemplate)
    .get(getAllTemplates);

router.route("/:id")
    .get(getTemplate)
    .patch(updateTemplate)
    .delete(restrictTo('superadmin', 'admin'), deleteTemplate);

module.exports = router;