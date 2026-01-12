import { useEffect, useState } from 'react';
import { useBookmarksStore } from '../store/bookmarksStore';
import { useBookmarkDrag } from '../context/BookmarkDragContext';
import BookmarkColumn from './BookmarkColumn';

/**
 * BookmarkList Component
 * Affiche les bookmarks d'un group en colonnes indépendantes
 *
 * Features:
 * - Minimal header avec bouton "Add Bookmark"
 * - Colonnes indépendantes (1-6 colonnes selon column_count)
 * - Drag & drop DANS une colonne pour réorganiser
 * - Drag & drop ENTRE colonnes pour déplacer
 * - Click tracking
 *
 * @param {string} groupId - UUID du group parent
 * @param {number} columnCount - Nombre de colonnes (1-6)
 * @param {function} onAddBookmark - Callback pour ouvrir modal de création
 * @param {function} onEditBookmark - Callback pour éditer un bookmark
 * @param {function} onDeleteBookmark - Callback pour supprimer un bookmark
 */
export default function BookmarkList({ groupId, columnCount = 1, onAddBookmark, onEditBookmark, onDeleteBookmark }) {
  const {
    getBookmarksForGroup,
    fetchBookmarks,
    reorderColumn,
    updateBookmark,
    moveBookmark,
    trackClick,
    loading,
    error
  } = useBookmarksStore();

  const { draggedBookmark, sourceGroupId, startDrag, endDrag } = useBookmarkDrag();
  const [localLoading, setLocalLoading] = useState(true);
  const [dragSourceColumn, setDragSourceColumn] = useState(null);
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [hoveredBookmarkId, setHoveredBookmarkId] = useState(null);
  const bookmarks = getBookmarksForGroup(groupId);

  // Charger les bookmarks au montage du composant
  useEffect(() => {
    const loadBookmarks = async () => {
      setLocalLoading(true);
      await fetchBookmarks(groupId);
      setLocalLoading(false);
    };

    loadBookmarks();
  }, [groupId, fetchBookmarks]);

  // Organiser les bookmarks par colonne
  const bookmarksByColumn = {};
  for (let col = 1; col <= columnCount; col++) {
    bookmarksByColumn[col] = bookmarks.filter(b => b.column === col);
  }

  // Handle bookmark click (track + open)
  const handleBookmarkClick = async (bookmark) => {
    trackClick(bookmark.id, groupId);
  };

  // Drag & Drop handlers
  const handleDragStart = (bookmark, columnNumber, e) => {
    startDrag(bookmark, groupId);
    setDragSourceColumn(columnNumber);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (bookmark, columnNumber, e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Track which column and bookmark is being hovered
    if (hoveredColumn !== columnNumber) {
      setHoveredColumn(columnNumber);
    }
    // Track hovered bookmark for drop target visual
    if (bookmark && hoveredBookmarkId !== bookmark.id) {
      setHoveredBookmarkId(bookmark.id);
    }
  };

  const handleDrop = async (targetBookmark, targetColumn, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!draggedBookmark) return;

    try {
      // Cas 1: Drag ENTRE GROUPES différents
      if (sourceGroupId !== groupId) {
        console.log(`Moving bookmark from group ${sourceGroupId} to group ${groupId}`);

        // Déplacer le bookmark vers le nouveau groupe avec la colonne cible
        await moveBookmark(draggedBookmark.id, sourceGroupId, groupId, targetColumn);

        // Refresh les bookmarks du groupe actuel pour voir le nouveau bookmark
        await fetchBookmarks(groupId);
      }
      // Cas 2: Drag DANS LE MÊME GROUPE
      else {
        // Cas 2a: Drag ENTRE colonnes (changer de colonne)
        if (dragSourceColumn !== targetColumn) {
          console.log(`Moving bookmark from column ${dragSourceColumn} to column ${targetColumn}`);

          // Update le bookmark pour changer sa colonne
          await updateBookmark(draggedBookmark.id, groupId, {
            column: targetColumn
          });

          // Si dropped sur un bookmark spécifique, calculer la position
          if (targetBookmark) {
            const targetColumnBookmarks = bookmarksByColumn[targetColumn];
            const targetIndex = targetColumnBookmarks.findIndex(b => b.id === targetBookmark.id);

            // Reconstruire l'ordre : insérer avant le target
            const newOrder = [
              ...targetColumnBookmarks.slice(0, targetIndex).map(b => b.id),
              draggedBookmark.id,
              ...targetColumnBookmarks.slice(targetIndex).map(b => b.id)
            ];

            await reorderColumn(groupId, targetColumn, newOrder);
          }
          // Sinon, le bookmark est ajouté à la fin de la colonne (position auto)
        }
        // Cas 2b: Drag DANS la même colonne (réorganiser)
        else if (targetBookmark && dragSourceColumn === targetColumn) {
          console.log(`Reordering within column ${targetColumn}`);

          const columnBookmarks = bookmarksByColumn[targetColumn];
          const draggedIndex = columnBookmarks.findIndex(b => b.id === draggedBookmark.id);
          const targetIndex = columnBookmarks.findIndex(b => b.id === targetBookmark.id);

          if (draggedIndex !== targetIndex) {
            const reordered = [...columnBookmarks];
            const [removed] = reordered.splice(draggedIndex, 1);
            reordered.splice(targetIndex, 0, removed);

            const newOrder = reordered.map(b => b.id);
            await reorderColumn(groupId, targetColumn, newOrder);
          }
        }
      }
    } catch (error) {
      console.error('Error during drop:', error);
    }

    endDrag();
    setDragSourceColumn(null);
    setHoveredColumn(null);
  };

  const handleDragEnd = () => {
    endDrag();
    setDragSourceColumn(null);
    setHoveredColumn(null);
    setHoveredBookmarkId(null);
  };

  // Loading state
  if (localLoading || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>⏳</div>
          <div style={styles.loadingText}>Loading bookmarks...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <div style={styles.errorText}>{error}</div>
        </div>
      </div>
    );
  }

  // Main view with columns - no header, compact layout
  return (
    <div style={styles.container}>
      <div style={styles.columnsContainer}>
        {Array.from({ length: columnCount }, (_, i) => i + 1).map((colNum) => (
          <BookmarkColumn
            key={colNum}
            columnNumber={colNum}
            bookmarks={bookmarksByColumn[colNum] || []}
            onEditBookmark={onEditBookmark}
            onDeleteBookmark={onDeleteBookmark}
            onBookmarkClick={handleBookmarkClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            draggedBookmark={draggedBookmark}
            sourceColumn={dragSourceColumn}
            hoveredColumn={hoveredColumn}
            hoveredBookmarkId={hoveredBookmarkId}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '12px 0',
    backgroundColor: 'transparent'
  },

  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '12px'
  },

  addButton: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  // Loading state
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    minHeight: '100px'
  },

  loadingSpinner: {
    fontSize: '20px',
    marginBottom: '6px'
  },

  loadingText: {
    fontSize: '12px',
    color: '#71717a'
  },

  // Error state
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    minHeight: '100px'
  },

  errorIcon: {
    fontSize: '20px',
    marginBottom: '6px'
  },

  errorText: {
    fontSize: '12px',
    color: '#ef4444',
    textAlign: 'center'
  },

  // Columns container
  columnsContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'stretch',
    overflowX: 'auto',
    paddingBottom: '8px'
  }
};
