const sectionsService = require('./sections.service');

/**
 * Sections Controller
 * Gère les requêtes HTTP pour les endpoints /api/sections
 */
class SectionsController {
  /**
   * GET /api/sections?pageId=X
   * Récupérer toutes les sections d'une page
   */
  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const { pageId } = req.query;

      // Validation: pageId requis
      if (!pageId) {
        return res.status(400).json({
          success: false,
          error: 'pageId query parameter is required'
        });
      }

      const sections = await sectionsService.getPageSections(userId, pageId);

      res.json({
        success: true,
        data: {
          sections,
          count: sections.length
        }
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
   * GET /api/sections/:id
   * Récupérer une section spécifique
   */
  async getOne(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Section ID is required'
        });
      }

      const section = await sectionsService.getSectionById(id, userId);

      res.json({
        success: true,
        data: { section }
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
   * POST /api/sections
   * Créer une nouvelle section
   * Body: { pageId, name }
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { pageId, name } = req.body;

      // Validation basique
      if (!pageId) {
        return res.status(400).json({
          success: false,
          error: 'pageId is required'
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Section name is required'
        });
      }

      const section = await sectionsService.createSection(userId, pageId, {
        name
      });

      res.status(201).json({
        success: true,
        message: 'Section created successfully',
        data: { section }
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/sections/:id
   * Mettre à jour une section existante
   * Body: { name?, collapsed? }
   */
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, collapsed } = req.body;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Section ID is required'
        });
      }

      // Validation: au moins un champ à mettre à jour
      if (name === undefined && collapsed === undefined) {
        return res.status(400).json({
          success: false,
          error: 'At least one field (name, collapsed) must be provided'
        });
      }

      const section = await sectionsService.updateSection(id, userId, {
        name,
        collapsed
      });

      res.json({
        success: true,
        message: 'Section updated successfully',
        data: { section }
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
      if (error.message.includes('cannot be') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/sections/:id
   * Supprimer une section
   */
  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Section ID is required'
        });
      }

      await sectionsService.deleteSection(id, userId);

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
   * POST /api/sections/reorder
   * Réorganiser l'ordre des sections (drag & drop)
   * Body: { pageId, sectionIds: [uuid1, uuid2, uuid3] }
   */
  async reorder(req, res, next) {
    try {
      const userId = req.user.id;
      const { pageId, sectionIds } = req.body;

      // Validation: pageId requis
      if (!pageId) {
        return res.status(400).json({
          success: false,
          error: 'pageId is required'
        });
      }

      // Validation: sectionIds requis et doit être un array
      if (!sectionIds || !Array.isArray(sectionIds)) {
        return res.status(400).json({
          success: false,
          error: 'sectionIds must be an array of section IDs'
        });
      }

      // Validation: array non vide
      if (sectionIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'sectionIds array cannot be empty'
        });
      }

      const sections = await sectionsService.reorderSections(userId, pageId, sectionIds);

      res.json({
        success: true,
        message: 'Sections reordered successfully',
        data: { sections }
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
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
   * POST /api/sections/:id/toggle-collapsed
   * Inverser l'état collapsed d'une section
   */
  async toggleCollapsed(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Section ID is required'
        });
      }

      const section = await sectionsService.toggleSectionCollapsed(id, userId);

      res.json({
        success: true,
        message: 'Section collapsed state toggled successfully',
        data: { section }
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
   * GET /api/sections/stats?pageId=X
   * Obtenir des statistiques sur les sections d'une page
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { pageId } = req.query;

      // Validation: pageId requis
      if (!pageId) {
        return res.status(400).json({
          success: false,
          error: 'pageId query parameter is required'
        });
      }

      const stats = await sectionsService.getPageSectionsStats(userId, pageId);

      res.json({
        success: true,
        data: stats
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
}

module.exports = new SectionsController();
