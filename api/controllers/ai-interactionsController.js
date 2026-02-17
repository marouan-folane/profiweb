// controllers/ai-interactionsController.js - Fixed Version
const asyncHandler = require('express-async-handler');
const AIInteraction = require('../models/AIInteraction');
const AppError = require('../utils/AppError');

// @desc    Get global AI instructions
// @route   GET /api/v1/ai-interactions
// @access  Private/Superadmin
const getGlobalInstructions = asyncHandler(async (req, res) => {
    let instructions = await AIInteraction.findOne({ type: 'global' })
        .populate('updatedBy', 'name email');
    
    if (!instructions) {
        // Create default global instructions if none exist
        instructions = await AIInteraction.create({
            type: 'global',
            instructions: "You are a helpful AI assistant. Follow these guidelines:\n1. Be respectful and professional\n2. Provide accurate information\n3. Maintain user privacy\n4. Give clear, concise responses",
            updatedBy: req.user._id
        });
    }
    
    res.status(200).json({
        success: true,
        data: instructions
    });
});

// @desc    Update global AI instructions
// @route   PUT /api/v1/ai-interactions
// @access  Private/Superadmin
const updateGlobalInstructions = asyncHandler(async (req, res) => {
    const { instructions, settings } = req.body;
    
    if (!instructions) {
        return next(new AppError("Please provide instructions", 400));
    }
    
    try {
        // Find existing global instructions or create new
        let aiInteraction = await AIInteraction.findOne({ type: 'global' });
        
        if (aiInteraction) {
            // Update instructions
            aiInteraction.instructions = instructions;
            aiInteraction.updatedBy = req.user._id;
            
            // Update settings if provided
            if (settings) {
                aiInteraction.settings = { ...aiInteraction.settings, ...settings };
            }
            
            await aiInteraction.save();
        } else {
            // Create new global instructions
            aiInteraction = await AIInteraction.create({
                type: 'global',
                instructions,
                updatedBy: req.user._id,
                settings: settings || {
                    temperature: 0.7,
                    model: 'gpt-4'
                }
            });
        }
        
        // Populate the updatedBy field
        await aiInteraction.populate('updatedBy', 'name email');
        
        res.status(200).json({
            success: true,
            message: 'Global AI instructions updated successfully',
            data: aiInteraction
        });
        
    } catch (error) {
        console.error('Error updating AI instructions:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating instructions',
            error: error.message
        });
    }
});

// @desc    Get instruction history
// @route   GET /api/v1/ai-interactions/history
// @access  Private/Superadmin
const getInstructionHistory = asyncHandler(async (req, res) => {
    const aiInteraction = await AIInteraction.findOne({ type: 'global' })
        .populate('updatedBy', 'name email')
        .populate('history.updatedBy', 'name email');
    
    if (!aiInteraction) {
        return res.status(404).json({
            success: false,
            message: 'No global instructions found'
        });
    }
    
    // Format history with current version first
    const formattedHistory = aiInteraction.history
        .slice()
        .reverse()
        .map(entry => ({
            instructions: entry.instructions,
            version: entry.version,
            updatedBy: entry.updatedBy,
            updatedAt: entry.updatedAt
        }));
    
    res.status(200).json({
        success: true,
        data: {
            current: {
                instructions: aiInteraction.instructions,
                version: aiInteraction.version,
                updatedBy: aiInteraction.updatedBy,
                updatedAt: aiInteraction.updatedAt,
                settings: aiInteraction.settings
            },
            history: formattedHistory
        }
    });
});

module.exports = {
    getGlobalInstructions,
    updateGlobalInstructions,
    getInstructionHistory
};