import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Sections Service
 * Gère les appels API pour les sections (niveau 2 hiérarchie)
 *
 * Toutes les méthodes nécessitent un token JWT (passé via authStore.getToken())
 */
const sectionsService = {
  /**
   * Récupérer toutes les sections d'une page
   * GET /api/sections?pageId=X
   * @param {string} pageId - UUID de la page
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { sections, count } }
   */
  async getAll(pageId, token) {
    const response = await axios.get(`${API_URL}/api/sections`, {
      params: { pageId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Récupérer une section spécifique par ID
   * GET /api/sections/:id
   * @param {string} id - UUID de la section
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { section } }
   */
  async getOne(id, token) {
    const response = await axios.get(`${API_URL}/api/sections/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Créer une nouvelle section
   * POST /api/sections
   * @param {string} pageId - UUID de la page parente
   * @param {object} sectionData - { name }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { section } }
   */
  async create(pageId, sectionData, token) {
    const response = await axios.post(
      `${API_URL}/api/sections`,
      { pageId, ...sectionData },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Mettre à jour une section existante
   * PUT /api/sections/:id
   * @param {string} id - UUID de la section
   * @param {object} updates - { name?, collapsed? }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { section } }
   */
  async update(id, updates, token) {
    const response = await axios.put(`${API_URL}/api/sections/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Supprimer une section
   * DELETE /api/sections/:id
   * @param {string} id - UUID de la section
   * @param {string} token - JWT token
   * @returns {Promise} Response 204 No Content
   */
  async delete(id, token) {
    const response = await axios.delete(`${API_URL}/api/sections/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Réorganiser les sections d'une page (drag & drop)
   * POST /api/sections/reorder
   * @param {string} pageId - UUID de la page
   * @param {Array<string>} sectionIds - Array d'UUIDs dans le nouvel ordre
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { sections } }
   */
  async reorder(pageId, sectionIds, token) {
    const response = await axios.post(
      `${API_URL}/api/sections/reorder`,
      { pageId, sectionIds },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Inverser l'état collapsed d'une section (replier/déplier)
   * POST /api/sections/:id/toggle-collapsed
   * @param {string} id - UUID de la section
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { section } }
   */
  async toggleCollapsed(id, token) {
    const response = await axios.post(
      `${API_URL}/api/sections/${id}/toggle-collapsed`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Obtenir les statistiques des sections d'une page
   * GET /api/sections/stats?pageId=X
   * @param {string} pageId - UUID de la page
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { total, collapsed_count, expanded_count, sections } }
   */
  async getStats(pageId, token) {
    const response = await axios.get(`${API_URL}/api/sections/stats`, {
      params: { pageId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  }
};

export default sectionsService;
