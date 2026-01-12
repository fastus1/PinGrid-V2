import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import pagesService from '../services/pagesService';
import { useAuthStore } from '../../auth/store/authStore';

/**
 * Pages Store (Zustand)
 * Gère l'état des pages (niveau 1 de la hiérarchie)
 *
 * State:
 * - pages: Array des pages du user
 * - currentPage: Page actuellement sélectionnée
 * - loading: Boolean pour état de chargement
 * - error: Message d'erreur si présent
 *
 * Actions:
 * - fetchPages: Récupérer toutes les pages
 * - createPage: Créer une nouvelle page
 * - updatePage: Mettre à jour une page
 * - deletePage: Supprimer une page
 * - reorderPages: Réorganiser l'ordre des pages
 * - setCurrentPage: Sélectionner une page
 * - getStats: Obtenir statistiques
 */
export const usePagesStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      pages: [],
      currentPage: null,
      loading: false,
      error: null,
      stats: null,

      // ============================================
      // ACTIONS - CRUD
      // ============================================

      /**
       * Récupérer toutes les pages du user
       * Appelé au mount du Dashboard
       */
      fetchPages: async () => {
        set({ loading: true, error: null });
        try {
          const token = useAuthStore.getState().getToken();
          const response = await pagesService.getAll(token);
          const pages = response.data.data.pages;

          set({
            pages,
            loading: false,
            error: null
          });

          // Si aucune page n'est sélectionnée, sélectionner la première
          const currentPage = get().currentPage;
          if (!currentPage && pages.length > 0) {
            set({ currentPage: pages[0] });
          }

          // Si la page courante a été supprimée, sélectionner la première
          if (currentPage && !pages.find(p => p.id === currentPage.id)) {
            set({ currentPage: pages.length > 0 ? pages[0] : null });
          }

          return { success: true, pages };
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
       * Créer une nouvelle page
       * @param {object} pageData - { name, icon?, color? }
       */
      createPage: async (pageData) => {
        set({ loading: true, error: null });
        try {
          const token = useAuthStore.getState().getToken();
          const response = await pagesService.create(pageData, token);
          const newPage = response.data.data.page;

          // Ajouter la page au state
          const pages = [...get().pages, newPage];
          set({
            pages,
            loading: false,
            error: null
          });

          // Si c'est la première page, la sélectionner automatiquement
          if (pages.length === 1) {
            set({ currentPage: newPage });
          }

          return { success: true, page: newPage };
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
       * Mettre à jour une page existante
       * @param {string} id - UUID de la page
       * @param {object} updates - { name?, icon?, color? }
       */
      updatePage: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const token = useAuthStore.getState().getToken();
          const response = await pagesService.update(id, updates, token);
          const updatedPage = response.data.data.page;

          // Mettre à jour dans le state
          const pages = get().pages.map(p =>
            p.id === id ? updatedPage : p
          );

          set({
            pages,
            loading: false,
            error: null
          });

          // Si c'est la page courante, la mettre à jour aussi
          const currentPage = get().currentPage;
          if (currentPage && currentPage.id === id) {
            set({ currentPage: updatedPage });
          }

          return { success: true, page: updatedPage };
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
       * Supprimer une page
       * @param {string} id - UUID de la page
       */
      deletePage: async (id) => {
        set({ loading: true, error: null });
        try {
          const token = useAuthStore.getState().getToken();
          await pagesService.delete(id, token);

          // Retirer du state
          const pages = get().pages.filter(p => p.id !== id);
          set({
            pages,
            loading: false,
            error: null
          });

          // Si c'était la page courante, sélectionner la première page restante
          const currentPage = get().currentPage;
          if (currentPage && currentPage.id === id) {
            set({ currentPage: pages.length > 0 ? pages[0] : null });
          }

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
       * Réorganiser les pages (drag & drop)
       * @param {Array<string>} pageIds - Array d'UUIDs dans le nouvel ordre
       */
      reorderPages: async (pageIds) => {
        set({ loading: true, error: null });
        try {
          const token = useAuthStore.getState().getToken();
          const response = await pagesService.reorder(pageIds, token);
          const reorderedPages = response.data.data.pages;

          set({
            pages: reorderedPages,
            loading: false,
            error: null
          });

          return { success: true, pages: reorderedPages };
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
       * Obtenir les statistiques des pages
       */
      getStats: async () => {
        set({ loading: true, error: null });
        try {
          const token = useAuthStore.getState().getToken();
          const response = await pagesService.getStats(token);
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
       * Sélectionner une page courante
       * @param {object} page - Page à sélectionner
       */
      setCurrentPage: (page) => {
        set({ currentPage: page });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset store (logout)
       */
      reset: () => {
        set({
          pages: [],
          currentPage: null,
          loading: false,
          error: null,
          stats: null
        });
      }
    }),
    {
      name: 'pingrid-pages-storage',
      // Persister uniquement currentPage (pas pages, qui doit être fresh depuis API)
      partialize: (state) => ({
        currentPage: state.currentPage
      })
    }
  )
);
