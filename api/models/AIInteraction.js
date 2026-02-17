// models/AIInteraction.js - Simplified Version
const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
    instructions: mongoose.Schema.Types.Mixed, // Support both String and EditorJS JSON
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    version: Number,
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const aiInteractionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['global'],
        default: 'global',
        unique: true
    },
    instructions: {
        type: mongoose.Schema.Types.Mixed, // Support both String and EditorJS JSON
        required: true,
        default: "You are a helpful AI assistant. Provide accurate and helpful responses."
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    version: {
        type: Number,
        default: 1
    },
    history: [historyEntrySchema],
    settings: {
        temperature: {
            type: Number,
            default: 0.7
        },
        model: {
            type: String,
            default: 'gpt-4'
        }
    }
}, {
    timestamps: true
});

// Create unique index for global type
aiInteractionSchema.index({ type: 1 }, { unique: true });

const AIInteraction = mongoose.model('AIInteraction', aiInteractionSchema);

module.exports = AIInteraction;