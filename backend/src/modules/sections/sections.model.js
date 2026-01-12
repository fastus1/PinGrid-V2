const pool = require('../../shared/config/database');

/**
 * Sections Model
 * Gère les opérations CRUD pour la table sections
 * Sections = Niveau 2 de la hiérarchie (Page → Section → Group → Bookmark)
 */
class Section {
  /**
   * Vérifier que la page appartient au user
   * @param {string} pageId - UUID de la page
   * @param {string} userId - UUID du user
   * @returns {Promise<boolean>} True si la page appartient au user
   */
  static async verifyPageOwnership(pageId, userId) {
    const result = await pool.query(
      'SELECT id FROM pages WHERE id = $1 AND user_id = $2',
      [pageId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Créer une nouvelle section
   * @param {string} pageId - UUID de la page parente
   * @param {object} sectionData - { name }
   * @returns {Promise<object>} Section créée
   */
  static async create(pageId, sectionData) {
    const { name } = sectionData;

    // Calculer la position automatiquement (max + 1)
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM sections WHERE page_id = $1',
      [pageId]
    );
    const position = positionResult.rows[0].next_position;

    const result = await pool.query(
      `INSERT INTO sections (page_id, name, position)
       VALUES ($1, $2, $3)
       RETURNING id, page_id, name, position, collapsed, created_at, updated_at`,
      [pageId, name, position]
    );

    return result.rows[0];
  }

  /**
   * Récupérer toutes les sections d'une page
   * @param {string} pageId - UUID de la page
   * @returns {Promise<Array>} Liste des sections triées par position
   */
  static async findAllByPage(pageId) {
    const result = await pool.query(
      `SELECT id, page_id, name, position, collapsed, created_at, updated_at
       FROM sections
       WHERE page_id = $1
       ORDER BY position ASC`,
      [pageId]
    );

    return result.rows;
  }

  /**
   * Récupérer une section par ID
   * @param {string} id - UUID de la section
   * @param {string} userId - UUID du user (pour vérification ownership via page)
   * @returns {Promise<object|null>} Section ou null si non trouvée ou pas d'accès
   */
  static async findById(id, userId) {
    const result = await pool.query(
      `SELECT s.id, s.page_id, s.name, s.position, s.collapsed, s.created_at, s.updated_at
       FROM sections s
       INNER JOIN pages p ON s.page_id = p.id
       WHERE s.id = $1 AND p.user_id = $2`,
      [id, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Récupérer une section par nom (pour vérifier doublons)
   * @param {string} pageId - UUID de la page
   * @param {string} name - Nom de la section
   * @returns {Promise<object|null>} Section ou null
   */
  static async findByName(pageId, name) {
    const result = await pool.query(
      `SELECT id, page_id, name, position, collapsed, created_at, updated_at
       FROM sections
       WHERE page_id = $1 AND LOWER(name) = LOWER($2)`,
      [pageId, name]
    );

    return result.rows[0] || null;
  }

  /**
   * Mettre à jour une section
   * @param {string} id - UUID de la section
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @param {object} updates - { name?, collapsed? }
   * @returns {Promise<object|null>} Section mise à jour ou null
   */
  static async update(id, userId, updates) {
    const { name, collapsed } = updates;

    // Construire la requête dynamiquement selon les champs fournis
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (collapsed !== undefined) {
      fields.push(`collapsed = $${paramCount++}`);
      values.push(collapsed);
    }

    // Si aucun champ à update, retourner la section existante
    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    // Ajouter updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Ajouter id pour WHERE
    values.push(id);

    const query = `
      UPDATE sections s
      SET ${fields.join(', ')}
      FROM pages p
      WHERE s.id = $${paramCount++}
        AND s.page_id = p.id
        AND p.user_id = $${paramCount}
      RETURNING s.id, s.page_id, s.name, s.position, s.collapsed, s.created_at, s.updated_at
    `;

    values.push(userId);
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Supprimer une section
   * @param {string} id - UUID de la section
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @returns {Promise<boolean>} True si supprimé, false sinon
   */
  static async delete(id, userId) {
    const result = await pool.query(
      `DELETE FROM sections s
       USING pages p
       WHERE s.id = $1
         AND s.page_id = p.id
         AND p.user_id = $2`,
      [id, userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Réorganiser les positions des sections (pour drag & drop)
   * @param {string} pageId - UUID de la page
   * @param {Array<string>} sectionIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Sections réordonnées
   */
  static async reorderPositions(pageId, sectionIds) {
    // Utiliser une transaction pour garantir l'atomicité
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Mettre à jour chaque section avec sa nouvelle position
      for (let i = 0; i < sectionIds.length; i++) {
        await client.query(
          'UPDATE sections SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND page_id = $3',
          [i, sectionIds[i], pageId]
        );
      }

      await client.query('COMMIT');

      // Retourner les sections réordonnées
      return this.findAllByPage(pageId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Compter le nombre de sections d'une page
   * @param {string} pageId - UUID de la page
   * @returns {Promise<number>} Nombre de sections
   */
  static async countByPage(pageId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM sections WHERE page_id = $1',
      [pageId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Inverser l'état collapsed d'une section (replier/déplier)
   * @param {string} id - UUID de la section
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @returns {Promise<object|null>} Section mise à jour ou null
   */
  static async toggleCollapsed(id, userId) {
    const result = await pool.query(
      `UPDATE sections s
       SET collapsed = NOT s.collapsed, updated_at = CURRENT_TIMESTAMP
       FROM pages p
       WHERE s.id = $1
         AND s.page_id = p.id
         AND p.user_id = $2
       RETURNING s.id, s.page_id, s.name, s.position, s.collapsed, s.created_at, s.updated_at`,
      [id, userId]
    );

    return result.rows[0] || null;
  }
}

module.exports = Section;
