import { create } from 'zustand';
import cacheService from '../services/cacheService';

// Load persisted favicon size from localStorage
const getPersistedFaviconSize = () => {
    try {
        const stored = localStorage.getItem('pingrid_faviconSize');
        if (stored) {
            const size = parseInt(stored, 10);
            if (!isNaN(size) && size >= 12 && size <= 64) {
                return size;
            }
        }
    } catch (e) {
        console.warn('Failed to load favicon size from localStorage:', e);
    }
    return 24; // Default favicon size
};

// Load persisted font size from localStorage
const getPersistedFontSize = () => {
    try {
        const stored = localStorage.getItem('pingrid_fontSize');
        if (stored) {
            const size = parseInt(stored, 10);
            if (!isNaN(size) && size >= 10 && size <= 24) {
                return size;
            }
        }
    } catch (e) {
        console.warn('Failed to load font size from localStorage:', e);
    }
    return 13; // Default font size
};

/**
 * View Mode Store (Zustand)
 * 
 * Manages Edit/View mode toggle and cached page data.
 * 
 * State:
 * - mode: 'view' | 'edit'
 * - cachedPages: { pageId: data } - In-memory copy of IndexedDB cache
 * - isGeneratingCache: Boolean - True while generating cache
 * 
 * Actions:
 * - setMode: Switch between view/edit
 * - loadCaches: Load all caches from IndexedDB on startup
 * - generatePageCache: Create static snapshot of current page
 * - getCacheForPage: Get cached data for a page
 */
export const useViewModeStore = create((set, get) => ({
    // ============================================
    // STATE
    // ============================================
    mode: 'edit',  // Default to edit on first load (no cache yet)
    cachedPages: {},
    isGeneratingCache: false,
    cacheLoaded: false,
    faviconSize: getPersistedFaviconSize(),  // Default favicon size in pixels (range: 12-64)
    fontSize: getPersistedFontSize(),  // Default font size in pixels (range: 10-24)

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Set the current mode
     * @param {'view' | 'edit'} newMode
     */
    setMode: (newMode) => {
        set({ mode: newMode });
    },

    /**
     * Toggle between view and edit mode
     */
    toggleMode: () => {
        const currentMode = get().mode;
        set({ mode: currentMode === 'view' ? 'edit' : 'view' });
    },

    /**
     * Set the favicon size for bookmark cards
     * @param {number} size - Size in pixels (12-64)
     */
    setFaviconSize: (size) => {
        const clampedSize = Math.min(64, Math.max(12, size));
        // Persist to localStorage
        try {
            localStorage.setItem('pingrid_faviconSize', clampedSize.toString());
        } catch (e) {
            console.warn('Failed to persist favicon size:', e);
        }
        set({ faviconSize: clampedSize });
    },

    /**
     * Set the font size for bookmark cards
     * @param {number} size - Size in pixels (10-24)
     */
    setFontSize: (size) => {
        const clampedSize = Math.min(24, Math.max(10, size));
        // Persist to localStorage
        try {
            localStorage.setItem('pingrid_fontSize', clampedSize.toString());
        } catch (e) {
            console.warn('Failed to persist font size:', e);
        }
        set({ fontSize: clampedSize });
    },

    /**
     * Load all cached pages from IndexedDB
     * Call this on app startup
     */
    loadCaches: async () => {
        try {
            const caches = await cacheService.getAllPageCaches();
            const hasCache = Object.keys(caches).length > 0;

            set({
                cachedPages: caches,
                cacheLoaded: true,
                // If we have cached pages, start in view mode
                mode: hasCache ? 'view' : 'edit'
            });

            return { success: true, hasCache };
        } catch (error) {
            console.error('Error loading caches:', error);
            set({ cacheLoaded: true, mode: 'edit' });
            return { success: false, error: error.message };
        }
    },

    /**
     * Generate and save cache for a page
     * Filters out Inbox groups (staging area, not for display)
     * @param {string} pageId - UUID of the page
     * @param {object} pageData - Full page data (sections, groups, bookmarks)
     */
    generatePageCache: async (pageId, pageData) => {
        set({ isGeneratingCache: true });

        try {
            // Filter out Inbox groups from all sections
            const filteredData = {
                ...pageData,
                sections: pageData.sections?.map(section => ({
                    ...section,
                    groups: section.groups?.filter(group =>
                        group.name !== 'Inbox' &&
                        group.name !== '📥 Inbox'
                    ) || []
                })) || []
            };

            // Save filtered data to IndexedDB
            await cacheService.savePageCache(pageId, filteredData);

            // Update in-memory cache with filtered data
            set((state) => ({
                cachedPages: {
                    ...state.cachedPages,
                    [pageId]: filteredData
                },
                isGeneratingCache: false
            }));

            return { success: true };
        } catch (error) {
            console.error('Error generating cache:', error);
            set({ isGeneratingCache: false });
            return { success: false, error: error.message };
        }
    },

    /**
     * Get cached data for a specific page
     * @param {string} pageId
     * @returns {object|null}
     */
    getCacheForPage: (pageId) => {
        return get().cachedPages[pageId] || null;
    },

    /**
     * Check if a page has cached data
     * @param {string} pageId
     * @returns {boolean}
     */
    hasCache: (pageId) => {
        return !!get().cachedPages[pageId];
    },

    /**
     * Clear cache for a specific page
     * @param {string} pageId
     */
    clearPageCache: async (pageId) => {
        try {
            await cacheService.clearPageCache(pageId);

            set((state) => {
                const newCaches = { ...state.cachedPages };
                delete newCaches[pageId];
                return { cachedPages: newCaches };
            });

            return { success: true };
        } catch (error) {
            console.error('Error clearing page cache:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Clear all caches
     */
    clearAllCaches: async () => {
        try {
            await cacheService.clearAllCaches();
            set({ cachedPages: {}, mode: 'edit' });
            return { success: true };
        } catch (error) {
            console.error('Error clearing all caches:', error);
            return { success: false, error: error.message };
        }
    }
}));
