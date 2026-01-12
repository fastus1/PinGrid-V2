import { createContext, useContext, useState, useCallback } from 'react';
import { useBookmarksStore } from '../../features/bookmarks/store/bookmarksStore';

const KeyboardNavigationContext = createContext(null);

/**
 * KeyboardNavigationProvider
 *
 * Simple row-based keyboard navigation for bookmarks.
 * Groups all bookmarks into visual rows based on Y position,
 * then navigates row by row (UP/DOWN) or within row (LEFT/RIGHT).
 */
export function KeyboardNavigationProvider({ children }) {
    const [selectedBookmarkId, setSelectedBookmarkId] = useState(null);

    /**
     * Build a 2D grid of bookmarks organized by visual rows
     * Elements within ~30px of the same Y are considered same row
     */
    const buildVisualGrid = useCallback(() => {
        const elements = Array.from(document.querySelectorAll('[data-bookmark-id]'));
        if (elements.length === 0) return [];

        // Get positions for all elements
        const items = elements.map(el => {
            const rect = el.getBoundingClientRect();
            return {
                id: el.getAttribute('data-bookmark-id'),
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                element: el
            };
        });

        // Sort by Y first, then X
        items.sort((a, b) => {
            if (Math.abs(a.y - b.y) < 30) {
                return a.x - b.x; // Same row, sort by X
            }
            return a.y - b.y; // Different rows, sort by Y
        });

        // Group into rows (elements within 30px Y of each other)
        const rows = [];
        let currentRow = [];
        let currentRowY = null;

        items.forEach(item => {
            if (currentRowY === null || Math.abs(item.y - currentRowY) < 30) {
                currentRow.push(item);
                if (currentRowY === null) currentRowY = item.y;
            } else {
                // New row
                if (currentRow.length > 0) {
                    // Sort row by X position
                    currentRow.sort((a, b) => a.x - b.x);
                    rows.push(currentRow);
                }
                currentRow = [item];
                currentRowY = item.y;
            }
        });

        // Don't forget the last row
        if (currentRow.length > 0) {
            currentRow.sort((a, b) => a.x - b.x);
            rows.push(currentRow);
        }

        return rows;
    }, []);

    /**
     * Find current position in the grid
     */
    const findPosition = useCallback((grid, bookmarkId) => {
        for (let rowIdx = 0; rowIdx < grid.length; rowIdx++) {
            for (let colIdx = 0; colIdx < grid[rowIdx].length; colIdx++) {
                if (grid[rowIdx][colIdx].id === bookmarkId) {
                    return { row: rowIdx, col: colIdx };
                }
            }
        }
        return null;
    }, []);

    /**
     * Scroll to bookmark
     */
    const scrollToBookmark = useCallback((bookmarkId) => {
        if (!bookmarkId) return;
        setTimeout(() => {
            const element = document.querySelector(`[data-bookmark-id="${bookmarkId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    }, []);

    /**
     * Navigate UP - go to previous row, closest X position
     */
    const navigateUp = useCallback(() => {
        const grid = buildVisualGrid();
        if (grid.length === 0) return;

        if (!selectedBookmarkId) {
            // Select first bookmark
            const firstId = grid[0][0].id;
            setSelectedBookmarkId(firstId);
            scrollToBookmark(firstId);
            return;
        }

        const pos = findPosition(grid, selectedBookmarkId);
        if (!pos) return;

        if (pos.row > 0) {
            // Go to previous row
            const prevRow = grid[pos.row - 1];
            const currentX = grid[pos.row][pos.col].x;

            // Find closest X in previous row
            let closestIdx = 0;
            let closestDist = Math.abs(prevRow[0].x - currentX);
            for (let i = 1; i < prevRow.length; i++) {
                const dist = Math.abs(prevRow[i].x - currentX);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIdx = i;
                }
            }

            const newId = prevRow[closestIdx].id;
            setSelectedBookmarkId(newId);
            scrollToBookmark(newId);
        }
    }, [selectedBookmarkId, buildVisualGrid, findPosition, scrollToBookmark]);

    /**
     * Navigate DOWN - go to next row, closest X position
     */
    const navigateDown = useCallback(() => {
        const grid = buildVisualGrid();
        if (grid.length === 0) return;

        if (!selectedBookmarkId) {
            const firstId = grid[0][0].id;
            setSelectedBookmarkId(firstId);
            scrollToBookmark(firstId);
            return;
        }

        const pos = findPosition(grid, selectedBookmarkId);
        if (!pos) return;

        if (pos.row < grid.length - 1) {
            // Go to next row
            const nextRow = grid[pos.row + 1];
            const currentX = grid[pos.row][pos.col].x;

            // Find closest X in next row
            let closestIdx = 0;
            let closestDist = Math.abs(nextRow[0].x - currentX);
            for (let i = 1; i < nextRow.length; i++) {
                const dist = Math.abs(nextRow[i].x - currentX);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIdx = i;
                }
            }

            const newId = nextRow[closestIdx].id;
            setSelectedBookmarkId(newId);
            scrollToBookmark(newId);
        }
    }, [selectedBookmarkId, buildVisualGrid, findPosition, scrollToBookmark]);

    /**
     * Navigate LEFT - go to previous element in same row
     */
    const navigateLeft = useCallback(() => {
        const grid = buildVisualGrid();
        if (grid.length === 0) return;

        if (!selectedBookmarkId) {
            const firstId = grid[0][0].id;
            setSelectedBookmarkId(firstId);
            scrollToBookmark(firstId);
            return;
        }

        const pos = findPosition(grid, selectedBookmarkId);
        if (!pos) return;

        if (pos.col > 0) {
            // Move left in same row
            const newId = grid[pos.row][pos.col - 1].id;
            setSelectedBookmarkId(newId);
            scrollToBookmark(newId);
        } else if (pos.row > 0) {
            // Wrap to end of previous row
            const prevRow = grid[pos.row - 1];
            const newId = prevRow[prevRow.length - 1].id;
            setSelectedBookmarkId(newId);
            scrollToBookmark(newId);
        }
    }, [selectedBookmarkId, buildVisualGrid, findPosition, scrollToBookmark]);

    /**
     * Navigate RIGHT - go to next element in same row
     */
    const navigateRight = useCallback(() => {
        const grid = buildVisualGrid();
        if (grid.length === 0) return;

        if (!selectedBookmarkId) {
            const firstId = grid[0][0].id;
            setSelectedBookmarkId(firstId);
            scrollToBookmark(firstId);
            return;
        }

        const pos = findPosition(grid, selectedBookmarkId);
        if (!pos) return;

        const currentRow = grid[pos.row];
        if (pos.col < currentRow.length - 1) {
            // Move right in same row
            const newId = currentRow[pos.col + 1].id;
            setSelectedBookmarkId(newId);
            scrollToBookmark(newId);
        } else if (pos.row < grid.length - 1) {
            // Wrap to start of next row
            const newId = grid[pos.row + 1][0].id;
            setSelectedBookmarkId(newId);
            scrollToBookmark(newId);
        }
    }, [selectedBookmarkId, buildVisualGrid, findPosition, scrollToBookmark]);

    /**
     * Open selected bookmark
     */
    const openSelectedBookmark = useCallback(() => {
        if (!selectedBookmarkId) return;

        const element = document.querySelector(`[data-bookmark-id="${selectedBookmarkId}"]`);
        if (element) {
            // Get URL from data-bookmark-url (for divs in search) or href (for links)
            const url = element.getAttribute('data-bookmark-url') || element.getAttribute('href');
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    }, [selectedBookmarkId]);

    /**
     * Select a bookmark by ID
     */
    const selectBookmark = useCallback((bookmarkId) => {
        setSelectedBookmarkId(bookmarkId);
        scrollToBookmark(bookmarkId);
    }, [scrollToBookmark]);

    /**
     * Clear selection
     */
    const clearSelection = useCallback(() => {
        setSelectedBookmarkId(null);
    }, []);

    const value = {
        selectedBookmarkId,
        selectBookmark,
        navigateUp,
        navigateDown,
        navigateLeft,
        navigateRight,
        openSelectedBookmark,
        clearSelection
    };

    return (
        <KeyboardNavigationContext.Provider value={value}>
            {children}
        </KeyboardNavigationContext.Provider>
    );
}

/**
 * Hook to use keyboard navigation
 */
export function useKeyboardNavigation() {
    const context = useContext(KeyboardNavigationContext);
    if (!context) {
        throw new Error('useKeyboardNavigation must be used within KeyboardNavigationProvider');
    }
    return context;
}
