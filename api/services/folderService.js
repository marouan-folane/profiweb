const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const Project = require('../models/project.model');
const AppError = require('../utils/AppError');
const fs = require('fs');
const mongoose = require('mongoose');

/**
 * Service to handle project folder operations
 */
class FolderService {
    /**
     * Create a new folder with lock checks
     */
    static async createFolder(userId, userRole, projectId, name) {
        // Duplicate check
        const existingFolder = await Folder.findOne({ user: userId, project: projectId || null, name });
        if (existingFolder) throw new AppError('You already have a folder with this name', 400);

        // Lock guard
        if (projectId && userRole !== 'superadmin') {
            const project = await Project.findById(projectId).select('contentStatus');
            if (project?.contentStatus === 'completed') {
                throw new AppError('Folder creation is locked — Content Department has finalized this project.', 403);
            }
        }

        return await Folder.create({ name, user: userId, project: projectId || null });
    }

    /**
     * Delete folder and all its physical/meta files
     */
    static async deleteFolder(folderId, userId) {
        const folder = await Folder.findById(folderId);
        if (!folder) throw new AppError('Folder not found', 404);

        // Protected names
        if (folder.name?.toLowerCase() === "generated instructions pdf") {
            throw new AppError('This folder is protected and cannot be deleted', 403);
        }

        // Ownership
        if (folder.user.toString() !== userId.toString()) {
            throw new AppError('You do not have permission to delete this folder', 403);
        }

        const files = await File.find({ folder: folderId });
        for (const file of files) {
            if (file.path && fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error(`Error deleting physical file ${file.path}:`, err);
                }
            }
            await File.findByIdAndDelete(file._id);
        }

        return await Folder.findByIdAndDelete(folderId);
    }

    /**
     * Get folder contents
     */
    static async getFolderFiles(folderId) {
        if (!mongoose.Types.ObjectId.isValid(folderId)) throw new AppError("Invalid folder ID", 400);

        const folder = await Folder.findById(folderId);
        if (!folder) throw new AppError("Folder not found", 404);

        const files = await File.find({ folder: folderId })
            .populate('user', 'name email').populate('project', 'title').sort({ createdAt: -1 });

        const folderDetails = await Folder.findById(folderId)
            .populate('user', 'name email').populate('project', 'title');

        return { folder: folderDetails, files };
    }
}

module.exports = FolderService;
