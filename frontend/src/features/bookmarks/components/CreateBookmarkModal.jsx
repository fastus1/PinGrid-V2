import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBookmarksStore } from '../store/bookmarksStore';

/**
 * CreateBookmarkModal Component
 * Modal pour créer un nouveau bookmark dans un group
 *
 * Features:
 * - Form: title (required, max 200), url (required, format http/https), description (optional, max 500), favicon_url (optional)
 * - Validation: title requis, URL format
 * - Submit → createBookmark action
 * - Afficher error si échec
 * - Close modal après success
 */
export default function CreateBookmarkModal({ isOpen, onClose, groupId }) {
  const { createBookmark, loading, error, clearError } = useBookmarksStore();

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    favicon_url: ''
  });

  const [formError, setFormError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation côté client
    if (!formData.title.trim()) {
      setFormError('Bookmark title is required');
      return;
    }

    if (formData.title.length > 200) {
      setFormError('Title must be 200 characters or less');
      return;
    }

    if (!formData.url.trim()) {
      setFormError('Bookmark URL is required');
      return;
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(formData.url.trim())) {
      setFormError('URL must start with http:// or https://');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      setFormError('Description must be 500 characters or less');
      return;
    }

    // Préparer les données
    const bookmarkData = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description.trim() || undefined,
      favicon_url: formData.favicon_url.trim() || undefined
    };

    // Appel API
    const result = await createBookmark(groupId, bookmarkData);

    if (result.success) {
      // Reset form et close modal
      setFormData({
        title: '',
        url: '',
        description: '',
        favicon_url: ''
      });
      setFormError('');
      onClose();
    } else {
      setFormError(result.error);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      favicon_url: ''
    });
    setFormError('');
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  const displayError = formError || error;

  return createPortal(
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create New Bookmark</h2>
          <button onClick={handleClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        {displayError && (
          <div style={styles.errorBox}>
            <strong>⚠️ Error:</strong> {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Title <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., GitHub, Google Drive, Stack Overflow..."
              style={styles.input}
              disabled={loading}
              maxLength={200}
              autoFocus
            />
            <div style={styles.charCount}>{formData.title.length}/200</div>
          </div>

          {/* URL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              URL <span style={styles.required}>*</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://example.com"
              style={styles.input}
              disabled={loading}
            />
            <div style={styles.hint}>Must start with http:// or https://</div>
          </div>

          {/* Description (Optional) */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this bookmark..."
              style={styles.textarea}
              disabled={loading}
              maxLength={500}
              rows={3}
            />
            <div style={styles.charCount}>{formData.description.length}/500</div>
          </div>

          {/* Favicon URL (Optional) */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Favicon URL (Optional)</label>
            <input
              type="url"
              value={formData.favicon_url}
              onChange={(e) => handleChange('favicon_url', e.target.value)}
              placeholder="https://example.com/favicon.ico"
              style={styles.input}
              disabled={loading}
            />
            <div style={styles.hint}>URL to the website's favicon image</div>
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
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
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {})
              }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Bookmark'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },

  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid #2d2d3f',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #2d2d3f'
  },

  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#e4e4e7'
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#71717a',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    lineHeight: 1
  },

  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    padding: '10px 12px',
    margin: '12px 16px 0',
    color: '#f87171',
    fontSize: '13px'
  },

  form: {
    padding: '16px'
  },

  formGroup: {
    marginBottom: '16px'
  },

  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#a1a1aa'
  },

  required: {
    color: '#f87171'
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #2d2d3f',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    backgroundColor: '#252540',
    color: '#e4e4e7'
  },

  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #2d2d3f',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'inherit',
    backgroundColor: '#252540',
    color: '#e4e4e7'
  },

  charCount: {
    textAlign: 'right',
    fontSize: '11px',
    color: '#71717a',
    marginTop: '4px'
  },

  hint: {
    fontSize: '11px',
    color: '#71717a',
    marginTop: '4px'
  },

  buttonGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },

  cancelButton: {
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #2d2d3f',
    borderRadius: '6px',
    backgroundColor: '#252540',
    color: '#a1a1aa',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  submitButton: {
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};
