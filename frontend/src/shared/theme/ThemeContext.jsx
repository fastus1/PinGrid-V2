/**
 * PinGrid V2.0 - Theme Context
 *
 * Context React pour gérer le système de thèmes global
 * Fournit l'accès au thème actuel et aux fonctions de changement de thème
 */

import { createContext } from 'react';

/**
 * Theme Context
 *
 * Valeur du context:
 * {
 *   theme: object,           // Objet thème actuel (colors, glass, glow)
 *   currentThemeId: string,  // ID du thème actuel
 *   switchTheme: function,   // Fonction pour changer de thème
 *   allThemes: array         // Tous les thèmes disponibles
 * }
 */
export const ThemeContext = createContext(null);
