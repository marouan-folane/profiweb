const mongoose = require('mongoose');

const questionTemplateSchema = new mongoose.Schema({
    questionKey: {
        type: String,
        required: true,
        unique: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'textarea', 'email', 'number', 'select', 'radio', 'checkbox', 'date', 'tel', 'url', 'multiselect'],
        default: 'text'
    },
    options: [{
        value: String,
        label: String
    }],
    placeholder: {
        type: String,
        default: ''
    },
    section: {
        type: String,
        required: true,
        default: 'general'
    },
    sectionName: {
        type: String,
        required: true,
        default: 'General'
    },
    sectionOrder: {
        type: Number,
        required: true,
        default: 0
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    isSectionVisible: {
        type: Boolean,
        default: true
    },
    projectType: {
        type: String,
        default: 'wordpress'
    },
    settings: {
        rows: Number,
        min: Number,
        max: Number,
        maxLength: Number
    },
    translations: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            en: "",
            fr: "",
            ar: "",
            de: ""
        }
    }
}, {
    timestamps: true
});

const QuestionTemplate = mongoose.models.QuestionTemplate || mongoose.model('QuestionTemplate', questionTemplateSchema);

module.exports = QuestionTemplate;
