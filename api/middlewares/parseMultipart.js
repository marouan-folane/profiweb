// middlewares/parseMultipart.js
const multer = require('multer');
const AppError = require('../utils/AppError');

const parseMultipart = (req, res, next) => {
    // If it's a multipart form, multer will handle it
    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
        // Multer already processes this, but we need to ensure fields are parsed
        // This is handled by the multer middleware in your routes
        console.log("Multipart form detected");
    }
    
    // Try to manually parse if needed (as fallback)
    if (!req.body || Object.keys(req.body).length === 0) {
        console.log("Warning: req.body is empty for multipart form");
        
        // For debugging: log what multer might have parsed
        if (req.fields) {
            console.log("Fields from multer:", req.fields);
        }
    }
    
    next();
};

module.exports = parseMultipart;