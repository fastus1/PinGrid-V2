import { useSearchStore } from '../store/searchStore';
import { useBookmarksStore } from '../../features/bookmarks/store/bookmarksStore';
import { useViewModeStore } from '../store/viewModeStore';
import { useTheme } from '../theme/useTheme';
import { useKeyboardNavigation } from '../context/KeyboardNavigationContext';

/**
 * SearchResultsView Component
 * Displays global search results in a clean grid layout
 *
 * Features:
 * - Shows all matching bookmarks across all pages/sections/groups
 * - Displays context (Page > Section > Group) for each result
 * - Click to open bookmark + track click
 * - Keyboard navigation support
 */
export default function SearchResultsView() {
    const { searchQuery, searchResults, totalMatches } = useSearchStore();
    const { trackClick } = useBookmarksStore();
    const { faviconSize, fontSize } = useViewModeStore();
    const { theme } = useTheme();
    const { selectedBookmarkId } = useKeyboardNavigation();

    const handleBookmarkClick = (result) => {
        // Track the click
        trackClick(result.bookmark.id, result.group.id);
        // Open in new tab
        window.open(result.bookmark.url, '_blank', 'noopener,noreferrer');
    };

    // Theme-aware styles
    const themedStyles = {
        container: {
            ...styles.container,
            backgroundColor: theme.colors.background
        },
        header: {
            ...styles.header,
            color: theme.colors.textPrimary
        },
        resultsCount: {
            ...styles.resultsCount,
            color: theme.colors.textMuted
        },
        grid: {
            ...styles.grid
        },
        resultCard: {
            ...styles.resultCard,
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
            backdropFilter: `blur(${theme.glass.blur})`,
            WebkitBackdropFilter: `blur(${theme.glass.blur})`
        },
        resultCardSelected: {
            borderColor: theme.colors.primary,
            backgroundColor: `${theme.colors.primary}14`,
            boxShadow: `0 0 0 2px ${theme.colors.primary}, 0 0 20px ${theme.colors.primary}40`
        },
        resultCardHover: {
            backgroundColor: theme.colors.cardBgHover,
            borderColor: theme.glow.color,
            boxShadow: `0 0 ${theme.glow.intensity} ${theme.glow.color}`,
            transform: 'translateY(-2px)'
        },
        bookmarkTitle: {
            ...styles.bookmarkTitle,
            color: theme.colors.textPrimary,
            fontSize: `${fontSize}px`
        },
        context: {
            ...styles.context,
            color: theme.colors.textMuted
        },
        contextIcon: {
            ...styles.contextIcon,
            color: theme.colors.textSecondary
        },
        emptyState: {
            ...styles.emptyState,
            color: theme.colors.textMuted
        }
    };

    if (!searchQuery || searchResults.length === 0) {
        return (
            <div style={themedStyles.container}>
                <div style={themedStyles.emptyState}>
                    {searchQuery ? (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                No results found
                            </div>
                            <div style={{ fontSize: '14px' }}>
                                Try a different search term
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                Start searching
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={themedStyles.container}>
            <div style={themedStyles.header}>
                Search Results
                <span style={themedStyles.resultsCount}>
                    {totalMatches} {totalMatches === 1 ? 'result' : 'results'} for "{searchQuery}"
                </span>
            </div>

            <div style={themedStyles.grid} data-search-grid>
                {searchResults.map((result, searchIndex) => {
                    // Unique instance ID for search results
                    const instanceId = `search-${searchIndex}`;
                    const isSelected = selectedBookmarkId === instanceId;

                    return (
                        <div
                            key={instanceId}
                            data-bookmark-id={instanceId}
                            data-bookmark-url={result.bookmark.url}
                            style={{
                                ...themedStyles.resultCard,
                                ...(isSelected ? themedStyles.resultCardSelected : {})
                            }}
                            onClick={() => handleBookmarkClick(result)}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    Object.assign(e.currentTarget.style, themedStyles.resultCardHover);
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    Object.assign(e.currentTarget.style, {
                                        backgroundColor: themedStyles.resultCard.backgroundColor,
                                        borderColor: themedStyles.resultCard.borderColor,
                                        boxShadow: 'none',
                                        transform: 'translateY(0)'
                                    });
                                }
                            }}
                        >
                            {/* Favicon */}
                            <div style={styles.faviconContainer}>
                                {result.bookmark.favicon_url ? (
                                    <img
                                        src={result.bookmark.favicon_url}
                                        alt=""
                                        style={{
                                            width: `${faviconSize}px`,
                                            height: `${faviconSize}px`,
                                            borderRadius: '4px'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: `${faviconSize}px`,
                                        height: `${faviconSize}px`,
                                        fontSize: `${Math.max(10, faviconSize - 4)}px`
                                    }}>
                                        🔖
                                    </div>
                                )}
                            </div>

                            {/* Bookmark Info */}
                            <div style={styles.bookmarkInfo}>
                                <div style={themedStyles.bookmarkTitle} title={result.bookmark.title}>
                                    {result.bookmark.title}
                                </div>
                                <div style={themedStyles.context}>
                                    <span style={themedStyles.contextIcon}>{result.page.icon}</span>
                                    {result.page.name}
                                    <span style={{ margin: '0 6px', opacity: 0.5 }}>›</span>
                                    {result.section.name}
                                    <span style={{ margin: '0 6px', opacity: 0.5 }}>›</span>
                                    {result.group.name}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const styles = {
    container: {
        flex: 1,
        padding: '32px',
        overflowY: 'auto'
    },
    header: {
        fontSize: '28px',
        fontWeight: '700',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    resultsCount: {
        fontSize: '16px',
        fontWeight: '400',
        opacity: 0.7
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        alignItems: 'start'
    },
    resultCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        borderRadius: '10px',
        border: '1px solid',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minHeight: '70px'
    },
    faviconContainer: {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    bookmarkInfo: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    bookmarkTitle: {
        fontWeight: '600',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    context: {
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    contextIcon: {
        fontSize: '14px',
        marginRight: '2px'
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center'
    }
};
