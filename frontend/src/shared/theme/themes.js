/**
 * PinGrid V2.0 - Theme Definitions
 *
 * 8 thèmes au total:
 * - 3 Light: Light Classic, Nord Light, Soft Purple
 * - 5 Dark: Cyberpunk Neon, Purple Dream, Forest Dark, Ocean Deep, Dracula Inspired
 *
 * Chaque thème contient:
 * - colors: Palette de couleurs complète
 * - glass: Propriétés pour effets glassmorphism
 * - glow: Propriétés pour effets de lueur au hover
 */

// ============================================
// DARK THEMES (5)
// ============================================

const cyberpunkNeon = {
  id: 'cyberpunk-neon',
  name: 'Cyberpunk Neon',
  type: 'dark',
  colors: {
    // Backgrounds (avec transparence pour glass effect)
    background: '#0a0a0f',
    sidebarBg: 'rgba(20, 10, 30, 0.4)',
    cardBg: 'rgba(30, 20, 50, 0.3)',
    cardBgHover: 'rgba(40, 30, 60, 0.4)',

    // Accents (pour effets glow)
    primary: '#ff006e',        // Hot pink néon
    secondary: '#00f5ff',      // Cyan électrique
    tertiary: '#b95fff',       // Violet lumineux

    // Texte
    textPrimary: '#ffffff',
    textSecondary: '#d0d0e0',
    textMuted: '#8080a0',

    // Bordures
    border: 'rgba(255, 0, 110, 0.2)',
    borderHover: 'rgba(255, 0, 110, 0.4)',

    // Status colors
    success: '#00ff9f',
    error: '#ff0055',
    warning: '#ffaa00',
    info: '#00d4ff'
  },
  glass: {
    blur: '10px',
    opacity: 0.65,
    border: 'rgba(255, 0, 110, 0.25)',
    shadow: '0 8px 32px rgba(255, 0, 110, 0.2)'
  },
  glow: {
    color: '#ff006e',
    intensity: '0 0 20px',
    transition: '0.3s ease'
  }
};

const purpleDream = {
  id: 'purple-dream',
  name: 'Purple Dream',
  type: 'dark',
  colors: {
    background: '#0f0a1e',
    sidebarBg: 'rgba(25, 15, 45, 0.5)',
    cardBg: 'rgba(35, 25, 55, 0.4)',
    cardBgHover: 'rgba(45, 35, 65, 0.5)',

    primary: '#9b5de5',
    secondary: '#b185db',
    tertiary: '#c4a5e0',

    textPrimary: '#f0e5ff',
    textSecondary: '#c5b0e0',
    textMuted: '#8a7aa0',

    border: 'rgba(155, 93, 229, 0.2)',
    borderHover: 'rgba(155, 93, 229, 0.35)',

    success: '#72efdd',
    error: '#f72585',
    warning: '#ffd60a',
    info: '#7209b7'
  },
  glass: {
    blur: '12px',
    opacity: 0.7,
    border: 'rgba(155, 93, 229, 0.2)',
    shadow: '0 8px 32px rgba(155, 93, 229, 0.15)'
  },
  glow: {
    color: '#9b5de5',
    intensity: '0 0 18px',
    transition: '0.3s ease'
  }
};

const forestDark = {
  id: 'forest-dark',
  name: 'Forest Dark',
  type: 'dark',
  colors: {
    background: '#0d1b0f',
    sidebarBg: 'rgba(20, 35, 25, 0.5)',
    cardBg: 'rgba(25, 45, 30, 0.4)',
    cardBgHover: 'rgba(30, 55, 35, 0.5)',

    primary: '#4ecca3',
    secondary: '#6dd5a6',
    tertiary: '#8ee4af',

    textPrimary: '#e8f5e9',
    textSecondary: '#a5d6a7',
    textMuted: '#6b8e6f',

    border: 'rgba(78, 204, 163, 0.2)',
    borderHover: 'rgba(78, 204, 163, 0.35)',

    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffb74d',
    info: '#4dd0e1'
  },
  glass: {
    blur: '10px',
    opacity: 0.7,
    border: 'rgba(78, 204, 163, 0.22)',
    shadow: '0 8px 32px rgba(78, 204, 163, 0.1)'
  },
  glow: {
    color: '#4ecca3',
    intensity: '0 0 18px',
    transition: '0.3s ease'
  }
};

const oceanDeep = {
  id: 'ocean-deep',
  name: 'Ocean Deep',
  type: 'dark',
  colors: {
    background: '#0a1929',
    sidebarBg: 'rgba(15, 30, 50, 0.5)',
    cardBg: 'rgba(20, 40, 65, 0.4)',
    cardBgHover: 'rgba(25, 50, 80, 0.5)',

    primary: '#2196f3',
    secondary: '#42a5f5',
    tertiary: '#64b5f6',

    textPrimary: '#e3f2fd',
    textSecondary: '#90caf9',
    textMuted: '#5b7a95',

    border: 'rgba(33, 150, 243, 0.2)',
    borderHover: 'rgba(33, 150, 243, 0.35)',

    success: '#26a69a',
    error: '#e57373',
    warning: '#ffb74d',
    info: '#4fc3f7'
  },
  glass: {
    blur: '11px',
    opacity: 0.72,
    border: 'rgba(33, 150, 243, 0.2)',
    shadow: '0 8px 32px rgba(33, 150, 243, 0.12)'
  },
  glow: {
    color: '#2196f3',
    intensity: '0 0 18px',
    transition: '0.3s ease'
  }
};

const draculaInspired = {
  id: 'dracula-inspired',
  name: 'Dracula Inspired',
  type: 'dark',
  colors: {
    background: '#1e1e2e',
    sidebarBg: 'rgba(40, 42, 54, 0.5)',
    cardBg: 'rgba(68, 71, 90, 0.4)',
    cardBgHover: 'rgba(80, 85, 105, 0.5)',

    primary: '#bd93f9',       // Purple
    secondary: '#ff79c6',     // Pink
    tertiary: '#8be9fd',      // Cyan

    textPrimary: '#f8f8f2',
    textSecondary: '#e0e0e0',
    textMuted: '#9090a0',

    border: 'rgba(189, 147, 249, 0.2)',
    borderHover: 'rgba(189, 147, 249, 0.35)',

    success: '#50fa7b',
    error: '#ff5555',
    warning: '#f1fa8c',
    info: '#8be9fd'
  },
  glass: {
    blur: '10px',
    opacity: 0.68,
    border: 'rgba(189, 147, 249, 0.22)',
    shadow: '0 8px 32px rgba(189, 147, 249, 0.15)'
  },
  glow: {
    color: '#bd93f9',
    intensity: '0 0 20px',
    transition: '0.3s ease'
  }
};

// ============================================
// LIGHT THEMES (3)
// ============================================

const lightClassic = {
  id: 'light-classic',
  name: 'Light Classic',
  type: 'light',
  colors: {
    background: '#f5f5f7',
    sidebarBg: 'rgba(255, 255, 255, 0.6)',
    cardBg: 'rgba(255, 255, 255, 0.5)',
    cardBgHover: 'rgba(255, 255, 255, 0.7)',

    primary: '#0066cc',
    secondary: '#5856d6',
    tertiary: '#34c759',

    textPrimary: '#1d1d1f',
    textSecondary: '#6e6e73',
    textMuted: '#999999',

    border: 'rgba(0, 0, 0, 0.08)',
    borderHover: 'rgba(0, 0, 0, 0.15)',

    success: '#34c759',
    error: '#ff3b30',
    warning: '#ff9500',
    info: '#007aff'
  },
  glass: {
    blur: '12px',
    opacity: 0.8,
    border: 'rgba(0, 0, 0, 0.1)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  glow: {
    color: '#0066cc',
    intensity: '0 0 15px',
    transition: '0.3s ease'
  }
};

const nordLight = {
  id: 'nord-light',
  name: 'Nord Light',
  type: 'light',
  colors: {
    background: '#eceff4',
    sidebarBg: 'rgba(229, 233, 240, 0.6)',
    cardBg: 'rgba(236, 239, 244, 0.5)',
    cardBgHover: 'rgba(216, 222, 233, 0.6)',

    primary: '#5e81ac',
    secondary: '#81a1c1',
    tertiary: '#88c0d0',

    textPrimary: '#2e3440',
    textSecondary: '#4c566a',
    textMuted: '#7b88a1',

    border: 'rgba(76, 86, 106, 0.12)',
    borderHover: 'rgba(76, 86, 106, 0.2)',

    success: '#a3be8c',
    error: '#bf616a',
    warning: '#ebcb8b',
    info: '#81a1c1'
  },
  glass: {
    blur: '10px',
    opacity: 0.75,
    border: 'rgba(76, 86, 106, 0.15)',
    shadow: '0 8px 32px rgba(46, 52, 64, 0.08)'
  },
  glow: {
    color: '#5e81ac',
    intensity: '0 0 18px',
    transition: '0.3s ease'
  }
};

const softPurple = {
  id: 'soft-purple',
  name: 'Soft Purple',
  type: 'light',
  colors: {
    background: '#f8f5fc',
    sidebarBg: 'rgba(245, 237, 255, 0.6)',
    cardBg: 'rgba(250, 245, 255, 0.5)',
    cardBgHover: 'rgba(240, 230, 255, 0.6)',

    primary: '#9b59b6',
    secondary: '#b595d6',
    tertiary: '#d4a5ff',

    textPrimary: '#2d1b3d',
    textSecondary: '#6b5a7a',
    textMuted: '#9a8aa9',

    border: 'rgba(155, 89, 182, 0.15)',
    borderHover: 'rgba(155, 89, 182, 0.25)',

    success: '#6bce9c',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#7e8ce0'
  },
  glass: {
    blur: '11px',
    opacity: 0.78,
    border: 'rgba(155, 89, 182, 0.18)',
    shadow: '0 8px 32px rgba(155, 89, 182, 0.12)'
  },
  glow: {
    color: '#9b59b6',
    intensity: '0 0 16px',
    transition: '0.3s ease'
  }
};

// ============================================
// EXPORTS & UTILITIES
// ============================================

/**
 * Array de tous les thèmes disponibles
 */
export const ALL_THEMES = [
  // Dark themes first (5)
  cyberpunkNeon,
  purpleDream,
  forestDark,
  oceanDeep,
  draculaInspired,

  // Light themes (3)
  lightClassic,
  nordLight,
  softPurple
];

/**
 * Thème par défaut (Light Classic)
 */
export const DEFAULT_THEME_ID = 'light-classic';

/**
 * Récupère un thème par son ID
 * @param {string} themeId - ID du thème
 * @returns {object|null} Objet thème ou null si non trouvé
 */
export function getThemeById(themeId) {
  return ALL_THEMES.find(theme => theme.id === themeId) || null;
}

/**
 * Récupère tous les thèmes groupés par type
 * @returns {object} { dark: [...], light: [...] }
 */
export function getThemesByType() {
  return {
    dark: ALL_THEMES.filter(theme => theme.type === 'dark'),
    light: ALL_THEMES.filter(theme => theme.type === 'light')
  };
}

/**
 * Vérifie si un thème existe
 * @param {string} themeId - ID du thème
 * @returns {boolean}
 */
export function themeExists(themeId) {
  return ALL_THEMES.some(theme => theme.id === themeId);
}

/**
 * Récupère le thème par défaut
 * @returns {object} Objet thème Cyberpunk Neon
 */
export function getDefaultTheme() {
  return getThemeById(DEFAULT_THEME_ID);
}
