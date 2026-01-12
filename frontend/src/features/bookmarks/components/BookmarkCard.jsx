/**
 * BookmarkCard Component
 * Affiche un bookmark individuel
 *
 * Features:
 * - Clean minimal design matching View mode (favicon + title)
 * - Edit and delete actions on hover
 * - Drag & Drop support for reordering
 * - Visit count badge for dynamic groups
 *
 * @param {object} bookmark - Objet bookmark { id, title, url, description, favicon_url, visit_count }
 * @param {function} onEdit - Callback pour éditer le bookmark
 * @param {function} onDelete - Callback pour supprimer le bookmark
 * @param {function} onClick - Callback pour tracker le clic
 * @param {function} onDragStart - Drag start handler
 * @param {function} onDragOver - Drag over handler
 * @param {function} onDrop - Drop handler
 * @param {boolean} isDragging - True if this bookmark is being dragged
 */
import { useState } from 'react';
import { useViewModeStore } from '../../../shared/store/viewModeStore';
import { useTheme } from '../../../shared/theme/useTheme';

export default function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget,
  isSelected = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { faviconSize, fontSize } = useViewModeStore();
  const { theme } = useTheme();

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(bookmark);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(bookmark);
  };

  const handleClick = (e) => {
    // In Edit mode, don't open links - just allow card selection or nothing
    // Links only work in View mode (StaticPageView)
    e.preventDefault();
  };

  // Create theme-aware styles with glassmorphism + glow effect
  const themedStyles = {
    card: {
      ...styles.card,
      backgroundColor: theme.colors.cardBg,
      borderColor: theme.colors.border,
      backdropFilter: `blur(${theme.glass.blur})`,
      WebkitBackdropFilter: `blur(${theme.glass.blur})`
    },
    cardHovered: {
      backgroundColor: theme.colors.cardBgHover,
      borderColor: theme.glow.color,
      boxShadow: `0 0 ${theme.glow.intensity} ${theme.glow.color}`,
      transform: 'translateY(-2px)',
      transition: theme.glow.transition
    },
    cardDragging: {
      ...styles.cardDragging,
      opacity: 0.5
    },
    cardDropTarget: {
      ...styles.cardDropTarget,
      borderColor: theme.colors.primary,
      boxShadow: `0 0 0 2px ${theme.colors.primary}40`
    },
    cardSelected: {
      borderColor: theme.colors.primary,
      borderWidth: '2px',
      backgroundColor: `${theme.colors.primary}14`,
      boxShadow: `0 0 0 2px ${theme.colors.primary}, 0 0 20px ${theme.colors.primary}40`,
      transform: 'scale(1.02)',
      transition: theme.glow.transition
    },
    title: {
      ...styles.title,
      color: theme.colors.textPrimary
    },
    dragHandle: {
      ...styles.dragHandle,
      color: theme.colors.textMuted
    },
    actionButton: {
      ...styles.actionButton,
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.cardBg
    },
    actionButtonDelete: {
      ...styles.actionButtonDelete,
      color: theme.colors.error,
      backgroundColor: theme.colors.cardBg
    }
  };

  return (
    <div
      data-bookmark-id={bookmark.id}
      style={{
        ...themedStyles.card,
        ...(isDragging ? themedStyles.cardDragging : {}),
        ...(isDropTarget ? themedStyles.cardDropTarget : {}),
        ...(isHovered ? themedStyles.cardHovered : {}),
        ...(isSelected ? themedStyles.cardSelected : {})
      }}
      draggable
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e);
      }}
      onDragOver={(e) => {
        e.stopPropagation();
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onDrop(e);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd(e);
      }}
      onClick={handleClick}
    >
      {/* Drag Handle - only rendered on hover */}
      {isHovered && (
        <div style={themedStyles.dragHandle} title="Drag to reorder">
          ⋮⋮
        </div>
      )}

      {/* Favicon */}
      {bookmark.favicon_url ? (
        <img
          src={bookmark.favicon_url}
          alt=""
          style={{ ...styles.favicon, width: `${faviconSize}px`, height: `${faviconSize}px` }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div style={{ ...styles.faviconPlaceholder, width: `${faviconSize}px`, height: `${faviconSize}px`, fontSize: `${Math.max(10, faviconSize - 4)}px` }}>🔖</div>
      )}

      {/* Title */}
      <span style={{ ...themedStyles.title, fontSize: `${fontSize}px` }} title={bookmark.title}>
        {bookmark.title}
      </span>

      {/* Actions - only rendered on hover */}
      {isHovered && (
        <div style={styles.actions}>
          <button
            onClick={handleEdit}
            style={themedStyles.actionButton}
            title="Edit bookmark"
          >
            ✎
          </button>
          <button
            onClick={handleDelete}
            style={themedStyles.actionButtonDelete}
            title="Delete bookmark"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '6px',
    border: '1px solid transparent',
    cursor: 'grab',
    transition: 'background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.15s ease',
    position: 'relative'
  },

  cardHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: '#3d3d4f'
  },

  cardDragging: {
    opacity: 0.5,
    cursor: 'grabbing'
  },

  cardDropTarget: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.4)',
    transform: 'scale(1.02)'
  },

  dragHandle: {
    fontSize: '10px',
    color: '#52525b',
    cursor: 'grab',
    userSelect: 'none',
    transition: 'opacity 0.2s',
    lineHeight: '1',
    flexShrink: 0
  },

  favicon: {
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    flexShrink: 0,
    objectFit: 'contain'
  },

  faviconPlaceholder: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  title: {
    flex: 1,
    fontSize: '13px',
    color: '#e4e4e7',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  actions: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
    transition: 'opacity 0.2s'
  },

  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '4px',
    color: '#71717a',
    transition: 'background-color 0.2s, color 0.2s'
  },

  actionButtonDelete: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#71717a',
    transition: 'background-color 0.2s, color 0.2s'
  }
};

