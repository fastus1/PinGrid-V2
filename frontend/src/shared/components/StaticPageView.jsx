import { useState } from 'react';
import { usePagesStore } from '../../features/pages/store/pagesStore';
import { useViewModeStore } from '../store/viewModeStore';
import { useSearchStore } from '../store/searchStore';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useTheme } from '../theme/useTheme';
import { useKeyboardNavigation } from '../context/KeyboardNavigationContext';
import SearchResultsView from './SearchResultsView';

/**
 * StaticPageView Component
 *
 * Lightweight view that renders cached page data.
 * No API calls, no interactive editing, just display.
 * Bookmarks are clickable (links open in new tab).
 * Supports keyboard navigation with arrow keys.
 *
 * Used in View mode for instant page loading.
 */
export default function StaticPageView() {
    const { currentPage } = usePagesStore();
    const { getCacheForPage, faviconSize, fontSize } = useViewModeStore();
    const { isSearchActive } = useSearchStore();
    const { theme } = useTheme();
    const { selectedBookmarkId } = useKeyboardNavigation();

    // Hover state management for bookmark links
    const [hoveredBookmark, setHoveredBookmark] = useState(null);

    // Create theme-aware styles with glassmorphism
    const themedStyles = {
        container: {
            ...styles.container,
            backgroundColor: theme.colors.background
        },
        section: {
            ...styles.section,
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
            backdropFilter: `blur(${theme.glass.blur})`,
            WebkitBackdropFilter: `blur(${theme.glass.blur})`
        },
        sectionTitle: {
            ...styles.sectionTitle,
            color: theme.colors.textSecondary
        },
        group: {
            ...styles.group,
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
            backdropFilter: `blur(${theme.glass.blur})`,
            WebkitBackdropFilter: `blur(${theme.glass.blur})`
        },
        groupTitle: {
            ...styles.groupTitle,
            color: theme.colors.textPrimary
        },
        bookmarkLink: {
            ...styles.bookmarkLink,
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
            backdropFilter: `blur(${theme.glass.blur})`,
            WebkitBackdropFilter: `blur(${theme.glass.blur})`
        },
        bookmarkLinkHovered: {
            backgroundColor: theme.colors.cardBgHover,
            borderColor: theme.glow.color,
            boxShadow: `0 0 ${theme.glow.intensity} ${theme.glow.color}`,
            transform: 'translateY(-2px)',
            transition: theme.glow.transition
        },
        bookmarkLinkSelected: {
            borderColor: theme.colors.primary,
            backgroundColor: `${theme.colors.primary}14`,
            boxShadow: `0 0 0 2px ${theme.colors.primary}, 0 0 20px ${theme.colors.primary}40`
        },
        emptyText: {
            ...styles.emptyText,
            color: theme.colors.textMuted
        },
        emptyHint: {
            ...styles.emptyHint,
            color: theme.colors.textMuted
        },
        emptyColumn: {
            ...styles.emptyColumn,
            color: theme.colors.textMuted
        },
        emptySection: {
            ...styles.emptySection,
            color: theme.colors.textMuted
        },
        visitBadge: {
            ...styles.visitBadge,
            color: theme.colors.primary
        }
    };

    if (!currentPage) {
        return (
            <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📄</div>
                <p style={themedStyles.emptyText}>Select a page to view</p>
            </div>
        );
    }

    const cachedData = getCacheForPage(currentPage.id);

    if (!cachedData) {
        return (
            <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>⏳</div>
                <p style={themedStyles.emptyText}>No cached data for this page</p>
                <p style={themedStyles.emptyHint}>Switch to Edit mode to load and cache this page</p>
            </div>
        );
    }

    // If search is active, show search results instead of cached content
    if (isSearchActive) {
        return <SearchResultsView />;
    }

    return (
        <div style={themedStyles.container}>
            {/* Sections - no header in View mode for max space */}
            <div style={styles.sectionsContainer}>
                {cachedData.sections?.map((section) => (
                    <div key={section.id} style={themedStyles.section}>
                        <h2 style={themedStyles.sectionTitle}>{section.name}</h2>

                        {/* Groups */}
                        <div style={styles.groupsContainer}>
                            {section.groups?.map((group) => {
                                // Calculate width based on group.width
                                const getGroupWidth = () => {
                                    const width = group.width || '100%';
                                    // Gap is 12px, so for N items: each loses (N-1)*gap/N from its percentage
                                    // These match GroupCard.jsx calculations
                                    if (width === '100%') return '100%';
                                    if (width === '75%') return 'calc(75% - 9px)';
                                    if (width === '66%') return 'calc(66.66% - 8px)';
                                    if (width === '50%') return 'calc(50% - 6px)';
                                    if (width === '33%') return 'calc(33.33% - 8px)';
                                    if (width === '25%') return 'calc(25% - 9px)';
                                    return width;
                                };

                                return (
                                    <div key={group.id} style={{
                                        ...themedStyles.group,
                                        flex: 'none',
                                        width: getGroupWidth()
                                    }}>
                                        <h3 style={themedStyles.groupTitle}>{group.name}</h3>

                                        {/* Bookmarks in columns */}
                                        <div style={{
                                            ...styles.columnsContainer,
                                            gridTemplateColumns: `repeat(${group.column_count || 1}, 1fr)`
                                        }}>
                                            {Array.from({ length: group.column_count || 1 }, (_, colIndex) => {
                                                const colNum = colIndex + 1;
                                                const columnBookmarks = group.bookmarks?.filter(b => b.column === colNum) || [];

                                                return (
                                                    <div key={colNum} style={styles.column}>
                                                        {columnBookmarks.map((bookmark, bmIndex) => {
                                                            // Unique instance ID to handle duplicate bookmarks
                                                            const instanceId = `${group.id}-${colNum}-${bmIndex}`;
                                                            const isSelected = selectedBookmarkId === instanceId;
                                                            return (
                                                                <a
                                                                    key={instanceId}
                                                                    data-bookmark-id={instanceId}
                                                                    data-bookmark-url={bookmark.url}
                                                                    href={bookmark.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        ...themedStyles.bookmarkLink,
                                                                        ...(isSelected ? themedStyles.bookmarkLinkSelected : {}),
                                                                        ...(hoveredBookmark === instanceId && !isSelected ? themedStyles.bookmarkLinkHovered : {})
                                                                    }}
                                                                    onMouseEnter={() => setHoveredBookmark(instanceId)}
                                                                    onMouseLeave={() => setHoveredBookmark(null)}
                                                                    onClick={() => {
                                                                        // Track click in background (doesn't block navigation)
                                                                        const token = useAuthStore.getState().getToken();
                                                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                                                                        fetch(`${API_URL}/api/bookmarks/${bookmark.id}/click`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                'Authorization': `Bearer ${token}`
                                                                            }
                                                                        }).catch((err) => { console.error('Click tracking failed:', err); });
                                                                    }}
                                                                >
                                                                    {bookmark.favicon_url && (
                                                                        <img
                                                                            src={bookmark.favicon_url}
                                                                            alt=""
                                                                            style={{ ...styles.favicon, width: `${faviconSize}px`, height: `${faviconSize}px` }}
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    )}
                                                                    <span style={{ ...styles.bookmarkTitle, fontSize: `${fontSize}px` }}>{bookmark.title}</span>
                                                                    {group.group_type === 'dynamic-top-used' && bookmark.visit_count > 0 && (
                                                                        <span style={{ ...themedStyles.visitBadge, fontSize: `${fontSize}px` }} title={`${bookmark.visit_count} clicks`}>
                                                                            {bookmark.visit_count}
                                                                            <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '4px' }}>
                                                                                {/* Cursor arrow */}
                                                                                <path d="M4 4l7 17 2.5-7.5L21 11z" />
                                                                                {/* Click rays */}
                                                                                <path d="M15 3V1M19.5 4.5l1.5-1.5M21 9h2M19.5 13.5l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                                                            </svg>
                                                                        </span>
                                                                    )}
                                                                </a>
                                                            );
                                                        })}

                                                        {columnBookmarks.length === 0 && (
                                                            <div style={themedStyles.emptyColumn}>—</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            })}

                            {(!section.groups || section.groups.length === 0) && (
                                <div style={themedStyles.emptySection}>No groups</div>
                            )}
                        </div>
                    </div>
                ))}

                {(!cachedData.sections || cachedData.sections.length === 0) && (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📦</div>
                        <p style={styles.emptyText}>This page is empty</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '24px',
        backgroundColor: '#0f0f0f',
        minHeight: '100vh'
    },

    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #2d2d3f'
    },

    pageTitle: {
        margin: 0,
        fontSize: '24px',
        fontWeight: '700',
        color: '#e4e4e7'
    },

    viewBadge: {
        fontSize: '12px',
        color: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        padding: '4px 12px',
        borderRadius: '12px',
        fontWeight: '500'
    },

    sectionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },

    section: {
        backgroundColor: '#1a1a2e',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #2d2d3f'
    },

    sectionTitle: {
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#a1a1aa'
    },

    groupsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',  // Match GroupList.jsx gap
        overflowX: 'auto',
        paddingBottom: '4px'
    },

    group: {
        // Width is set dynamically via getGroupWidth()
        // Don't use flex grow/shrink or maxWidth - they would override explicit width
        backgroundColor: '#1e1e2e',
        borderRadius: '6px',
        padding: '12px',
        border: '1px solid #2d2d3f',
        boxSizing: 'border-box',
        minWidth: '280px'  // Prevent collapse at small sizes
    },

    groupTitle: {
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#e4e4e7'
    },

    columnsContainer: {
        display: 'grid',
        gap: '12px'
    },

    column: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },

    bookmarkLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '6px',
        textDecoration: 'none',
        color: '#e4e4e7',
        fontSize: '13px',
        transition: 'background-color 0.2s',
        border: '1px solid transparent'
    },

    favicon: {
        width: '16px',
        height: '16px',
        borderRadius: '3px',
        flexShrink: 0
    },

    bookmarkTitle: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },

    emptyColumn: {
        color: '#52525b',
        fontSize: '12px',
        textAlign: 'center',
        padding: '8px'
    },

    visitBadge: {
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        color: '#22d3ee',
        fontSize: '12px',
        fontWeight: '600',
        flexShrink: 0,
        opacity: 0.85
    },

    emptySection: {
        color: '#52525b',
        fontSize: '13px',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '24px'
    },

    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center'
    },

    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    },

    emptyText: {
        margin: 0,
        fontSize: '16px',
        color: '#71717a'
    },

    emptyHint: {
        margin: '8px 0 0 0',
        fontSize: '13px',
        color: '#52525b'
    }
};
