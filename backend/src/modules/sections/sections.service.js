const Section = require('./sections.model');
const Page = require('../pages/pages.model');

/**
 * Sections Service
 * Contient la business logic pour la gestion des sections
 */
class SectionsService {
  /**
   * Créer une nouvelle section avec validation
   * @param {string} userId - UUID du user
   * @param {string} pageId - UUID de la page parente
   * @param {object} sectionData - { name }
   * @returns {Promise<object>} Section créée
   * @throws {Error} Si validation échoue
   */
  async createSection(userId, pageId, sectionData) {
    const { name } = sectionData;

    // Validation: pageId requis
    if (!pageId || pageId.trim().length === 0) {
      throw new Error('Page ID is required');
    }

    // Validation: vérifier que la page existe et appartient au user
    const page = await Page.findById(pageId, userId);
    if (!page) {
      throw new Error('Page not found or access denied');
    }

    // Validation: name requis
    if (!name || name.trim().length === 0) {
      throw new Error('Section name is required');
    }

    // Validation: name max 100 caractères
    if (name.length > 100) {
      throw new Error('Section name must be 100 characters or less');
    }

    // Validation: nom unique par page
    const existing = await Section.findByName(pageId, name);
    if (existing) {
      throw new Error(`Section with name "${name}" already exists in this page`);
    }

    // Créer la section
    const section = await Section.create(pageId, {
      name: name.trim()
    });

    return section;
  }

  /**
   * Récupérer toutes les sections d'une page
   * @param {string} userId - UUID du user
   * @param {string} pageId - UUID de la page
   * @returns {Promise<Array>} Liste des sections
   * @throws {Error} Si page non trouvée ou pas owned par user
   */
  async getPageSections(userId, pageId) {
    // Vérifier que la page existe et appartient au user
    const page = await Page.findById(pageId, userId);
    if (!page) {
      throw new Error('Page not found or access denied');
    }

    return Section.findAllByPage(pageId);
  }

  /**
   * Récupérer une section par ID
   * @param {string} sectionId - UUID de la section
   * @param {string} userId - UUID du user
   * @returns {Promise<object>} Section
   * @throws {Error} Si section non trouvée ou pas owned par user
   */
  async getSectionById(sectionId, userId) {
    const section = await Section.findById(sectionId, userId);

    if (!section) {
      throw new Error('Section not found or access denied');
    }

    return section;
  }

  /**
   * Mettre à jour une section avec validation
   * @param {string} sectionId - UUID de la section
   * @param {string} userId - UUID du user
   * @param {object} updates - { name?, collapsed? }
   * @returns {Promise<object>} Section mise à jour
   * @throws {Error} Si validation échoue ou section non trouvée
   */
  async updateSection(sectionId, userId, updates) {
    const { name, collapsed } = updates;

    // Vérifier que la section existe et appartient au user (via page)
    const existing = await Section.findById(sectionId, userId);
    if (!existing) {
      throw new Error('Section not found or access denied');
    }

    // Validation: name si fourni
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new Error('Section name cannot be empty');
      }

      if (name.length > 100) {
        throw new Error('Section name must be 100 characters or less');
      }

      // Vérifier unicité du nom dans la page (si différent du nom actuel)
      if (name.trim().toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await Section.findByName(existing.page_id, name);
        if (duplicate) {
          throw new Error(`Section with name "${name}" already exists in this page`);
        }
      }
    }

    // Validation: collapsed si fourni
    if (collapsed !== undefined && typeof collapsed !== 'boolean') {
      throw new Error('Collapsed must be a boolean value');
    }

    // Préparer les updates
    const validUpdates = {};
    if (name !== undefined) validUpdates.name = name.trim();
    if (collapsed !== undefined) validUpdates.collapsed = collapsed;

    // Si aucun update, retourner la section existante
    if (Object.keys(validUpdates).length === 0) {
      return existing;
    }

    // Mettre à jour
    const updated = await Section.update(sectionId, userId, validUpdates);

    if (!updated) {
      throw new Error('Failed to update section');
    }

    return updated;
  }

  /**
   * Supprimer une section
   * @param {string} sectionId - UUID de la section
   * @param {string} userId - UUID du user
   * @returns {Promise<boolean>} True si supprimé
   * @throws {Error} Si section non trouvée
   */
  async deleteSection(sectionId, userId) {
    // Vérifier que la section existe et appartient au user
    const existing = await Section.findById(sectionId, userId);
    if (!existing) {
      throw new Error('Section not found or access denied');
    }

    // TODO Itération 4: Gérer les groups/bookmarks enfants
    // Pour l'instant, CASCADE supprimera automatiquement (à définir dans migrations futures)

    const deleted = await Section.delete(sectionId, userId);

    if (!deleted) {
      throw new Error('Failed to delete section');
    }

    return true;
  }

  /**
   * Réorganiser les sections d'une page (drag & drop)
   * @param {string} userId - UUID du user
   * @param {string} pageId - UUID de la page
   * @param {Array<string>} sectionIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Sections réordonnées
   * @throws {Error} Si validation échoue
   */
  async reorderSections(userId, pageId, sectionIds) {
    // Validation: pageId requis
    if (!pageId || pageId.trim().length === 0) {
      throw new Error('Page ID is required');
    }

    // Validation: vérifier que la page existe et appartient au user
    const page = await Page.findById(pageId, userId);
    if (!page) {
      throw new Error('Page not found or access denied');
    }

    // Validation: sectionIds doit être un array
    if (!Array.isArray(sectionIds)) {
      throw new Error('sectionIds must be an array');
    }

    // Validation: pas d'IDs vides
    if (sectionIds.some(id => !id || typeof id !== 'string')) {
      throw new Error('All sectionIds must be valid strings');
    }

    // Validation: toutes les sections appartiennent à cette page
    const pageSections = await Section.findAllByPage(pageId);
    const pageSectionIds = pageSections.map(s => s.id);

    // Vérifier que tous les IDs fournis appartiennent à cette page
    const invalidIds = sectionIds.filter(id => !pageSectionIds.includes(id));
    if (invalidIds.length > 0) {
      throw new Error('Some sections do not belong to this page');
    }

    // Réorganiser
    const reordered = await Section.reorderPositions(pageId, sectionIds);

    return reordered;
  }

  /**
   * Inverser l'état collapsed d'une section (replier/déplier)
   * @param {string} sectionId - UUID de la section
   * @param {string} userId - UUID du user
   * @returns {Promise<object>} Section mise à jour
   * @throws {Error} Si section non trouvée
   */
  async toggleSectionCollapsed(sectionId, userId) {
    // Vérifier que la section existe et appartient au user
    const existing = await Section.findById(sectionId, userId);
    if (!existing) {
      throw new Error('Section not found or access denied');
    }

    // Toggle collapsed
    const updated = await Section.toggleCollapsed(sectionId, userId);

    if (!updated) {
      throw new Error('Failed to toggle section collapsed state');
    }

    return updated;
  }

  /**
   * Obtenir des statistiques sur les sections d'une page
   * @param {string} userId - UUID du user
   * @param {string} pageId - UUID de la page
   * @returns {Promise<object>} Statistiques
   * @throws {Error} Si page non trouvée
   */
  async getPageSectionsStats(userId, pageId) {
    // Vérifier que la page existe et appartient au user
    const page = await Page.findById(pageId, userId);
    if (!page) {
      throw new Error('Page not found or access denied');
    }

    const sections = await Section.findAllByPage(pageId);

    return {
      total: sections.length,
      collapsed_count: sections.filter(s => s.collapsed).length,
      expanded_count: sections.filter(s => !s.collapsed).length,
      sections: sections.map(s => ({
        id: s.id,
        name: s.name,
        position: s.position,
        collapsed: s.collapsed,
        created_at: s.created_at
        // TODO Itération 4+: Ajouter counts groups/bookmarks
      }))
    };
  }
}

module.exports = new SectionsService();
