import { createContext, useContext, useState } from 'react';

/**
 * BookmarkDragContext
 *
 * Contexte global pour gérer le drag & drop de bookmarks entre groups
 * Permet de partager l'état du bookmark dragué entre tous les BookmarkList
 */
const BookmarkDragContext = createContext(null);

export function BookmarkDragProvider({ children }) {
  const [draggedBookmark, setDraggedBookmark] = useState(null);
  const [sourceGroupId, setSourceGroupId] = useState(null);

  const startDrag = (bookmark, groupId) => {
    setDraggedBookmark(bookmark);
    setSourceGroupId(groupId);
  };

  const endDrag = () => {
    setDraggedBookmark(null);
    setSourceGroupId(null);
  };

  const value = {
    draggedBookmark,
    sourceGroupId,
    startDrag,
    endDrag,
    isDragging: !!draggedBookmark
  };

  return (
    <BookmarkDragContext.Provider value={value}>
      {children}
    </BookmarkDragContext.Provider>
  );
}

export function useBookmarkDrag() {
  const context = useContext(BookmarkDragContext);
  if (!context) {
    throw new Error('useBookmarkDrag must be used within BookmarkDragProvider');
  }
  return context;
}
