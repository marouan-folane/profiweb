const Question = require('../models/question.model');

/**
 * Service to handle question-specific business logic
 */
class QuestionService {
    /**
     * Filters a list of questions to find those that are suitable for printing in a PDF.
     * This logic ensures that hidden fields and unanswered questions are excluded.
     * 
     * @param {Array} questions - The list of questions to filter
     * @returns {Array} - The filtered list of questions
     */
    static filterPrintable(questions) {
        if (!questions || !Array.isArray(questions)) return [];

        return questions.filter((q) => {
            // Visibility check: both the question itself and its section must be visible
            const isVisible = q.isVisible !== false && q.isSectionVisible !== false;

            // Answer check: must have a non-empty answer
            const hasAnswer =
                q.answer !== null &&
                q.answer !== undefined &&
                String(q.answer).trim() !== "";

            // Status check: must be marked as 'answered'
            const isAnswered = q.status === "answered" && hasAnswer;

            return isVisible && isAnswered;
        });
    }

    /**
     * Fetch all questions for a project and filter for printable ones
     */
    static async getPrintableQuestionsForProject(projectId) {
        const questions = await Question.find({ project: projectId }).sort({ order: 1 });
        return this.filterPrintable(questions);
    }

    /**
     * Process raw answer based on question type
     */
    static processAnswer(type, answer) {
        if ((type === "multiselect" || type === "checkbox") && Array.isArray(answer)) {
            return answer.join(", ");
        }
        return answer;
    }

    /**
     * Process raw options into a standardized [{value, label}] format
     */
    static processOptions(options) {
        if (!options || !Array.isArray(options)) return [];

        return options
            .map((option) => {
                if (typeof option === "string") {
                    return { value: option, label: option };
                } else if (option && typeof option === "object") {
                    let value = option.value;
                    let label = option.label || option.value;

                    if (value && typeof value === "object" && value.value !== undefined) {
                        value = value.value;
                    }
                    if (label && typeof label === "object" && label.label !== undefined) {
                        label = label.label;
                    }

                    if (value !== null && value !== undefined) value = String(value);
                    if (label !== null && label !== undefined) label = String(label);

                    return { value: value || "", label: label || "" };
                }
                return { value: "", label: "" };
            })
            .filter((opt) => opt.value !== undefined && opt.value !== null);
    }

    /**
     * Get all questions for a project, synchronized with global templates and filtered by RBAC
     */
    static async getProjectQuestions(projectId, userRole) {
        const Project = require('../models/project.model');
        const project = await Project.findById(projectId);
        if (!project) {
            const AppError = require('../utils/AppError');
            throw new AppError("Project not found", 404);
        }

        // 1. Get Project Questions
        let questions = await Question.find({ project: projectId })
            .sort({ order: 1, createdAt: 1 })
            .select("-__v");

        // 2. Load Global Templates
        const QuestionTemplate = require("../models/questionTemplate.model");
        const globalTemplates = await QuestionTemplate.find({});
        const templateMap = globalTemplates.reduce((acc, t) => {
            acc[t.questionKey] = t;
            return acc;
        }, {});

        // 3. Sync Logic
        if (questions.length === 0) {
            questions = globalTemplates
                .filter(t => t.isVisible !== false)
                .map(t => ({
                    questionKey: t.questionKey,
                    question: t.question,
                    type: t.type,
                    placeholder: t.placeholder,
                    isRequired: t.isRequired,
                    section: t.section,
                    sectionName: t.sectionName,
                    options: t.options,
                    isVisible: t.isVisible,
                    isSectionVisible: t.isSectionVisible,
                    translations: t.translations || {},
                    answer: '',
                    status: 'pending',
                    isCustom: false
                }));
        } else {
            questions = questions.map(q => {
                const template = templateMap[q.questionKey];
                if (template) {
                    q = q.toObject ? q.toObject() : q;
                    q.isVisible = template.isVisible;
                    q.isSectionVisible = template.isSectionVisible;
                    q.question = template.question;
                    q.placeholder = template.placeholder;
                    q.isRequired = template.isRequired;
                    q.translations = template.translations || q.translations || {};
                }
                return q;
            });
        }

        // 4. RBAC Filtering
        const isAdmin = ['superadmin', 'admin'].includes(userRole);
        if (userRole === 'd.s') {
            questions = [];
        } else if (!isAdmin) {
            questions = questions.filter(q => q.isVisible !== false && q.isSectionVisible !== false);
        }

        return { questions, project };
    }

    /**
     * Group questions by section
     */
    static groupQuestionsBySection(questions) {
        if (!questions || !Array.isArray(questions)) return [];

        const grouped = questions.reduce((acc, question) => {
            const section = question.section || "general";
            const sectionName = question.sectionName || "General Information";

            if (!acc[section]) {
                acc[section] = {
                    sectionName,
                    questions: [],
                };
            }

            acc[section].questions.push(question);
            return acc;
        }, {});

        return Object.keys(grouped).map((section) => ({
            section,
            sectionName: grouped[section].sectionName,
            questions: grouped[section].questions,
        }));
    }

    /**
     * Calculate question statistics
     */
    static calculateStatistics(questions) {
        const total = questions.length;
        const answered = questions.filter(q => q.status === "answered").length;
        const pending = questions.filter(q => q.status === "pending").length;
        const completionPercentage = total > 0 ? Math.round((answered / total) * 100) : 0;

        const requiredQuestions = questions.filter((q) => q.isRequired);
        const requiredAnswered = requiredQuestions.filter(q => q.status === "answered").length;
        const requiredCompletion = requiredQuestions.length > 0
            ? Math.round((requiredAnswered / requiredQuestions.length) * 100)
            : 100;

        return {
            total,
            answered,
            pending,
            completionPercentage,
            required: {
                total: requiredQuestions.length,
                answered: requiredAnswered,
                completionPercentage: requiredCompletion,
            },
        };
    }
}

module.exports = QuestionService;
