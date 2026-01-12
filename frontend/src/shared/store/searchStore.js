import { create } from 'zustand';
import { useBookmarksStore } from '../../features/bookmarks/store/bookmarksStore';
import { usePagesStore } from '../../features/pages/store/pagesStore';
import { useSectionsStore } from '../../features/sections/store/sectionsStore';
import { useGroupsStore } from '../../features/groups/store/groupsStore';

/**
 * Search Store (Zustand)
 *
 * Manages global bookmark search functionality with real-time filtering.
 * Searches across ALL bookmarks in ALL pages/sections/groups.
 *
 * State:
 * - searchQuery: Current search query string
 * - isSearchActive: Boolean indicating if search is active
 * - searchResults: Array of search results with context (page/section/group info)
 * - totalMatches: Total number of matching bookmarks
 *
 * Actions:
 * - setSearchQuery: Update search query and trigger filtering
 * - clearSearch: Reset search state
 * - filterBookmarks: Internal filtering logic (case-insensitive title + URL matching)
 */
export const useSearchStore = create((set, get) => ({
    // ============================================
    // STATE
    // ============================================
    searchQuery: '',                    // Current search query
    isSearchActive: false,              // True if search is currently active
    searchResults: [],                  // Array of { bookmark, page, section, group }
    totalMatches: 0,                    // Total number of results

    // ============================================
    // ACTIONS
    // ============================================

    /**
     * Set search query and trigger filtering
     * @param {string} query - Search query string
     */
    setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().filterBookmarks();
    },

    /**
     * Clear search and reset to show all bookmarks
     */
    clearSearch: () => {
        set({
            searchQuery: '',
            isSearchActive: false,
            searchResults: [],
            totalMatches: 0
        });
    },

    // ============================================
    // INTERNAL UTILITIES
    // ============================================

    /**
     * Filter bookmarks based on current search query
     * Searches across ALL bookmarks in ALL pages/sections/groups
     * Returns results with full context
     *
     * Note: Only searches in bookmarks that are already loaded in memory.
     * To search ALL bookmarks, user must have visited all pages first,
     * or we need a backend search endpoint.
     */
    filterBookmarks: async () => {
        const { searchQuery } = get();

        // If query is empty, deactivate search
        if (!searchQuery.trim()) {
            set({
                isSearchActive: false,
                searchResults: [],
                totalMatches: 0
            });
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const results = [];

        // Get all data from stores
        const allPages = usePagesStore.getState().pages;
        const sectionsStore = useSectionsStore.getState();
        const groupsStore = useGroupsStore.getState();
        const bookmarksStore = useBookmarksStore.getState();

        // For each page, load its sections and groups to ensure bookmarks are fetched
        for (const page of allPages) {
            // Fetch sections for this page if not loaded
            await sectionsStore.fetchSections(page.id);
            const sections = sectionsStore.getSectionsForPage(page.id);

            for (const section of sections) {
                // Fetch groups for this section if not loaded
                await groupsStore.fetchGroups(section.id);
                const groups = groupsStore.getGroupsForSection(section.id);

                for (const group of groups) {
                    // Fetch bookmarks for this group if not already loaded
                    let bookmarks = bookmarksStore.bookmarksByGroup[group.id];
                    if (!bookmarks || bookmarks.length === 0) {
                        await bookmarksStore.fetchBookmarks(group.id);
                        bookmarks = bookmarksStore.bookmarksByGroup[group.id] || [];
                    }

                    bookmarks.forEach(bookmark => {
                        const titleMatch = bookmark.title.toLowerCase().includes(query);
                        const urlMatch = bookmark.url.toLowerCase().includes(query);

                        if (titleMatch || urlMatch) {
                            results.push({
                                bookmark,
                                page: { id: page.id, name: page.name, icon: page.icon },
                                section: { id: section.id, name: section.name },
                                group: { id: group.id, name: group.name }
                            });
                        }
                    });
                }
            }
        }

        set({
            isSearchActive: true,
            searchResults: results,
            totalMatches: results.length
        });
    }
}));
