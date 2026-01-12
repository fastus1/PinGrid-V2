const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const importController = require('./importController');

/**
 * Configure Multer for file upload
 * - Memory storage (file stored in memory as Buffer)
 * - Max file size: 5MB
 * - File type filter: text/html only
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only HTML files
    if (file.mimetype === 'text/html') {
      cb(null, true);
    } else {
      cb(new Error('Only HTML files are allowed'), false);
    }
  }
});

/**
 * POST /api/import/bookmarks
 *
 * Import bookmarks from HTML file (Chrome, Firefox, Safari)
 * - Requires authentication
 * - Accepts multipart/form-data with 'file' field
 * - File must be text/html, max 5MB
 * - Creates section + group + bookmarks
 * - Skips duplicates by URL
 * - Returns import statistics
 */
router.post(
  '/bookmarks',
  authMiddleware, // Protect route - requires JWT token
  upload.single('file'), // Handle file upload (field name: 'file')
  importController.importBookmarks
);

module.exports = router;
