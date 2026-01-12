import { useState } from 'react';
import { usePagesStore } from '../store/pagesStore';

/**
 * CreatePageModal Component
 * Modal pour créer une nouvelle page
 *
 * Features:
 * - Form: name (required), icon (emoji picker ou input), color (picker)
 * - Validation: name requis, max 100 chars
 * - Submit → createPage action
 * - Afficher error si échec
 * - Close modal après success
 */
export default function CreatePageModal({ isOpen, onClose }) {
  const { createPage, loading, error, clearError } = usePagesStore();

  const [formData, setFormData] = useState({
    name: '',
    icon: '📄',
    color: '#667eea'
  });

  const [formError, setFormError] = useState('');

  // Liste d'emojis suggérés
  const suggestedEmojis = ['📄', '📁', '💼', '🏠', '🎯', '💡', '📚', '🎨', '⚡', '🔥', '🌟', '✨'];

  // Liste de couleurs suggérées
  const suggestedColors = [
    '#667eea', // Purple (default)
    '#764ba2', // Dark purple
    '#f093fb', // Pink
    '#4facfe', // Blue
    '#43e97b', // Green
    '#fa709a', // Rose
    '#feca57', // Yellow
    '#ff6b6b', // Red
    '#ee5a6f', // Dark red
    '#c44569', // Burgundy
    '#786fa6', // Lavender
    '#f8b500'  // Orange
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation côté client
    if (!formData.name.trim()) {
      setFormError('Page name is required');
      return;
    }

    if (formData.name.length > 100) {
      setFormError('Page name must be 100 characters or less');
      return;
    }

    // Appel API
    const result = await createPage(formData);

    if (result.success) {
      // Reset form et close modal
      setFormData({ name: '', icon: '📄', color: '#667eea' });
      setFormError('');
      onClose();
    } else {
      setFormError(result.error);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', icon: '📄', color: '#667eea' });
    setFormError('');
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  const displayError = formError || error;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create New Page</h2>
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
          {/* Page Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Page Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Work, Personal, Projects..."
              style={styles.input}
              disabled={loading}
              maxLength={100}
              autoFocus
            />
            <div style={styles.charCount}>{formData.name.length}/100</div>
          </div>

          {/* Icon Picker */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Icon</label>
            <div style={styles.emojiGrid}>
              {suggestedEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange('icon', emoji)}
                  style={{
                    ...styles.emojiButton,
                    ...(formData.icon === emoji ? styles.emojiButtonActive : {})
                  }}
                  disabled={loading}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              placeholder="Or paste custom emoji"
              style={styles.inputSmall}
              disabled={loading}
              maxLength={50}
            />
          </div>

          {/* Color Picker */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Color</label>
            <div style={styles.colorGrid}>
              {suggestedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  style={{
                    ...styles.colorButton,
                    backgroundColor: color,
                    ...(formData.color === color ? styles.colorButtonActive : {})
                  }}
                  disabled={loading}
                  title={color}
                />
              ))}
            </div>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="#667eea"
              style={styles.inputSmall}
              disabled={loading}
              maxLength={7}
            />
          </div>

          {/* Preview */}
          <div style={styles.preview}>
            <div style={styles.previewLabel}>Preview:</div>
            <div
              style={{
                ...styles.previewBox,
                borderColor: formData.color
              }}
            >
              <span style={styles.previewIcon}>{formData.icon}</span>
              <span style={styles.previewName}>{formData.name || 'Page Name'}</span>
            </div>
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleClose}
              style={styles.buttonSecondary}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.buttonPrimary,
                ...(loading ? styles.buttonDisabled : {})
              }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    backgroundColor: '#1e1e2e',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    padding: '0',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid #2d2d3f'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 24px 16px',
    borderBottom: '1px solid #2d2d3f'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#e4e4e7',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#a1a1aa',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s'
  },
  errorBox: {
    background: '#3d1f1f',
    border: '2px solid #5c2d2d',
    color: '#ef4444',
    padding: '12px',
    margin: '16px 24px',
    borderRadius: '8px',
    fontSize: '0.9rem'
  },
  form: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#e4e4e7'
  },
  required: {
    color: '#ef4444'
  },
  input: {
    padding: '12px',
    border: '2px solid #2d2d3f',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.2s',
    outline: 'none',
    backgroundColor: '#252540',
    color: '#e4e4e7'
  },
  inputSmall: {
    padding: '8px',
    border: '2px solid #2d2d3f',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
    marginTop: '8px',
    backgroundColor: '#252540',
    color: '#e4e4e7'
  },
  charCount: {
    fontSize: '0.8rem',
    color: '#71717a',
    textAlign: 'right'
  },
  emojiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px'
  },
  emojiButton: {
    padding: '12px',
    fontSize: '1.5rem',
    backgroundColor: '#252540',
    border: '2px solid #2d2d3f',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  emojiButtonActive: {
    backgroundColor: '#3d3d5c',
    borderColor: '#667eea',
    transform: 'scale(1.1)'
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px'
  },
  colorButton: {
    width: '100%',
    height: '40px',
    border: '2px solid #2d2d3f',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  colorButtonActive: {
    borderColor: '#e4e4e7',
    borderWidth: '3px',
    transform: 'scale(1.1)'
  },
  preview: {
    padding: '16px',
    backgroundColor: '#252540',
    borderRadius: '8px',
    border: '1px solid #2d2d3f'
  },
  previewLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: '8px'
  },
  previewBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#1e1e2e',
    borderRadius: '8px',
    border: '2px solid',
    borderColor: '#667eea'
  },
  previewIcon: {
    fontSize: '1.5rem'
  },
  previewName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#e4e4e7'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px'
  },
  buttonSecondary: {
    padding: '12px 24px',
    backgroundColor: '#2d2d3f',
    color: '#e4e4e7',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  buttonPrimary: {
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  buttonDisabled: {
    backgroundColor: '#3d3d5c',
    cursor: 'not-allowed'
  }
};
