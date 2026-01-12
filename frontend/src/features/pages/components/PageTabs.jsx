import { usePagesStore } from '../store/pagesStore';

/**
 * PageTabs Component
 * Affiche les tabs horizontaux pour naviguer entre les pages
 *
 * Features:
 * - Tab pour chaque page avec icon et nom
 * - Active tab styling avec couleur de la page
 * - Click sur tab → setCurrentPage
 * - Bouton "+" pour créer nouvelle page
 * - Hover sur tab → boutons Edit/Delete
 */
export default function PageTabs({ onCreateClick, onEditClick, onDeleteClick }) {
  const { pages, currentPage, setCurrentPage, loading, error } = usePagesStore();

  const handleTabClick = (page) => {
    setCurrentPage(page);
  };

  const handleEditClick = (e, page) => {
    e.stopPropagation(); // Empêcher le click du tab
    onEditClick(page);
  };

  const handleDeleteClick = (e, page) => {
    e.stopPropagation(); // Empêcher le click du tab
    onDeleteClick(page);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading pages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>⚠️ {error}</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyText}>No pages yet. Create your first page!</div>
        <button onClick={onCreateClick} style={styles.createButton}>
          + Create Page
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tabsWrapper}>
        {pages.map((page) => {
          const isActive = currentPage && currentPage.id === page.id;

          return (
            <div
              key={page.id}
              onClick={() => handleTabClick(page)}
              style={{
                ...styles.tab,
                ...(isActive ? { ...styles.tabActive, borderColor: page.color } : {})
              }}
            >
              <span style={styles.tabIcon}>{page.icon}</span>
              <span style={styles.tabName}>{page.name}</span>

              <div style={styles.tabActions}>
                <button
                  onClick={(e) => handleEditClick(e, page)}
                  style={styles.actionButton}
                  title="Edit page"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, page)}
                  style={styles.actionButtonDelete}
                  title="Delete page"
                >
                  🗑️
                </button>
              </div>

              {isActive && (
                <div
                  style={{
                    ...styles.activeIndicator,
                    backgroundColor: page.color
                  }}
                />
              )}
            </div>
          );
        })}

        <button onClick={onCreateClick} style={styles.addButton} title="Create new page">
          + Add Page
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #2d2d3f',
    padding: '12px 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  loadingText: {
    color: '#667eea',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '12px'
  },
  errorText: {
    color: '#ef4444',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '12px'
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '12px'
  },
  tabsWrapper: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    overflowX: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: '#2d2d3f #1a1a2e'
  },
  tab: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#252540',
    border: '2px solid transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    minWidth: '120px'
  },
  tabHover: {
    backgroundColor: '#2d2d3f',
    borderColor: '#3d3d5c'
  },
  tabActive: {
    backgroundColor: '#1e1e2e',
    borderWidth: '2px',
    borderStyle: 'solid',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  tabIcon: {
    fontSize: '1.2rem'
  },
  tabName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#e4e4e7'
  },
  tabActions: {
    display: 'flex',
    gap: '4px',
    marginLeft: 'auto'
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: '#3d3d5c'
    }
  },
  actionButtonDelete: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: '#5c2d2d'
    }
  },
  activeIndicator: {
    position: 'absolute',
    bottom: '-2px',
    left: '0',
    right: '0',
    height: '3px',
    borderRadius: '3px 3px 0 0'
  },
  addButton: {
    padding: '10px 16px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#5568d3'
    }
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    margin: '0 auto',
    display: 'block'
  }
};
