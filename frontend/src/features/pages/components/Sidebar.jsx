import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../auth/store/authStore';
import { usePagesStore } from '../store/pagesStore';
import { useViewModeStore } from '../../../shared/store/viewModeStore';
import { useSearchStore } from '../../../shared/store/searchStore';
import { useTheme } from '../../../shared/theme/useTheme';
import { useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../../../shared/components/ThemeSwitcher';
import {
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  LogOut,
  Pencil,
  LayoutDashboard,
  Download,
  Plus,
  Trash
} from 'lucide-react';

/**
 * Favicon Size Slider - Inline component for sidebar
 */
function FaviconSizeSlider() {
  const { faviconSize, setFaviconSize } = useViewModeStore();
  const { theme } = useTheme();

  return (
    <div style={{ ...sliderStyles.container, borderColor: theme.colors.border, borderTop: 'none' }}>
      <div style={sliderStyles.header}>
        <span style={{ ...sliderStyles.label, color: theme.colors.textMuted }}>Favicon Size</span>
        <span style={{ ...sliderStyles.value, color: theme.colors.textSecondary }}>{faviconSize}px</span>
      </div>
      <input
        type="range"
        min="12"
        max="64"
        value={faviconSize}
        onChange={(e) => setFaviconSize(parseInt(e.target.value))}
        style={{ ...sliderStyles.slider, backgroundColor: theme.colors.cardBg, accentColor: theme.colors.primary }}
      />
    </div>
  );
}

/**
 * Font Size Slider - Inline component for sidebar
 */
function FontSizeSlider() {
  const { fontSize, setFontSize } = useViewModeStore();
  const { theme } = useTheme();

  return (
    <div style={{ ...sliderStyles.container, borderColor: theme.colors.border }}>
      <div style={sliderStyles.header}>
        <span style={{ ...sliderStyles.label, color: theme.colors.textMuted }}>Font Size</span>
        <span style={{ ...sliderStyles.value, color: theme.colors.textSecondary }}>{fontSize}px</span>
      </div>
      <input
        type="range"
        min="10"
        max="24"
        value={fontSize}
        onChange={(e) => setFontSize(parseInt(e.target.value))}
        style={{ ...sliderStyles.slider, backgroundColor: theme.colors.cardBg, accentColor: theme.colors.primary }}
      />
    </div>
  );
}

/**
 * SearchBar - Inline component for searching bookmarks
 */
function SearchBar() {
  const { searchQuery, setSearchQuery, clearSearch } = useSearchStore();
  const { theme } = useTheme();
  const searchInputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div style={{
      padding: '8px 8px 12px 8px',
      position: 'relative'
    }}>
      <style>{`
        .search-input::placeholder {
          color: #71717a;
          opacity: 1;
        }
      `}</style>
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search bookmarks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-search="true"
        style={{
          width: '100%',
          padding: '8px 32px 8px 10px',
          backgroundColor: theme.colors.cardBg,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '6px',
          color: '#e4e4e7',
          fontSize: '13px',
          outline: 'none',
          backdropFilter: `blur(${theme.glass.blur})`,
          WebkitBackdropFilter: `blur(${theme.glass.blur})`,
          transition: 'all 0.2s',
          boxSizing: 'border-box'
        }}
        className="search-input"
        onFocus={(e) => {
          e.target.style.borderColor = theme.colors.primary;
          e.target.style.boxShadow = `0 0 0 2px ${theme.colors.primary}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.colors.border;
          e.target.style.boxShadow = 'none';
        }}
      />
      {searchQuery && (
        <button
          onClick={clearSearch}
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: theme.colors.textMuted,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = theme.colors.cardBgHover;
            e.target.style.color = theme.colors.text;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = theme.colors.textMuted;
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

const sliderStyles = {
  container: {
    padding: '12px',
    borderTop: '1px solid #2d2d3f'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  value: {
    fontSize: '11px',
    color: '#a1a1aa',
    fontWeight: '500'
  },
  slider: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: '#252540',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#667eea'
  }
};

/**
 * Sidebar Component
 * Collapsible left navigation (280px expanded, 56px collapsed)
 *
 * Features:
 * - Collapse/expand button
 * - Edit/View mode toggle
 * - Page navigation list
 * - Active page indicator
 * - User profile at bottom
 */
export default function Sidebar({
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onImportClick,
  mode,
  onToggleMode,
  onBeforeToggle
}) {
  const { user, logout } = useAuthStore();
  const { pages, currentPage, setCurrentPage, loading, error } = usePagesStore();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const handleEditClick = (e, page) => {
    e.stopPropagation();
    onEditClick(page);
  };

  const handleDeleteClick = (e, page) => {
    e.stopPropagation();
    onDeleteClick(page);
  };

  const handleToggle = async () => {
    if (onBeforeToggle) {
      const result = await onBeforeToggle(mode);
      if (result === 'cancel') return;
    }
    onToggleMode();
  };

  const sidebarWidth = isCollapsed ? '56px' : '280px';

  // Create theme-aware styles with glassmorphism
  const themedStyles = {
    ...styles,
    sidebar: {
      ...styles.sidebar,
      backgroundColor: theme.colors.sidebarBg,
      borderRightColor: theme.colors.border,
      backdropFilter: `blur(${theme.glass.blur})`,
      WebkitBackdropFilter: `blur(${theme.glass.blur})`,
      boxShadow: theme.glass.shadow
    }
  };

  return (
    <div style={{ ...themedStyles.sidebar, width: sidebarWidth, minWidth: sidebarWidth }}>
      {/* Header with collapse button and logo */}
      <div style={styles.headerSection}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={styles.collapseButton}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
        {!isCollapsed && (
          <img src="/pingrid-logo.png" alt="PinGrid" style={styles.logo} />
        )}
      </div>

      {/* Mode Toggle */}
      {!isCollapsed && onToggleMode && (
        <div style={styles.toggleSection}>
          <div style={styles.toggleContainer}>
            <button
              onClick={handleToggle}
              style={{
                ...styles.toggleButton,
                ...(mode === 'edit' ? styles.toggleButtonActive : {})
              }}
            >
              <div style={styles.buttonContent}>
                <Pencil size={14} />
                <span>Edit</span>
              </div>
            </button>
            <button
              onClick={handleToggle}
              style={{
                ...styles.toggleButton,
                ...(mode === 'view' ? styles.toggleButtonActive : {})
              }}
            >
              <div style={styles.buttonContent}>
                <LayoutDashboard size={14} />
                <span>View</span>
              </div>
            </button>
          </div>
        </div>
      )}
      {isCollapsed && onToggleMode && (
        <button
          onClick={handleToggle}
          style={styles.collapsedToggle}
          title={mode === 'edit' ? 'Switch to View mode' : 'Switch to Edit mode'}
        >
          {mode === 'edit' ? <Pencil size={18} /> : <LayoutDashboard size={18} />}
        </button>
      )}

      {/* Pages Section */}
      <div style={styles.pagesSection}>
        {!isCollapsed && (
          <>
            <div style={styles.pagesSectionHeader}>
              <span style={styles.pagesSectionTitle}>Pages</span>
              <button
                onClick={onCreateClick}
                style={styles.addPageButton}
                title="Add new page"
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Search Bar */}
            <SearchBar />
          </>
        )}

        {/* Loading State */}
        {loading && !isCollapsed && (
          <div style={styles.loadingText}>Loading...</div>
        )}

        {/* Error State */}
        {error && !isCollapsed && (
          <div style={styles.errorText}>{error}</div>
        )}

        {/* Empty State */}
        {!loading && !error && pages.length === 0 && !isCollapsed && (
          <div style={styles.emptyState}>
            <div style={styles.emptyText}>No pages yet</div>
            <button onClick={onCreateClick} style={styles.createFirstButton}>
              Create Page
            </button>
          </div>
        )}

        {/* Pages List */}
        {!loading && !error && pages.length > 0 && (
          <div style={styles.pagesList}>
            {pages.map((page) => {
              const isActive = currentPage && currentPage.id === page.id;

              return (
                <div
                  key={page.id}
                  onClick={() => handlePageClick(page)}
                  style={{
                    ...styles.pageItem,
                    ...(isActive ? styles.pageItemActive : {}),
                    ...(isCollapsed ? styles.pageItemCollapsed : {})
                  }}
                  title={isCollapsed ? page.name : undefined}
                >
                  <span style={styles.pageIcon}>{page.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span style={styles.pageName}>{page.name}</span>
                      <div style={styles.pageActions}>
                        <button
                          onClick={(e) => handleEditClick(e, page)}
                          style={styles.actionButton}
                          title="Edit page"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, page)}
                          style={styles.actionButtonDelete}
                          title="Delete page"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </>
                  )}
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
          </div>
        )}
      </div>

      {/* Actions Section */}
      {onImportClick && !isCollapsed && (
        <div style={styles.actionsSection}>
          <button onClick={onImportClick} style={styles.importButton} title="Import bookmarks">
            <Download size={16} />
            <span>Import</span>
          </button>
        </div>
      )}
      {onImportClick && isCollapsed && (
        <button onClick={onImportClick} style={styles.collapsedImport} title="Import bookmarks">
          <Download size={20} />
        </button>
      )}

      {/* Size Sliders - Only in Edit mode */}
      {mode === 'edit' && !isCollapsed && (
        <>
          <FontSizeSlider />
          <FaviconSizeSlider />
        </>
      )}

      {/* Theme Switcher */}
      {!isCollapsed && (
        <div style={styles.themeSection}>
          <ThemeSwitcher isCollapsed={false} />
        </div>
      )}
      {isCollapsed && (
        <div style={styles.themeSection}>
          <ThemeSwitcher isCollapsed={true} />
        </div>
      )}

      {/* User Section (Bottom) */}
      <div style={styles.userSection}>
        {!isCollapsed && (
          <div style={styles.userInfo}>
            <div style={styles.userName}>
              {user?.first_name || 'User'}
            </div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={isCollapsed ? styles.collapsedLogout : styles.logoutButton}
          title="Logout"
        >
          {isCollapsed ? <LogOut size={20} /> : (
            <div style={styles.buttonContent}>
              <LogOut size={16} />
              <span>Logout</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    height: '100vh',
    backgroundColor: '#1a1a2e',
    borderRight: '1px solid #2d2d3f',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    left: 0,
    transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    zIndex: 50
  },

  headerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderBottom: '1px solid #2d2d3f',
    minHeight: '64px'
  },

  collapseButton: {
    width: '32px',
    height: '32px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#a1a1aa',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff'
    }
  },

  logo: {
    height: '24px',
    width: 'auto',
    opacity: 0.9
  },

  toggleSection: {
    padding: '16px',
    borderBottom: '1px solid #2d2d3f'
  },

  toggleContainer: {
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '4px',
    gap: '4px'
  },

  toggleButton: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#71717a',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },

  toggleButtonActive: {
    backgroundColor: '#667eea',
    color: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },

  collapsedToggle: {
    width: '40px',
    height: '40px',
    margin: '16px auto',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#a1a1aa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },

  pagesSection: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  pagesSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px 8px 4px',
    marginBottom: '4px'
  },

  pagesSectionTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },

  addPageButton: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#a1a1aa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff'
    }
  },

  loadingText: {
    fontSize: '13px',
    color: '#71717a',
    textAlign: 'center',
    padding: '16px 8px'
  },

  errorText: {
    fontSize: '13px',
    color: '#ef4444',
    textAlign: 'center',
    padding: '16px 8px'
  },

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 8px',
    textAlign: 'center'
  },

  emptyText: {
    fontSize: '13px',
    color: '#71717a'
  },

  createFirstButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  pagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },

  pageItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    border: '1px solid transparent'
  },

  pageItemActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    color: '#fff',
    border: '1px solid rgba(102, 126, 234, 0.2)'
  },

  pageItemCollapsed: {
    justifyContent: 'center',
    padding: '10px'
  },

  pageIcon: {
    fontSize: '16px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  pageName: {
    fontSize: '14px',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1
  },

  pageActions: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0,
    opacity: 0.6,
    transition: 'opacity 0.2s'
  },

  actionButton: {
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#a1a1aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#fff'
    }
  },

  actionButtonDelete: {
    width: '24px',
    height: '24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#71717a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444'
    }
  },

  activeIndicator: {
    position: 'absolute',
    left: '0',
    top: '10px',
    bottom: '10px',
    width: '4px',
    borderRadius: '0 4px 4px 0'
  },

  actionsSection: {
    padding: '16px',
    borderTop: '1px solid #2d2d3f'
  },

  importButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  },

  collapsedImport: {
    width: '40px',
    height: '40px',
    margin: '16px auto',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '8px',
    color: '#667eea',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },

  themeSection: {
    padding: '16px',
    borderTop: '1px solid #2d2d3f'
  },

  userSection: {
    padding: '16px',
    borderTop: '1px solid #2d2d3f',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },

  userInfo: {
    padding: '0 4px'
  },

  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e4e4e7',
    marginBottom: '2px'
  },

  userEmail: {
    fontSize: '12px',
    color: '#a1a1aa',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  logoutButton: {
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#a1a1aa',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  collapsedLogout: {
    width: '40px',
    height: '40px',
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    color: '#a1a1aa',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  }
};
