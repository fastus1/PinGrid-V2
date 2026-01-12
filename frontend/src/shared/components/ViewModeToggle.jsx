import { useViewModeStore } from '../store/viewModeStore';

/**
 * ViewModeToggle Component
 * 
 * Toggle button to switch between Edit and View modes.
 * Displays current mode with visual indicator.
 */
export default function ViewModeToggle({ onBeforeToggle }) {
    const { mode, toggleMode, isGeneratingCache } = useViewModeStore();

    const handleToggle = async () => {
        // Call onBeforeToggle if provided (for cache generation)
        if (onBeforeToggle) {
            const result = await onBeforeToggle(mode);
            if (result === 'cancel') {
                return; // Abort toggle - confirmation dialog will handle it
            }
        }
        toggleMode();
    };

    const isViewMode = mode === 'view';

    return (
        <button
            onClick={handleToggle}
            style={{
                ...styles.toggleButton,
                ...(isViewMode ? styles.viewModeButton : styles.editModeButton)
            }}
            disabled={isGeneratingCache}
            title={isViewMode ? 'Switch to Edit mode' : 'Switch to View mode'}
        >
            {isGeneratingCache ? (
                <span style={styles.generating}>⏳ Generating...</span>
            ) : (
                <>
                    <span style={styles.icon}>{isViewMode ? '👁' : '✏️'}</span>
                    <span style={styles.label}>{isViewMode ? 'View' : 'Edit'}</span>
                    <span style={styles.arrow}>→</span>
                    <span style={styles.targetMode}>{isViewMode ? 'Edit' : 'View'}</span>
                </>
            )}
        </button>
    );
}

const styles = {
    toggleButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.2s'
    },

    viewModeButton: {
        backgroundColor: 'rgba(34, 211, 238, 0.15)',
        color: '#22d3ee',
        border: '1px solid rgba(34, 211, 238, 0.3)'
    },

    editModeButton: {
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        color: '#a855f7',
        border: '1px solid rgba(168, 85, 247, 0.3)'
    },

    icon: {
        fontSize: '14px'
    },

    label: {
        fontWeight: '700'
    },

    arrow: {
        opacity: 0.6,
        fontSize: '11px'
    },

    targetMode: {
        opacity: 0.8
    },

    generating: {
        color: '#f59e0b'
    }
};
