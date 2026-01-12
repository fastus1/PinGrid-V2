import { useState, useEffect } from 'react';
import { useSectionsStore } from '../store/sectionsStore';

/**
 * EditSectionModal Component
 * Modal pour éditer une section existante
 *
 * Features:
 * - Form: name (pré-rempli avec section.name)
 * - Validation: name requis, max 100 chars
 * - Submit → updateSection action
 * - Afficher error si échec
 * - Close modal après success
 */
export default function EditSectionModal({ isOpen, onClose, section }) {
  const { updateSection, loading, error, clearError } = useSectionsStore();

  const [formData, setFormData] = useState({
    name: ''
  });

  const [formError, setFormError] = useState('');

  // Pré-remplir le form quand la section change
  useEffect(() => {
    if (section) {
      setFormData({ name: section.name });
    }
  }, [section]);

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

    // Si pas de changement, juste fermer
    if (formData.name.trim() === section.name) {
      handleClose();
      return;
    }

    // Appel API
    const result = await updateSection(section.id, formData);

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

  if (!isOpen || !section) return null;

  const displayError = formError || error;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Section</h2>
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
              {loading ? 'Saving...' : 'Save Changes'}
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
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb'
  },

  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827'
  },

  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
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
    borderRadius: '8px',
    padding: '12px 16px',
    margin: '16px 24px 0',
    color: '#dc2626',
    fontSize: '14px'
  },

  form: {
    padding: '24px'
  },

  formGroup: {
    marginBottom: '24px'
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },

  required: {
    color: '#dc2626'
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box'
  },

  charCount: {
    textAlign: 'right',
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px'
  },

  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '32px'
  },

  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s'
  },

  submitButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
  },

  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};
