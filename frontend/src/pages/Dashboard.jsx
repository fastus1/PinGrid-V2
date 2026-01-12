import { useEffect, useState } from 'react';
import { useAuthStore } from '../features/auth/store/authStore';
import { usePagesStore } from '../features/pages/store/pagesStore';
import { useSectionsStore } from '../features/sections/store/sectionsStore';
import { useGroupsStore } from '../features/groups/store/groupsStore';
import { useBookmarksStore } from '../features/bookmarks/store/bookmarksStore';
import { useViewModeStore } from '../shared/store/viewModeStore';
import { useSearchStore } from '../shared/store/searchStore';
import { KeyboardNavigationProvider, useKeyboardNavigation } from '../shared/context/KeyboardNavigationContext';
import { useTheme } from '../shared/theme/useTheme';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../features/pages/components/Sidebar';
import PageView from '../features/pages/components/PageView';
import StaticPageView from '../shared/components/StaticPageView';
import ViewModeToggle from '../shared/components/ViewModeToggle';
import CreatePageModal from '../features/pages/components/CreatePageModal';
import EditPageModal from '../features/pages/components/EditPageModal';
import ImportDialog from '../features/import/ImportDialog';

/**
 * DashboardContent Component - Inner component that uses keyboard navigation
 */
function DashboardContent() {
  const { user } = useAuthStore();
  const { fetchPages, deletePage, pages, currentPage, setCurrentPage } = usePagesStore();
  const { getSectionsForPage } = useSectionsStore();
  const { getGroupsForSection } = useGroupsStore();
  const { getBookmarksForGroup } = useBookmarksStore();
  const { mode, loadCaches, generatePageCache, cacheLoaded } = useViewModeStore();
  const { isSearchActive, searchResults } = useSearchStore();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Keyboard navigation context (simplified - now DOM-based)
  const {
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
    openSelectedBookmark
  } = useKeyboardNavigation();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPage, setDeletingPage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Load caches on mount
  useEffect(() => {
    loadCaches();
  }, [loadCaches]);

  // Fetch pages on mount
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Auto-select first page if none selected
  useEffect(() => {
    if (pages.length > 0 && !currentPage) {
      setCurrentPage(pages[0]);
    }
  }, [pages, currentPage, setCurrentPage]);

  // Global keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log('[Dashboard] Key pressed:', e.key, 'Target:', e.target.tagName);

      // Ignore if focus is in an input/textarea (except search bar)
      if (e.target.tagName === 'INPUT' && e.target.getAttribute('data-search') !== 'true') {
        console.log('[Dashboard] Ignoring key - focus in non-search input');
        return;
      }
      if (e.target.tagName === 'TEXTAREA') {
        console.log('[Dashboard] Ignoring key - focus in textarea');
        return;
      }
      // Ignore if a modal is open
      if (isCreateModalOpen || isEditModalOpen || isDeleteDialogOpen || isSaveConfirmOpen) {
        console.log('[Dashboard] Ignoring key - modal is open');
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          // Blur search input if focused to show navigation clearly
          if (document.activeElement && document.activeElement.getAttribute('data-search') === 'true') {
            document.activeElement.blur();
          }
          console.log('[Dashboard] Calling navigateUp');
          navigateUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Blur search input if focused to show navigation clearly
          if (document.activeElement && document.activeElement.getAttribute('data-search') === 'true') {
            document.activeElement.blur();
          }
          console.log('[Dashboard] Calling navigateDown');
          navigateDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // Blur search input if focused to show navigation clearly
          if (document.activeElement && document.activeElement.getAttribute('data-search') === 'true') {
            document.activeElement.blur();
          }
          console.log('[Dashboard] Calling navigateLeft');
          navigateLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          // Blur search input if focused to show navigation clearly
          if (document.activeElement && document.activeElement.getAttribute('data-search') === 'true') {
            document.activeElement.blur();
          }
          console.log('[Dashboard] Calling navigateRight');
          navigateRight();
          break;
        case 'Enter':
          e.preventDefault();
          console.log('[Dashboard] Calling openSelectedBookmark');
          openSelectedBookmark();
          break;
      }
    };

    console.log('[Dashboard] Adding keyboard event listener');
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      console.log('[Dashboard] Removing keyboard event listener');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
    openSelectedBookmark,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    isSaveConfirmOpen
  ]);

  // Generate cache - extracted as reusable function
  const buildPageCache = async () => {
    if (!currentPage) return null;

    // Get top-used bookmarks for dynamic groups - ALWAYS fetch fresh data
    let topUsedBookmarks = [];
    const result = await useBookmarksStore.getState().fetchTopUsed(50);
    if (result.success) {
      topUsedBookmarks = result.topUsed;
    }

    // Build full page snapshot
    const sections = getSectionsForPage(currentPage.id);
    const pageData = {
      id: currentPage.id,
      name: currentPage.name,
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        groups: getGroupsForSection(section.id).map(group => {
          // For dynamic groups, use top-used bookmarks
          if (group.group_type === 'dynamic-top-used') {
            const limit = group.bookmark_limit || 10;
            const colCount = group.column_count || 1;
            const dynamicBookmarks = topUsedBookmarks.slice(0, limit).map((b, index) => ({
              id: b.id,
              title: b.title,
              url: b.url,
              favicon_url: b.favicon_url,
              column: (index % colCount) + 1,
              position: index,
              visit_count: b.visit_count
            }));
            return {
              id: group.id,
              name: group.name,
              column_count: colCount,
              group_type: group.group_type,
              bookmark_limit: group.bookmark_limit,
              width: group.width || '100%',
              bookmarks: dynamicBookmarks
            };
          }
          return {
            id: group.id,
            name: group.name,
            column_count: group.column_count,
            group_type: group.group_type,
            width: group.width || '100%',
            bookmarks: getBookmarksForGroup(group.id).map(b => ({
              id: b.id,
              title: b.title,
              url: b.url,
              favicon_url: b.favicon_url,
              column: b.column,
              position: b.position
            }))
          };
        })
      }))
    };

    return pageData;
  };

  // Handle Save Cache button click
  const handleSaveCache = async () => {
    if (!currentPage) return;

    setIsSaving(true);
    try {
      const pageData = await buildPageCache();
      if (pageData) {
        await generatePageCache(currentPage.id, pageData);
        setLastSavedTime(new Date());
      }
    } catch (error) {
      console.error('Failed to save cache:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle before toggle with confirmation if not saved
  const handleBeforeToggle = async (currentMode) => {
    if (currentMode === 'edit' && currentPage) {
      // Check if cache exists for this page
      const hasExistingCache = useViewModeStore.getState().hasCache(currentPage.id);

      if (!hasExistingCache && !lastSavedTime) {
        // No cache and not saved - show confirmation
        setIsSaveConfirmOpen(true);
        return 'cancel'; // Prevent toggle
      }

      // ALWAYS regenerate cache before switching to View mode
      // This ensures width and other properties are always fresh
      const pageData = await buildPageCache();
      if (pageData) {
        await generatePageCache(currentPage.id, pageData);
        console.log('[Dashboard] Cache regenerated with groups:', pageData.sections?.map(s => s.groups?.map(g => ({ name: g.name, width: g.width }))));
      }
    }
    return 'continue';
  };

  // Modal handlers
  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditClick = (page) => {
    setEditingPage(page);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (page) => {
    setDeletingPage(page);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPage) return;

    setIsDeleting(true);
    try {
      await deletePage(deletingPage.id);
      setIsDeleteDialogOpen(false);
      setDeletingPage(null);
    } catch (error) {
      console.error('Failed to delete page:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeletingPage(null);
  };

  const isViewMode = mode === 'view';

  // Create theme-aware styles
  const themedStyles = {
    ...styles,
    container: {
      ...styles.container,
      background: theme.colors.background
    },
    overlay: {
      ...styles.overlay,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: `blur(${theme.glass.blur})`,
      WebkitBackdropFilter: `blur(${theme.glass.blur})`
    },
    deleteDialog: {
      ...styles.deleteDialog,
      backgroundColor: theme.colors.cardBg,
      borderColor: theme.colors.border,
      backdropFilter: `blur(${theme.glass.blur})`,
      WebkitBackdropFilter: `blur(${theme.glass.blur})`
    },
    deleteTitle: {
      ...styles.deleteTitle,
      color: theme.colors.textPrimary
    },
    deleteText: {
      ...styles.deleteText,
      color: theme.colors.textSecondary
    },
    deleteWarning: {
      ...styles.deleteWarning,
      color: theme.colors.error
    },
    cancelButton: {
      ...styles.cancelButton,
      backgroundColor: theme.colors.cardBg,
      color: theme.colors.textPrimary,
      borderColor: theme.colors.border
    },
    confirmDeleteButton: {
      ...styles.confirmDeleteButton,
      backgroundColor: theme.colors.error
    },
    switchWithoutSaveButton: {
      ...styles.switchWithoutSaveButton,
      backgroundColor: theme.colors.cardBg,
      color: theme.colors.textPrimary
    },
    saveAndSwitchButton: {
      ...styles.saveAndSwitchButton,
      backgroundColor: theme.colors.success
    }
  };

  return (
    <div style={themedStyles.container}>
      {/* Sidebar Navigation */}
      <Sidebar
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onImportClick={() => setIsImportDialogOpen(true)}
        mode={mode}
        onToggleMode={() => useViewModeStore.getState().toggleMode()}
        onBeforeToggle={handleBeforeToggle}
      />

      {/* Main Content - Page View */}
      <div style={themedStyles.mainContent}>
        {/* Content based on mode */}
        {isViewMode ? <StaticPageView /> : <PageView />}
      </div>

      {/* Create Page Modal */}
      <CreatePageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Page Modal */}
      <EditPageModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPage(null);
        }}
        page={editingPage}
      />

      {/* Import Dialog */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
      />

      {/* Save Confirmation Dialog */}
      {isSaveConfirmOpen && (
        <div style={themedStyles.overlay} onClick={() => setIsSaveConfirmOpen(false)}>
          <div style={themedStyles.deleteDialog} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteIcon}>💾</div>
            <h3 style={themedStyles.deleteTitle}>Save before switching?</h3>
            <p style={themedStyles.deleteText}>
              You have unsaved changes. Would you like to save them before switching to View mode?
            </p>
            <div style={styles.saveDialogActions}>
              <button
                onClick={() => setIsSaveConfirmOpen(false)}
                style={themedStyles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsSaveConfirmOpen(false);
                  useViewModeStore.getState().toggleMode();
                }}
                style={themedStyles.switchWithoutSaveButton}
              >
                Switch without saving
              </button>
              <button
                onClick={async () => {
                  await handleSaveCache();
                  setIsSaveConfirmOpen(false);
                  useViewModeStore.getState().toggleMode();
                }}
                style={themedStyles.saveAndSwitchButton}
              >
                Save & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div style={themedStyles.overlay} onClick={handleCancelDelete}>
          <div style={themedStyles.deleteDialog} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteIcon}>🗑️</div>
            <h3 style={themedStyles.deleteTitle}>Delete Page?</h3>
            <p style={themedStyles.deleteText}>
              Are you sure you want to delete "<strong>{deletingPage?.name}</strong>"?
              <br />
              <span style={themedStyles.deleteWarning}>
                This action cannot be undone. All sections, groups, and bookmarks in this page will be deleted.
              </span>
            </p>
            <div style={styles.deleteActions}>
              <button
                onClick={handleCancelDelete}
                style={themedStyles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={themedStyles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard Component - Wrapper with KeyboardNavigationProvider
 * Main dashboard with Sidebar navigation and keyboard navigation support
 */
export default function Dashboard() {
  return (
    <KeyboardNavigationProvider>
      <DashboardContent />
    </KeyboardNavigationProvider>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'row',
    background: '#0f0f0f'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto'
  },
  saveBar: {
    position: 'absolute',
    top: '12px',
    right: '24px',
    zIndex: 10
  },
  // Delete Dialog Styles
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  deleteDialog: {
    backgroundColor: '#1e1e2e',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    border: '1px solid #2d2d3f'
  },
  deleteIcon: {
    fontSize: '3rem',
    marginBottom: '16px'
  },
  deleteTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#e4e4e7',
    marginBottom: '12px'
  },
  deleteText: {
    fontSize: '1rem',
    color: '#a1a1aa',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  deleteWarning: {
    color: '#ef4444',
    fontSize: '0.85rem',
    display: 'block',
    marginTop: '8px'
  },
  deleteActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#2d2d3f',
    color: '#e4e4e7',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  confirmDeleteButton: {
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  // Save Button Styles
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
    marginRight: '12px'
  },
  saveButtonSaved: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderColor: 'rgba(34, 197, 94, 0.5)'
  },
  saveDialogActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  switchWithoutSaveButton: {
    padding: '10px 18px',
    backgroundColor: '#52525b',
    color: '#e4e4e7',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  saveAndSwitchButton: {
    padding: '10px 18px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  }
};
