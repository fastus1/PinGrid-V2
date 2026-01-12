const express = require('express');
const groupsController = require('./groups.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * Routes pour /api/groups
 * Toutes les routes sont protégées (nécessitent authentification)
 */

// Récupérer tous les groups d'une section
// Query param: ?sectionId=X
router.get('/', authMiddleware, groupsController.getAll);

// Obtenir statistiques des groups d'une section
// Query param: ?sectionId=X
router.get('/stats', authMiddleware, groupsController.getStats);

// Créer un nouveau group
// Body: { sectionId, name, column_count?, group_type?, bookmark_limit? }
router.post('/', authMiddleware, groupsController.create);

// Réorganiser les groups (drag & drop)
// Body: { sectionId, groupIds: [] }
router.post('/reorder', authMiddleware, groupsController.reorder);

// Mettre à jour le layout (column_count) d'un group
// Body: { column_count }
router.patch('/:id/layout', authMiddleware, groupsController.updateLayout);

// Dupliquer un group avec tous ses bookmarks
router.post('/:id/duplicate', authMiddleware, groupsController.duplicate);

// Récupérer un group spécifique
router.get('/:id', authMiddleware, groupsController.getOne);

// Mettre à jour un group
// Body: { name?, column_count?, bookmark_limit? }
router.put('/:id', authMiddleware, groupsController.update);

// Supprimer un group
router.delete('/:id', authMiddleware, groupsController.delete);

module.exports = router;
