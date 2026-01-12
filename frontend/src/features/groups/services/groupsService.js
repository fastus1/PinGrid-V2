import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Groups Service
 * Gère les appels API pour les groups (niveau 3 hiérarchie)
 *
 * Toutes les méthodes nécessitent un token JWT (passé via authStore.getToken())
 */
const groupsService = {
  /**
   * Récupérer tous les groups d'une section
   * GET /api/groups?sectionId=X
   * @param {string} sectionId - UUID de la section
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { groups, count } }
   */
  async getAll(sectionId, token) {
    const response = await axios.get(`${API_URL}/api/groups`, {
      params: { sectionId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Récupérer un group spécifique par ID
   * GET /api/groups/:id
   * @param {string} id - UUID du group
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { group } }
   */
  async getOne(id, token) {
    const response = await axios.get(`${API_URL}/api/groups/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Créer un nouveau group
   * POST /api/groups
   * @param {string} sectionId - UUID de la section parente
   * @param {object} groupData - { name, column_count?, group_type?, bookmark_limit? }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { group } }
   */
  async create(sectionId, groupData, token) {
    const response = await axios.post(
      `${API_URL}/api/groups`,
      { sectionId, ...groupData },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Mettre à jour un group existant
   * PUT /api/groups/:id
   * @param {string} id - UUID du group
   * @param {object} updates - { name?, column_count?, bookmark_limit? }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { group } }
   */
  async update(id, updates, token) {
    const response = await axios.put(`${API_URL}/api/groups/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Supprimer un group
   * DELETE /api/groups/:id
   * @param {string} id - UUID du group
   * @param {string} token - JWT token
   * @returns {Promise} Response 204 No Content
   */
  async delete(id, token) {
    const response = await axios.delete(`${API_URL}/api/groups/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Réorganiser les groups d'une section (drag & drop)
   * POST /api/groups/reorder
   * @param {string} sectionId - UUID de la section
   * @param {Array<string>} groupIds - Array d'UUIDs dans le nouvel ordre
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { groups } }
   */
  async reorder(sectionId, groupIds, token) {
    const response = await axios.post(
      `${API_URL}/api/groups/reorder`,
      { sectionId, groupIds },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Mettre à jour le column_count d'un group (layout)
   * PATCH /api/groups/:id/layout
   * @param {string} id - UUID du group
   * @param {number} columnCount - Nouveau nombre de colonnes (1-6)
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { group } }
   */
  async updateLayout(id, columnCount, token) {
    const response = await axios.patch(
      `${API_URL}/api/groups/${id}/layout`,
      { column_count: columnCount },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Obtenir les statistiques des groups d'une section
   * GET /api/groups/stats?sectionId=X
   * @param {string} sectionId - UUID de la section
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { total, manual_count, dynamic_count, groups } }
   */
  async getStats(sectionId, token) {
    const response = await axios.get(`${API_URL}/api/groups/stats`, {
      params: { sectionId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Dupliquer un group avec tous ses bookmarks
   * POST /api/groups/:id/duplicate
   * @param {string} id - UUID du group à dupliquer
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { group } }
   */
  async duplicate(id, token) {
    const response = await axios.post(
      `${API_URL}/api/groups/${id}/duplicate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  }
};

export default groupsService;
