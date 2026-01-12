/**
 * PinGrid V2.0 - Theme Switcher Component
 *
 * Sélecteur de thème avec dropdown et previews colorées
 * Groupe les thèmes par type (Light / Dark) et affiche une preview visuelle
 */

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../theme/useTheme';
import { getThemesByType } from '../theme/themes';

export default function ThemeSwitcher({ isCollapsed = false }) {
  const { theme, currentThemeId, switchTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Grouper les thèmes par type
  const { dark, light } = getThemesByType();

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeSelect = (themeId) => {
    switchTheme(themeId);
    setIsOpen(false);
  };

  // ============================================
  // RENDER MODE COLLAPSED (juste icône)
  // ============================================

  if (isCollapsed) {
    return (
      <div style={styles.collapsedContainer}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={styles.collapsedButton}
          title="Change theme"
        >
          🎨
        </button>

        {isOpen && (
          <div ref={dropdownRef} style={styles.collapsedDropdown}>
            <div style={styles.dropdownContent}>
              {/* Dark Themes */}
              <div style={styles.themeGroup}>
                <div style={styles.groupLabel}>Dark</div>
                {dark.map((t) => (
                  <ThemeOption
                    key={t.id}
                    theme={t}
                    isActive={t.id === currentThemeId}
                    onClick={() => handleThemeSelect(t.id)}
                    currentTheme={theme}
                  />
                ))}
              </div>

              {/* Light Themes */}
              <div style={styles.themeGroup}>
                <div style={styles.groupLabel}>Light</div>
                {light.map((t) => (
                  <ThemeOption
                    key={t.id}
                    theme={t}
                    isActive={t.id === currentThemeId}
                    onClick={() => handleThemeSelect(t.id)}
                    currentTheme={theme}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER MODE EXPANDED (plein composant)
  // ============================================

  return (
    <div ref={dropdownRef} style={styles.container}>
      {/* Header du switcher */}
      <div style={styles.header}>
        <span style={{...styles.label, color: theme.colors.textSecondary}}>
          Theme
        </span>
      </div>

      {/* Bouton pour ouvrir le dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.button,
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.border,
          color: theme.colors.textPrimary
        }}
      >
        <div style={styles.currentTheme}>
          <ThemePreview theme={theme} size="small" />
          <span style={styles.themeName}>{theme.name}</span>
        </div>
        <span style={{...styles.arrow, color: theme.colors.textMuted}}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown avec tous les thèmes */}
      {isOpen && (
        <div
          style={{
            ...styles.dropdown,
            backgroundColor: theme.colors.sidebarBg,
            borderColor: theme.colors.border,
            backdropFilter: `blur(${theme.glass.blur})`,
            WebkitBackdropFilter: `blur(${theme.glass.blur})`,
            boxShadow: theme.glass.shadow
          }}
        >
          {/* Dark Themes */}
          <div style={styles.themeGroup}>
            <div style={{...styles.groupLabel, color: theme.colors.textMuted}}>
              Dark Themes
            </div>
            {dark.map((t) => (
              <ThemeOption
                key={t.id}
                theme={t}
                isActive={t.id === currentThemeId}
                onClick={() => handleThemeSelect(t.id)}
                currentTheme={theme}
              />
            ))}
          </div>

          {/* Light Themes */}
          <div style={styles.themeGroup}>
            <div style={{...styles.groupLabel, color: theme.colors.textMuted}}>
              Light Themes
            </div>
            {light.map((t) => (
              <ThemeOption
                key={t.id}
                theme={t}
                isActive={t.id === currentThemeId}
                onClick={() => handleThemeSelect(t.id)}
                currentTheme={theme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// THEME OPTION (item dans la liste)
// ============================================

function ThemeOption({ theme, isActive, onClick, currentTheme }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.themeOption,
        backgroundColor: isActive
          ? currentTheme.colors.cardBgHover
          : isHovered
          ? currentTheme.colors.cardBg
          : 'transparent',
        borderColor: isActive
          ? currentTheme.colors.primary
          : 'transparent',
        color: currentTheme.colors.textPrimary
      }}
    >
      <ThemePreview theme={theme} size="medium" />
      <div style={styles.optionContent}>
        <span style={styles.optionName}>{theme.name}</span>
        {isActive && (
          <span style={{...styles.activeBadge, color: currentTheme.colors.primary}}>
            ✓
          </span>
        )}
      </div>
    </button>
  );
}

// ============================================
// THEME PREVIEW (pastilles colorées)
// ============================================

function ThemePreview({ theme, size = 'medium' }) {
  const sizeMap = {
    small: { width: 16, height: 16, gap: 2 },
    medium: { width: 20, height: 20, gap: 3 }
  };

  const dimensions = sizeMap[size];

  return (
    <div style={{...styles.preview, gap: `${dimensions.gap}px`}}>
      <div
        style={{
          ...styles.previewCircle,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          backgroundColor: theme.colors.primary
        }}
      />
      <div
        style={{
          ...styles.previewCircle,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          backgroundColor: theme.colors.secondary
        }}
      />
      <div
        style={{
          ...styles.previewCircle,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          backgroundColor: theme.colors.tertiary
        }}
      />
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    marginTop: '12px'
  },

  header: {
    marginBottom: '6px'
  },

  label: {
    fontSize: '11px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  button: {
    width: '100%',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    fontWeight: '500'
  },

  currentTheme: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  themeName: {
    fontSize: '14px'
  },

  arrow: {
    fontSize: '10px'
  },

  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: '8px',
    border: '1px solid',
    borderRadius: '12px',
    padding: '8px',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1000
  },

  themeGroup: {
    marginBottom: '12px'
  },

  groupLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
    paddingLeft: '8px'
  },

  themeOption: {
    width: '100%',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500'
  },

  optionContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  optionName: {
    fontSize: '14px'
  },

  activeBadge: {
    fontSize: '16px',
    fontWeight: 'bold'
  },

  preview: {
    display: 'flex',
    alignItems: 'center'
  },

  previewCircle: {
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    flexShrink: 0
  },

  // Mode collapsed
  collapsedContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '12px'
  },

  collapsedButton: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },

  collapsedDropdown: {
    position: 'absolute',
    left: '100%',
    top: 0,
    marginLeft: '12px',
    width: '280px',
    zIndex: 1000
  },

  dropdownContent: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    maxHeight: '400px',
    overflowY: 'auto'
  }
};
