const Page = require('./pages.model');

/**
 * Pages Service
 * Contient la business logic pour la gestion des pages
 */
class PagesService {
  /**
   * Créer une nouvelle page avec validation
   * @param {string} userId - UUID du user
   * @param {object} pageData - { name, icon?, color? }
   * @returns {Promise<object>} Page créée
   * @throws {Error} Si validation échoue
   */
  async createPage(userId, pageData) {
    const { name, icon, color } = pageData;

    // Validation: name requis
    if (!name || name.trim().length === 0) {
      throw new Error('Page name is required');
    }

    // Validation: name max 100 caractères
    if (name.length > 100) {
      throw new Error('Page name must be 100 characters or less');
    }

    // Validation: nom unique par user
    const existing = await Page.findByName(userId, name);
    if (existing) {
      throw new Error(`Page with name "${name}" already exists`);
    }

    // Validation: couleur hex valide (optionnel)
    if (color && !this.isValidHexColor(color)) {
      throw new Error('Invalid color format. Use hex format: #RRGGBB');
    }

    // Validation: icon max 50 caractères
    if (icon && icon.length > 50) {
      throw new Error('Icon must be 50 characters or less');
    }

    // Créer la page
    const page = await Page.create(userId, {
      name: name.trim(),
      icon: icon || '📄',
      color: color || '#667eea'
    });

    return page;
  }

  /**
   * Récupérer toutes les pages d'un user
   * @param {string} userId - UUID du user
   * @returns {Promise<Array>} Liste des pages
   */
  async getUserPages(userId) {
    return Page.findAllByUser(userId);
  }

  /**
   * Récupérer une page par ID
   * @param {string} pageId - UUID de la page
   * @param {string} userId - UUID du user
   * @returns {Promise<object>} Page
   * @throws {Error} Si page non trouvée ou pas owned par user
   */
  async getPageById(pageId, userId) {
    const page = await Page.findById(pageId, userId);

    if (!page) {
      throw new Error('Page not found or access denied');
    }

    return page;
  }

  /**
   * Mettre à jour une page avec validation
   * @param {string} pageId - UUID de la page
   * @param {string} userId - UUID du user
   * @param {object} updates - { name?, icon?, color? }
   * @returns {Promise<object>} Page mise à jour
   * @throws {Error} Si validation échoue ou page non trouvée
   */
  async updatePage(pageId, userId, updates) {
    const { name, icon, color } = updates;

    // Vérifier que la page existe et appartient au user
    const existing = await Page.findById(pageId, userId);
    if (!existing) {
      throw new Error('Page not found or access denied');
    }

    // Validation: name si fourni
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new Error('Page name cannot be empty');
      }

      if (name.length > 100) {
        throw new Error('Page name must be 100 characters or less');
      }

      // Vérifier unicité du nom (si différent du nom actuel)
      if (name.trim().toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await Page.findByName(userId, name);
        if (duplicate) {
          throw new Error(`Page with name "${name}" already exists`);
        }
      }
    }

    // Validation: couleur hex si fournie
    if (color !== undefined && !this.isValidHexColor(color)) {
      throw new Error('Invalid color format. Use hex format: #RRGGBB');
    }

    // Validation: icon si fourni
    if (icon !== undefined && icon.length > 50) {
      throw new Error('Icon must be 50 characters or less');
    }

    // Préparer les updates
    const validUpdates = {};
    if (name !== undefined) validUpdates.name = name.trim();
    if (icon !== undefined) validUpdates.icon = icon;
    if (color !== undefined) validUpdates.color = color;

    // Mettre à jour
    const updated = await Page.update(pageId, userId, validUpdates);

    if (!updated) {
      throw new Error('Failed to update page');
    }

    return updated;
  }

  /**
   * Supprimer une page
   * @param {string} pageId - UUID de la page
   * @param {string} userId - UUID du user
   * @returns {Promise<boolean>} True si supprimé
   * @throws {Error} Si page non trouvée
   */
  async deletePage(pageId, userId) {
    // Vérifier que la page existe et appartient au user
    const existing = await Page.findById(pageId, userId);
    if (!existing) {
      throw new Error('Page not found or access denied');
    }

    // TODO Itération 3: Gérer les sections/groups/bookmarks enfants
    // Pour l'instant, CASCADE supprimera automatiquement (à définir dans migrations futures)

    const deleted = await Page.delete(pageId, userId);

    if (!deleted) {
      throw new Error('Failed to delete page');
    }

    return true;
  }

  /**
   * Réorganiser les pages (drag & drop)
   * @param {string} userId - UUID du user
   * @param {Array<string>} pageIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Pages réordonnées
   * @throws {Error} Si validation échoue
   */
  async reorderPages(userId, pageIds) {
    // Validation: pageIds doit être un array
    if (!Array.isArray(pageIds)) {
      throw new Error('pageIds must be an array');
    }

    // Validation: pas d'IDs vides
    if (pageIds.some(id => !id || typeof id !== 'string')) {
      throw new Error('All pageIds must be valid strings');
    }

    // Validation: toutes les pages appartiennent au user
    const userPages = await Page.findAllByUser(userId);
    const userPageIds = userPages.map(p => p.id);

    // Vérifier que tous les IDs fournis appartiennent au user
    const invalidIds = pageIds.filter(id => !userPageIds.includes(id));
    if (invalidIds.length > 0) {
      throw new Error('Some pages do not belong to this user');
    }

    // Réorganiser
    const reordered = await Page.reorderPositions(userId, pageIds);

    return reordered;
  }

  /**
   * Obtenir des statistiques sur les pages d'un user
   * @param {string} userId - UUID du user
   * @returns {Promise<object>} Statistiques
   */
  async getUserPagesStats(userId) {
    const pages = await Page.findAllByUser(userId);

    return {
      total: pages.length,
      pages: pages.map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        created_at: p.created_at
        // TODO Itération 3+: Ajouter counts sections/groups/bookmarks
      }))
    };
  }

  /**
   * Valider format couleur hex
   * @param {string} color - Couleur à valider
   * @returns {boolean} True si valide
   * @private
   */
  isValidHexColor(color) {
    // Format: #RRGGBB (7 caractères)
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(color);
  }
}

module.exports = new PagesService();
