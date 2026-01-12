import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Bookmarks Service
 * Gère les appels API pour les bookmarks (niveau 4 hiérarchie)
 *
 * Toutes les méthodes nécessitent un token JWT (passé via authStore.getToken())
 */
const bookmarksService = {
  /**
   * Récupérer tous les bookmarks d'un group
   * GET /api/bookmarks?groupId=X
   * @param {string} groupId - UUID du group
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: [bookmarks] }
   */
  async getAll(groupId, token) {
    const response = await axios.get(`${API_URL}/api/bookmarks`, {
      params: { groupId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Récupérer un bookmark spécifique par ID
   * GET /api/bookmarks/:id
   * @param {string} id - UUID du bookmark
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: bookmark }
   */
  async getOne(id, token) {
    const response = await axios.get(`${API_URL}/api/bookmarks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Créer un nouveau bookmark
   * POST /api/bookmarks
   * @param {string} groupId - UUID du group parent
   * @param {object} bookmarkData - { title, url, description?, favicon_url? }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: bookmark }
   */
  async create(groupId, bookmarkData, token) {
    const response = await axios.post(
      `${API_URL}/api/bookmarks`,
      { groupId, ...bookmarkData },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Mettre à jour un bookmark existant
   * PUT /api/bookmarks/:id
   * @param {string} id - UUID du bookmark
   * @param {object} updates - { title?, url?, description?, favicon_url? }
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: bookmark }
   */
  async update(id, updates, token) {
    const response = await axios.put(`${API_URL}/api/bookmarks/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Supprimer un bookmark
   * DELETE /api/bookmarks/:id
   * @param {string} id - UUID du bookmark
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message }
   */
  async delete(id, token) {
    const response = await axios.delete(`${API_URL}/api/bookmarks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Réorganiser les bookmarks d'un group (drag & drop)
   * POST /api/bookmarks/reorder
   * @param {string} groupId - UUID du group
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: [bookmarks] }
   */
  async reorder(groupId, bookmarkIds, token) {
    const response = await axios.post(
      `${API_URL}/api/bookmarks/reorder`,
      { groupId, bookmarkIds },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Réorganiser les bookmarks d'une colonne spécifique (drag & drop)
   * POST /api/bookmarks/reorder-column
   * @param {string} groupId - UUID du group
   * @param {number} columnNumber - Numéro de la colonne (1-based)
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: [bookmarks] }
   */
  async reorderColumn(groupId, columnNumber, bookmarkIds, token) {
    const response = await axios.post(
      `${API_URL}/api/bookmarks/reorder-column`,
      { groupId, columnNumber, bookmarkIds },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Tracker un clic sur un bookmark (incrémenter visit_count)
   * POST /api/bookmarks/:id/click
   * @param {string} id - UUID du bookmark
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: bookmark }
   */
  async trackClick(id, token) {
    const response = await axios.post(
      `${API_URL}/api/bookmarks/${id}/click`,
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
   * Récupérer les bookmarks les plus utilisés
   * GET /api/bookmarks/top-used?limit=10
   * @param {number} limit - Nombre de bookmarks à retourner (default 10)
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: [bookmarks] }
   */
  async getTopUsed(limit = 10, token) {
    const response = await axios.get(`${API_URL}/api/bookmarks/top-used`, {
      params: { limit },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Récupérer les statistiques d'un group
   * GET /api/bookmarks/stats?groupId=X
   * @param {string} groupId - UUID du group
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: { total_bookmarks, total_visits, most_used, average_visits } }
   */
  async getStats(groupId, token) {
    const response = await axios.get(`${API_URL}/api/bookmarks/stats`, {
      params: { groupId },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  },

  /**
   * Forcer le refresh de la favicon d'un bookmark
   * POST /api/bookmarks/:id/refresh-favicon
   * @param {string} id - UUID du bookmark
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, message, data: bookmark }
   */
  async refreshFavicon(id, token) {
    const response = await axios.post(
      `${API_URL}/api/bookmarks/${id}/refresh-favicon`,
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
   * Scan a website's HTML to find declared favicons
   * POST /api/bookmarks/scan-site
   * @param {string} url - URL to scan
   * @param {string} token - JWT token
   * @returns {Promise} Response avec { success, data: [{url, size, type}] }
   */
  async scanSite(url, token) {
    const response = await axios.post(
      `${API_URL}/api/bookmarks/scan-site`,
      { url },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response;
  },

  /**
   * Upload a custom favicon image
   * POST /api/upload/favicon
   * @param {File} file - Image file to upload
   * @param {string} token - JWT token
   */
  async uploadFavicon(file, token) {
    const formData = new FormData();
    formData.append('favicon', file);

    const response = await axios.post(
      `${API_URL}/api/upload/favicon`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response;
  }
};

export default bookmarksService;
