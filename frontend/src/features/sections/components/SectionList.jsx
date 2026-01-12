import { useEffect, useState } from 'react';
import { useSectionsStore } from '../store/sectionsStore';
import SectionCard from './SectionCard';
import QuickAddBar from '../../bookmarks/components/QuickAddBar';
import { useTheme } from '../../../shared/theme/useTheme';

/**
 * SectionList Component
 * Affiche toutes les sections d'une page, empilées verticalement (Design Refonte 4.5)
 *
 * Features:
 * - Fetch sections au mount
 * - Quick URL bar for paste/drop links
 * - Minimal: simple "+ Add Section" button
 * - Empty state (sans emoji)
 * - Loading/error states
 * - Map sections → <SectionCard />
 * - Drag & Drop pour réordonner
 */
export default function SectionList({ pageId, onCreateClick, onEditClick, onDeleteClick }) {
  const { getSectionsForPage, fetchSections, reorderSections, loading, error } = useSectionsStore();
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverSectionId, setDragOverSectionId] = useState(null);
  const { theme } = useTheme();

  const sections = getSectionsForPage(pageId);

  useEffect(() => {
    if (pageId) {
      fetchSections(pageId);
    }
  }, [pageId, fetchSections]);

  // Drag & Drop handlers
  const handleDragStart = (section) => (e) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (section) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Track which section is being hovered
    if (draggedSection && draggedSection.id !== section.id) {
      setDragOverSectionId(section.id);
    }
  };

  const handleDrop = (section) => async (e) => {
    e.preventDefault();
    setDragOverSectionId(null);

    if (!draggedSection || draggedSection.id === section.id) {
      setDraggedSection(null);
      return;
    }

    // Calculate new order
    const draggedIndex = sections.findIndex(s => s.id === draggedSection.id);
    const targetIndex = sections.findIndex(s => s.id === section.id);

    if (draggedIndex !== targetIndex) {
      const reordered = [...sections];
      const [removed] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, removed);

      // Call API only on drop (once)
      const sectionIds = reordered.map(s => s.id);
      await reorderSections(pageId, sectionIds);
    }

    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    // Reset drag state if drag is cancelled
    setDragOverSectionId(null);
    setDraggedSection(null);
  };

  // Create theme-aware styles
  const themedStyles = {
    loadingText: {
      ...styles.loadingText,
      color: theme.colors.textMuted
    },
    errorBox: {
      ...styles.errorBox,
      backgroundColor: `${theme.colors.error}1a`,
      borderColor: theme.colors.error,
      color: theme.colors.error
    },
    emptyTitle: {
      ...styles.emptyTitle,
      color: theme.colors.textPrimary
    },
    emptySubtext: {
      ...styles.emptySubtext,
      color: theme.colors.textMuted
    },
    createButtonLarge: {
      ...styles.createButtonLarge,
      color: theme.colors.textSecondary,
      borderColor: theme.colors.border
    },
    createButton: {
      ...styles.createButton,
      color: theme.colors.textSecondary
    }
  };

  if (loading && sections.length === 0) {
    return (
      <div style={styles.container}>
        <div style={themedStyles.loadingText}>Loading sections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={themedStyles.errorBox}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={themedStyles.emptyTitle}>No sections yet</div>
          <div style={themedStyles.emptySubtext}>
            Create your first section to organize your bookmarks
          </div>
          <button onClick={onCreateClick} style={themedStyles.createButtonLarge}>
            + Create Section
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header: Quick URL bar + Add button */}
      <div style={styles.header}>
        <QuickAddBar pageId={pageId} />
        <button onClick={onCreateClick} style={themedStyles.createButton}>
          + Add Section
        </button>
      </div>

      {/* Liste des sections */}
      <div
        style={styles.sectionsList}
        onDragLeave={() => setDragOverSectionId(null)}
      >
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            onEdit={onEditClick}
            onDelete={onDeleteClick}
            onDragStart={handleDragStart(section)}
            onDragOver={handleDragOver(section)}
            onDrop={handleDrop(section)}
            onDragEnd={handleDragEnd}
            isDragging={draggedSection?.id === section.id}
            isDropTarget={dragOverSectionId === section.id && draggedSection?.id !== section.id}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    padding: '0'
  },

  loadingText: {
    textAlign: 'center',
    padding: '32px 16px',
    fontSize: '14px'
  },

  errorBox: {
    border: '1px solid',
    borderRadius: '6px',
    padding: '12px 16px',
    margin: '16px 0',
    fontSize: '14px'
  },

  emptyState: {
    textAlign: 'center',
    padding: '48px 16px',
    maxWidth: '400px',
    margin: '0 auto'
  },

  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px'
  },

  emptySubtext: {
    fontSize: '14px',
    marginBottom: '24px'
  },

  createButtonLarge: {
    background: 'none',
    border: '1px dashed',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px'
  },

  createButton: {
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
  },

  sectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0'
  }
};
