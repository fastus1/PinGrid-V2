import { useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid } from 'react-window';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../../../../shared/theme/useTheme';
import { SPACING } from '../../../utils/spacing';

// Smaller cells for more icons visible
const CELL_SIZE = 64;
const SEARCH_BAR_HEIGHT = 56;

/**
 * Cell Component - for react-window v1.x with itemData
 */
const Cell = ({ columnIndex, rowIndex, style, data }) => {
  const { filteredIcons, selectedIcon, onIconSelect, styles, columnCount } = data;

  const index = rowIndex * columnCount + columnIndex;
  const iconName = filteredIcons[index];

  if (!iconName) return null;

  const IconComponent = LucideIcons[iconName];
  if (!IconComponent) return null;

  const isSelected = selectedIcon === iconName;

  return (
    <div style={style}>
      <button
        onClick={() => onIconSelect(iconName)}
        style={{
          ...styles.iconCell,
          ...(isSelected ? styles.iconCellSelected : {}),
        }}
        title={iconName}
        type="button"
      >
        <IconComponent
          size={28}
          strokeWidth={1.75}
          style={styles.icon}
        />
      </button>
    </div>
  );
};

/**
 * IconBrowser Component
 *
 * Grid virtualisé d'icônes avec react-window
 * - Calcul dynamique des colonnes basé sur la largeur
 * - Pas de scrollbar horizontale
 * - Scrollbar verticale uniquement dans le grid
 */
export default function IconBrowser({
  filteredIcons = [],
  selectedIcon,
  onIconSelect,
  searchTerm = '',
  onSearchChange
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const gridWrapperRef = useRef(null);
  const [gridSize, setGridSize] = useState({ width: 600, height: 400 });

  // Mesurer le wrapper du grid (pas le container entier)
  useEffect(() => {
    const updateSize = () => {
      if (gridWrapperRef.current) {
        const rect = gridWrapperRef.current.getBoundingClientRect();
        setGridSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    // Initial + debounced resize
    const timeoutId = setTimeout(updateSize, 50);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Calculer colonnes pour remplir exactement la largeur (pas de scroll horizontal)
  const columnCount = Math.max(1, Math.floor(gridSize.width / CELL_SIZE));
  const actualCellSize = Math.floor(gridSize.width / columnCount);
  const rowCount = Math.max(1, Math.ceil(filteredIcons.length / columnCount));

  // Memoize itemData
  const itemData = useMemo(() => ({
    filteredIcons,
    selectedIcon,
    onIconSelect,
    styles,
    columnCount,
  }), [filteredIcons, selectedIcon, onIconSelect, styles, columnCount]);

  return (
    <div style={styles.container}>
      {/* Search Bar */}
      <div style={styles.searchBar}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${filteredIcons.length} icons...`}
          style={styles.searchInput}
          autoFocus
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            style={styles.clearButton}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Grid Wrapper - fills remaining space */}
      <div style={styles.gridWrapper} ref={gridWrapperRef}>
        {filteredIcons.length > 0 && gridSize.height > 0 ? (
          <FixedSizeGrid
            columnCount={columnCount}
            columnWidth={actualCellSize}
            height={gridSize.height}
            rowCount={rowCount}
            rowHeight={actualCellSize}
            width={gridSize.width}
            itemData={itemData}
          >
            {Cell}
          </FixedSizeGrid>
        ) : filteredIcons.length === 0 ? (
          <div style={styles.noResults}>
            <span style={styles.noResultsIcon}>🔍</span>
            <p style={styles.noResultsText}>No icons found</p>
            <p style={styles.noResultsHint}>
              Try a different search term
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    flex: 1,
    minWidth: '400px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${theme.colors.border}`,
    overflow: 'hidden',
  },

  searchBar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${theme.colors.border}`,
    background: theme.colors.background,
    position: 'relative',
    height: `${SEARCH_BAR_HEIGHT}px`,
  },

  searchIcon: {
    fontSize: '14px',
    color: theme.colors.textMuted,
  },

  searchInput: {
    flex: 1,
    height: '32px',
    padding: `0 ${SPACING.sm}`,
    paddingRight: '28px',
    fontSize: '13px',
    color: theme.colors.textPrimary,
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    outline: 'none',
  },

  clearButton: {
    position: 'absolute',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    color: theme.colors.textMuted,
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    outline: 'none',
  },

  gridWrapper: {
    flex: 1,
    overflow: 'hidden',
  },

  iconCell: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: `2px solid transparent`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
    margin: '2px',
    boxSizing: 'border-box',
  },

  iconCellSelected: {
    borderColor: theme.glow.color,
    boxShadow: `0 0 10px ${theme.glow.color}40`,
    background: `${theme.glow.color}15`,
  },

  icon: {
    color: theme.colors.textPrimary,
  },

  noResults: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
    color: theme.colors.textMuted,
  },

  noResultsIcon: {
    fontSize: '40px',
    opacity: 0.5,
  },

  noResultsText: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  noResultsHint: {
    margin: 0,
    fontSize: '12px',
    textAlign: 'center',
  },
});
