import { useEffect, useState } from 'react';
import { useGroupsStore } from '../store/groupsStore';
import { useGroupDrag } from '../context/GroupDragContext';
import GroupCard from './GroupCard';

/**
 * GroupList Component
 * Affiche la liste des groups d'une section (Design Refonte 4.5)
 *
 * Features:
 * - Minimal header avec bouton "Add Group"
 * - Empty state (sans emoji)
 * - Loading state pendant chargement
 * - Affiche les groups avec flex layout (auto-width distribution)
 * - Drag & Drop pour réordonner ET déplacer entre sections
 *
 * @param {string} sectionId - UUID de la section parente
 * @param {function} onAddGroup - Callback pour ouvrir modal de création
 * @param {function} onEditGroup - Callback pour éditer un group
 * @param {function} onDeleteGroup - Callback pour supprimer un group
 */
export default function GroupList({ sectionId, onAddGroup, onEditGroup, onDeleteGroup, onDuplicateGroup }) {
  const {
    getGroupsForSection,
    fetchGroups,
    reorderGroups,
    moveGroup,
    loading,
    error
  } = useGroupsStore();

  const { draggedGroup, sourceSectionId, startDrag, endDrag } = useGroupDrag();
  const [localLoading, setLocalLoading] = useState(true);
  const [dragOverGroupId, setDragOverGroupId] = useState(null);
  const groups = getGroupsForSection(sectionId);

  // Charger les groups au montage du composant
  useEffect(() => {
    const loadGroups = async () => {
      setLocalLoading(true);
      await fetchGroups(sectionId);
      setLocalLoading(false);
    };

    loadGroups();
  }, [sectionId, fetchGroups]);

  // Drag & Drop handlers
  const handleDragStart = (group) => (e) => {
    e.stopPropagation(); // Prevent bubbling to parent SectionCard
    startDrag(group, sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (group) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    // Track which group is being hovered
    if (draggedGroup && draggedGroup.id !== group.id) {
      setDragOverGroupId(group.id);
    }
  };

  const handleDrop = (group) => async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroupId(null);

    if (!draggedGroup || draggedGroup.id === group.id) {
      endDrag();
      return;
    }

    // Si c'est la même section : réorganiser
    if (sourceSectionId === sectionId) {
      const draggedIndex = groups.findIndex(g => g.id === draggedGroup.id);
      const targetIndex = groups.findIndex(g => g.id === group.id);

      if (draggedIndex !== targetIndex) {
        const reordered = [...groups];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, removed);

        const groupIds = reordered.map(g => g.id);
        await reorderGroups(sectionId, groupIds);
      }
    } else {
      // Le group vient d'une autre section : déplacer
      await moveGroup(draggedGroup.id, sourceSectionId, sectionId);
    }

    endDrag();
  };

  // Permettre le drop sur la zone vide de la section (pour ajouter un groupe)
  const handleContainerDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroupId(null);

    if (!draggedGroup) return;

    // Si le group vient d'une autre section : déplacer
    if (sourceSectionId !== sectionId) {
      await moveGroup(draggedGroup.id, sourceSectionId, sectionId);
    }

    endDrag();
  };

  const handleContainerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDragOverGroupId(null);
    endDrag();
  };

  // Loading state
  if (localLoading || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>⏳</div>
          <div style={styles.loadingText}>Loading groups...</div>
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

  // Empty state - still allow drop for cross-section moves
  if (!groups || groups.length === 0) {
    return (
      <div
        style={styles.container}
        onDragOver={handleContainerDragOver}
        onDrop={handleContainerDrop}
      >
        <div style={styles.header}>
          <button
            onClick={onAddGroup}
            style={styles.addButton}
            title="Add new group"
          >
            + Add Group
          </button>
        </div>
        <div style={styles.emptyState}>
          <div style={styles.emptyText}>No groups yet</div>
          <div style={styles.emptySubtext}>
            Create your first group to organize bookmarks
          </div>
          <button
            onClick={onAddGroup}
            style={styles.emptyButton}
          >
            + Create Group
          </button>
        </div>
      </div>
    );
  }

  // Groups list - pass totalGroups for width calculation
  return (
    <div
      style={styles.container}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
      onDragLeave={() => setDragOverGroupId(null)}
    >
      <div style={styles.groupsFlex}>
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            totalGroups={groups.length}
            onEdit={onEditGroup}
            onDelete={onDeleteGroup}
            onDuplicate={onDuplicateGroup}
            onDragStart={handleDragStart(group)}
            onDragOver={handleDragOver(group)}
            onDrop={handleDrop(group)}
            onDragEnd={handleDragEnd}
            isDragging={draggedGroup?.id === group.id}
            isDropTarget={dragOverGroupId === group.id && draggedGroup?.id !== group.id}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '4px 0',
    backgroundColor: 'transparent'
  },

  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '6px'
  },

  addButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  // Loading state
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    minHeight: '60px'
  },

  loadingSpinner: {
    fontSize: '18px',
    marginBottom: '4px'
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
    padding: '16px',
    minHeight: '60px'
  },

  errorIcon: {
    fontSize: '18px',
    marginBottom: '4px'
  },

  errorText: {
    fontSize: '12px',
    color: '#ef4444',
    textAlign: 'center'
  },

  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    minHeight: '60px',
    textAlign: 'center'
  },

  emptyText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#71717a',
    marginBottom: '4px'
  },

  emptySubtext: {
    fontSize: '11px',
    color: '#52525b',
    marginBottom: '8px'
  },

  emptyButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  // Groups flex layout
  groupsFlex: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    overflowX: 'auto',
    overflow: 'visible',         // Allow scaled groups to show beyond container
    paddingTop: '4px',           // Space for scale-up at top
    paddingBottom: '4px'
  }
};
