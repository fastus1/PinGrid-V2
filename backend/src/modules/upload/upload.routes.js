const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('./upload.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

// Configure multer for memory storage (processing with Sharp)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Routes
router.post('/favicon', authMiddleware, upload.single('favicon'), uploadController.uploadFavicon);

module.exports = router;
