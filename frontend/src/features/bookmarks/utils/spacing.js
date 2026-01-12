/**
 * Spacing System (échelle 8px)
 *
 * Système d'espacement cohérent basé sur une échelle de 8px
 * pour maintenir une hiérarchie visuelle claire
 */

export const SPACING = {
  xs: '4px',   // Très petit - entre éléments très proches
  sm: '8px',   // Petit - entre éléments proches (gap dans grid)
  md: '16px',  // Moyen - entre groupes d'éléments
  lg: '24px',  // Large - entre sections différentes
  xl: '32px',  // Extra large - padding de containers principaux
};

/**
 * Helper pour obtenir plusieurs spacings à la fois
 * Usage: getSpacing('sm', 'md') => { sm: '8px', md: '16px' }
 */
export const getSpacing = (...keys) => {
  return keys.reduce((acc, key) => {
    acc[key] = SPACING[key];
    return acc;
  }, {});
};

/**
 * Helper pour générer des valeurs numériques (sans 'px')
 * Utile pour les calculs
 */
export const SPACING_NUM = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
