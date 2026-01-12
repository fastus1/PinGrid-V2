import { useState } from 'react';
import BookmarkList from '../../bookmarks/components/BookmarkList';
import CreateBookmarkModal from '../../bookmarks/components/CreateBookmarkModal';
import EditBookmarkModal from '../../bookmarks/components/EditBookmarkModal';
import { useBookmarksStore } from '../../bookmarks/store/bookmarksStore';
import { useBookmarkDrag } from '../../bookmarks/context/BookmarkDragContext';
import { useTheme } from '../../../shared/theme/useTheme';

/**
 * GroupCard Component
 * Affiche un group individuel (Design Refonte 4.5)
 *
 * Features:
 * - Minimal design: drag handle + name + actions
 * - Dynamic width based on totalGroups (1=100%, 2=50%, 3=33%, etc.)
 * - Displays bookmarks list
 * - Drag & Drop support for reordering
 *
 * @param {object} group - Objet group { id, name, column_count, group_type, bookmark_limit }
 * @param {number} totalGroups - Total number of groups in the section (for width calculation)
 * @param {function} onEdit - Callback pour éditer le group
 * @param {function} onDelete - Callback pour supprimer le group
 * @param {function} onDragStart - Drag start handler
 * @param {function} onDragOver - Drag over handler
 * @param {function} onDrop - Drop handler
 * @param {boolean} isDragging - True if this group is being dragged
 */
export default function GroupCard({ group, totalGroups, onEdit, onDelete, onDuplicate, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDropTarget }) {
  const { deleteBookmark, moveBookmark } = useBookmarksStore();
  const { draggedBookmark, sourceGroupId, endDrag } = useBookmarkDrag();
  const { theme } = useTheme();

  // Modal states
  const [showCreateBookmark, setShowCreateBookmark] = useState(false);
  const [showEditBookmark, setShowEditBookmark] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState(null);
  const [bookmarkHovering, setBookmarkHovering] = useState(false);

  // Check if a bookmark from another group is being dragged over this group
  const isReceivingBookmark = !!(draggedBookmark && sourceGroupId !== group.id && bookmarkHovering);

  // Get actual width - use group.width if set, with some gap adjustment
  const getActualWidth = () => {
    const width = group.width || '100%';
    // For widths less than 100%, subtract gap from calc
    if (width === '100%') return '100%';
    if (width === '75%') return 'calc(75% - 9px)';
    if (width === '66%') return 'calc(66.66% - 8px)';
    if (width === '50%') return 'calc(50% - 6px)';
    if (width === '33%') return 'calc(33.33% - 8px)';
    if (width === '25%') return 'calc(25% - 9px)';
    return width;
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(group);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(group);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    onDuplicate(group);
  };

  // Bookmark handlers
  const handleAddBookmark = () => {
    setShowCreateBookmark(true);
  };

  const handleEditBookmark = (bookmark) => {
    setSelectedBookmark(bookmark);
    setShowEditBookmark(true);
  };

  const handleDeleteBookmark = async (bookmark) => {
    if (window.confirm(`Delete bookmark "${bookmark.title}"?`)) {
      await deleteBookmark(bookmark.id, group.id);
    }
  };

  // Create theme-aware styles with glassmorphism
  const themedStyles = {
    card: {
      ...styles.card,
      backgroundColor: theme.colors.cardBg,
      borderColor: theme.colors.border,
      backdropFilter: `blur(${theme.glass.blur})`,
      WebkitBackdropFilter: `blur(${theme.glass.blur})`
    },
    cardDragging: {
      ...styles.cardDragging
    },
    cardDropTarget: {
      ...styles.cardDropTarget,
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}14`
    },
    cardReceivingBookmark: {
      ...styles.cardReceivingBookmark,
      borderColor: theme.colors.secondary,
      boxShadow: `inset 0 0 20px ${theme.colors.secondary}14`,
      backgroundColor: `${theme.colors.secondary}0a`
    },
    dragHandle: {
      ...styles.dragHandle,
      color: theme.colors.textMuted
    },
    groupName: {
      ...styles.name,
      color: theme.colors.textPrimary
    },
    addButton: {
      ...styles.addButton,
      backgroundColor: theme.colors.cardBg,
      color: theme.colors.primary,
      borderColor: theme.colors.border
    },
    actionButton: {
      ...styles.actionButton,
      color: theme.colors.textSecondary
    },
    actionButtonDelete: {
      ...styles.actionButtonDelete,
      color: theme.colors.error
    }
  };

  return (
    <div
      style={{
        ...themedStyles.card,
        width: getActualWidth(),
        ...(isDragging ? themedStyles.cardDragging : {}),
        ...(isDropTarget ? themedStyles.cardDropTarget : {}),
        ...(isReceivingBookmark ? themedStyles.cardReceivingBookmark : {})
      }}
      draggable
      onDragStart={(e) => {
        e.stopPropagation(); // Prevent bubbling to parent SectionCard
        onDragStart(e);
      }}
      onDragOver={(e) => {
        e.stopPropagation();
        onDragOver(e);
        // Track if a bookmark is hovering this group
        if (draggedBookmark && sourceGroupId !== group.id) {
          setBookmarkHovering(true);
        }
      }}
      onDrop={async (e) => {
        e.stopPropagation();
        e.preventDefault();
        setBookmarkHovering(false);

        // Check if a BOOKMARK is being dropped (from another group)
        if (draggedBookmark && sourceGroupId !== group.id) {
          // Move the bookmark to this group
          await moveBookmark(draggedBookmark.id, sourceGroupId, group.id);
          endDrag();
          return;
        }

        // Otherwise, it's a GROUP being dropped - call the parent handler
        onDrop(e);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        setBookmarkHovering(false);
        onDragEnd(e);
      }}
      onDragLeave={(e) => {
        // Only reset if leaving the card (not entering a child)
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setBookmarkHovering(false);
        }
      }}
    >
      {/* Compact Header: drag + name + actions */}
      <div style={styles.header}>
        <div style={themedStyles.dragHandle} title="Drag to reorder">
          ⋮⋮
        </div>
        <h5 style={themedStyles.groupName}>{group.name}</h5>

        {/* Action buttons */}
        <div style={styles.actions}>
          <button
            onClick={handleAddBookmark}
            style={themedStyles.addButton}
            title="Add bookmark"
          >
            +
          </button>
          <button
            onClick={handleEdit}
            style={themedStyles.actionButton}
            title="Edit group"
          >
            ✎
          </button>
          <button
            onClick={handleDuplicate}
            style={themedStyles.actionButton}
            title="Duplicate group"
          >
            ⧉
          </button>
          <button
            onClick={handleDelete}
            style={themedStyles.actionButtonDelete}
            title="Delete group"
          >
            ×
          </button>
        </div>
      </div>

      {/* Bookmarks List */}
      <div style={styles.bookmarksContainer}>
        <BookmarkList
          groupId={group.id}
          columnCount={group.column_count}
          onAddBookmark={handleAddBookmark}
          onEditBookmark={handleEditBookmark}
          onDeleteBookmark={handleDeleteBookmark}
        />
      </div>

      {/* Modals */}
      <CreateBookmarkModal
        isOpen={showCreateBookmark}
        onClose={() => setShowCreateBookmark(false)}
        groupId={group.id}
      />

      <EditBookmarkModal
        isOpen={showEditBookmark}
        onClose={() => {
          setShowEditBookmark(false);
          setSelectedBookmark(null);
        }}
        bookmark={selectedBookmark}
        groupId={group.id}
      />
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#141a24',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#1e3a5f',
    borderRadius: '6px',
    padding: '8px',
    transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s, transform 0.15s ease',
    minHeight: '80px',
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    flexShrink: 0,
    flexGrow: 0
  },

  cardDragging: {
    opacity: 0.5,
    cursor: 'grabbing'
  },

  cardDropTarget: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.4), inset 0 0 15px rgba(59, 130, 246, 0.15)',
    transform: 'scale(1.01)'
  },

  cardReceivingBookmark: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.1)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px'
  },

  dragHandle: {
    fontSize: '10px',
    cursor: 'grab',
    userSelect: 'none',
    padding: '2px'
  },

  name: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  actions: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center'
  },

  addButton: {
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    color: '#5e7795',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '3px 5px'
  },

  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '4px',
    color: '#5e7795',
    transition: 'color 0.15s, background-color 0.15s'
  },

  actionButtonDelete: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#5e7795',
    transition: 'color 0.15s, background-color 0.15s'
  },

  bookmarksContainer: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden'
  }
};
