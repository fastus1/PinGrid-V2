/**
 * ImportReport Component
 *
 * Displays results of bookmark import
 * - Statistics (imported, skipped, failed)
 * - Section and group information
 * - Success message and close button
 */
export default function ImportReport({ result, onClose }) {
  const { section, group, imported, skipped, failed, total } = result;

  const hasErrors = failed > 0;
  const allSkipped = imported === 0 && skipped > 0;

  return (
    <div style={styles.container}>
      <div style={styles.iconContainer}>
        {!hasErrors && !allSkipped ? (
          <div style={styles.successIcon}>✅</div>
        ) : allSkipped ? (
          <div style={styles.warningIcon}>⚠️</div>
        ) : (
          <div style={styles.mixedIcon}>⚡</div>
        )}
      </div>

      <h2 style={styles.title}>
        {!hasErrors && !allSkipped
          ? 'Import Complete!'
          : allSkipped
          ? 'All Bookmarks Skipped'
          : 'Import Completed with Warnings'}
      </h2>

      {/* Statistics Cards */}
      <div style={styles.statsContainer}>
        <div style={{ ...styles.statCard, ...styles.successCard }}>
          <div style={styles.statNumber}>{imported}</div>
          <div style={styles.statLabel}>Imported</div>
        </div>

        {skipped > 0 && (
          <div style={{ ...styles.statCard, ...styles.warningCard }}>
            <div style={styles.statNumber}>{skipped}</div>
            <div style={styles.statLabel}>Skipped</div>
            <div style={styles.statHint}>(Duplicates)</div>
          </div>
        )}

        {failed > 0 && (
          <div style={{ ...styles.statCard, ...styles.errorCard }}>
            <div style={styles.statNumber}>{failed}</div>
            <div style={styles.statLabel}>Failed</div>
          </div>
        )}
      </div>

      {/* Total */}
      <div style={styles.total}>
        Total processed: <strong>{total}</strong> bookmarks
      </div>

      {/* Section and Group Info */}
      <div style={styles.infoBox}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>📦 Section:</span>
          <span style={styles.infoValue}>{section.name}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>🗂️ Group:</span>
          <span style={styles.infoValue}>{group.name}</span>
        </div>
      </div>

      {/* Messages */}
      {allSkipped && (
        <div style={styles.message}>
          All bookmarks were skipped because they already exist in your collection.
        </div>
      )}

      {hasErrors && (
        <div style={styles.errorMessage}>
          Some bookmarks could not be imported. This may be due to invalid URLs or data.
        </div>
      )}

      {imported > 0 && (
        <div style={styles.successMessage}>
          🎉 {imported} bookmark{imported !== 1 ? 's' : ''} successfully imported with favicons!
        </div>
      )}

      {/* Close Button */}
      <button onClick={onClose} style={styles.closeButton}>
        Close
      </button>

      {/* Auto-refresh notice */}
      <div style={styles.refreshNotice}>
        The page will refresh automatically in 3 seconds...
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    textAlign: 'center'
  },
  iconContainer: {
    marginBottom: '20px'
  },
  successIcon: {
    fontSize: '64px',
    animation: 'bounce 0.5s ease-in-out'
  },
  warningIcon: {
    fontSize: '64px',
    color: '#ff9800'
  },
  mixedIcon: {
    fontSize: '64px',
    color: '#2196F3'
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    fontWeight: '600',
    color: '#333'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  },
  statCard: {
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid',
    textAlign: 'center'
  },
  successCard: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50'
  },
  warningCard: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800'
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#666'
  },
  statHint: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px'
  },
  total: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#666'
  },
  infoBox: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e0e0e0'
  },
  infoLabel: {
    fontWeight: '500',
    color: '#666',
    fontSize: '14px'
  },
  infoValue: {
    color: '#333',
    fontSize: '14px',
    fontWeight: '500'
  },
  message: {
    padding: '12px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    color: '#856404',
    marginBottom: '12px',
    fontSize: '14px'
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    color: '#721c24',
    marginBottom: '12px',
    fontSize: '14px'
  },
  successMessage: {
    padding: '12px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '8px',
    color: '#155724',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  closeButton: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s',
    width: '100%'
  },
  refreshNotice: {
    marginTop: '16px',
    color: '#999',
    fontSize: '12px',
    fontStyle: 'italic'
  }
};
