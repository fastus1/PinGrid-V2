const pool = require('../../shared/config/database');

/**
 * Pages Model
 * Gère les opérations CRUD pour la table pages
 * Pages = Niveau 1 de la hiérarchie (Page → Section → Group → Bookmark)
 */
class Page {
  /**
   * Créer une nouvelle page
   * @param {string} userId - UUID du user propriétaire
   * @param {object} pageData - { name, icon?, color? }
   * @returns {Promise<object>} Page créée
   */
  static async create(userId, pageData) {
    const { name, icon = '📄', color = '#667eea' } = pageData;

    // Calculer la position automatiquement (max + 1)
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM pages WHERE user_id = $1',
      [userId]
    );
    const position = positionResult.rows[0].next_position;

    const result = await pool.query(
      `INSERT INTO pages (user_id, name, position, icon, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, name, position, icon, color, created_at, updated_at`,
      [userId, name, position, icon, color]
    );

    return result.rows[0];
  }

  /**
   * Récupérer toutes les pages d'un user
   * @param {string} userId - UUID du user
   * @returns {Promise<Array>} Liste des pages triées par position
   */
  static async findAllByUser(userId) {
    const result = await pool.query(
      `SELECT id, user_id, name, position, icon, color, created_at, updated_at
       FROM pages
       WHERE user_id = $1
       ORDER BY position ASC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Récupérer une page par ID
   * @param {string} id - UUID de la page
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @returns {Promise<object|null>} Page ou null si non trouvée
   */
  static async findById(id, userId) {
    const result = await pool.query(
      `SELECT id, user_id, name, position, icon, color, created_at, updated_at
       FROM pages
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Récupérer une page par nom (pour vérifier doublons)
   * @param {string} userId - UUID du user
   * @param {string} name - Nom de la page
   * @returns {Promise<object|null>} Page ou null
   */
  static async findByName(userId, name) {
    const result = await pool.query(
      `SELECT id, user_id, name, position, icon, color, created_at, updated_at
       FROM pages
       WHERE user_id = $1 AND LOWER(name) = LOWER($2)`,
      [userId, name]
    );

    return result.rows[0] || null;
  }

  /**
   * Mettre à jour une page
   * @param {string} id - UUID de la page
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @param {object} updates - { name?, icon?, color? }
   * @returns {Promise<object|null>} Page mise à jour ou null
   */
  static async update(id, userId, updates) {
    const { name, icon, color } = updates;

    // Construire la requête dynamiquement selon les champs fournis
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (icon !== undefined) {
      fields.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(color);
    }

    // Si aucun champ à update, retourner la page existante
    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    // Ajouter updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Ajouter id et userId pour WHERE
    values.push(id, userId);

    const query = `
      UPDATE pages
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount}
      RETURNING id, user_id, name, position, icon, color, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Supprimer une page
   * @param {string} id - UUID de la page
   * @param {string} userId - UUID du user (pour vérification ownership)
   * @returns {Promise<boolean>} True si supprimé, false sinon
   */
  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM pages WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Réorganiser les positions des pages (pour drag & drop)
   * @param {string} userId - UUID du user
   * @param {Array<string>} pageIds - Array d'UUIDs dans le nouvel ordre
   * @returns {Promise<Array>} Pages réordonnées
   */
  static async reorderPositions(userId, pageIds) {
    // Utiliser une transaction pour garantir l'atomicité
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Mettre à jour chaque page avec sa nouvelle position
      for (let i = 0; i < pageIds.length; i++) {
        await client.query(
          'UPDATE pages SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
          [i, pageIds[i], userId]
        );
      }

      await client.query('COMMIT');

      // Retourner les pages réordonnées
      return this.findAllByUser(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Compter le nombre de pages d'un user
   * @param {string} userId - UUID du user
   * @returns {Promise<number>} Nombre de pages
   */
  static async countByUser(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM pages WHERE user_id = $1',
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = Page;
