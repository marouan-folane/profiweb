const Project = require('../models/project.model');
const Question = require('../models/question.model');
const Template = require('../models/template.model');
const PDFGenerator = require('../utils/pdfGenerator');
const AIStructorPDFGenerator = require('../utils/aistructorpdfgenerator');

/**
 * Service to handle PDF generation logic with proper data preparation
 */
class ProjectPDFService {
    /**
     * Resolves template ID to title and prepares data for PDF generation
     */
    static async preparePDFData(projectId) {
        // 1. Fetch project and questions
        const project = await Project.findById(projectId);
        const allQuestions = await Question.find({ project: projectId }).sort({ order: 1 });

        if (!project) return null;

        // 2. Filter printable questions
        const printableQuestions = allQuestions.filter((q) => {
            const isVisible = q.isVisible !== false && q.isSectionVisible !== false;
            const hasAnswer = q.answer !== null && q.answer !== undefined && String(q.answer).trim() !== "";
            return isVisible && q.status === "answered" && hasAnswer;
        }).map(q => q.toObject ? q.toObject() : JSON.parse(JSON.stringify(q)));

        // 3. Resolve Template Details
        let templateTitle = project.templateName || "";
        let templateStructure = null;
        let foundTemplate = null;

        // Collect all possible template ID's to look up
        const possibleIds = new Set();
        if (project.selectedTemplate) possibleIds.add(String(project.selectedTemplate));
        if (project.selectedTemplateId) possibleIds.add(String(project.selectedTemplateId));

        allQuestions.forEach(q => {
            if ((q.questionKey && (q.questionKey === "selectedTemplateId" || q.questionKey === "selectedTemplate")) ||
                (q.question && q.question.toLowerCase().includes("selected template"))) {
                if (q.answer) possibleIds.add(String(q.answer));
            }
        });

        // Try to find the template title from any of the ID candidates
        for (const idCandidate of possibleIds) {
            const trimmed = idCandidate.trim();
            if (trimmed.match(/^[0-9a-fA-F]{24}$/)) {
                foundTemplate = await Template.findById(trimmed);
                if (foundTemplate) {
                    console.log(`✅ ProjectPDFService: Resolved template title to "${foundTemplate.title}" from ID ${trimmed}`);
                    templateTitle = foundTemplate.title;
                    templateStructure = foundTemplate.structure;

                    // Sync back to project in DB if missing or different
                    if (project.templateName !== templateTitle || project.selectedTemplate !== trimmed) {
                        await Project.findByIdAndUpdate(project._id, {
                            templateName: templateTitle,
                            selectedTemplate: trimmed
                        });
                    }
                    break;
                }
            } else if (trimmed && trimmed.length > 5 && !trimmed.match(/^[0-9a-fA-F]{24}$/)) {
                // If it's already a non-ID string, it might be the title
                if (!templateTitle) templateTitle = trimmed;
            }
        }

        // 4. Force replace the ID with Title across ALL questions in the printable list
        printableQuestions.forEach(q => {
            const isTemplateField = (q.questionKey && (q.questionKey === "selectedTemplateId" || q.questionKey === "selectedTemplate")) ||
                (q.question && q.question.toLowerCase().includes("selected template"));

            // If it's a template field OR the answer exactly matches a resolved ID, swap it
            if (foundTemplate && (isTemplateField || String(q.answer).trim() === String(foundTemplate._id))) {
                q.answer = foundTemplate.title;
            } else if (!foundTemplate && isTemplateField && q.answer && q.answer.match(/^[0-9a-fA-F]{24}$/)) {
                // Last ditch effort: if we couldn't resolve but it's clearly an ID in a template field
                // we might want to flag it, but for now we've tried finding it above.
            }
        });

        // 5. Create plain project object for PDF
        const projectObj = project.toObject ? project.toObject() : JSON.parse(JSON.stringify(project));
        projectObj.templateName = templateTitle;
        projectObj.selectedTemplate = templateTitle;
        projectObj.selectedTemplateId = templateTitle; // Force resolve everywhere

        return {
            project: projectObj,
            questions: printableQuestions,
            templateStructure
        };
    }

    /**
     * Generates both PDFs for a project
     */
    static async generateAllProjectPDFs(projectId, userId) {
        const data = await this.preparePDFData(projectId);
        if (!data) return null;

        const { project, questions, templateStructure } = data;

        // Generate standard info PDF
        const docInfos = await PDFGenerator.generateProjectInfo(project, questions);

        // Generate AI instructions PDF
        const aiStructured = await AIStructorPDFGenerator.generateAiInstructions(
            project,
            questions,
            templateStructure
        );

        return {
            docInfos,
            aiStructured
        };
    }
}

module.exports = ProjectPDFService;
