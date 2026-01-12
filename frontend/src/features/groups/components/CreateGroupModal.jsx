import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGroupsStore } from '../store/groupsStore';

/**
 * CreateGroupModal Component
 * Modal pour créer un nouveau group dans une section
 *
 * Features:
 * - Form: name (required), group_type (manual/dynamic), column_count (1-6), bookmark_limit (si dynamic)
 * - Validation: name requis, bookmark_limit requis si dynamic
 * - Submit → createGroup action
 * - Afficher error si échec
 * - Close modal après success
 * - Preview du layout selon column_count sélectionné
 */
export default function CreateGroupModal({ isOpen, onClose, sectionId }) {
  const { createGroup, loading, error, clearError } = useGroupsStore();

  const [formData, setFormData] = useState({
    name: '',
    group_type: 'manual',
    column_count: 3,
    bookmark_limit: '',
    width: '100%'
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
    if (!formData.name.trim()) {
      setFormError('Group name is required');
      return;
    }

    if (formData.name.length > 100) {
      setFormError('Group name must be 100 characters or less');
      return;
    }

    if (formData.group_type === 'dynamic-top-used') {
      if (!formData.bookmark_limit || formData.bookmark_limit <= 0) {
        setFormError('Bookmark limit is required and must be greater than 0 for dynamic groups');
        return;
      }
    }

    // Préparer les données
    const groupData = {
      name: formData.name.trim(),
      group_type: formData.group_type,
      column_count: parseInt(formData.column_count),
      width: formData.width
    };

    // Ajouter bookmark_limit uniquement si dynamic
    if (formData.group_type === 'dynamic-top-used') {
      groupData.bookmark_limit = parseInt(formData.bookmark_limit);
    }

    // Appel API
    const result = await createGroup(sectionId, groupData);

    if (result.success) {
      // Reset form et close modal
      setFormData({
        name: '',
        group_type: 'manual',
        column_count: 3,
        bookmark_limit: '',
        width: '100%'
      });
      setFormError('');
      onClose();
    } else {
      setFormError(result.error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      group_type: 'manual',
      column_count: 3,
      bookmark_limit: '',
      width: '100%'
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
          <h2 style={styles.title}>Create New Group</h2>
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
          {/* Group Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Group Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Daily Links, Top Resources, Quick Access..."
              style={styles.input}
              disabled={loading}
              maxLength={100}
              autoFocus
            />
            <div style={styles.charCount}>{formData.name.length}/100</div>
          </div>

          {/* Group Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Group Type <span style={styles.required}>*</span>
            </label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="group_type"
                  value="manual"
                  checked={formData.group_type === 'manual'}
                  onChange={(e) => handleChange('group_type', e.target.value)}
                  disabled={loading}
                  style={styles.radio}
                />
                <div>
                  <div style={styles.radioTitle}>📌 Manual</div>
                  <div style={styles.radioDescription}>
                    You manually add and organize bookmarks
                  </div>
                </div>
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="group_type"
                  value="dynamic-top-used"
                  checked={formData.group_type === 'dynamic-top-used'}
                  onChange={(e) => handleChange('group_type', e.target.value)}
                  disabled={loading}
                  style={styles.radio}
                />
                <div>
                  <div style={styles.radioTitle}>⚡ Dynamic (Top Used)</div>
                  <div style={styles.radioDescription}>
                    Automatically shows your most clicked bookmarks
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Bookmark Limit (si Dynamic) */}
          {formData.group_type === 'dynamic-top-used' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Bookmark Limit <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={formData.bookmark_limit}
                onChange={(e) => handleChange('bookmark_limit', e.target.value)}
                placeholder="e.g., 10"
                style={styles.input}
                disabled={loading}
                min="1"
                max="50"
              />
              <div style={styles.hint}>
                Number of top bookmarks to display (1-50)
              </div>
            </div>
          )}

          {/* Column Count */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Column Layout <span style={styles.required}>*</span>
            </label>
            <select
              value={formData.column_count}
              onChange={(e) => handleChange('column_count', e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              <option value="1">1 Column</option>
              <option value="2">2 Columns</option>
              <option value="3">3 Columns (Recommended)</option>
              <option value="4">4 Columns</option>
              <option value="5">5 Columns</option>
              <option value="6">6 Columns</option>
            </select>
            <div style={styles.hint}>
              Number of columns for bookmark cards
            </div>
          </div>

          {/* Width Selector */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Group Width <span style={styles.required}>*</span>
            </label>
            <select
              value={formData.width}
              onChange={(e) => handleChange('width', e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              <option value="25%">25% - Quarter</option>
              <option value="33%">33% - Third</option>
              <option value="50%">50% - Half</option>
              <option value="66%">66% - Two Thirds</option>
              <option value="75%">75% - Three Quarters</option>
              <option value="100%">100% - Full Width</option>
            </select>
            <div style={styles.hint}>
              Horizontal space the group takes in the section
            </div>
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
              {loading ? 'Creating...' : 'Create Group'}
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

  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #2d2d3f',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    backgroundColor: '#252540',
    color: '#e4e4e7',
    cursor: 'pointer'
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

  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  radioLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px',
    border: '1px solid #2d2d3f',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    backgroundColor: '#252540'
  },

  radio: {
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: '#667eea'
  },

  radioTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e4e4e7',
    marginBottom: '2px'
  },

  radioDescription: {
    fontSize: '12px',
    color: '#a1a1aa'
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
