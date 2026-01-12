const importService = require('./importService');

/**
 * ImportController
 *
 * Handles HTTP requests for bookmark imports
 */
class ImportController {
  /**
   * Import bookmarks from HTML file
   * POST /api/import/bookmarks
   *
   * @param {Express.Request} req - Request with file upload (multipart/form-data)
   * @param {Express.Response} res - Response
   */
  async importBookmarks(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const file = req.file; // From multer middleware

      // Validation: file is required
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'HTML file is required. Please upload a bookmarks HTML file.',
          timestamp: new Date().toISOString()
        });
      }

      // Validation: check file type (should be text/html)
      if (file.mimetype !== 'text/html') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only HTML files are accepted.',
          timestamp: new Date().toISOString()
        });
      }

      // Convert buffer to string
      const htmlContent = file.buffer.toString('utf-8');

      // Validate HTML content is not empty
      if (!htmlContent || htmlContent.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'HTML file is empty.',
          timestamp: new Date().toISOString()
        });
      }

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📥 Import request from user: ${userId}`);
      console.log(`📄 File: ${file.originalname} (${file.size} bytes)`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Import bookmarks
      const result = await importService.importBookmarks(userId, htmlContent);

      // Success response
      return res.status(201).json({
        success: true,
        message: `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`,
        data: {
          section: {
            id: result.section.id,
            name: result.section.name,
            page_id: result.section.page_id
          },
          group: {
            id: result.group.id,
            name: result.group.name,
            section_id: result.group.section_id
          },
          imported: result.imported,
          skipped: result.skipped,
          failed: result.failed,
          total: result.imported + result.skipped + result.failed
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in importBookmarks controller:', error);

      // Determine appropriate status code
      let statusCode = 500;
      if (error.message.includes('No pages found')) {
        statusCode = 400;
      } else if (error.message.includes('parse') || error.message.includes('No bookmarks found')) {
        statusCode = 400;
      }

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to import bookmarks',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Export instance
module.exports = new ImportController();
