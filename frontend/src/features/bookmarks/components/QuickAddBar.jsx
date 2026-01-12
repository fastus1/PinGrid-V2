import { useState } from 'react';
import { useBookmarksStore } from '../../bookmarks/store/bookmarksStore';
import { useGroupsStore } from '../../groups/store/groupsStore';
import { useSectionsStore } from '../../sections/store/sectionsStore';
import { useTheme } from '../../../shared/theme/useTheme';

/**
 * QuickAddBar Component
 *
 * URL input bar for quickly adding bookmarks via:
 * - Pasting a URL
 * - Drag & drop from browser
 *
 * Adds bookmark to the "📥 Inbox" group (auto-created if needed)
 */
export default function QuickAddBar({ pageId }) {
    const [url, setUrl] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const { createBookmark } = useBookmarksStore();
    const { findInboxGroup, findOrCreateInboxGroup } = useGroupsStore();
    const { getSectionsForPage } = useSectionsStore();
    const { theme } = useTheme();

    const showMessage = (text, isError = false) => {
        setMessage({ text, isError });
        setTimeout(() => setMessage(null), 3000);
    };

    const addBookmark = async (inputUrl) => {
        const trimmedUrl = inputUrl.trim();
        if (!trimmedUrl) return;

        // Validate URL
        try {
            new URL(trimmedUrl);
        } catch {
            showMessage('Invalid URL', true);
            return;
        }

        // Get sections for this page
        const sections = getSectionsForPage(pageId);
        if (!sections || sections.length === 0) {
            showMessage('Create a section first', true);
            return;
        }

        setIsLoading(true);
        try {
            // Find or create Inbox group in first section
            const firstSectionId = sections[0].id;
            let inboxGroup = findInboxGroup();

            if (!inboxGroup) {
                inboxGroup = await findOrCreateInboxGroup(firstSectionId);
            }

            // Extract title from URL (use hostname as fallback)
            const urlObj = new URL(trimmedUrl);
            const title = urlObj.hostname.replace('www.', '');

            await createBookmark(inboxGroup.id, {
                title,
                url: trimmedUrl,
                column: 1
            });

            setUrl('');
            showMessage(`Added to "${inboxGroup.name}"`);
        } catch (error) {
            showMessage(error.message || 'Failed to add', true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addBookmark(url);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        // Try to get URL from various drag data types
        const droppedUrl =
            e.dataTransfer.getData('text/uri-list') ||
            e.dataTransfer.getData('text/plain') ||
            e.dataTransfer.getData('URL');

        if (droppedUrl) {
            addBookmark(droppedUrl.split('\n')[0]); // Take first URL if multiple
        }
    };

    const handlePaste = (e) => {
        // Auto-submit on paste if input was empty
        const pastedText = e.clipboardData.getData('text');
        if (!url && pastedText) {
            setTimeout(() => addBookmark(pastedText), 0);
        }
    };

    // Create theme-aware styles with glassmorphism
    const themedStyles = {
        container: {
            ...styles.container,
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.border,
            backdropFilter: `blur(${theme.glass.blur})`,
            WebkitBackdropFilter: `blur(${theme.glass.blur})`
        },
        containerDragOver: {
            ...styles.containerDragOver,
            borderColor: theme.colors.primary,
            backgroundColor: `${theme.colors.primary}14`
        },
        icon: {
            ...styles.icon,
            color: theme.colors.textMuted
        },
        input: {
            ...styles.input,
            color: theme.colors.textSecondary
        },
        message: styles.message,
        messageSuccess: {
            color: theme.colors.success
        },
        messageError: {
            color: theme.colors.error
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                ...themedStyles.container,
                ...(isDragOver ? themedStyles.containerDragOver : {})
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <span style={themedStyles.icon}>🔗</span>
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste or drop a link here..."
                style={themedStyles.input}
                disabled={isLoading}
            />
            {isLoading && <span style={styles.spinner}>⏳</span>}
            {message && (
                <span style={{
                    ...themedStyles.message,
                    ...(message.isError ? themedStyles.messageError : themedStyles.messageSuccess)
                }}>
                    {message.text}
                </span>
            )}
        </form>
    );
}

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        borderWidth: '1px',
        borderStyle: 'dashed',
        borderRadius: '6px',
        padding: '6px 12px',
        marginRight: '12px',
        transition: 'border-color 0.15s, background-color 0.15s'
    },

    containerDragOver: {
        borderStyle: 'solid'
    },

    icon: {
        fontSize: '14px',
        opacity: 0.6
    },

    input: {
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        fontSize: '13px',
        fontFamily: 'inherit'
    },

    spinner: {
        fontSize: '12px'
    },

    message: {
        fontSize: '11px',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    }
};
