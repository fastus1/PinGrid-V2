const express = require('express');
const router = express.Router();
const bookmarksController = require('./bookmarks.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

/**
 * Bookmarks Routes
 * All routes require authentication (JWT token)
 */

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/bookmarks?groupId=UUID
 * Récupérer tous les bookmarks d'un group
 */
router.get('/', bookmarksController.getAll);

/**
 * GET /api/bookmarks/top-used?limit=10
 * Récupérer les bookmarks les plus utilisés
 * NOTE: Must be BEFORE /:id route to avoid matching "top-used" as an ID
 */
router.get('/top-used', bookmarksController.getTopUsed);

/**
 * GET /api/bookmarks/stats?groupId=UUID
 * Récupérer les statistiques d'un group
 * NOTE: Must be BEFORE /:id route to avoid matching "stats" as an ID
 */
router.get('/stats', bookmarksController.getStats);

/**
 * GET /api/bookmarks/:id
 * Récupérer un bookmark par ID
 */
router.get('/:id', bookmarksController.getOne);

/**
 * POST /api/bookmarks
 * Créer un nouveau bookmark
 * Body: { groupId, title, url, description?, favicon_url? }
 */
router.post('/', bookmarksController.create);

/**
 * POST /api/bookmarks/reorder
 * Réorganiser les bookmarks d'un group (drag & drop)
 * Body: { groupId, bookmarkIds: [uuid1, uuid2, ...] }
 */
router.post('/reorder', bookmarksController.reorder);

/**
 * POST /api/bookmarks/reorder-column
 * Réorganiser les bookmarks d'une colonne spécifique (drag & drop)
 * Body: { groupId, columnNumber, bookmarkIds: [uuid1, uuid2, ...] }
 */
router.post('/reorder-column', bookmarksController.reorderColumn);

/**
 * POST /api/bookmarks/scan-site
 * Scan a website's HTML to find declared favicons
 * Body: { url }
 */
router.post('/scan-site', bookmarksController.scanSite);

/**
 * POST /api/bookmarks/:id/click
 * Tracker un clic sur un bookmark
 */
router.post('/:id/click', bookmarksController.trackClick);

/**
 * POST /api/bookmarks/:id/refresh-favicon
 * Forcer le refresh de la favicon d'un bookmark
 */
router.post('/:id/refresh-favicon', bookmarksController.refreshFavicon);

/**
 * PUT /api/bookmarks/:id
 * Mettre à jour un bookmark
 * Body: { title?, url?, description?, favicon_url? }
 */
router.put('/:id', bookmarksController.update);

/**
 * DELETE /api/bookmarks/:id
 * Supprimer un bookmark
 */
router.delete('/:id', bookmarksController.delete);

module.exports = router;
