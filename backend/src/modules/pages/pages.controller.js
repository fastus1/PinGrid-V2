const pagesService = require('./pages.service');

/**
 * Pages Controller
 * Gère les requêtes HTTP pour les endpoints /api/pages
 */
class PagesController {
  /**
   * GET /api/pages
   * Récupérer toutes les pages du user connecté
   */
  async getAll(req, res, next) {
    try {
      const userId = req.user.id;

      const pages = await pagesService.getUserPages(userId);

      res.json({
        success: true,
        data: {
          pages,
          count: pages.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pages/:id
   * Récupérer une page spécifique
   */
  async getOne(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Page ID is required'
        });
      }

      const page = await pagesService.getPageById(id, userId);

      res.json({
        success: true,
        data: { page }
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/pages
   * Créer une nouvelle page
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, icon, color } = req.body;

      // Validation basique
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Page name is required'
        });
      }

      const page = await pagesService.createPage(userId, {
        name,
        icon,
        color
      });

      res.status(201).json({
        success: true,
        message: 'Page created successfully',
        data: { page }
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/pages/:id
   * Mettre à jour une page existante
   */
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, icon, color } = req.body;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Page ID is required'
        });
      }

      // Validation: au moins un champ à mettre à jour
      if (name === undefined && icon === undefined && color === undefined) {
        return res.status(400).json({
          success: false,
          error: 'At least one field (name, icon, color) must be provided'
        });
      }

      const page = await pagesService.updatePage(id, userId, {
        name,
        icon,
        color
      });

      res.json({
        success: true,
        message: 'Page updated successfully',
        data: { page }
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('Invalid') || error.message.includes('cannot be') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/pages/:id
   * Supprimer une page
   */
  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Page ID is required'
        });
      }

      await pagesService.deletePage(id, userId);

      res.status(204).send(); // No content
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/pages/reorder
   * Réorganiser l'ordre des pages (drag & drop)
   * Body: { pageIds: [uuid1, uuid2, uuid3] }
   */
  async reorder(req, res, next) {
    try {
      const userId = req.user.id;
      const { pageIds } = req.body;

      // Validation: pageIds requis et doit être un array
      if (!pageIds || !Array.isArray(pageIds)) {
        return res.status(400).json({
          success: false,
          error: 'pageIds must be an array of page IDs'
        });
      }

      // Validation: array non vide
      if (pageIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'pageIds array cannot be empty'
        });
      }

      const pages = await pagesService.reorderPages(userId, pageIds);

      res.json({
        success: true,
        message: 'Pages reordered successfully',
        data: { pages }
      });
    } catch (error) {
      if (error.message.includes('must be') || error.message.includes('do not belong')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/pages/stats
   * Obtenir des statistiques sur les pages du user
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await pagesService.getUserPagesStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PagesController();
