// controllers/uploadController.js
const Project = require("../models/project.model");
const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const { getFileInfo, normalizePath } = require("../middlewares/uploadFiles");

const uploadFiles = catchAsync(async (req, res, next) => {
    const { folderId } = req.body;

    console.log(req.isTempUpload && req.projectId ? req.projectId : req.body.projectId);

    // Determine projectId: prioritize token-based uploads, then body
    let projectId = req.isTempUpload && req.projectId ? req.projectId : req.body.projectId;

    console.log("📦 Upload Request:");
    console.log("  projectId:", projectId);
    console.log("  folderId:", folderId);
    console.log("  isTempUpload:", req.isTempUpload);
    console.log("  files:", req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
        return next(new AppError('No files uploaded', 400));
    }

    // Validate project exists if projectId is provided
    if (projectId) {
        const project = await Project.findById(projectId);
        if (!project) {
            return next(new AppError('Project not found', 404));
        }

        // Lock guard: uploads blocked once content is finalized (SuperAdmin exempt)
        if (project.contentStatus === 'completed' && req.user.role !== 'superadmin') {
            return next(new AppError('File uploads are locked \u2014 Content Department has finalized this project.', 403));
        }
    }

    let projectFolder;

    if (folderId) {
        // If folderId is provided, find that specific folder
        projectFolder = await Folder.findById(folderId);
        if (!projectFolder) {
            return next(new AppError('Target folder not found', 404));
        }
        console.log(`✅ Using specified folderId: "${projectFolder._id}" (${projectFolder.name})`);
    } else {
        // Fallback to "Client Files" logic if no folderId provided
        projectFolder = await Folder.findOne({
            project: projectId,
            user: req.user.id,
            name: "Client Files"
        });

        // If folder doesn't exist, create ONE folder only
        if (!projectFolder && projectId) {
            const folderName = "Client Files";

            projectFolder = await Folder.create({
                name: folderName,
                user: req.user.id,
                project: projectId,
                description: `Folder for project files`
            });

            console.log(`✅ Created folder: "${folderName}" for project ${projectId}`);
        } else if (projectFolder) {
            console.log(`✅ Using existing folder: "${projectFolder.name}" for project ${projectId}`);
        }
    }

    const uploadedFiles = [];
    const createdFiles = [];

    // Helper function to determine file type
    function getFileType(mimetype) {
        if (mimetype.startsWith('image/')) return 'images';
        if (mimetype.includes('pdf')) return 'pdfs';
        if (
            mimetype.includes('word') ||
            mimetype.includes('excel') ||
            mimetype.includes('powerpoint') ||
            mimetype.includes('officedocument')
        ) {
            return 'documents';
        }
        if (mimetype.startsWith('video/')) return 'videos';
        if (
            mimetype.includes('zip') ||
            mimetype.includes('rar') ||
            mimetype.includes('compressed') ||
            mimetype.includes('7z')
        ) {
            return 'archives';
        }
        if (
            mimetype.includes('photoshop') ||
            mimetype.includes('illustrator') ||
            mimetype.includes('postscript')
        ) {
            return 'documents';
        }
        return 'others';
    }

    // Process all files
    for (const file of req.files) {
        const fileInfo = getFileInfo(file, projectId);
        uploadedFiles.push(fileInfo);

        const cleanPath = normalizePath(fileInfo.path) || fileInfo.path;

        const newFile = await File.create({
            filename: fileInfo.filename,
            originalName: file.originalname,
            path: fileInfo.url,
            url: fileInfo.url,
            size: fileInfo.size,
            mimetype: file.mimetype,
            project: projectId,
            user: req.user.id,
            folder: projectFolder ? projectFolder._id : null,
            fileType: getFileType(file.mimetype)
        });

        createdFiles.push(newFile);
    }

    // Update project with file references
    if (projectId && createdFiles.length > 0) {
        await Project.findByIdAndUpdate(
            projectId,
            {
                $push: {
                    files: { $each: createdFiles.map(file => file._id) }
                },
                $inc: {
                    totalFiles: createdFiles.length,
                    totalSize: createdFiles.reduce((sum, file) => sum + (parseInt(file.size) || 0), 0)
                }
            },
            { new: true }
        );
    }

    // Update folder with file references if folder exists
    if (projectFolder && createdFiles.length > 0) {
        await Folder.findByIdAndUpdate(
            projectFolder._id,
            {
                $push: {
                    files: { $each: createdFiles.map(file => file._id) }
                },
                $inc: {
                    fileCount: createdFiles.length,
                    totalSize: createdFiles.reduce((sum, file) => sum + (parseInt(file.size) || 0), 0)
                }
            },
            { new: true }
        );
    }

    res.status(200).json({
        status: 'success',
        message: 'Files uploaded successfully',
        count: uploadedFiles.length,
        folder: projectFolder ? {
            id: projectFolder._id,
            name: projectFolder.name,
            existed: true
        } : null,
        files: uploadedFiles,
        createdFiles: createdFiles.map(file => ({
            id: file._id,
            filename: file.filename,
            originalName: file.originalName,
            path: file.path,
            url: file.url,
            size: file.size,
            mimetype: file.mimetype,
            fileType: file.fileType,
            folder: file.folder
        }))
    });
});

// Function to fix existing file paths in database
const fixFilePaths = catchAsync(async (req, res, next) => {
    // Get all files with absolute paths
    const files = await File.find({
        $or: [
            { path: { $regex: /^[A-Za-z]:\\/ } }, // Windows absolute paths like D:\
            { path: { $regex: /^\\/ } }, // Unix absolute paths like /home
            { path: { $regex: /uploads.*uploads/ } } // Contains uploads twice
        ]
    });

    let fixedCount = 0;
    const results = [];

    for (const file of files) {
        const oldPath = file.path;
        const normalizedPath = normalizePath(oldPath);

        if (normalizedPath && normalizedPath !== oldPath) {
            // Update the path
            file.path = normalizedPath;

            // Update the URL if it exists
            if (file.url) {
                file.url = `/uploads/${normalizedPath}`;
            } else {
                file.url = `/uploads/${normalizedPath}`;
            }

            await file.save();
            fixedCount++;
            results.push({
                id: file._id,
                oldPath: oldPath,
                newPath: normalizedPath,
                newUrl: file.url
            });

            console.log(`✅ Fixed path for file ${file.filename}: ${oldPath} → ${normalizedPath}`);
        }
    }

    res.status(200).json({
        status: 'success',
        message: `Fixed ${fixedCount} file paths`,
        fixedCount,
        results
    });
});

// Generate a temporary 1-hour upload link
const generateTemporaryUploadLink = catchAsync(async (req, res, next) => {
    const { projectId } = req.params;
    const { lang } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new AppError('Project not found', 404));
    }

    // Create a token that expires in 1 hour
    const token = jwt.sign(
        {
            projectId,
            type: 'temporary_upload'
        },
        process.env.JWT_SECRET,
        { expiresIn: '2d' }
    );

    // Get site URL from env or fallback (Frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const language = lang || 'fr';
    const uploadLink = `${frontendUrl}/${language}/upload/${projectId}/temp/${token}`;

    res.status(200).json({
        status: 'success',
        uploadLink,
        expiresIn: '2 days'
    });
});

module.exports = {
    uploadFiles,
    generateTemporaryUploadLink,
    fixFilePaths
};