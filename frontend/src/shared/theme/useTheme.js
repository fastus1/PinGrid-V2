/**
 * PinGrid V2.0 - useTheme Hook
 *
 * Hook personnalisé pour accéder au système de thèmes
 * Fournit le thème actuel et les fonctions pour le manipuler
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

/**
 * Hook pour accéder au thème actuel
 *
 * @returns {object} { theme, currentThemeId, switchTheme, allThemes }
 * @throws {Error} Si utilisé en dehors du ThemeProvider
 *
 * @example
 * function MyComponent() {
 *   const { theme, switchTheme } = useTheme();
 *
 *   return (
 *     <div style={{ background: theme.colors.background }}>
 *       <button onClick={() => switchTheme('cyberpunk-neon')}>
 *         Switch to Cyberpunk
 *       </button>
 *     </div>
 *   );
 * }
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Wrap your app with <ThemeProvider> to use themes.'
    );
  }

  return context;
}
