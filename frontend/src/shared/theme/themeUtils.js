/**
 * PinGrid V2.0 - Theme Utilities
 *
 * Fonctions helper pour appliquer les effets de thème
 * - Glass styles (glassmorphism)
 * - Glow styles (hover effects)
 * - Browser fallbacks
 */

/**
 * Vérifie si le navigateur supporte backdrop-filter
 * @returns {boolean} true si supporté
 */
export function checkBackdropSupport() {
  if (typeof CSS === 'undefined' || typeof CSS.supports === 'undefined') {
    return false;
  }

  return (
    CSS.supports('backdrop-filter', 'blur(10px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
  );
}

/**
 * Récupère les styles CSS pour l'effet glassmorphism
 *
 * @param {object} theme - Objet thème complet
 * @param {object} options - Options additionnelles
 * @param {boolean} options.includeBorder - Inclure la bordure (default: true)
 * @param {boolean} options.includeShadow - Inclure l'ombre (default: true)
 * @returns {object} Objet styles CSS pour React inline styles
 *
 * @example
 * const glassStyles = getGlassStyles(theme);
 * <div style={{...myStyles, ...glassStyles}}>Glass effect</div>
 */
export function getGlassStyles(theme, options = {}) {
  const {
    includeBorder = true,
    includeShadow = true
  } = options;

  const supportsBackdrop = checkBackdropSupport();

  // Base styles
  const styles = {
    backdropFilter: `blur(${theme.glass.blur})`,
    WebkitBackdropFilter: `blur(${theme.glass.blur})`,
  };

  // Si backdrop-filter n'est pas supporté, augmenter l'opacité
  if (!supportsBackdrop) {
    // Augmenter l'opacité pour compenser l'absence de blur
    const fallbackOpacity = Math.min(theme.glass.opacity + 0.2, 0.95);
    styles.backgroundColor = theme.colors.cardBg.replace(
      /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/,
      `rgba($1, $2, $3, ${fallbackOpacity})`
    );
  }

  // Bordure
  if (includeBorder) {
    styles.border = `1px solid ${theme.glass.border}`;
  }

  // Ombre
  if (includeShadow) {
    styles.boxShadow = theme.glass.shadow;
  }

  return styles;
}

/**
 * Récupère les styles CSS pour l'effet glow (hover)
 *
 * @param {object} theme - Objet thème complet
 * @param {string} customColor - Couleur personnalisée (optionnel, utilise theme.glow.color par défaut)
 * @param {boolean} includeTransform - Inclure l'effet de lift (translateY)
 * @returns {object} Objet styles CSS pour React inline styles
 *
 * @example
 * const glowStyles = getGlowStyles(theme);
 * <div style={{...styles.card, ...(isHovered ? glowStyles : {})}}>
 *   Hover me!
 * </div>
 */
export function getGlowStyles(theme, customColor = null, includeTransform = true) {
  const glowColor = customColor || theme.glow.color;

  const styles = {
    boxShadow: `0 0 ${theme.glow.intensity} ${glowColor}`,
    borderColor: glowColor,
    transition: theme.glow.transition
  };

  if (includeTransform) {
    styles.transform = 'translateY(-2px)';
  }

  return styles;
}

/**
 * Récupère l'opacité de fallback pour les navigateurs sans backdrop-filter
 *
 * @param {object} theme - Objet thème complet
 * @returns {number} Opacité entre 0 et 1
 */
export function getFallbackOpacity(theme) {
  const supportsBackdrop = checkBackdropSupport();

  if (supportsBackdrop) {
    return theme.glass.opacity;
  }

  // Augmenter l'opacité de 20% si pas de blur
  return Math.min(theme.glass.opacity + 0.2, 0.95);
}

/**
 * Applique les couleurs de texte du thème
 *
 * @param {object} theme - Objet thème complet
 * @param {string} level - Niveau de couleur: 'primary', 'secondary', 'muted'
 * @returns {object} { color: string }
 */
export function getTextColor(theme, level = 'primary') {
  const colorMap = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted
  };

  return {
    color: colorMap[level] || theme.colors.textPrimary
  };
}

/**
 * Crée un style de fond avec glass effect
 *
 * @param {object} theme - Objet thème complet
 * @param {string} bgType - Type de fond: 'sidebar', 'card', 'cardHover'
 * @returns {object} Objet styles CSS complet
 */
export function createGlassBackground(theme, bgType = 'card') {
  const bgColorMap = {
    sidebar: theme.colors.sidebarBg,
    card: theme.colors.cardBg,
    cardHover: theme.colors.cardBgHover
  };

  return {
    backgroundColor: bgColorMap[bgType] || theme.colors.cardBg,
    ...getGlassStyles(theme)
  };
}

/**
 * Récupère les styles de bordure du thème
 *
 * @param {object} theme - Objet thème complet
 * @param {boolean} isHovered - Si true, utilise borderHover
 * @returns {object} { border: string, borderColor: string }
 */
export function getBorderStyles(theme, isHovered = false) {
  const borderColor = isHovered ? theme.colors.borderHover : theme.colors.border;

  return {
    border: `1px solid ${borderColor}`,
    borderColor: borderColor
  };
}

/**
 * Crée un style complet pour un élément avec glass + glow
 *
 * @param {object} theme - Objet thème complet
 * @param {boolean} isHovered - Si l'élément est hover
 * @param {object} baseStyles - Styles de base à merger
 * @returns {object} Objet styles CSS complet
 */
export function createGlassCardStyles(theme, isHovered = false, baseStyles = {}) {
  const glassStyles = createGlassBackground(
    theme,
    isHovered ? 'cardHover' : 'card'
  );

  const borderStyles = getBorderStyles(theme, isHovered);

  let styles = {
    ...baseStyles,
    ...glassStyles,
    ...borderStyles
  };

  // Ajouter glow si hover
  if (isHovered) {
    const glowStyles = getGlowStyles(theme);
    styles = {
      ...styles,
      ...glowStyles
    };
  }

  return styles;
}

/**
 * Détecte si le thème actuel est dark ou light
 *
 * @param {object} theme - Objet thème complet
 * @returns {boolean} true si dark, false si light
 */
export function isDarkTheme(theme) {
  return theme.type === 'dark';
}

/**
 * Retourne la couleur d'accent appropriée selon le contexte
 *
 * @param {object} theme - Objet thème complet
 * @param {string} accentType - 'primary', 'secondary', 'tertiary'
 * @returns {string} Couleur hexadécimale ou rgba
 */
export function getAccentColor(theme, accentType = 'primary') {
  const accentMap = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    tertiary: theme.colors.tertiary
  };

  return accentMap[accentType] || theme.colors.primary;
}
