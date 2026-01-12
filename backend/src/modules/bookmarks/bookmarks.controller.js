const bookmarksService = require('./bookmarks.service');
const faviconService = require('../../shared/services/faviconService');

/**
 * Bookmarks Controller
 * Gère les requêtes HTTP pour les bookmarks
 */
class BookmarksController {
  /**
   * GET /api/bookmarks?groupId=UUID
   * Récupérer tous les bookmarks d'un group
   */
  async getAll(req, res) {
    try {
      const userId = req.userId; // From auth middleware
      const { groupId } = req.query;

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
          timestamp: new Date().toISOString()
        });
      }

      const bookmarks = await bookmarksService.getGroupBookmarks(userId, groupId);

      res.status(200).json({
        success: true,
        data: bookmarks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in getAll bookmarks:', error);
      res.status(error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch bookmarks',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/bookmarks/:id
   * Récupérer un bookmark par ID
   */
  async getOne(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const bookmark = await bookmarksService.getBookmarkById(userId, id);

      res.status(200).json({
        success: true,
        data: bookmark,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in getOne bookmark:', error);
      res.status(error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch bookmark',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/bookmarks
   * Créer un nouveau bookmark
   * Body: { groupId, title, url, description?, favicon_url? }
   */
  async create(req, res) {
    try {
      const userId = req.userId;
      const { groupId, title, url, description, favicon_url } = req.body;

      const bookmark = await bookmarksService.createBookmark(userId, groupId, {
        title,
        url,
        description,
        favicon_url
      });

      res.status(201).json({
        success: true,
        data: bookmark,
        message: 'Bookmark created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in create bookmark:', error);
      const statusCode = error.message.includes('required') ||
        error.message.includes('Invalid') ||
        error.message.includes('must be') ? 400 :
        error.message.includes('not found') ||
          error.message.includes('access denied') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create bookmark',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * PUT /api/bookmarks/:id
   * Mettre à jour un bookmark
   * Body: { title?, url?, description?, favicon_url? }
   */
  async update(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const updates = req.body;

      const bookmark = await bookmarksService.updateBookmark(userId, id, updates);

      res.status(200).json({
        success: true,
        data: bookmark,
        message: 'Bookmark updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in update bookmark:', error);
      const statusCode = error.message.includes('cannot be empty') ||
        error.message.includes('Invalid') ||
        error.message.includes('must be') ? 400 :
        error.message.includes('not found') ||
          error.message.includes('access denied') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update bookmark',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * DELETE /api/bookmarks/:id
   * Supprimer un bookmark
   */
  async delete(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      await bookmarksService.deleteBookmark(userId, id);

      res.status(200).json({
        success: true,
        message: 'Bookmark deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in delete bookmark:', error);
      res.status(error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to delete bookmark',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/bookmarks/reorder
   * Réorganiser les bookmarks d'un group (drag & drop)
   * Body: { groupId, bookmarkIds: [uuid1, uuid2, ...] }
   */
  async reorder(req, res) {
    try {
      const userId = req.userId;
      const { groupId, bookmarkIds } = req.body;

      if (!groupId || !bookmarkIds) {
        return res.status(400).json({
          success: false,
          message: 'Group ID and bookmark IDs array are required',
          timestamp: new Date().toISOString()
        });
      }

      const bookmarks = await bookmarksService.reorderBookmarks(userId, groupId, bookmarkIds);

      res.status(200).json({
        success: true,
        data: bookmarks,
        message: 'Bookmarks reordered successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in reorder bookmarks:', error);
      const statusCode = error.message.includes('required') ||
        error.message.includes('cannot be empty') ||
        error.message.includes('does not belong') ? 400 :
        error.message.includes('not found') ||
          error.message.includes('access denied') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to reorder bookmarks',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/bookmarks/reorder-column
   * Réorganiser les bookmarks d'une colonne spécifique (drag & drop)
   * Body: { groupId, columnNumber, bookmarkIds: [uuid1, uuid2, ...] }
   */
  async reorderColumn(req, res) {
    try {
      const userId = req.userId;
      const { groupId, columnNumber, bookmarkIds } = req.body;

      if (!groupId || columnNumber === undefined || !bookmarkIds) {
        return res.status(400).json({
          success: false,
          message: 'Group ID, column number, and bookmark IDs array are required',
          timestamp: new Date().toISOString()
        });
      }

      const bookmarks = await bookmarksService.reorderColumn(userId, groupId, columnNumber, bookmarkIds);

      res.status(200).json({
        success: true,
        data: bookmarks,
        message: `Column ${columnNumber} reordered successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in reorder column:', error);
      const statusCode = error.message.includes('required') ||
        error.message.includes('cannot be empty') ||
        error.message.includes('must be') ||
        error.message.includes('does not belong') ? 400 :
        error.message.includes('not found') ||
          error.message.includes('access denied') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to reorder column',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/bookmarks/scan-site
   * Scan a website's HTML to find declared favicons
   * Body: { url }
   */
  async scanSite(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required',
          timestamp: new Date().toISOString()
        });
      }

      const icons = await faviconService.scanSiteForFavicons(url);

      res.status(200).json({
        success: true,
        data: icons,
        message: `Found ${icons.length} icons`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in scanSite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to scan site',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/bookmarks/:id/click
   * Tracker un clic sur un bookmark (incrémenter visit_count)
   */
  async trackClick(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const bookmark = await bookmarksService.trackBookmarkClick(userId, id);

      res.status(200).json({
        success: true,
        data: bookmark,
        message: 'Click tracked successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in trackClick bookmark:', error);
      res.status(error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to track click',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/bookmarks/top-used?limit=10
   * Récupérer les bookmarks les plus utilisés d'un user
   */
  async getTopUsed(req, res) {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit) || 10;

      const bookmarks = await bookmarksService.getTopUsedBookmarks(userId, limit);

      res.status(200).json({
        success: true,
        data: bookmarks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in getTopUsed bookmarks:', error);
      res.status(error.message.includes('must be greater than') ? 400 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch top used bookmarks',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/bookmarks/:id/refresh-favicon
   * Forcer le refresh de la favicon d'un bookmark
   */
  async refreshFavicon(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const bookmark = await bookmarksService.refreshBookmarkFavicon(userId, id);

      res.status(200).json({
        success: true,
        data: bookmark,
        message: 'Favicon refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in refreshFavicon bookmark:', error);
      res.status(error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to refresh favicon',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/bookmarks/stats?groupId=UUID
   * Récupérer les statistiques d'un group
   */
  async getStats(req, res) {
    try {
      const userId = req.userId;
      const { groupId } = req.query;

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: 'Group ID is required',
          timestamp: new Date().toISOString()
        });
      }

      const stats = await bookmarksService.getGroupStats(userId, groupId);

      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in getStats bookmarks:', error);
      res.status(error.message.includes('not found') || error.message.includes('access denied') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch bookmark stats',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new BookmarksController();
