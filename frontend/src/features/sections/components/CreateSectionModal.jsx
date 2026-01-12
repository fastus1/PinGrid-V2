import { useState } from 'react';
import { useSectionsStore } from '../store/sectionsStore';

/**
 * CreateSectionModal Component
 * Modal pour créer une nouvelle section dans une page
 *
 * Features:
 * - Form: name (required)
 * - Validation: name requis, max 100 chars
 * - Submit → createSection action
 * - Afficher error si échec
 * - Close modal après success
 */
export default function CreateSectionModal({ isOpen, onClose, pageId }) {
  const { createSection, loading, error, clearError } = useSectionsStore();

  const [formData, setFormData] = useState({
    name: ''
  });

  const [formError, setFormError] = useState('');

  const handleChange = (value) => {
    setFormData({ name: value });
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation côté client
    if (!formData.name.trim()) {
      setFormError('Section name is required');
      return;
    }

    if (formData.name.length > 100) {
      setFormError('Section name must be 100 characters or less');
      return;
    }

    // Appel API
    const result = await createSection(pageId, formData);

    if (result.success) {
      // Reset form et close modal
      setFormData({ name: '' });
      setFormError('');
      onClose();
    } else {
      setFormError(result.error);
    }
  };

  const handleClose = () => {
    setFormData({ name: '' });
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
          <h2 style={styles.title}>Create New Section</h2>
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
          {/* Section Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Section Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="e.g., Daily Tools, Work Projects, Resources..."
              style={styles.input}
              disabled={loading}
              maxLength={100}
              autoFocus
            />
            <div style={styles.charCount}>{formData.name.length}/100</div>
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
              {loading ? 'Creating...' : 'Create Section'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },

  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    maxWidth: '450px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb'
  },

  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827'
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    lineHeight: 1
  },

  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '10px 12px',
    margin: '12px 16px 0',
    color: '#dc2626',
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
    color: '#374151'
  },

  required: {
    color: '#dc2626'
  },

  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },

  charCount: {
    textAlign: 'right',
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px'
  },

  buttonGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },

  cancelButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },

  submitButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
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
