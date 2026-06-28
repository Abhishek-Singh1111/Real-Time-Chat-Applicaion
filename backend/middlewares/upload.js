const multer = require('multer');
// Allowed file types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
     // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',   // .mov
    'video/x-msvideo',   // .avi
    'video/x-matroska' 
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // Check file type
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1 // Maximum 1 file per request
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Only one file is allowed'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next(err);
};

module.exports = {
    upload,
    handleMulterError,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE
};