const express = require('express');
const sectionsController = require('./sections.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * Routes pour /api/sections
 * Toutes les routes sont protégées (nécessitent authentification)
 */

// Récupérer toutes les sections d'une page
// Query param: ?pageId=X
router.get('/', authMiddleware, sectionsController.getAll);

// Obtenir statistiques des sections d'une page
// Query param: ?pageId=X
router.get('/stats', authMiddleware, sectionsController.getStats);

// Créer une nouvelle section
// Body: { pageId, name }
router.post('/', authMiddleware, sectionsController.create);

// Réorganiser les sections (drag & drop)
// Body: { pageId, sectionIds: [] }
router.post('/reorder', authMiddleware, sectionsController.reorder);

// Inverser l'état collapsed d'une section
router.post('/:id/toggle-collapsed', authMiddleware, sectionsController.toggleCollapsed);

// Récupérer une section spécifique
router.get('/:id', authMiddleware, sectionsController.getOne);

// Mettre à jour une section
// Body: { name?, collapsed? }
router.put('/:id', authMiddleware, sectionsController.update);

// Supprimer une section
router.delete('/:id', authMiddleware, sectionsController.delete);

module.exports = router;
