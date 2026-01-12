import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Pages Service
 * Gère les appels API pour les pages (niveau 1 hiérarchie)
 *
 * Toutes les méthodes nécessitent un token JWT (passé via authStore.getToken())
 */
const pagesService = {
  /**
   * Récupérer toutes les pages du user connecté
   * GET /api/pages
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { pages, count } }
   */
  async getAll(token) {
    const response = await axios.get(`${API_URL}/api/pages`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Récupérer une page spécifique par ID
   * GET /api/pages/:id
   * @param {string} id - UUID de la page
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { page } }
   */
  async getOne(id, token) {
    const response = await axios.get(`${API_URL}/api/pages/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Créer une nouvelle page
   * POST /api/pages
   * @param {object} pageData - { name, icon?, color? }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { page } }
   */
  async create(pageData, token) {
    const response = await axios.post(`${API_URL}/api/pages`, pageData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Mettre à jour une page existante
   * PUT /api/pages/:id
   * @param {string} id - UUID de la page
   * @param {object} updates - { name?, icon?, color? }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { page } }
   */
  async update(id, updates, token) {
    const response = await axios.put(`${API_URL}/api/pages/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Supprimer une page
   * DELETE /api/pages/:id
   * @param {string} id - UUID de la page
   * @param {string} token - JWT token
   * @returns {Promise} Response 204 No Content
   */
  async delete(id, token) {
    const response = await axios.delete(`${API_URL}/api/pages/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Réorganiser les pages (drag & drop)
   * POST /api/pages/reorder
   * @param {Array<string>} pageIds - Array d'UUIDs dans le nouvel ordre
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: { pages } }
   */
  async reorder(pageIds, token) {
    const response = await axios.post(
      `${API_URL}/api/pages/reorder`,
      { pageIds },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Obtenir les statistiques des pages du user
   * GET /api/pages/stats
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { total, pages } }
   */
  async getStats(token) {
    const response = await axios.get(`${API_URL}/api/pages/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  }
};

export default pagesService;
