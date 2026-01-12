const Bookmark = require('./bookmarks.model');
const faviconService = require('../../shared/services/faviconService');

/**
 * Bookmarks Service
 * Contient la business logic pour la gestion des bookmarks
 */
class BookmarksService {
  /**
   * Créer un nouveau bookmark avec validation
   * @param {string} userId - UUID du user
   * @param {string} groupId - UUID du group parent
   * @param {object} bookmarkData - { title, url, description?, favicon_url? }
   * @returns {Promise<object>} Bookmark créé
   * @throws {Error} Si validation échoue
   */
  async createBookmark(userId, groupId, bookmarkData) {
    const { title, url, description, favicon_url } = bookmarkData;

    // Validation: groupId requis
    if (!groupId || groupId.trim().length === 0) {
      throw new Error('Group ID is required');
    }

    // Validation: vérifier que le group existe et appartient au user (via section→page)
    const hasAccess = await Bookmark.verifyGroupOwnership(groupId, userId);
    if (!hasAccess) {
      throw new Error('Group not found or access denied');
    }

    // Validation: title requis
    if (!title || title.trim().length === 0) {
      throw new Error('Bookmark title is required');
    }

    // Validation: title max 200 caractères
    if (title.length > 200) {
      throw new Error('Bookmark title must be 200 characters or less');
    }

    // Validation: url requis
    if (!url || url.trim().length === 0) {
      throw new Error('Bookmark URL is required');
    }

    // Validation: URL format (basic check)
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url.trim())) {
      throw new Error('Invalid URL format. URL must start with http:// or https://');
    }

    // Validation: description max 500 caractères
    if (description && description.length > 500) {
      throw new Error('Description must be 500 characters or less');
    }

    // Validation: URL unique par group (optionnel - décommenter si besoin)
    // const existing = await Bookmark.findByUrl(groupId, url.trim());
    // if (existing) {
    //   throw new Error('A bookmark with this URL already exists in this group');
    // }

    // AUTO-FETCH FAVICON si pas fourni
    let finalFaviconUrl = favicon_url ? favicon_url.trim() : null;

    if (!finalFaviconUrl || finalFaviconUrl.length === 0) {
      try {
        console.log(`🔍 Auto-fetching favicon for: ${url.trim()}`);
        finalFaviconUrl = await faviconService.getFavicon(url.trim());
        console.log(`✅ Favicon fetched: ${finalFaviconUrl.substring(0, 100)}...`);
      } catch (error) {
        console.warn('⚠️ Favicon fetch failed, using default:', error.message);
        finalFaviconUrl = faviconService.getDefaultIcon();
      }
    }

    // Créer le bookmark
    const bookmark = await Bookmark.create(groupId, userId, {
      title: title.trim(),
      url: url.trim(),
      description: description ? description.trim() : null,
      favicon_url: finalFaviconUrl
    });

    return bookmark;
  }

  /**
   * Récupérer tous les bookmarks d'un group
   * @param {string} userId - UUID du user
   * @param {string} groupId - UUID du group
   * @returns {Promise<Array>} Liste des bookmarks
   * @throws {Error} Si group non trouvé ou pas owned par user
   */
  async getGroupBookmarks(userId, groupId) {
    // Vérifier que le group existe et appartient au user
    const hasAccess = await Bookmark.verifyGroupOwnership(groupId, userId);
    if (!hasAccess) {
      throw new Error('Group not found or access denied');
    }

    return Bookmark.findAllByGroup(groupId);
  }

  /**
   * Récupérer un bookmark par ID
   * @param {string} userId - UUID du user
   * @param {string} bookmarkId - UUID du bookmark
   * @returns {Promise<object>} Bookmark
   * @throws {Error} Si bookmark non trouvé ou pas owned par user
   */
  async getBookmarkById(userId, bookmarkId) {
    const bookmark = await Bookmark.findById(bookmarkId, userId);
    if (!bookmark) {
      throw new Error('Bookmark not found or access denied');
    }

    return bookmark;
  }

  /**
   * Mettre à jour un bookmark
   * @param {string} userId - UUID du user
   * @param {string} bookmarkId - UUID du bookmark
   * @param {object} updates - Champs à mettre à jour { title?, url?, description?, favicon_url? }
   * @returns {Promise<object>} Bookmark mis à jour
   * @throws {Error} Si validation échoue ou bookmark non trouvé
   */
  async updateBookmark(userId, bookmarkId, updates) {
    // Vérifier que le bookmark existe et appartient au user
    const existingBookmark = await Bookmark.findById(bookmarkId, userId);
    if (!existingBookmark) {
      throw new Error('Bookmark not found or access denied');
    }

    // Validation: title si présent
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim().length === 0) {
        throw new Error('Bookmark title cannot be empty');
      }
      if (updates.title.length > 200) {
        throw new Error('Bookmark title must be 200 characters or less');
      }
      updates.title = updates.title.trim();
    }

    // Validation: url si présent
    if (updates.url !== undefined) {
      if (!updates.url || updates.url.trim().length === 0) {
        throw new Error('Bookmark URL cannot be empty');
      }
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(updates.url.trim())) {
        throw new Error('Invalid URL format. URL must start with http:// or https://');
      }
      updates.url = updates.url.trim();
    }

    // Validation: description si présent
    if (updates.description !== undefined) {
      if (updates.description && updates.description.length > 500) {
        throw new Error('Description must be 500 characters or less');
      }
      updates.description = updates.description ? updates.description.trim() : null;
    }

    // Validation: favicon_url si présent
    if (updates.favicon_url !== undefined) {
      updates.favicon_url = updates.favicon_url ? updates.favicon_url.trim() : null;
    }

    // Validation: group_id si présent (pour déplacer bookmark vers autre group)
    if (updates.group_id !== undefined) {
      if (!updates.group_id || updates.group_id.trim().length === 0) {
        throw new Error('Group ID cannot be empty');
      }

      // Vérifier que le nouveau group existe et appartient au user
      const hasAccess = await Bookmark.verifyGroupOwnership(updates.group_id, userId);
      if (!hasAccess) {
        throw new Error('Target group not found or access denied');
      }

      updates.group_id = updates.group_id.trim();
    }

    // Mettre à jour
    const updatedBookmark = await Bookmark.update(bookmarkId, userId, updates);
    return updatedBookmark;
  }

  /**
   * Supprimer un bookmark
   * @param {string} userId - UUID du user
   * @param {string} bookmarkId - UUID du bookmark
   * @returns {Promise<boolean>} True si supprimé
   * @throws {Error} Si bookmark non trouvé ou pas owned par user
   */
  async deleteBookmark(userId, bookmarkId) {
    const deleted = await Bookmark.delete(bookmarkId, userId);
    if (!deleted) {
      throw new Error('Bookmark not found or access denied');
    }

    return true;
  }

  /**
   * Réorganiser les bookmarks d'un group (drag & drop)
   * @param {string} userId - UUID du user
   * @param {string} groupId - UUID du group
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Liste des bookmarks réorganisés
   * @throws {Error} Si validation échoue
   */
  async reorderBookmarks(userId, groupId, bookmarkIds) {
    // Vérifier que le group existe et appartient au user
    const hasAccess = await Bookmark.verifyGroupOwnership(groupId, userId);
    if (!hasAccess) {
      throw new Error('Group not found or access denied');
    }

    // Validation: bookmarkIds doit être un array non vide
    if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
      throw new Error('Bookmark IDs array is required and cannot be empty');
    }

    // Vérifier que tous les bookmarks appartiennent au group
    const groupBookmarks = await Bookmark.findAllByGroup(groupId);
    const groupBookmarkIds = groupBookmarks.map(b => b.id);

    for (const id of bookmarkIds) {
      if (!groupBookmarkIds.includes(id)) {
        throw new Error(`Bookmark ${id} does not belong to this group`);
      }
    }

    // Réorganiser
    const reorderedBookmarks = await Bookmark.reorderPositions(groupId, bookmarkIds);
    return reorderedBookmarks;
  }

  /**
   * Réorganiser les bookmarks d'une colonne spécifique (drag & drop)
   * @param {string} userId - UUID du user
   * @param {string} groupId - UUID du group
   * @param {number} columnNumber - Numéro de la colonne (1-based)
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Liste des bookmarks de cette colonne réorganisés
   * @throws {Error} Si validation échoue
   */
  async reorderColumn(userId, groupId, columnNumber, bookmarkIds) {
    // Vérifier que le group existe et appartient au user
    const hasAccess = await Bookmark.verifyGroupOwnership(groupId, userId);
    if (!hasAccess) {
      throw new Error('Group not found or access denied');
    }

    // Validation: columnNumber doit être un entier positif
    if (!Number.isInteger(columnNumber) || columnNumber < 1) {
      throw new Error('Column number must be a positive integer');
    }

    // Validation: bookmarkIds doit être un array non vide
    if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
      throw new Error('Bookmark IDs array is required and cannot be empty');
    }

    // Vérifier que tous les bookmarks appartiennent au group et à la bonne colonne
    const groupBookmarks = await Bookmark.findAllByGroup(groupId);
    const columnBookmarks = groupBookmarks.filter(b => b.column === columnNumber);
    const columnBookmarkIds = columnBookmarks.map(b => b.id);

    for (const id of bookmarkIds) {
      if (!columnBookmarkIds.includes(id)) {
        throw new Error(`Bookmark ${id} does not belong to column ${columnNumber} of this group`);
      }
    }

    // Réorganiser cette colonne
    const reorderedBookmarks = await Bookmark.reorderColumn(groupId, columnNumber, bookmarkIds);
    return reorderedBookmarks;
  }

  /**
   * Tracker un clic sur un bookmark (incrémenter visit_count)
   * @param {string} userId - UUID du user
   * @param {string} bookmarkId - UUID du bookmark
   * @returns {Promise<object>} Bookmark avec visit_count mis à jour
   * @throws {Error} Si bookmark non trouvé ou pas owned par user
   */
  async trackBookmarkClick(userId, bookmarkId) {
    // Vérifier que le bookmark existe et appartient au user
    const existingBookmark = await Bookmark.findById(bookmarkId, userId);
    if (!existingBookmark) {
      throw new Error('Bookmark not found or access denied');
    }

    // Incrémenter visit_count
    const updatedBookmark = await Bookmark.incrementVisitCount(bookmarkId);
    return updatedBookmark;
  }

  /**
   * Récupérer les bookmarks les plus utilisés d'un user
   * @param {string} userId - UUID du user
   * @param {number} limit - Nombre de bookmarks à retourner (default 10)
   * @returns {Promise<Array>} Top bookmarks triés par visit_count DESC
   */
  async getTopUsedBookmarks(userId, limit = 10) {
    // Validation: limit doit être positif
    if (limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }

    // Cap à 100 pour éviter surcharge
    const cappedLimit = Math.min(limit, 100);

    return Bookmark.getTopUsed(userId, cappedLimit);
  }

  /**
   * Forcer le refresh de la favicon d'un bookmark
   * Supprime le cache et re-fetch depuis les APIs
   * @param {string} userId - UUID du user
   * @param {string} bookmarkId - UUID du bookmark
   * @returns {Promise<object>} Bookmark avec nouvelle favicon
   * @throws {Error} Si bookmark non trouvé ou pas owned par user
   */
  async refreshBookmarkFavicon(userId, bookmarkId) {
    // Vérifier que le bookmark existe et appartient au user
    const existingBookmark = await Bookmark.findById(bookmarkId, userId);
    if (!existingBookmark) {
      throw new Error('Bookmark not found or access denied');
    }

    // Extraire le domain pour supprimer le cache
    const domain = faviconService.extractDomain(existingBookmark.url);
    if (domain) {
      // Supprimer le cache existant pour ce domain
      await faviconService.clearCache(domain);
    }

    // Re-fetch la favicon avec les nouvelles APIs haute-résolution
    let newFaviconUrl;
    try {
      console.log(`🔄 Refreshing favicon for: ${existingBookmark.url}`);
      newFaviconUrl = await faviconService.getFavicon(existingBookmark.url);
      console.log(`✅ New favicon fetched: ${newFaviconUrl.substring(0, 100)}...`);
    } catch (error) {
      console.warn('⚠️ Favicon refresh failed, using default:', error.message);
      newFaviconUrl = faviconService.getDefaultIcon();
    }

    // Mettre à jour le bookmark avec la nouvelle favicon
    const updatedBookmark = await Bookmark.update(bookmarkId, userId, {
      favicon_url: newFaviconUrl
    });

    return updatedBookmark;
  }

  /**
   * Récupérer les statistiques d'un group
   * @param {string} userId - UUID du user
   * @param {string} groupId - UUID du group
   * @returns {Promise<object>} Stats { total_bookmarks, total_visits, most_used }
   * @throws {Error} Si group non trouvé ou pas owned par user
   */
  async getGroupStats(userId, groupId) {
    // Vérifier que le group existe et appartient au user
    const hasAccess = await Bookmark.verifyGroupOwnership(groupId, userId);
    if (!hasAccess) {
      throw new Error('Group not found or access denied');
    }

    // Compter les bookmarks
    const totalBookmarks = await Bookmark.countByGroup(groupId);

    // Récupérer tous les bookmarks pour calculer stats
    const bookmarks = await Bookmark.findAllByGroup(groupId);

    // Calculer total des visites
    const totalVisits = bookmarks.reduce((sum, b) => sum + b.visit_count, 0);

    // Trouver le bookmark le plus utilisé
    const mostUsed = bookmarks.length > 0
      ? bookmarks.reduce((max, b) => b.visit_count > max.visit_count ? b : max, bookmarks[0])
      : null;

    return {
      total_bookmarks: totalBookmarks,
      total_visits: totalVisits,
      most_used: mostUsed,
      average_visits: totalBookmarks > 0 ? (totalVisits / totalBookmarks).toFixed(2) : 0
    };
  }
}

module.exports = new BookmarksService();
