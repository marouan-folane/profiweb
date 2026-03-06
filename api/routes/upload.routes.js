// routes/upload.routes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const { uploadFiles, generateTemporaryUploadLink } = require("../controllers/uploadController");
const { protect } = require("../middlewares/auth");
const { uploadFiles: uploadMiddleware } = require("../middlewares/uploadFiles");
const { verifyUploadToken } = require("../middlewares/uploadToken");

const router = express.Router({ mergeParams: true });

// Generation route (Protected - only admins/PMs can generate links)
router.get("/generate-link/:projectId", protect, generateTemporaryUploadLink);

const Project = require("../models/project.model");
// Public static client upload route
router.post("/client/:projectId", uploadMiddleware, async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });
        if (!req.body) req.body = {};
        req.body.projectId = req.params.projectId;
        req.projectId = req.params.projectId;
        req.isTempUpload = true;
        req.user = {
            id: project.projectManager || project._id, // Assign to project manager
            role: "client"
        };
        next();
    } catch (err) {
        next(err);
    }
}, uploadFiles);

// Temporary upload route (Public but token-validated)
router.route("/temp")
    .get((req, res) => {
        const { token } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        if (token) {
            // Decode token to get projectId for the new URL structure
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const lang = req.params.lang || 'fr';
                return res.redirect(`${frontendUrl}/${lang}/upload/${decoded.projectId}/temp/${token}`);
            } catch (err) {
                return res.redirect(`${frontendUrl}/fr/upload/temp`);
            }
        }
        res.redirect(`${frontendUrl}/fr/upload/temp`);
    })
    .post(verifyUploadToken, uploadMiddleware, uploadFiles);

// Standard upload route (Protected)
router.use(protect);
router.route("/")
    .post(uploadMiddleware, uploadFiles);

module.exports = router;