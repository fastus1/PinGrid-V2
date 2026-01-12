/**
 * PinGrid V2.0 - Theme Provider
 *
 * Provider React pour gérer le système de thèmes global
 * Gère le state, la persistence localStorage, et fournit le context
 */

import { useState, useEffect, useMemo } from 'react';
import { ThemeContext } from './ThemeContext';
import {
  ALL_THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  themeExists
} from './themes';

// Clé localStorage pour persister le thème
const STORAGE_KEY = 'pingrid_theme_id';

/**
 * ThemeProvider Component
 *
 * Wrapper pour toute l'application qui fournit le système de thèmes
 *
 * @param {object} props
 * @param {ReactNode} props.children - Composants enfants
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  /**
   * Initialise le thème depuis localStorage ou utilise le thème par défaut
   */
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    // Essayer de récupérer depuis localStorage
    const savedThemeId = localStorage.getItem(STORAGE_KEY);

    // Vérifier que le thème existe toujours
    if (savedThemeId && themeExists(savedThemeId)) {
      return savedThemeId;
    }

    // Sinon, utiliser le thème par défaut (Cyberpunk Neon)
    return DEFAULT_THEME_ID;
  });

  /**
   * Récupère l'objet thème complet basé sur l'ID actuel
   */
  const currentTheme = useMemo(() => {
    const theme = getThemeById(currentThemeId);
    if (!theme) {
      console.warn(`Theme "${currentThemeId}" not found, falling back to default`);
      return getThemeById(DEFAULT_THEME_ID);
    }
    return theme;
  }, [currentThemeId]);

  // ============================================
  // THEME SWITCHING
  // ============================================

  /**
   * Change le thème actuel
   * @param {string} newThemeId - ID du nouveau thème
   */
  const switchTheme = (newThemeId) => {
    if (!themeExists(newThemeId)) {
      console.error(`Cannot switch to theme "${newThemeId}": theme does not exist`);
      return;
    }

    setCurrentThemeId(newThemeId);
  };

  // ============================================
  // PERSISTENCE
  // ============================================

  /**
   * Persiste le thème dans localStorage à chaque changement
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentThemeId);
  }, [currentThemeId]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  /**
   * Valeur du context (memoized pour éviter re-renders inutiles)
   */
  const contextValue = useMemo(
    () => ({
      theme: currentTheme,
      currentThemeId,
      switchTheme,
      allThemes: ALL_THEMES
    }),
    [currentTheme, currentThemeId]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
