import { useTheme } from '../../../../shared/theme/useTheme';
import { SPACING } from '../../utils/spacing';

/**
 * TabNavigation Component
 *
 * Navigation par onglets pour le modal EditBookmark
 * 3 tabs: Basic Info, Favicon Sources, Icon Designer
 */
export default function TabNavigation({ activeTab, onTabChange, tabsValidation }) {
  const { theme } = useTheme();

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'sources', label: 'Sources', icon: '🔍' },
    { id: 'designer', label: 'Designer', icon: '🎨' }
  ];

  const styles = getStyles(theme);

  return (
    <div style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isValid = tabsValidation?.[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              ...styles.tab,
              ...(isActive ? styles.tabActive : {}),
            }}
            type="button"
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span style={styles.tabLabel}>{tab.label}</span>
            {isValid && <span style={styles.checkmark}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    display: 'flex',
    gap: SPACING.sm,
    borderBottom: `1px solid ${theme.colors.border}`,
    padding: `0 ${SPACING.xl}`,
    height: '50px',
  },

  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: `0 ${SPACING.md}`,
    background: 'none',
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    color: theme.colors.textMuted,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    position: 'relative',
  },

  tabActive: {
    color: theme.colors.primary,
    borderBottomColor: theme.glow.color,
    textShadow: `0 0 8px ${theme.glow.color}40`,
  },

  tabIcon: {
    fontSize: '16px',
  },

  tabLabel: {
    whiteSpace: 'nowrap',
  },

  checkmark: {
    fontSize: '12px',
    color: theme.colors.success,
    marginLeft: '4px',
  }
});
