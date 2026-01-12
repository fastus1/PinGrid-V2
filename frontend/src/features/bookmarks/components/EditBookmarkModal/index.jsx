import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBookmarksStore } from '../../store/bookmarksStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { useTheme } from '../../../../shared/theme/useTheme';
import bookmarksService from '../../services/bookmarksService';
import TabNavigation from './TabNavigation';
import BasicInfoTab from './BasicInfoTab';
import IconDesignerTab from './IconDesignerTab';
import { SPACING } from '../../utils/spacing';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * EditBookmarkModal Component (Refactored V2)
 *
 * Modal redesigné avec structure par onglets minimaliste:
 * - Tab 1: Basic Info (title, URL, description)
 * - Tab 2: Favicon Sources (8 API sources + upload)
 * - Tab 3: Icon Designer (custom icon creation)
 *
 * Dimensions fixes: 900px × 700px
 */
export default function EditBookmarkModal({ isOpen, onClose, bookmark, groupId }) {
  const { updateBookmark, loading, error, clearError } = useBookmarksStore();
  const { token } = useAuthStore();
  const { theme } = useTheme();

  // Active tab state
  const [activeTab, setActiveTab] = useState('basic');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    favicon_url: ''
  });

  const [formError, setFormError] = useState('');
  const [refreshingFavicon, setRefreshingFavicon] = useState(false);

  // Tab validation state (for checkmarks)
  const [tabsValidation, setTabsValidation] = useState({
    basic: false,
    sources: false,
    designer: false
  });

  // Pre-fill form when bookmark changes
  useEffect(() => {
    if (bookmark && isOpen) {
      setFormData({
        title: bookmark.title || '',
        url: bookmark.url || '',
        description: bookmark.description || '',
        favicon_url: bookmark.favicon_url || ''
      });
      setActiveTab('basic'); // Reset to basic tab on open
    }
  }, [bookmark, isOpen]);

  // Validate basic tab whenever formData changes
  useEffect(() => {
    const isUrlValid = formData.url && (formData.url.startsWith('http://') || formData.url.startsWith('https://'));
    const basicValid = formData.title.trim().length > 0 && isUrlValid;

    setTabsValidation((prev) => ({
      ...prev,
      basic: basicValid
    }));
  }, [formData.title, formData.url]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setFormError('');
    clearError();
  };

  // Callback for saving designed icon from FaviconDesigner
  const handleDesignedIcon = async (blob) => {
    try {
      const file = new File([blob], "custom-icon.png", { type: "image/png" });
      setRefreshingFavicon(true);

      const response = await bookmarksService.uploadFavicon(file, token);
      if (response.data?.success) {
        const iconUrl = `${API_URL}${response.data.data.url}`;
        handleChange('favicon_url', iconUrl);
        setActiveTab('basic'); // Return to basic tab after saving icon
      }
    } catch (error) {
      console.error('Failed to upload designed icon:', error);
      setFormError('Failed to save designed icon');
    } finally {
      setRefreshingFavicon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation côté client
    if (!formData.title.trim()) {
      setFormError('Bookmark title is required');
      setActiveTab('basic');
      return;
    }

    if (formData.title.length > 200) {
      setFormError('Title must be 200 characters or less');
      setActiveTab('basic');
      return;
    }

    if (!formData.url.trim()) {
      setFormError('Bookmark URL is required');
      setActiveTab('basic');
      return;
    }

    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(formData.url.trim())) {
      setFormError('URL must start with http:// or https://');
      setActiveTab('basic');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      setFormError('Description must be 500 characters or less');
      setActiveTab('basic');
      return;
    }

    // Préparer les données (only changed fields)
    const updates = {};
    if (formData.title.trim() !== bookmark.title) {
      updates.title = formData.title.trim();
    }
    if (formData.url.trim() !== bookmark.url) {
      updates.url = formData.url.trim();
    }
    if (formData.description.trim() !== (bookmark.description || '')) {
      updates.description = formData.description.trim() || null;
    }
    if (formData.favicon_url.trim() !== (bookmark.favicon_url || '')) {
      updates.favicon_url = formData.favicon_url.trim() || null;
    }

    // Si aucun changement, fermer
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    // Appel API
    const result = await updateBookmark(bookmark.id, groupId, updates);

    if (result.success) {
      setFormError('');
      onClose();
    } else {
      setFormError(result.error);
    }
  };

  const handleClose = () => {
    setFormError('');
    clearError();
    onClose();
  };

  if (!isOpen || !bookmark) return null;

  const displayError = formError || error;
  const styles = getStyles(theme);

  return createPortal(
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Bookmark</h2>
          <button onClick={handleClose} style={styles.closeButton} type="button">
            ✕
          </button>
        </div>

        {/* Error Display */}
        {displayError && (
          <div style={styles.errorBox}>
            <strong>⚠️ Error:</strong> {displayError}
          </div>
        )}

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabsValidation={tabsValidation}
        />

        {/* Tab Content */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {activeTab === 'basic' && (
            <BasicInfoTab
              formData={formData}
              onChange={handleChange}
              currentFavicon={formData.favicon_url}
            />
          )}

          {activeTab === 'sources' && (
            <FaviconSourcesTabPlaceholder
              formData={formData}
              onChange={handleChange}
              token={token}
              setFormError={setFormError}
            />
          )}

          {activeTab === 'designer' && (
            <div style={styles.tabContent}>
              <IconDesignerTab
                onSave={handleDesignedIcon}
                onCancel={() => setActiveTab('basic')}
                currentFaviconUrl={formData.favicon_url}
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div style={styles.footer}>
            <button
              type="button"
              onClick={handleClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.saveButton,
                ...(loading ? styles.saveButtonDisabled : {})
              }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/**
 * Temporary Placeholder for FaviconSourcesTab
 * Will be replaced with proper component in Phase 4
 */
function FaviconSourcesTabPlaceholder({ formData, onChange, token, setFormError }) {
  const { theme } = useTheme();

  // Extract domain from URL
  let domain = '';
  try {
    const url = formData.url.trim();
    if (url.startsWith('http')) {
      domain = new URL(url).hostname;
    }
  } catch (e) { /* ignore */ }

  const sources = [
    { name: 'Google Magic', url: `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(formData.url)}&size=256` },
    { name: 'Google S2 HD', url: `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(formData.url)}&sz=256` },
    { name: 'Clearbit', url: `https://logo.clearbit.com/${domain}` },
    { name: 'IconHorse', url: `https://icon.horse/icon/${domain}` },
    { name: 'Unavatar', url: `https://unavatar.io/${domain}` },
    { name: 'Logo.dev', url: `https://img.logo.dev/${domain}?token=pk_b0bIoxPqTaCHxm8nd6nAfw` },
    { name: 'Favicon.im', url: `https://favicon.im/${domain}?larger=true` },
    { name: 'DuckDuckGo', url: `https://icons.duckduckgo.com/ip3/${domain}.ico` },
  ];

  const styles = {
    container: {
      height: '530px',
      overflowY: 'auto',
      padding: SPACING.xl,
    },
    noDomain: {
      textAlign: 'center',
      padding: SPACING.xl,
      color: theme.colors.textMuted,
      fontSize: '14px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: SPACING.md,
    },
    sourceCard: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: SPACING.md,
      background: theme.colors.cardBg,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    sourceCardSelected: {
      borderColor: theme.glow.color,
      boxShadow: `0 0 12px ${theme.glow.color}`,
    },
    sourceImg: {
      width: '48px',
      height: '48px',
      objectFit: 'contain',
    },
    sourceName: {
      fontSize: '12px',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  };

  if (!domain) {
    return (
      <div style={styles.container}>
        <div style={styles.noDomain}>
          Enter a valid URL in the Basic Info tab first
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {sources.map((source) => (
          <div
            key={source.name}
            style={{
              ...styles.sourceCard,
              ...(formData.favicon_url === source.url ? styles.sourceCardSelected : {})
            }}
            onClick={() => onChange('favicon_url', source.url)}
          >
            <img
              src={source.url}
              alt={source.name}
              style={styles.sourceImg}
              onError={(e) => {
                e.target.style.opacity = '0.3';
              }}
            />
            <span style={styles.sourceName}>{source.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },

  modal: {
    width: '90vw',
    maxWidth: '1600px',
    height: '85vh',
    maxHeight: '900px',
    background: theme.colors.background,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    padding: `0 ${SPACING.xl}`,
    borderBottom: `1px solid ${theme.colors.border}`,
  },

  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: theme.colors.textMuted,
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    outline: 'none',
    '&:hover': {
      background: theme.colors.cardBgHover,
      color: theme.colors.textPrimary,
    },
  },

  errorBox: {
    background: `${theme.colors.error}15`,
    border: `1px solid ${theme.colors.error}30`,
    borderRadius: '8px',
    padding: `${SPACING.md} ${SPACING.md}`,
    margin: `${SPACING.md} ${SPACING.xl} 0`,
    color: theme.colors.error,
    fontSize: '13px',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },

  tabContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    padding: `${SPACING.md} ${SPACING.xl}`,
    borderTop: `1px solid ${theme.colors.border}`,
    height: '60px',
    alignItems: 'center',
  },

  cancelButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: `1px solid ${theme.colors.border}`,
    background: 'transparent',
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },

  saveButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    background: theme.colors.primary,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },

  saveButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});
