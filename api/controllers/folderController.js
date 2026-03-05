const FolderService = require('../services/folderService');
const Folder = require('../models/folder.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// Create a new folder
const createFolder = catchAsync(async (req, res) => {
    const { name, projectId } = req.body;
    const folder = await FolderService.createFolder(req.user._id, req.user.role, projectId, name);

    res.status(201).json({
        status: 'success',
        message: 'Folder created successfully',
        data: { folder }
    });
});

const getFolders = catchAsync(async (req, res) => {
    const { projectId } = req.params;

    if (!projectId || projectId === 'undefined' || !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(200).json({
            status: 'success',
            data: { folders: [], count: 0 }
        });
    }

    const folders = await Folder.find({ project: projectId }).sort({ createdAt: -1 });

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
    const { folder, files } = await FolderService.getFolderFiles(folderId);

    res.status(200).json({
        status: "success",
        data: {
            folder,
            files,
            count: files.length
        },
        message: `Successfully retrieved ${files.length} files from folder "${folder.name}"`
    });
});

// Delete a folder
const deleteFolder = catchAsync(async (req, res, next) => {
    const { folderId } = req.params;
    await FolderService.deleteFolder(folderId, req.user._id);

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