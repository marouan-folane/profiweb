const Project = require('../models/project.model');
const AppError = require('../utils/AppError');
const ProjectFileService = require('./projectFileService');
const AIStructorPDFGenerator = require('../utils/aistructorpdfgenerator');
const fs = require('fs');
const path = require('path');

/**
 * Service to handle project content development (Drafts, Submissions, JSON persistence)
 */
class ProjectContentService {
    /**
     * Saves a draft of the content text
     */
    static async saveDraft(projectId, userId, contentDraftText) {
        const project = await Project.findById(projectId);
        if (!project) throw new AppError("Project not found", 404);

        if (project.contentStatus === "completed") {
            throw new AppError("Content workflow is completed and locked.", 403);
        }

        project.contentDraftText = contentDraftText || "";
        project.updatedBy = userId;
        return await project.save();
    }

    /**
     * Submits final content, generates PDFs and persists JSON
     */
    static async submitContent(projectId, userId, data) {
        let { contentJson, contentText } = data;
        const project = await Project.findById(projectId);
        if (!project) throw new AppError("Project not found", 404);

        if (project.contentStatus === "completed") {
            throw new AppError("Content workflow is completed and locked.", 403);
        }

        // Use draft if contentText is missing
        if (!contentText && project.contentDraftText) {
            contentText = project.contentDraftText;
        }

        if (!contentJson) throw new AppError("JSON content is required", 400);
        if (!contentText || contentText.trim() === "") throw new AppError("Text content is required", 400);

        // Normalize text
        const formattedText = contentText
            .replace(/\r\n/g, "\n")
            .replace(/[ \t]+/g, " ")
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "")
            .join("\n\n");

        // Update Project State
        project.contentJson = contentJson;
        project.contentText = formattedText;
        project.isContentReady = true;
        project.contentSubmittedAt = new Date();
        project.contentDraftText = ""; // Clear draft

        // Department Workflow
        if (!project.completedDepartments.includes("content")) project.completedDepartments.push("content");
        if (!project.activeDepartments.includes("integration")) project.activeDepartments.push("integration");

        project.updatedBy = userId;
        await project.save();

        // Background Tasks (PDF & JSON)
        this._handleBackgroundPersistence(project, userId, formattedText, contentJson).catch(err => {
            console.error("Content Background Persistence Error:", err);
        });

        return project;
    }

    /**
     * Private helper for PDF/JSON file generation
     */
    static async _handleBackgroundPersistence(project, userId, formattedText, contentJson) {
        try {
            // 1. PDF
            const contentPdf = await AIStructorPDFGenerator.generateFormattedContentPdf(project, formattedText);
            await ProjectFileService.saveFileToProjectFolder(
                project._id,
                userId,
                { name: "Formatted content pdf", description: "Folder for formatted content PDFs" },
                {
                    filename: contentPdf.filename,
                    path: contentPdf.path || `uploads/pdfs/${contentPdf.filename}`,
                    size: contentPdf.size || "0"
                }
            );

            // 2. JSON
            const jsonFilename = `content-${project._id}-${Date.now()}.json`;
            const jsonDir = path.join(__dirname, "../uploads/others");
            if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
            const jsonPath = path.join(jsonDir, jsonFilename);

            fs.writeFileSync(jsonPath, JSON.stringify(contentJson, null, 2));
            const stats = fs.statSync(jsonPath);

            await ProjectFileService.saveFileToProjectFolder(
                project._id,
                userId,
                { name: "Structured content json", description: "Folder for structured content JSON files" },
                {
                    filename: jsonFilename,
                    path: `uploads/others/${jsonFilename}`,
                    size: stats.size.toString()
                }
            );
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ProjectContentService;
