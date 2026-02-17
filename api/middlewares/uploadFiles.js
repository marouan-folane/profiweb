// middlewares/uploadFiles.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/AppError');

// Ensure uploads directory exists with subdirectories
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Create subdirectories for different file types
const createUploadsSubdirs = () => {
    const subdirs = ['documents', 'images', 'pdfs', 'videos', 'archives', 'others'];
    subdirs.forEach(dir => {
        const dirPath = path.join(uploadsDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Created directory: ${dirPath}`);
        }
    });
};
createUploadsSubdirs();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'others';

        // Determine folder based on file type
        if (file.mimetype.startsWith('image/')) {
            folder = 'images';
        } else if (file.mimetype.includes('pdf')) {
            folder = 'pdfs';
        } else if (
            file.mimetype.includes('word') ||
            file.mimetype.includes('excel') ||
            file.mimetype.includes('powerpoint') ||
            file.mimetype.includes('officedocument')
        ) {
            folder = 'documents';
        } else if (file.mimetype.startsWith('video/')) {
            folder = 'videos';
        } else if (
            file.mimetype.includes('zip') ||
            file.mimetype.includes('rar') ||
            file.mimetype.includes('compressed') ||
            file.mimetype.includes('tar') ||
            file.mimetype.includes('7z')
        ) {
            folder = 'archives';
        } else if (
            file.mimetype.includes('photoshop') ||
            file.mimetype.includes('illustrator') ||
            file.mimetype.includes('postscript') ||
            file.originalname.toLowerCase().match(/\.(psd|ai|eps|xcf)$/)
        ) {
            folder = 'documents'; // or a new 'design' folder if you prefer
        }

        const dirPath = path.join(uploadsDir, folder);

        // Ensure folder exists
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        cb(null, dirPath);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        // Clean filename but keep the original name structure
        const cleanName = path.basename(file.originalname, extension)
            .replace(/[^\w\s.-]/gi, '') // Remove special characters except dots and hyphens
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .toLowerCase();
        const filename = `${cleanName}-${uniqueId}${extension}`;
        cb(null, filename);
    }
});

// File filter function - accept all file types
const fileFilter = (req, file, cb) => {
    // Accept all files
    cb(null, true);
};

// Multer upload configuration - CHANGED TO upload.any()
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
        files: 50 // Increased to match frontend
    }
});

// CHANGED: Use upload.any() instead of upload.array()
const uploadFiles = upload.any();

// Get file info - FIXED AND SIMPLIFIED VERSION
const getFileInfo = (file, projectId) => {
    // Get the folder name from the destination (e.g., 'pdfs', 'images', etc.)
    const folderName = path.basename(file.destination);

    // Construct consistent relative path: "pdfs/filename.pdf"
    const relativePath = `${folderName}/${file.filename}`;

    // Construct URL path: "/uploads/pdfs/filename.pdf"
    const urlPath = `/uploads/${relativePath}`;

    return {
        originalName: file.originalname,
        filename: file.filename,
        path: urlPath, // Store as "pdfs/filename.pdf"
        size: file.size,
        url: urlPath, // This is for accessing the file: "/uploads/pdfs/filename.pdf"
        projectId: projectId,
        uploadedAt: new Date()
    };
};

// Function to clean existing absolute paths to relative paths
const normalizePath = (filePath) => {
    if (!filePath || typeof filePath !== 'string') {
        return null;
    }

    // If it's already a relative path like "pdfs/filename.pdf", return as is
    if (!path.isAbsolute(filePath) && !filePath.includes(':')) {
        return filePath.replace(/\\/g, '/');
    }

    // If it contains the uploads directory, extract relative part
    if (filePath.includes('uploads')) {
        // Find the position after "uploads"
        const uploadsIndex = filePath.indexOf('uploads');
        if (uploadsIndex !== -1) {
            // Get everything after "uploads/" including the slash
            const afterUploads = filePath.substring(uploadsIndex + 'uploads'.length);
            // Remove leading slashes or backslashes
            const cleanPath = afterUploads.replace(/^[\\\/]+/, '');
            return cleanPath.replace(/\\/g, '/');
        }
    }

    // If it's an absolute path but doesn't contain "uploads", try to make it relative to uploadsDir
    if (path.isAbsolute(filePath)) {
        try {
            const relative = path.relative(uploadsDir, filePath);
            return relative.replace(/\\/g, '/');
        } catch (error) {
            console.error('Error converting absolute path:', error);
            return null;
        }
    }

    return filePath;
};

// Function to get URL from stored path
const getFileUrl = (storedPath) => {
    if (!storedPath) return null;

    // If path is already a full URL or starts with /uploads, return as is
    if (storedPath.startsWith('/uploads/') || storedPath.startsWith('http')) {
        return storedPath;
    }

    // If path is like "pdfs/filename.pdf", prepend "/uploads/"
    return `/uploads/${storedPath.replace(/\\/g, '/')}`;
};

// Delete file from local storage
const deleteFileLocally = async (filePath) => {
    try {
        if (!filePath || typeof filePath !== 'string') {
            console.log('⚠️ No file path provided for deletion');
            return false;
        }

        let absolutePath;

        // If it's a relative path like "pdfs/filename.pdf", join with uploadsDir
        if (!path.isAbsolute(filePath) && !filePath.includes(':')) {
            // Handle paths like "pdfs/filename.pdf"
            absolutePath = path.join(uploadsDir, filePath);
        } else if (filePath.includes('uploads')) {
            // Handle paths that contain "uploads" in them
            const normalized = normalizePath(filePath);
            if (normalized) {
                absolutePath = path.join(uploadsDir, normalized);
            } else {
                // If we can't normalize, try to use as absolute path
                absolutePath = filePath;
            }
        } else {
            // Assume it's an absolute path
            absolutePath = filePath;
        }

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            console.log(`⚠️ File not found: ${absolutePath}`);
            return false;
        }

        // Delete the file
        await fs.promises.unlink(absolutePath);
        console.log(`✅ Deleted file: ${absolutePath}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting file:', error);
        return false;
    }
};

// Helper function to get absolute path from stored path
const getAbsolutePath = (storedPath) => {
    if (!storedPath) return null;

    // If it's already absolute, return as is
    if (path.isAbsolute(storedPath)) {
        return storedPath;
    }

    // If it's a relative path like "pdfs/filename.pdf", join with uploadsDir
    if (!storedPath.includes(':')) {
        return path.join(uploadsDir, storedPath.replace(/\//g, path.sep));
    }

    // If it contains "uploads", try to normalize it
    if (storedPath.includes('uploads')) {
        const normalized = normalizePath(storedPath);
        if (normalized) {
            return path.join(uploadsDir, normalized.replace(/\//g, path.sep));
        }
    }

    return storedPath;
};

module.exports = {
    uploadFiles,
    getFileInfo,
    normalizePath,
    deleteFileLocally,
    getAbsolutePath,
    getFileUrl
};