const QuestionTemplate = require('../models/questionTemplate.model');

/**
 * Service to handle synchronization with global question templates
 */
class QuestionTemplateService {
    /**
     * Sync custom question to global templates if it doesn't exist
     */
    static async syncCustomQuestion(questionData) {
        const {
            questionKey,
            question,
            type,
            placeholder,
            isRequired,
            section,
            sectionName,
            projectType,
            order,
            translations
        } = questionData;

        return await QuestionTemplate.findOneAndUpdate(
            { questionKey },
            {
                $setOnInsert: {
                    questionKey,
                    question,
                    type,
                    placeholder: placeholder || '',
                    isRequired: isRequired || false,
                    section: section || 'custom',
                    sectionName: sectionName || 'Custom Fields',
                    options: processedOptions,
                    projectType: projectType || 'wordpress',
                    order: order || 99,
                    isVisible: true,
                    isSectionVisible: true,
                    translations: translations || {}
                }
            },
            { upsert: true }
        );
    }

    /**
     * Sync visibility changes to global templates
     */
    static async syncVisibility(filter, update) {
        if (filter.questionKey) {
            return await QuestionTemplate.findOneAndUpdate({ questionKey: filter.questionKey }, { $set: update });
        } else if (filter.section) {
            return await QuestionTemplate.updateMany({ section: filter.section }, { $set: update });
        }
    }

    /**
     * Sync metadata changes to global templates
     */
    static async syncMetadata(questionKey, patch) {
        return await QuestionTemplate.findOneAndUpdate(
            { questionKey },
            { $set: patch }
        );
    }
}

module.exports = QuestionTemplateService;
