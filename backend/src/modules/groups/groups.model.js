const pool = require('../../shared/config/database');

/**
 * Groups Model
 * Gère les opérations CRUD pour la table groups
 * Groups = Niveau 3 de la hiérarchie (Page → Section → Group → Bookmark)
 */
class Group {
  /**
   * Vérifier que la section appartient au user (via page)
   * @param {string} sectionId - UUID de la section
   * @param {string} userId - UUID du user
   * @returns {Promise<boolean>} True si la section appartient au user
   */
  static async verifySectionOwnership(sectionId, userId) {
    const result = await pool.query(
      `SELECT s.id
       FROM sections s
       INNER JOIN pages p ON s.page_id = p.id
       WHERE s.id = $1 AND p.user_id = $2`,
      [sectionId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Créer un nouveau group
   * @param {string} sectionId - UUID de la section parente
   * @param {object} groupData - { name, column_count?, group_type?, bookmark_limit? }
   * @returns {Promise<object>} Group créé
   */
  static async create(sectionId, groupData) {
    const { name, column_count = 3, group_type = 'manual', bookmark_limit = null, width = '100%' } = groupData;

    // Calculer la position automatiquement (max + 1)
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM groups WHERE section_id = $1',
      [sectionId]
    );
    const position = positionResult.rows[0].next_position;

    const result = await pool.query(
      `INSERT INTO groups (section_id, name, position, column_count, group_type, bookmark_limit, width)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, section_id, name, position, column_count, group_type, bookmark_limit, width, created_at, updated_at`,
      [sectionId, name, position, column_count, group_type, bookmark_limit, width]
    );

    return result.rows[0];
  }

  /**
   * Récupérer tous les groups d'une section
   * @param {string} sectionId - UUID de la section
   * @returns {Promise<Array>} Liste des groups triés par position
   */
  static async findAllBySection(sectionId) {
    const result = await pool.query(
      `SELECT id, section_id, name, position, column_count, group_type, bookmark_limit, width, created_at, updated_at
       FROM groups
       WHERE section_id = $1
       ORDER BY position ASC`,
      [sectionId]
    );

    return result.rows;
  }

  /**
   * Récupérer un group par ID
   * @param {string} id - UUID du group
   * @param {string} userId - UUID du user (pour vérification ownership via section→page)
   * @returns {Promise<object|null>} Group ou null si non trouvé ou pas d'accès
   */
  static async findById(id, userId) {
    const result = await pool.query(
      `SELECT g.id, g.section_id, g.name, g.position, g.column_count, g.group_type, g.bookmark_limit, g.width, g.created_at, g.updated_at
       FROM groups g
       INNER JOIN sections s ON g.section_id = s.id
       INNER JOIN pages p ON s.page_id = p.id
       WHERE g.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Récupérer un group par nom (pour vérifier doublons)
   * @param {string} sectionId - UUID de la section
   * @param {string} name - Nom du group
   * @returns {Promise<object|null>} Group ou null
   */
  static async findByName(sectionId, name) {
    const result = await pool.query(
      `SELECT id, section_id, name, position, column_count, group_type, bookmark_limit, width, created_at, updated_at
       FROM groups
       WHERE section_id = $1 AND LOWER(name) = LOWER($2)`,
      [sectionId, name]
    );

    return result.rows[0] || null;
  }

  /**
   * Mettre à jour un group
   * @param {string} id - UUID du group
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @param {object} updates - { name?, column_count?, group_type?, bookmark_limit? }
   * @returns {Promise<object|null>} Group mis à jour ou null
   */
  static async update(id, userId, updates) {
    const { name, column_count, group_type, bookmark_limit, width } = updates;

    // Construire la requête dynamiquement selon les champs fournis
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (column_count !== undefined) {
      fields.push(`column_count = $${paramCount++}`);
      values.push(column_count);
    }
    if (group_type !== undefined) {
      fields.push(`group_type = $${paramCount++}`);
      values.push(group_type);
    }
    if (bookmark_limit !== undefined) {
      fields.push(`bookmark_limit = $${paramCount++}`);
      values.push(bookmark_limit);
    }
    if (width !== undefined) {
      fields.push(`width = $${paramCount++}`);
      values.push(width);
    }

    // Si aucun champ à update, retourner le group existant
    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    // Ajouter updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Ajouter id pour WHERE
    values.push(id);

    const query = `
      UPDATE groups g
      SET ${fields.join(', ')}
      FROM sections s, pages p
      WHERE g.id = $${paramCount++}
        AND g.section_id = s.id
        AND s.page_id = p.id
        AND p.user_id = $${paramCount}
      RETURNING g.id, g.section_id, g.name, g.position, g.column_count, g.group_type, g.bookmark_limit, g.width, g.created_at, g.updated_at
    `;

    values.push(userId);
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Supprimer un group
   * @param {string} id - UUID du group
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @returns {Promise<boolean>} True si supprimé, false sinon
   */
  static async delete(id, userId) {
    const result = await pool.query(
      `DELETE FROM groups g
       USING sections s, pages p
       WHERE g.id = $1
         AND g.section_id = s.id
         AND s.page_id = p.id
         AND p.user_id = $2`,
      [id, userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Réorganiser les positions des groups (pour drag & drop)
   * @param {string} sectionId - UUID de la section
   * @param {Array<string>} groupIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Groups réordonnés
   */
  static async reorderPositions(sectionId, groupIds) {
    // Utiliser une transaction pour garantir l'atomicité
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Mettre à jour chaque group avec sa nouvelle position
      for (let i = 0; i < groupIds.length; i++) {
        await client.query(
          'UPDATE groups SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND section_id = $3',
          [i, groupIds[i], sectionId]
        );
      }

      await client.query('COMMIT');

      // Retourner les groups réordonnés
      return this.findAllBySection(sectionId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Compter le nombre de groups d'une section
   * @param {string} sectionId - UUID de la section
   * @returns {Promise<number>} Nombre de groups
   */
  static async countBySection(sectionId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM groups WHERE section_id = $1',
      [sectionId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Mettre à jour le column_count d'un group (pour changer le layout)
   * @param {string} id - UUID du group
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @param {number} columnCount - Nouveau nombre de colonnes (1-6)
   * @returns {Promise<object|null>} Group mis à jour ou null
   */
  static async updateColumnCount(id, userId, columnCount) {
    const result = await pool.query(
      `UPDATE groups g
       SET column_count = $1, updated_at = CURRENT_TIMESTAMP
       FROM sections s, pages p
       WHERE g.id = $2
         AND g.section_id = s.id
         AND s.page_id = p.id
         AND p.user_id = $3
       RETURNING g.id, g.section_id, g.name, g.position, g.column_count, g.group_type, g.bookmark_limit, g.width, g.created_at, g.updated_at`,
      [columnCount, id, userId]
    );

    return result.rows[0] || null;
  }
}

module.exports = Group;
