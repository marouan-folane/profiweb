// controllers/folderController.js
const Project = require('../models/project.model');
const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { default: mongoose } = require('mongoose');

// Create a new folder
const createFolder = catchAsync(async (req, res) => {
    try {
        const { name, projectId } = req.body;
        const userId = req.user._id;

        // Check if folder with same name exists for this user in THIS project
        const existingFolder = await Folder.findOne({
            user: userId,
            project: projectId || null,
            name: name
        });

        if (existingFolder) {
            return res.status(400).json({
                status: 'error',
                message: 'You already have a folder with this name'
            });
        }

        // Lock guard: folders cannot be created once content is finalized (SuperAdmin exempt)
        if (projectId && req.user.role !== 'superadmin') {
            const project = await Project.findById(projectId).select('contentStatus');
            if (project && project.contentStatus === 'completed') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Folder creation is locked — Content Department has finalized this project.'
                });
            }
        }

        const folder = await Folder.create({
            name,
            user: userId,
            project: projectId || null
        });

        res.status(201).json({
            status: 'success',
            message: 'Folder created successfully',
            data: { folder }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

const getFolders = catchAsync(async (req, res) => {
    const { projectId } = req.params;

    const folders = await Folder.find({
        project: projectId
    }).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: {
            folders,
            count: folders.length
        }
    });
});

const getFolderFiles = catchAsync(async (req, res, next) => {
    const { folderId } = req.params;

    console.log("folderId: ", folderId);

    // Validate folderId
    if (!folderId || !mongoose.Types.ObjectId.isValid(folderId)) {
        return next(new AppError("Invalid or missing folder ID", 400))
    }

    // First, verify the folder exists
    const folder = await Folder.findById(folderId);

    if (!folder) {
        return res.status(404).json({
            status: "error",
            message: "Folder not found"
        });
    }

    // Find ALL files that belong to this folder
    const files = await File.find({ folder: folderId })
        .populate('user', 'name email') // Optionally populate user info
        .populate('project', 'title')   // Optionally populate project info
        .sort({ createdAt: -1 }); // Sort by newest first

    console.log(`📁 Folder ID: ${folderId}`);
    console.log(`📄 Files count: ${files.length}`);
    console.log(`🔍 Folder name: ${folder.name}`);

    // Get folder info with populated data
    const folderDetails = await Folder.findById(folderId)
        .populate('user', 'name email')
        .populate('project', 'title');

    res.status(200).json({
        status: "success",
        data: {
            folder: folderDetails,
            files: files,
            count: files.length
        },
        message: `Successfully retrieved ${files.length} files from folder "${folder.name}"`
    });
});

// Delete a folder
const deleteFolder = catchAsync(async (req, res, next) => {
    const { folderId } = req.params;
    const userId = req.user._id;
    const fs = require('fs');

    console.log("Folder ID: ", folderId);

    const folder = await Folder.findById(folderId);

    if (!folder) {
        return next(new AppError('Folder not found', 404));
    }

    // 1. Restriction: "Generated instructions pdf" cannot be deleted
    if (folder.name?.toLowerCase() === "generated instructions pdf") {
        return res.status(403).json({
            status: 'error',
            message: 'This folder is protected and cannot be deleted'
        });
    }

    // 2. Ownership: Only the creator can delete the folder
    if (folder.user.toString() !== userId.toString()) {
        return res.status(403).json({
            status: 'error',
            message: 'You do not have permission to delete this folder'
        });
    }

    // 3. Delete all files in the folder
    const files = await File.find({ folder: folderId });

    for (const file of files) {
        // Delete physical file
        if (file.path && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error(`Error deleting file ${file.path}:`, err);
            }
        }
        // Delete from database
        await File.findByIdAndDelete(file._id);
    }

    // 4. Delete the folder
    await Folder.findByIdAndDelete(folderId);

    res.status(200).json({
        status: 'success',
        message: 'Folder and its contents deleted successfully'
    });
});

module.exports = {
    createFolder,
    getFolders,
    getFolderFiles,
    deleteFolder
};