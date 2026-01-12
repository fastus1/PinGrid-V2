const express = require('express');
const pagesController = require('./pages.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * Routes pour /api/pages
 * Toutes les routes sont protégées (nécessitent authentification)
 */

// Récupérer toutes les pages du user
router.get('/', authMiddleware, pagesController.getAll);

// Obtenir statistiques
router.get('/stats', authMiddleware, pagesController.getStats);

// Créer une nouvelle page
router.post('/', authMiddleware, pagesController.create);

// Réorganiser les pages (drag & drop)
router.post('/reorder', authMiddleware, pagesController.reorder);

// Récupérer une page spécifique
router.get('/:id', authMiddleware, pagesController.getOne);

// Mettre à jour une page
router.put('/:id', authMiddleware, pagesController.update);

// Supprimer une page
router.delete('/:id', authMiddleware, pagesController.delete);

module.exports = router;
