import { useState } from 'react';
import { useSectionsStore } from '../store/sectionsStore';
import { useGroupsStore } from '../../groups/store/groupsStore';
import { useGroupDrag } from '../../groups/context/GroupDragContext';
import { useTheme } from '../../../shared/theme/useTheme';
import GroupList from '../../groups/components/GroupList';
import CreateGroupModal from '../../groups/components/CreateGroupModal';
import EditGroupModal from '../../groups/components/EditGroupModal';

/**
 * SectionCard Component
 * Affiche une section individuelle (Design Refonte 4.5)
 *
 * Features:
 * - Minimal header: drag handle + title + hover actions
 * - Always expanded (no collapse)
 * - Cross-section group drop indicator
 * - Drag & Drop pour réordonner
 */
export default function SectionCard({ section, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isDropTarget }) {
  const { deleteGroup, duplicateGroup } = useGroupsStore();
  const { draggedGroup, sourceSectionId } = useGroupDrag();
  const { theme } = useTheme();
  const [isHoveringGroup, setIsHoveringGroup] = useState(false);

  // Show visual indicator when a group from another section is being dragged over this section
  const isReceivingGroup = draggedGroup && sourceSectionId !== section.id && isHoveringGroup;

  // Modal states pour groups
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(section);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(section);
  };

  // Group handlers
  const handleAddGroup = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const handleDeleteGroup = async (group) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the group "${group.name}"?\n\nThis will also delete all bookmarks in this group.`
    );

    if (confirmed) {
      await deleteGroup(group.id, section.id);
    }
  };

  const handleDuplicateGroup = async (group) => {
    await duplicateGroup(group.id, section.id);
  };

  // Handle drag over for cross-section group moves
  const handleBodyDragOver = (e) => {
    // If a group is being dragged from another section, handle group drop
    if (draggedGroup && sourceSectionId !== section.id) {
      setIsHoveringGroup(true);
    } else if (!draggedGroup) {
      // If no group is being dragged, propagate to parent for section reordering
      onDragOver(e);
    }
  };

  const handleBodyDragLeave = (e) => {
    // Only reset if leaving the section body entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsHoveringGroup(false);
    }
  };

  const handleBodyDrop = (e) => {
    setIsHoveringGroup(false);
    // If no group is being dragged, propagate to parent for section drop
    if (!draggedGroup) {
      onDrop(e);
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
    cardReceivingGroup: {
      ...styles.cardReceivingGroup,
      borderColor: theme.colors.primary,
      boxShadow: `inset 0 0 20px ${theme.colors.primary}14`,
      backgroundColor: `${theme.colors.primary}0a`
    },
    dragHandle: {
      ...styles.dragHandle,
      color: theme.colors.textMuted
    },
    sectionName: {
      ...styles.sectionName,
      color: theme.colors.textSecondary
    },
    addButton: {
      ...styles.addButton,
      backgroundColor: theme.colors.primary,
      color: '#ffffff'
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
        ...(isDragging ? themedStyles.cardDragging : {}),
        ...(isDropTarget ? themedStyles.cardDropTarget : {}),
        ...(isReceivingGroup ? themedStyles.cardReceivingGroup : {})
      }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Compact Header with all actions */}
      <div style={styles.header}>
        <div style={themedStyles.dragHandle} title="Drag to reorder">
          ⋮⋮
        </div>
        <h3 style={themedStyles.sectionName}>{section.name}</h3>

        <div style={styles.headerActions}>
          <button
            onClick={handleAddGroup}
            style={themedStyles.addButton}
            title="Add group"
          >
            + Add Group
          </button>
          <button
            onClick={handleEdit}
            style={themedStyles.actionButton}
            title="Edit section"
          >
            ✎
          </button>
          <button
            onClick={handleDelete}
            style={themedStyles.actionButtonDelete}
            title="Delete section"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body (always visible) */}
      <div
        style={styles.body}
        onDragOver={handleBodyDragOver}
        onDragLeave={handleBodyDragLeave}
        onDrop={handleBodyDrop}
      >
        <GroupList
          sectionId={section.id}
          onAddGroup={handleAddGroup}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          onDuplicateGroup={handleDuplicateGroup}
        />
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        sectionId={section.id}
      />

      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        group={selectedGroup}
      />
    </div>
  );
}

const styles = {
  card: {
    marginBottom: '10px',
    padding: '10px',
    backgroundColor: 'rgba(20, 26, 36, 0.6)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#1e3a5f',
    borderRadius: '8px',
    transition: 'border-color 0.2s, background-color 0.2s'
  },

  cardDragging: {
    opacity: 0.5
  },

  cardDropTarget: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)'
  },

  cardReceivingGroup: {
    borderColor: '#3b82f6',
    boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.08)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    userSelect: 'none'
  },

  dragHandle: {
    fontSize: '10px',
    cursor: 'grab'
  },

  sectionName: {
    margin: 0,
    fontSize: '12px',
    fontWeight: '600',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  headerActions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },

  addButton: {
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  actionButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '4px',
    transition: 'color 0.15s, background-color 0.15s'
  },

  actionButtonDelete: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'color 0.15s, background-color 0.15s'
  },

  body: {
    padding: '0'
  }
};
