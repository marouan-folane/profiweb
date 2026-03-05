const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Template = require('../models/template.model');
const QuestionService = require('./questionService');
const QuestionTemplateService = require('./questionTemplateService');
const ProjectFileService = require('./projectFileService');
const AIStructorPDFGenerator = require('../utils/aistructorpdfgenerator');
const AppError = require('../utils/AppError');

/**
 * Service to handle project-specific question logic (Bulk updates, PDF generation triggers)
 */
class ProjectQuestionService {
    /**
     * Bulk create or update questions for a project
     */
    static async createOrUpdateQuestions(projectId, userId, userRole, data) {
        const { questions, projectType, generatePDFs = false } = data;

        const project = await Project.findById(projectId);
        if (!project) throw new AppError("Project not found", 404);

        if (project.infoStatus === "completed") {
            throw new AppError("Questionnaire is locked and cannot be modified.", 403);
        }

        if (!questions || !Array.isArray(questions)) {
            throw new AppError("Questions array is required", 400);
        }

        const savedQuestions = [];
        let templateObj;

        for (const questionData of questions) {
            const {
                questionKey, question, type, answer, section, sectionName,
                order, isRequired, options, placeholder, settings, isCustom,
                translations
            } = questionData;

            // Extract whole template if "Selected Template" is provided
            if (question === "Selected Template" || questionKey === "selectedTemplateId") {
                templateObj = await this._getTemplate(answer);
            }

            const processedAnswer = QuestionService.processAnswer(type, answer);
            const status = processedAnswer && processedAnswer.toString().trim() !== "" ? "answered" : "pending";
            const processedOptions = QuestionService.processOptions(options);

            const savedQuestion = await Question.findOneAndUpdate(
                { project: projectId, questionKey },
                {
                    project: projectId, questionKey, question, type, answer: processedAnswer,
                    section: section || "general", sectionName: sectionName || "General",
                    order: order || 0, isRequired: isRequired || false, projectType: projectType || "wordpress",
                    status, ...(options && { options: processedOptions }),
                    ...(placeholder && { placeholder }), ...(settings && { settings }),
                    ...(isCustom !== undefined && { isCustom: Boolean(isCustom) }),
                    ...(translations && { translations }),
                },
                { new: true, upsert: true, runValidators: true }
            );

            // Global Sync for custom questions by admins
            if (isCustom && ['superadmin', 'admin'].includes(userRole)) {
                await QuestionTemplateService.syncCustomQuestion({
                    questionKey, question, type, placeholder, isRequired,
                    section, sectionName, processedOptions, projectType, order,
                    translations
                });
            }

            savedQuestions.push(savedQuestion);
        }

        // Update Project Status & Template Selection
        const allAnswered = savedQuestions.every((q) => q.status === "answered");
        const anyAnswered = savedQuestions.some((q) => q.status === "answered");
        let questionsStatus = allAnswered ? "completed" : (anyAnswered ? "in-progress" : "pending");

        const updatePayload = {
            questionsStatus,
            ...(allAnswered && { questionsCompletedAt: new Date() })
        };

        // Sync template structure to project model if provided
        if (templateObj && templateObj._id) {
            updatePayload.selectedTemplate = templateObj._id.toString();
            updatePayload.templateName = templateObj.title;
        } else {
            // Check if one of the questions was the template selection
            const templateQ = savedQuestions.find(q =>
                (q.questionKey && (q.questionKey === "selectedTemplateId" || q.questionKey === "selectedTemplate")) ||
                (q.question && q.question.toLowerCase().includes("selected template"))
            );
            if (templateQ && templateQ.answer && templateQ.answer.toString().match(/^[0-9a-fA-F]{24}$/)) {
                // If we didn't get templateObj yet, look it up now for the title
                const tObj = await this._getTemplate(templateQ.answer.toString());
                if (tObj) {
                    updatePayload.selectedTemplate = tObj._id.toString();
                    updatePayload.templateName = tObj.title;
                } else {
                    updatePayload.selectedTemplate = templateQ.answer.toString();
                }
            }
        }

        await Project.findByIdAndUpdate(projectId, updatePayload);

        let pdfResult = null;
        if (generatePDFs && savedQuestions.length > 0) {
            pdfResult = await this._handlePDFGeneration(projectId, userId, project, templateObj?.structure);
        }

        return {
            savedQuestions,
            questionsStatus,
            pdfResult
        };
    }

    /**
     * Private helper to fetch template
     */
    static async _getTemplate(answer) {
        if (!answer) return null;
        let template = null;
        if (typeof answer === "string" && answer.match(/^[0-9a-fA-F]{24}$/)) {
            template = await Template.findById(answer);
        }
        if (!template) {
            template = await Template.findOne({ title: answer });
        }
        return template;
    }

    /**
     * Private helper for PDF generation logic
     */
    static async _handlePDFGeneration(projectId, userId, project) {
        try {
            const ProjectPDFService = require('./projectPDFService');
            const pdfResults = await ProjectPDFService.generateAllProjectPDFs(projectId, userId);

            if (!pdfResults) return { success: false, error: "Preparation failed" };

            return {
                success: true,
                document: {
                    filename: pdfResults.aiStructured.filename,
                    url: pdfResults.aiStructured.url,
                    type: "ai-structured",
                    generatedAt: new Date(),
                    documentId: pdfResults.aiStructured.documentId || `doc_${Date.now()}`
                },
                docInfos: pdfResults.docInfos
            };
        } catch (error) {
            console.error("ProjectQuestionService PDF Error:", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = ProjectQuestionService;
