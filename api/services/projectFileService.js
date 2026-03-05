const Folder = require('../models/folder.model');
const File = require('../models/file.model');
const Project = require('../models/project.model');

/**
 * Service to handle project-related file and folder operations
 */
class ProjectFileService {
    /**
     * Saves or updates a file within a specific project folder
     * @param {string} projectId - ID of the project
     * @param {string} userId - ID of the user performing the action
     * @param {Object} folderConfig - Configuration for the folder { name, description }
     * @param {Object} fileInfo - Information about the file { filename, originalName, path, size }
     * @param {Object} options - Additional options { updateProjectDocuments: boolean, clearExistingDocuments: boolean }
     * @returns {Object} { folder, file }
     */
    static async saveFileToProjectFolder(projectId, userId, folderConfig, fileInfo, options = {}) {
        const {
            updateProjectDocuments = true,
            clearExistingDocuments = false
        } = options;

        // 1. Ensure Folder exists
        let folder = await Folder.findOne({
            name: folderConfig.name,
            project: projectId
        });

        if (!folder) {
            folder = await Folder.create({
                name: folderConfig.name,
                user: userId,
                project: projectId,
                description: folderConfig.description || ""
            });
        }

        // 2. Ensure File record exists/updated
        let file = await File.findOne({
            project: projectId,
            folder: folder._id
        });

        if (!file) {
            file = await File.create({
                ...fileInfo,
                originalName: fileInfo.originalName || fileInfo.filename,
                project: projectId,
                user: userId,
                folder: folder._id
            });
        } else {
            file.filename = fileInfo.filename;
            file.originalName = fileInfo.originalName || fileInfo.filename;
            file.path = fileInfo.path;
            file.size = fileInfo.size || file.size;
            file.updatedAt = new Date();
            await file.save();
        }

        // 3. Update Project documents
        if (updateProjectDocuments) {
            if (clearExistingDocuments) {
                // Replace entire documents array
                await Project.findByIdAndUpdate(projectId, {
                    $set: { documents: [file._id] }
                });
            } else {
                // Add to documents array if not already present
                await Project.findByIdAndUpdate(projectId, {
                    $addToSet: { documents: file._id }
                });
            }
        }

        return { folder, file };
    }

    /**
     * Deletes all files currently linked to a project's documents
     * @param {string} projectId 
     */
    static async clearProjectDocuments(projectId) {
        const project = await Project.findById(projectId);
        if (!project || !project.documents || project.documents.length === 0) return;

        await File.deleteMany({ _id: { $in: project.documents } });
        project.documents = [];
        await project.save();
    }
}

module.exports = ProjectFileService;
