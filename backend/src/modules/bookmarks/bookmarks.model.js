const pool = require('../../shared/config/database');

/**
 * Bookmarks Model
 * Gère les opérations CRUD pour la table bookmarks
 * Bookmarks = Niveau 4 de la hiérarchie (Page → Section → Group → Bookmark)
 */
class Bookmark {
  /**
   * Vérifier que le group appartient au user (via section → page)
   * @param {string} groupId - UUID du group
   * @param {string} userId - UUID du user
   * @returns {Promise<boolean>} True si le group appartient au user
   */
  static async verifyGroupOwnership(groupId, userId) {
    const result = await pool.query(
      `SELECT g.id
       FROM groups g
       INNER JOIN sections s ON g.section_id = s.id
       INNER JOIN pages p ON s.page_id = p.id
       WHERE g.id = $1 AND p.user_id = $2`,
      [groupId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Créer un nouveau bookmark
   * @param {string} groupId - UUID du group parent
   * @param {string} userId - UUID du user propriétaire
   * @param {object} bookmarkData - { title, url, description?, favicon_url?, column? }
   * @returns {Promise<object>} Bookmark créé
   */
  static async create(groupId, userId, bookmarkData) {
    const {
      title,
      url,
      description = null,
      favicon_url = null,
      column = 1  // Default to column 1 if not specified
    } = bookmarkData;

    // Calculer la position automatiquement dans cette colonne (max + 1)
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM bookmarks WHERE group_id = $1 AND "column" = $2',
      [groupId, column]
    );
    const position = positionResult.rows[0].next_position;

    const result = await pool.query(
      `INSERT INTO bookmarks (group_id, user_id, title, url, description, position, "column", favicon_url, visit_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
       RETURNING id, group_id, user_id, title, url, description, position, "column", visit_count, favicon_url, created_at, updated_at`,
      [groupId, userId, title, url, description, position, column, favicon_url]
    );

    return result.rows[0];
  }

  /**
   * Récupérer tous les bookmarks d'un group
   * @param {string} groupId - UUID du group
   * @returns {Promise<Array>} Liste des bookmarks triés par colonne puis position
   */
  static async findAllByGroup(groupId) {
    const result = await pool.query(
      `SELECT id, group_id, user_id, title, url, description, position, "column", visit_count, favicon_url, created_at, updated_at
       FROM bookmarks
       WHERE group_id = $1
       ORDER BY "column" ASC, position ASC`,
      [groupId]
    );

    return result.rows;
  }

  /**
   * Récupérer un bookmark par ID
   * @param {string} id - UUID du bookmark
   * @param {string} userId - UUID du user (pour vérification ownership via group→section→page)
   * @returns {Promise<object|null>} Bookmark ou null si non trouvé ou pas d'accès
   */
  static async findById(id, userId) {
    const result = await pool.query(
      `SELECT b.id, b.group_id, b.user_id, b.title, b.url, b.description, b.position, b."column", b.visit_count, b.favicon_url, b.created_at, b.updated_at
       FROM bookmarks b
       INNER JOIN groups g ON b.group_id = g.id
       INNER JOIN sections s ON g.section_id = s.id
       INNER JOIN pages p ON s.page_id = p.id
       WHERE b.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Trouver un bookmark par URL dans un group spécifique (pour vérifier doublons)
   * @param {string} groupId - UUID du group
   * @param {string} url - URL du bookmark
   * @returns {Promise<object|null>} Bookmark existant ou null
   */
  static async findByUrl(groupId, url) {
    const result = await pool.query(
      `SELECT id, group_id, user_id, title, url, description, position, "column", visit_count, favicon_url, created_at, updated_at
       FROM bookmarks
       WHERE group_id = $1 AND url = $2`,
      [groupId, url]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Mettre à jour un bookmark
   * @param {string} id - UUID du bookmark
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @param {object} updates - Champs à mettre à jour { title?, url?, description?, favicon_url? }
   * @returns {Promise<object|null>} Bookmark mis à jour ou null si non trouvé
   */
  static async update(id, userId, updates) {
    // Récupérer le bookmark actuel pour vérifier ownership
    const existingBookmark = await this.findById(id, userId);
    if (!existingBookmark) {
      return null;
    }

    // Construire la requête UPDATE dynamiquement
    const allowedFields = ['title', 'url', 'description', 'favicon_url', 'group_id', 'column', 'position'];
    const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return existingBookmark; // Aucun champ à mettre à jour
    }

    const setClause = fieldsToUpdate.map((field, index) => `"${field}" = $${index + 2}`).join(', ');
    const values = [id, ...fieldsToUpdate.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE bookmarks
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, group_id, user_id, title, url, description, position, "column", visit_count, favicon_url, created_at, updated_at`,
      values
    );

    return result.rows[0];
  }

  /**
   * Supprimer un bookmark
   * @param {string} id - UUID du bookmark
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @returns {Promise<boolean>} True si supprimé, false si non trouvé
   */
  static async delete(id, userId) {
    const result = await pool.query(
      `DELETE FROM bookmarks b
       USING groups g, sections s, pages p
       WHERE b.group_id = g.id
         AND g.section_id = s.id
         AND s.page_id = p.id
         AND b.id = $1
         AND p.user_id = $2
       RETURNING b.id`,
      [id, userId]
    );

    return result.rows.length > 0;
  }

  /**
   * Réorganiser les positions des bookmarks d'une colonne spécifique (drag & drop)
   * @param {string} groupId - UUID du group
   * @param {number} columnNumber - Numéro de la colonne (1-based)
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Liste des bookmarks de cette colonne avec nouvelles positions
   */
  static async reorderColumn(groupId, columnNumber, bookmarkIds) {
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Mettre à jour chaque position dans cette colonne
      for (let i = 0; i < bookmarkIds.length; i++) {
        await client.query(
          'UPDATE bookmarks SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND group_id = $3 AND "column" = $4',
          [i, bookmarkIds[i], groupId, columnNumber]
        );
      }

      await client.query('COMMIT');

      // Retourner la liste réorganisée pour cette colonne
      const result = await client.query(
        `SELECT id, group_id, user_id, title, url, description, position, "column", visit_count, favicon_url, created_at, updated_at
         FROM bookmarks
         WHERE group_id = $1 AND "column" = $2
         ORDER BY position ASC`,
        [groupId, columnNumber]
      );

      return result.rows;
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError.message);
        }
      }
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Réorganiser les positions des bookmarks d'un group (drag & drop) - LEGACY
   * @deprecated Use reorderColumn instead for independent columns
   * @param {string} groupId - UUID du group
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Liste des bookmarks avec nouvelles positions
   */
  static async reorderPositions(groupId, bookmarkIds) {
    let client;

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // Mettre à jour chaque position
      for (let i = 0; i < bookmarkIds.length; i++) {
        await client.query(
          'UPDATE bookmarks SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND group_id = $3',
          [i, bookmarkIds[i], groupId]
        );
      }

      await client.query('COMMIT');

      // Retourner la liste réorganisée
      const result = await client.query(
        `SELECT id, group_id, user_id, title, url, description, position, "column", visit_count, favicon_url, created_at, updated_at
         FROM bookmarks
         WHERE group_id = $1
         ORDER BY "column" ASC, position ASC`,
        [groupId]
      );

      return result.rows;
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError.message);
        }
      }
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Incrémenter le compteur de visites d'un bookmark (click tracking)
   * @param {string} id - UUID du bookmark
   * @returns {Promise<object|null>} Bookmark mis à jour avec visit_count incrémenté
   */
  static async incrementVisitCount(id) {
    const result = await pool.query(
      `UPDATE bookmarks
       SET visit_count = visit_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, group_id, user_id, title, url, description, position, "column", visit_count, favicon_url, created_at, updated_at`,
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Compter le nombre de bookmarks dans un group
   * @param {string} groupId - UUID du group
   * @returns {Promise<number>} Nombre de bookmarks
   */
  static async countByGroup(groupId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM bookmarks WHERE group_id = $1',
      [groupId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Récupérer les bookmarks les plus utilisés d'un user (pour groups dynamiques "Top Used")
   * @param {string} userId - UUID du user
   * @param {number} limit - Nombre de bookmarks à retourner (default 10)
   * @returns {Promise<Array>} Liste des top bookmarks triés par visit_count DESC
   */
  static async getTopUsed(userId, limit = 10) {
    const result = await pool.query(
      `SELECT b.id, b.group_id, b.user_id, b.title, b.url, b.description, b.position, b."column", b.visit_count, b.favicon_url, b.created_at, b.updated_at
       FROM bookmarks b
       INNER JOIN groups g ON b.group_id = g.id
       INNER JOIN sections s ON g.section_id = s.id
       INNER JOIN pages p ON s.page_id = p.id
       WHERE p.user_id = $1
       ORDER BY b.visit_count DESC, b.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}

module.exports = Bookmark;
