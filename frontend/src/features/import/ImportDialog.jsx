import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../auth/store/authStore';
import ImportReport from './ImportReport';

/**
 * ImportDialog Component
 *
 * Dialog for importing bookmarks from HTML files (Chrome, Firefox, Safari)
 * - File selection with validation
 * - Upload to backend
 * - Display import results
 */
export default function ImportDialog({ isOpen, onClose }) {
  const { getToken } = useAuthStore();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (selectedFile.type !== 'text/html') {
      setError('Please select an HTML file (.html)');
      setFile(null);
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      setFile(null);
      return;
    }

    // File is valid
    setFile(selectedFile);
    setError('');
  };

  /**
   * Handle import submission
   */
  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);

      // Get auth token from Zustand store
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Upload to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/import/bookmarks`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Show result
      setResult(response.data.data);

      // Refresh page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (err) {
      console.error('Import error:', err);

      // Extract error message
      const errorMessage = err.response?.data?.message || err.message || 'Import failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close dialog and reset state
   */
  const handleClose = () => {
    setFile(null);
    setError('');
    setResult(null);
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!result ? (
          // Upload form
          <>
            <h2 style={styles.title}>📥 Import Bookmarks</h2>

            <p style={styles.description}>
              Upload an HTML bookmarks file exported from Chrome, Firefox, or Safari.
            </p>

            <div style={styles.fileInputContainer}>
              <input
                type="file"
                accept=".html"
                onChange={handleFileChange}
                disabled={loading}
                style={styles.fileInput}
              />
            </div>

            {file && (
              <div style={styles.fileInfo}>
                <span style={styles.fileIcon}>📄</span>
                <span style={styles.fileName}>{file.name}</span>
                <span style={styles.fileSize}>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            {error && (
              <div style={styles.error}>
                ⚠️ {error}
              </div>
            )}

            <div style={styles.buttons}>
              <button
                onClick={handleClose}
                disabled={loading}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || loading}
                style={{
                  ...styles.importButton,
                  ...((!file || loading) && styles.importButtonDisabled)
                }}
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>

            {loading && (
              <div style={styles.loadingText}>
                ⏳ This may take a few moments depending on file size...
              </div>
            )}
          </>
        ) : (
          // Import report
          <ImportReport result={result} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

// Styles
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    fontWeight: '600',
    color: '#333'
  },
  description: {
    margin: '0 0 24px 0',
    color: '#666',
    lineHeight: '1.5'
  },
  fileInputContainer: {
    marginBottom: '16px'
  },
  fileInput: {
    width: '100%',
    padding: '12px',
    border: '2px dashed #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  fileIcon: {
    fontSize: '20px'
  },
  fileName: {
    flex: 1,
    fontWeight: '500',
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  fileSize: {
    color: '#999',
    fontSize: '12px'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c00',
    marginBottom: '16px',
    fontSize: '14px'
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  importButton: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  importButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  loadingText: {
    marginTop: '16px',
    textAlign: 'center',
    color: '#999',
    fontSize: '13px'
  }
};
