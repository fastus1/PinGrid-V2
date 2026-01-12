import { useState } from 'react';
import { usePagesStore } from '../store/pagesStore';
import { useSectionsStore } from '../../sections/store/sectionsStore';
import { useSearchStore } from '../../../shared/store/searchStore';
import SectionList from '../../sections/components/SectionList';
import SearchResultsView from '../../../shared/components/SearchResultsView';
import CreateSectionModal from '../../sections/components/CreateSectionModal';
import EditSectionModal from '../../sections/components/EditSectionModal';

/**
 * PageView Component
 * Affiche le contenu de la page courante avec ses sections (Design Refonte 4.5)
 *
 * Features:
 * - Minimal: affiche uniquement la SectionList
 * - Modals: CreateSectionModal, EditSectionModal
 * - Message si aucune page sélectionnée
 */
export default function PageView() {
  const { currentPage, pages } = usePagesStore();
  const { deleteSection } = useSectionsStore();
  const { isSearchActive } = useSearchStore();

  // State pour les modals sections
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  // Section handlers
  const handleCreateSection = () => {
    setIsCreateSectionOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setIsEditSectionOpen(true);
  };

  const handleDeleteSection = async (section) => {
    if (window.confirm(`Delete section "${section.name}"? This action cannot be undone.`)) {
      await deleteSection(section.id, currentPage.id);
    }
  };

  // Si aucune page sélectionnée
  if (!currentPage) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>No Page Selected</h2>
          <p style={styles.emptyText}>
            {pages.length === 0
              ? 'Create your first page to get started!'
              : 'Select a page from the sidebar to view its content.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Show search results if search is active, otherwise show normal page content */}
      {isSearchActive ? (
        <SearchResultsView />
      ) : (
        <SectionList
          pageId={currentPage.id}
          onCreateClick={handleCreateSection}
          onEditClick={handleEditSection}
          onDeleteClick={handleDeleteSection}
        />
      )}

      {/* Modals */}
      <CreateSectionModal
        isOpen={isCreateSectionOpen}
        onClose={() => setIsCreateSectionOpen(false)}
        pageId={currentPage.id}
      />

      <EditSectionModal
        isOpen={isEditSectionOpen}
        onClose={() => setIsEditSectionOpen(false)}
        section={editingSection}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0f0f0f',
    padding: '24px',
    overflowY: 'auto'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center'
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#e4e4e7',
    marginBottom: '8px'
  },
  emptyText: {
    fontSize: '0.9rem',
    color: '#71717a',
    maxWidth: '400px'
  }
};
