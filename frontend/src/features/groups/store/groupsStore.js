import { create } from 'zustand';
import groupsService from '../services/groupsService';
import { useAuthStore } from '../../auth/store/authStore';

/**
 * Groups Store (Zustand)
 * Gère l'état des groups (niveau 3 de la hiérarchie)
 *
 * State:
 * - groupsBySection: Object { sectionId: [groups] } pour grouper par section
 * - loading: Boolean pour état de chargement
 * - error: Message d'erreur si présent
 *
 * Actions:
 * - fetchGroups: Récupérer tous les groups d'une section
 * - createGroup: Créer un nouveau group
 * - updateGroup: Mettre à jour un group
 * - deleteGroup: Supprimer un group
 * - reorderGroups: Réorganiser l'ordre des groups
 * - updateGroupLayout: Changer le column_count d'un group
 * - getStats: Obtenir statistiques
 */
export const useGroupsStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  groupsBySection: {}, // { sectionId: [groups] }
  loading: false,
  error: null,
  stats: null,

  // ============================================
  // ACTIONS - CRUD
  // ============================================

  /**
   * Récupérer tous les groups d'une section
   * @param {string} sectionId - UUID de la section
   */
  fetchGroups: async (sectionId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await groupsService.getAll(sectionId, token);
      const groups = response.data.data.groups;

      // Mettre à jour le state pour cette section
      set((state) => ({
        groupsBySection: {
          ...state.groupsBySection,
          [sectionId]: groups
        },
        loading: false,
        error: null
      }));

      return { success: true, groups };
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
   * Créer un nouveau group
   * @param {string} sectionId - UUID de la section parente
   * @param {object} groupData - { name, column_count?, group_type?, bookmark_limit? }
   */
  createGroup: async (sectionId, groupData) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await groupsService.create(sectionId, groupData, token);
      const newGroup = response.data.data.group;

      // Ajouter le group au state pour cette section
      set((state) => {
        const currentGroups = state.groupsBySection[sectionId] || [];
        return {
          groupsBySection: {
            ...state.groupsBySection,
            [sectionId]: [...currentGroups, newGroup]
          },
          loading: false,
          error: null
        };
      });

      return { success: true, group: newGroup };
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
   * Mettre à jour un group existant
   * @param {string} id - UUID du group
   * @param {object} updates - { name?, column_count?, bookmark_limit? }
   */
  updateGroup: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await groupsService.update(id, updates, token);
      const updatedGroup = response.data.data.group;

      // Mettre à jour dans le state
      set((state) => {
        const sectionId = updatedGroup.section_id;
        const currentGroups = state.groupsBySection[sectionId] || [];
        const updatedGroups = currentGroups.map((g) =>
          g.id === id ? updatedGroup : g
        );

        return {
          groupsBySection: {
            ...state.groupsBySection,
            [sectionId]: updatedGroups
          },
          loading: false,
          error: null
        };
      });

      return { success: true, group: updatedGroup };
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
   * Supprimer un group
   * @param {string} id - UUID du group
   * @param {string} sectionId - UUID de la section (pour mise à jour du state)
   */
  deleteGroup: async (id, sectionId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      await groupsService.delete(id, token);

      // Retirer du state
      set((state) => {
        const currentGroups = state.groupsBySection[sectionId] || [];
        const filteredGroups = currentGroups.filter((g) => g.id !== id);

        return {
          groupsBySection: {
            ...state.groupsBySection,
            [sectionId]: filteredGroups
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
   * Réorganiser les groups d'une section (drag & drop)
   * @param {string} sectionId - UUID de la section
   * @param {Array<string>} groupIds - Array d'UUIDs dans le nouvel ordre
   */
  reorderGroups: async (sectionId, groupIds) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await groupsService.reorder(sectionId, groupIds, token);
      const reorderedGroups = response.data.data.groups;

      set((state) => ({
        groupsBySection: {
          ...state.groupsBySection,
          [sectionId]: reorderedGroups
        },
        loading: false,
        error: null
      }));

      return { success: true, groups: reorderedGroups };
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
   * Déplacer un group vers une autre section
   * @param {string} groupId - UUID du group
   * @param {string} sourceSectionId - UUID de la section source
   * @param {string} targetSectionId - UUID de la section destination
   */
  moveGroup: async (groupId, sourceSectionId, targetSectionId) => {
    try {
      const token = useAuthStore.getState().getToken();

      // Appeler le backend pour update le section_id
      const response = await groupsService.update(groupId, { section_id: targetSectionId }, token);
      const movedGroup = response.data.data.group;

      // Mettre à jour le state local
      set((state) => {
        const sourceGroups = state.groupsBySection[sourceSectionId] || [];
        const targetGroups = state.groupsBySection[targetSectionId] || [];

        // Retirer de la section source
        const newSourceGroups = sourceGroups.filter(g => g.id !== groupId);

        // Ajouter à la section cible
        const newTargetGroups = [...targetGroups, movedGroup];

        return {
          groupsBySection: {
            ...state.groupsBySection,
            [sourceSectionId]: newSourceGroups,
            [targetSectionId]: newTargetGroups
          }
        };
      });

      return { success: true, group: movedGroup };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Mettre à jour le layout (column_count) d'un group
   * @param {string} id - UUID du group
   * @param {number} columnCount - Nouveau nombre de colonnes (1-6)
   */
  updateGroupLayout: async (id, columnCount) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await groupsService.updateLayout(id, columnCount, token);
      const updatedGroup = response.data.data.group;

      // Mettre à jour dans le state
      set((state) => {
        const sectionId = updatedGroup.section_id;
        const currentGroups = state.groupsBySection[sectionId] || [];
        const updatedGroups = currentGroups.map((g) =>
          g.id === id ? updatedGroup : g
        );

        return {
          groupsBySection: {
            ...state.groupsBySection,
            [sectionId]: updatedGroups
          },
          loading: false,
          error: null
        };
      });

      return { success: true, group: updatedGroup };
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
   * Obtenir les statistiques des groups d'une section
   * @param {string} sectionId - UUID de la section
   */
  getStats: async (sectionId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await groupsService.getStats(sectionId, token);
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

  /**
   * Dupliquer un group avec tous ses bookmarks
   * @param {string} groupId - UUID du group à dupliquer
   * @param {string} sectionId - UUID de la section (pour mise à jour du state)
   */
  duplicateGroup: async (groupId, sectionId) => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().getToken();
      const response = await groupsService.duplicate(groupId, token);
      const newGroup = response.data.data.group;

      // Ajouter le group dupliqué au state pour cette section
      set((state) => {
        const currentGroups = state.groupsBySection[sectionId] || [];
        return {
          groupsBySection: {
            ...state.groupsBySection,
            [sectionId]: [...currentGroups, newGroup]
          },
          loading: false,
          error: null
        };
      });

      return { success: true, group: newGroup };
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
   * Obtenir les groups d'une section depuis le state
   * @param {string} sectionId - UUID de la section
   * @returns {Array} Groups de la section ou []
   */
  getGroupsForSection: (sectionId) => {
    return get().groupsBySection[sectionId] || [];
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Find existing Inbox group across all sections
   * @returns {object|null} Inbox group or null
   */
  findInboxGroup: () => {
    const state = get();
    const allGroups = Object.values(state.groupsBySection).flat();
    // Look for a group named "Inbox" or "📥 Inbox" that is manual type
    return allGroups.find(g =>
      (g.name === 'Inbox' || g.name === '📥 Inbox') &&
      g.group_type === 'manual'
    ) || null;
  },

  /**
   * Find or create an Inbox group for quick adds
   * @param {string} sectionId - Section to create inbox in if needed
   * @returns {Promise<object>} Inbox group
   */
  findOrCreateInboxGroup: async (sectionId) => {
    const state = get();

    // First, try to find existing Inbox group
    const existingInbox = state.findInboxGroup();
    if (existingInbox) {
      return existingInbox;
    }

    // No inbox exists, create one in the specified section
    const result = await state.createGroup(sectionId, {
      name: '📥 Inbox',
      column_count: 1,
      group_type: 'manual'
    });

    if (result.success) {
      return result.group;
    }

    throw new Error(result.error || 'Failed to create Inbox group');
  },

  /**
   * Get the first manual group for a page (for quick add fallback)
   * @returns {object|null} First manual group or null
   */
  getFirstManualGroup: () => {
    const state = get();
    const allGroups = Object.values(state.groupsBySection).flat();
    return allGroups.find(g => g.group_type === 'manual') || null;
  },

  /**
   * Reset store (logout ou changement de section)
   */
  reset: () => {
    set({
      groupsBySection: {},
      loading: false,
      error: null,
      stats: null
    });
  }
}));
