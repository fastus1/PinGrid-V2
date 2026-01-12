import { create } from 'zustand';
import sectionsService from '../services/sectionsService';
import { useAuthStore } from '../../auth/store/authStore';

/**
 * Sections Store (Zustand)
 * Gère l'état des sections (niveau 2 de la hiérarchie)
 *
 * State:
 * - sectionsByPage: Object { pageId: [sections] } pour grouper par page
 * - loading: Boolean pour état de chargement
 * - error: Message d'erreur si présent
 *
 * Actions:
 * - fetchSections: Récupérer toutes les sections d'une page
 * - createSection: Créer une nouvelle section
 * - updateSection: Mettre à jour une section
 * - deleteSection: Supprimer une section
 * - reorderSections: Réorganiser l'ordre des sections
 * - toggleCollapsed: Replier/déplier une section
 * - getStats: Obtenir statistiques
 */
export const useSectionsStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  sectionsByPage: {}, // { pageId: [sections] }
  loading: false,
  error: null,
  stats: null,

  // ============================================
  // ACTIONS - CRUD
  // ============================================

  /**
   * Récupérer toutes les sections d'une page
   * @param {string} pageId - UUID de la page
   */
  fetchSections: async (pageId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await sectionsService.getAll(pageId, token);
      const sections = response.data.data.sections;

      // Mettre à jour le state pour cette page
      set((state) => ({
        sectionsByPage: {
          ...state.sectionsByPage,
          [pageId]: sections
        },
        loading: false,
        error: null
      }));

      return { success: true, sections };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Créer une nouvelle section
   * @param {string} pageId - UUID de la page parente
   * @param {object} sectionData - { name }
   */
  createSection: async (pageId, sectionData) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await sectionsService.create(pageId, sectionData, token);
      const newSection = response.data.data.section;

      // Ajouter la section au state pour cette page
      set((state) => {
        const currentSections = state.sectionsByPage[pageId] || [];
        return {
          sectionsByPage: {
            ...state.sectionsByPage,
            [pageId]: [...currentSections, newSection]
          },
          loading: false,
          error: null
        };
      });

      return { success: true, section: newSection };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Mettre à jour une section existante
   * @param {string} id - UUID de la section
   * @param {object} updates - { name?, collapsed? }
   */
  updateSection: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await sectionsService.update(id, updates, token);
      const updatedSection = response.data.data.section;

      // Mettre à jour dans le state
      set((state) => {
        const pageId = updatedSection.page_id;
        const currentSections = state.sectionsByPage[pageId] || [];
        const updatedSections = currentSections.map((s) =>
          s.id === id ? updatedSection : s
        );

        return {
          sectionsByPage: {
            ...state.sectionsByPage,
            [pageId]: updatedSections
          },
          loading: false,
          error: null
        };
      });

      return { success: true, section: updatedSection };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Supprimer une section
   * @param {string} id - UUID de la section
   * @param {string} pageId - UUID de la page (pour mise à jour du state)
   */
  deleteSection: async (id, pageId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      await sectionsService.delete(id, token);

      // Retirer du state
      set((state) => {
        const currentSections = state.sectionsByPage[pageId] || [];
        const filteredSections = currentSections.filter((s) => s.id !== id);

        return {
          sectionsByPage: {
            ...state.sectionsByPage,
            [pageId]: filteredSections
          },
          loading: false,
          error: null
        };
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Réorganiser les sections d'une page (drag & drop)
   * @param {string} pageId - UUID de la page
   * @param {Array<string>} sectionIds - Array d'UUIDs dans le nouvel ordre
   */
  reorderSections: async (pageId, sectionIds) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await sectionsService.reorder(pageId, sectionIds, token);
      const reorderedSections = response.data.data.sections;

      set((state) => ({
        sectionsByPage: {
          ...state.sectionsByPage,
          [pageId]: reorderedSections
        },
        loading: false,
        error: null
      }));

      return { success: true, sections: reorderedSections };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Inverser l'état collapsed d'une section (replier/déplier)
   * @param {string} id - UUID de la section
   */
  toggleCollapsed: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await sectionsService.toggleCollapsed(id, token);
      const updatedSection = response.data.data.section;

      // Mettre à jour dans le state
      set((state) => {
        const pageId = updatedSection.page_id;
        const currentSections = state.sectionsByPage[pageId] || [];
        const updatedSections = currentSections.map((s) =>
          s.id === id ? updatedSection : s
        );

        return {
          sectionsByPage: {
            ...state.sectionsByPage,
            [pageId]: updatedSections
          },
          loading: false,
          error: null
        };
      });

      return { success: true, section: updatedSection };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Obtenir les statistiques des sections d'une page
   * @param {string} pageId - UUID de la page
   */
  getStats: async (pageId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await sectionsService.getStats(pageId, token);
      const stats = response.data.data;

      set({
        stats,
        loading: false,
        error: null
      });

      return { success: true, stats };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
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
   * Obtenir les sections d'une page depuis le state
   * @param {string} pageId - UUID de la page
   * @returns {Array} Sections de la page ou []
   */
  getSectionsForPage: (pageId) => {
    return get().sectionsByPage[pageId] || [];
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store (logout ou changement de page)
   */
  reset: () => {
    set({
      sectionsByPage: {},
      loading: false,
      error: null,
      stats: null
    });
  }
}));
