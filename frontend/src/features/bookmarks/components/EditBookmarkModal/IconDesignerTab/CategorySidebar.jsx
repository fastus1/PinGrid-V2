import { useTheme } from '../../../../../shared/theme/useTheme';
import { ICON_CATEGORIES } from '../../../utils/iconCategories';
import { SPACING } from '../../../utils/spacing';

/**
 * CategorySidebar Component
 *
 * Sidebar avec liste de catégories d'icônes
 * - 11 catégories: Popular, Actions, Communication, Files, etc.
 * - Affichage du nombre d'icônes par catégorie
 * - Active state avec border gauche et glow
 */
export default function CategorySidebar({ activeCategory, onCategoryChange, iconCounts }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <div style={styles.container}>
      {ICON_CATEGORIES.map((category) => {
        const isActive = activeCategory === category.id;
        const count = iconCounts?.[category.id] || 0;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            style={{
              ...styles.categoryButton,
              ...(isActive ? styles.categoryButtonActive : {}),
            }}
            type="button"
            title={category.description}
          >
            <span style={styles.categoryIcon}>{category.icon}</span>
            <span style={styles.categoryLabel}>{category.name}</span>
            {count > 0 && (
              <span style={styles.categoryCount}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    width: '160px',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    borderRight: `1px solid ${theme.colors.border}`,
  },

  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    background: 'transparent',
    border: 'none',
    borderLeft: '2px solid transparent',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    fontSize: '11px',
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'left',
  },

  categoryButtonActive: {
    background: theme.colors.cardBgHover,
    borderLeftColor: theme.glow.color,
    color: theme.colors.primary,
  },

  categoryIcon: {
    fontSize: '12px',
    flexShrink: 0,
  },

  categoryLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  categoryCount: {
    fontSize: '9px',
    color: theme.colors.textMuted,
    background: theme.colors.cardBg,
    padding: '1px 4px',
    borderRadius: '8px',
    minWidth: '20px',
    textAlign: 'center',
  },
});
