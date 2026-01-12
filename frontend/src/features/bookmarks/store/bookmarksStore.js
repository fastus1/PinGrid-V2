import { create } from 'zustand';
import bookmarksService from '../services/bookmarksService';
import { useAuthStore } from '../../auth/store/authStore';

/**
 * Bookmarks Store (Zustand)
 * Gère l'état des bookmarks (niveau 4 de la hiérarchie)
 *
 * State:
 * - bookmarksByGroup: Object { groupId: [bookmarks] } pour grouper par group
 * - loading: Boolean pour état de chargement
 * - error: Message d'erreur si présent
 * - topUsed: Array des bookmarks les plus utilisés
 * - stats: Object statistiques d'un group
 *
 * Actions:
 * - fetchBookmarks: Récupérer tous les bookmarks d'un group
 * - createBookmark: Créer un nouveau bookmark
 * - updateBookmark: Mettre à jour un bookmark
 * - deleteBookmark: Supprimer un bookmark
 * - reorderBookmarks: Réorganiser l'ordre des bookmarks
 * - trackClick: Incrémenter le compteur de visites
 * - fetchTopUsed: Récupérer les bookmarks les plus utilisés
 * - fetchStats: Récupérer les statistiques d'un group
 */
export const useBookmarksStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  bookmarksByGroup: {}, // { groupId: [bookmarks] }
  loading: false,
  error: null,
  topUsed: [],
  stats: null,

  // ============================================
  // ACTIONS - CRUD
  // ============================================

  /**
   * Récupérer tous les bookmarks d'un group
   * @param {string} groupId - UUID du group
   */
  fetchBookmarks: async (groupId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.getAll(groupId, token);
      const bookmarks = response.data.data;

      // Mettre à jour le state pour ce group
      set((state) => ({
        bookmarksByGroup: {
          ...state.bookmarksByGroup,
          [groupId]: bookmarks
        },
        loading: false,
        error: null
      }));

      return { success: true, bookmarks };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Créer un nouveau bookmark
   * @param {string} groupId - UUID du group parent
   * @param {object} bookmarkData - { title, url, description?, favicon_url? }
   */
  createBookmark: async (groupId, bookmarkData) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.create(groupId, bookmarkData, token);
      const newBookmark = response.data.data;

      // Ajouter le bookmark au state pour ce group
      set((state) => {
        const currentBookmarks = state.bookmarksByGroup[groupId] || [];
        return {
          bookmarksByGroup: {
            ...state.bookmarksByGroup,
            [groupId]: [...currentBookmarks, newBookmark]
          },
          loading: false,
          error: null
        };
      });

      return { success: true, bookmark: newBookmark };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Mettre à jour un bookmark existant
   * @param {string} id - UUID du bookmark
   * @param {string} groupId - UUID du group (pour mise à jour du state)
   * @param {object} updates - { title?, url?, description?, favicon_url? }
   */
  updateBookmark: async (id, groupId, updates) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.update(id, updates, token);
      const updatedBookmark = response.data.data;

      // Mettre à jour dans le state
      set((state) => {
        const currentBookmarks = state.bookmarksByGroup[groupId] || [];
        const updatedBookmarks = currentBookmarks.map((b) =>
          b.id === id ? updatedBookmark : b
        );

        return {
          bookmarksByGroup: {
            ...state.bookmarksByGroup,
            [groupId]: updatedBookmarks
          },
          loading: false,
          error: null
        };
      });

      return { success: true, bookmark: updatedBookmark };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Déplacer un bookmark vers un autre group
   * @param {string} bookmarkId - UUID du bookmark
   * @param {string} sourceGroupId - UUID du group source
   * @param {string} targetGroupId - UUID du group destination
   * @param {number} targetColumn - Numéro de la colonne cible (1-based, default 1)
   */
  moveBookmark: async (bookmarkId, sourceGroupId, targetGroupId, targetColumn = 1) => {
    try {
      const token = useAuthStore.getState().getToken();

      // Appeler le backend pour update le group_id et la colonne
      const response = await bookmarksService.update(bookmarkId, { group_id: targetGroupId, column: targetColumn }, token);
      const movedBookmark = response.data.data;

      // Mettre à jour le state local
      set((state) => {
        const sourceBookmarks = state.bookmarksByGroup[sourceGroupId] || [];
        const targetBookmarks = state.bookmarksByGroup[targetGroupId] || [];

        // Retirer du group source
        const newSourceBookmarks = sourceBookmarks.filter(b => b.id !== bookmarkId);

        // Ajouter au group cible
        const newTargetBookmarks = [...targetBookmarks, movedBookmark];

        return {
          bookmarksByGroup: {
            ...state.bookmarksByGroup,
            [sourceGroupId]: newSourceBookmarks,
            [targetGroupId]: newTargetBookmarks
          }
        };
      });

      return { success: true, bookmark: movedBookmark };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Supprimer un bookmark
   * @param {string} id - UUID du bookmark
   * @param {string} groupId - UUID du group (pour mise à jour du state)
   */
  deleteBookmark: async (id, groupId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      await bookmarksService.delete(id, token);

      // Retirer du state
      set((state) => {
        const currentBookmarks = state.bookmarksByGroup[groupId] || [];
        const filteredBookmarks = currentBookmarks.filter((b) => b.id !== id);

        return {
          bookmarksByGroup: {
            ...state.bookmarksByGroup,
            [groupId]: filteredBookmarks
          },
          loading: false,
          error: null
        };
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Réorganiser les bookmarks d'un group (drag & drop)
   * @param {string} groupId - UUID du group
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   */
  reorderBookmarks: async (groupId, bookmarkIds) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.reorder(groupId, bookmarkIds, token);
      const reorderedBookmarks = response.data.data;

      set((state) => ({
        bookmarksByGroup: {
          ...state.bookmarksByGroup,
          [groupId]: reorderedBookmarks
        },
        loading: false,
        error: null
      }));

      return { success: true, bookmarks: reorderedBookmarks };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Réorganiser les bookmarks d'une colonne spécifique (drag & drop)
   * @param {string} groupId - UUID du group
   * @param {number} columnNumber - Numéro de la colonne (1-based)
   * @param {Array<string>} bookmarkIds - Array d'UUIDs dans le nouvel ordre
   */
  reorderColumn: async (groupId, columnNumber, bookmarkIds) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.reorderColumn(groupId, columnNumber, bookmarkIds, token);
      const reorderedColumnBookmarks = response.data.data;

      // Mettre à jour seulement les bookmarks de cette colonne dans le state
      set((state) => {
        const currentBookmarks = state.bookmarksByGroup[groupId] || [];
        const otherBookmarks = currentBookmarks.filter(b => b.column !== columnNumber);
        const updatedBookmarks = [...otherBookmarks, ...reorderedColumnBookmarks].sort((a, b) => {
          // Trier par colonne puis par position
          if (a.column !== b.column) return a.column - b.column;
          return a.position - b.position;
        });

        return {
          bookmarksByGroup: {
            ...state.bookmarksByGroup,
            [groupId]: updatedBookmarks
          },
          loading: false,
          error: null
        };
      });

      return { success: true, bookmarks: reorderedColumnBookmarks };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // ============================================
  // ACTIONS - CLICK TRACKING
  // ============================================

  /**
   * Tracker un clic sur un bookmark (incrémenter visit_count)
   * @param {string} id - UUID du bookmark
   * @param {string} groupId - UUID du group (pour mise à jour du state)
   */
  trackClick: async (id, groupId) => {
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.trackClick(id, token);
      const updatedBookmark = response.data.data;

      // Mettre à jour dans le state (optimistic update)
      set((state) => {
        const currentBookmarks = state.bookmarksByGroup[groupId] || [];
        const updatedBookmarks = currentBookmarks.map((b) =>
          b.id === id ? updatedBookmark : b
        );

        return {
          bookmarksByGroup: {
            ...state.bookmarksByGroup,
            [groupId]: updatedBookmarks
          }
        };
      });

      return { success: true, bookmark: updatedBookmark };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error tracking click:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Récupérer les bookmarks les plus utilisés
   * @param {number} limit - Nombre de bookmarks à retourner (default 10)
   */
  fetchTopUsed: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.getTopUsed(limit, token);
      const topUsed = response.data.data;

      set({
        topUsed,
        loading: false,
        error: null
      });

      return { success: true, topUsed };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Récupérer les statistiques d'un group
   * @param {string} groupId - UUID du group
   */
  fetchStats: async (groupId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await bookmarksService.getStats(groupId, token);
      const stats = response.data.data;

      set({
        stats,
        loading: false,
        error: null
      });

      return { success: true, stats };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  // ============================================
  // ACTIONS - UI
  // ============================================

  /**
   * Obtenir les bookmarks d'un group depuis le state
   * @param {string} groupId - UUID du group
   * @returns {Array} Bookmarks du group ou []
   */
  getBookmarksForGroup: (groupId) => {
    return get().bookmarksByGroup[groupId] || [];
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store (logout ou changement de contexte)
   */
  reset: () => {
    set({
      bookmarksByGroup: {},
      loading: false,
      error: null,
      topUsed: [],
      stats: null
    });
  }
}));
