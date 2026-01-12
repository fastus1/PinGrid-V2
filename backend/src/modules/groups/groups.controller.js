const groupsService = require('./groups.service');

/**
 * Groups Controller
 * Gère les requêtes HTTP pour les endpoints /api/groups
 */
class GroupsController {
  /**
   * GET /api/groups?sectionId=X
   * Récupérer tous les groups d'une section
   */
  async getAll(req, res, next) {
    try {
      const userId = req.user.id;
      const { sectionId } = req.query;

      // Validation: sectionId requis
      if (!sectionId) {
        return res.status(400).json({
          success: false,
          error: 'sectionId query parameter is required'
        });
      }

      const groups = await groupsService.getSectionGroups(userId, sectionId);

      res.json({
        success: true,
        data: {
          groups,
          count: groups.length
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
   * GET /api/groups/:id
   * Récupérer un group spécifique
   */
  async getOne(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Group ID is required'
        });
      }

      const group = await groupsService.getGroupById(id, userId);

      res.json({
        success: true,
        data: { group }
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
   * POST /api/groups
   * Créer un nouveau group
   * Body: { sectionId, name, column_count?, group_type?, bookmark_limit? }
   */
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const { sectionId, name, column_count, group_type, bookmark_limit, width } = req.body;

      // Validation basique
      if (!sectionId) {
        return res.status(400).json({
          success: false,
          error: 'sectionId is required'
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Group name is required'
        });
      }

      const group = await groupsService.createGroup(userId, sectionId, {
        name,
        column_count,
        group_type,
        bookmark_limit,
        width
      });

      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: { group }
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
   * PUT /api/groups/:id
   * Mettre à jour un group existant
   * Body: { name?, column_count?, bookmark_limit? }
   */
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, column_count, bookmark_limit, width, section_id } = req.body;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Group ID is required'
        });
      }

      // Validation: au moins un champ à mettre à jour
      if (name === undefined && column_count === undefined && bookmark_limit === undefined && width === undefined && section_id === undefined) {
        return res.status(400).json({
          success: false,
          error: 'At least one field (name, column_count, bookmark_limit, width, section_id) must be provided'
        });
      }

      const group = await groupsService.updateGroup(id, userId, {
        name,
        column_count,
        bookmark_limit,
        width,
        section_id
      });

      res.json({
        success: true,
        message: 'Group updated successfully',
        data: { group }
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
      if (error.message.includes('cannot be') || error.message.includes('must be') || error.message.includes('should not')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/groups/:id
   * Supprimer un group
   */
  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Group ID is required'
        });
      }

      await groupsService.deleteGroup(id, userId);

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
   * POST /api/groups/reorder
   * Réorganiser l'ordre des groups (drag & drop)
   * Body: { sectionId, groupIds: [uuid1, uuid2, uuid3] }
   */
  async reorder(req, res, next) {
    try {
      const userId = req.user.id;
      const { sectionId, groupIds } = req.body;

      // Validation: sectionId requis
      if (!sectionId) {
        return res.status(400).json({
          success: false,
          error: 'sectionId is required'
        });
      }

      // Validation: groupIds requis et doit être un array
      if (!groupIds || !Array.isArray(groupIds)) {
        return res.status(400).json({
          success: false,
          error: 'groupIds must be an array of group IDs'
        });
      }

      // Validation: array non vide
      if (groupIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'groupIds array cannot be empty'
        });
      }

      const groups = await groupsService.reorderGroups(userId, sectionId, groupIds);

      res.json({
        success: true,
        message: 'Groups reordered successfully',
        data: { groups }
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
   * PATCH /api/groups/:id/layout
   * Mettre à jour le column_count d'un group
   * Body: { column_count }
   */
  async updateLayout(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { column_count } = req.body;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Group ID is required'
        });
      }

      // Validation: column_count requis
      if (column_count === undefined) {
        return res.status(400).json({
          success: false,
          error: 'column_count is required'
        });
      }

      // Validation: column_count doit être un nombre
      if (typeof column_count !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'column_count must be a number'
        });
      }

      const group = await groupsService.updateGroupLayout(id, userId, column_count);

      res.json({
        success: true,
        message: 'Group layout updated successfully',
        data: { group }
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/groups/stats?sectionId=X
   * Obtenir des statistiques sur les groups d'une section
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { sectionId } = req.query;

      // Validation: sectionId requis
      if (!sectionId) {
        return res.status(400).json({
          success: false,
          error: 'sectionId query parameter is required'
        });
      }

      const stats = await groupsService.getSectionGroupsStats(userId, sectionId);

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

  /**
   * POST /api/groups/:id/duplicate
   * Dupliquer un group avec tous ses bookmarks
   */
  async duplicate(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validation: ID requis
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Group ID is required'
        });
      }

      const group = await groupsService.duplicateGroup(id, userId);

      res.status(201).json({
        success: true,
        message: 'Group duplicated successfully',
        data: { group }
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

module.exports = new GroupsController();
