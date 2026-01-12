import BookmarkCard from './BookmarkCard';
import { useTheme } from '../../../shared/theme/useTheme';
import { useKeyboardNavigation } from '../../../shared/context/KeyboardNavigationContext';

/**
 * BookmarkColumn Component - Compact Edit Mode Design
 *
 * Features:
 * - No header labels to save space
 * - Minimal placeholder for empty columns
 * - D&D visual feedback
 */
export default function BookmarkColumn({
  columnNumber,
  bookmarks,
  onEditBookmark,
  onDeleteBookmark,
  onBookmarkClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedBookmark,
  sourceColumn,
  hoveredColumn,
  hoveredBookmarkId
}) {
  const { theme } = useTheme();
  const { selectedBookmarkId } = useKeyboardNavigation();
  const shouldHighlight = draggedBookmark &&
    hoveredColumn === columnNumber &&
    sourceColumn !== columnNumber;

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(null, columnNumber, e);
  };

  const handleColumnDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedBookmark && sourceColumn !== columnNumber) {
      await onDrop(null, columnNumber);
    }
  };

  // Create theme-aware styles
  const themedStyles = {
    column: {
      ...styles.column,
      borderColor: theme.colors.border
    },
    columnHighlight: {
      ...styles.columnHighlight,
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}14`,
      boxShadow: `inset 0 0 12px ${theme.colors.primary}26`
    },
    emptyIcon: {
      ...styles.emptyIcon,
      color: theme.colors.textMuted
    }
  };

  return (
    <div
      style={{
        ...themedStyles.column,
        ...(shouldHighlight ? themedStyles.columnHighlight : {})
      }}
      onDragOver={handleColumnDragOver}
      onDrop={handleColumnDrop}
    >
      {/* Bookmarks - no header */}
      {bookmarks.length === 0 ? (
        <div style={styles.emptyColumn}>
          <span style={themedStyles.emptyIcon}>+</span>
        </div>
      ) : (
        bookmarks.map((bookmark) => {
          // Show drop target visual when hovering over a different bookmark
          const isDropTarget = hoveredBookmarkId === bookmark.id &&
            draggedBookmark &&
            draggedBookmark.id !== bookmark.id;
          // Check if this bookmark is selected for keyboard navigation
          const isSelected = selectedBookmarkId === bookmark.id;
          return (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={onEditBookmark}
              onDelete={onDeleteBookmark}
              onClick={onBookmarkClick}
              onDragStart={(e) => onDragStart(bookmark, columnNumber, e)}
              onDragOver={(e) => onDragOver(bookmark, columnNumber, e)}
              onDrop={(e) => onDrop(bookmark, columnNumber, e)}
              onDragEnd={onDragEnd}
              isDragging={draggedBookmark?.id === bookmark.id}
              isDropTarget={isDropTarget}
              isSelected={isSelected}
            />
          );
        })
      )}
    </div>
  );
}

const styles = {
  column: {
    flex: '1 1 0',
    minWidth: '140px',
    backgroundColor: 'transparent',
    border: '1px dashed',
    borderRadius: '4px',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'all 0.2s',
    minHeight: '60px'
  },

  columnHighlight: {
    borderStyle: 'solid'
  },

  emptyColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    minHeight: '40px'
  },

  emptyIcon: {
    fontSize: '18px',
    fontWeight: '300'
  }
};
