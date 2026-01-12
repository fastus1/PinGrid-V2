import { detectIconCategory } from '../../../utils/iconCategories';
import { getAliasesForIcon, matchesAlias } from '../../../utils/iconAliases';

/**
 * IconSearchEngine
 *
 * Moteur de recherche intelligent pour icônes avec:
 * - Exact matching
 * - Fuzzy matching (Levenshtein distance)
 * - Alias support
 * - Keyword matching
 * - Scoring system
 */
export class IconSearchEngine {
  constructor(icons) {
    this.icons = icons;
    this.index = this.buildSearchIndex(icons);
  }

  /**
   * Construit l'index de recherche
   */
  buildSearchIndex(icons) {
    return icons.map(iconName => ({
      name: iconName,
      normalized: iconName.toLowerCase(),
      keywords: this.extractKeywords(iconName),
      aliases: getAliasesForIcon(iconName),
      category: detectIconCategory(iconName)
    }));
  }

  /**
   * Extrait les mots-clés d'un nom d'icône
   * Example: "ArrowUpRight" -> ["arrow", "up", "right"]
   */
  extractKeywords(iconName) {
    // Split on capital letters
    const parts = iconName.split(/(?=[A-Z])/).filter(p => p.length > 0);
    return parts.map(p => p.toLowerCase());
  }

  /**
   * Recherche d'icônes avec scoring
   * @param {string} query - Terme de recherche
   * @param {string} category - Catégorie filtrée (default: 'all')
   * @param {number} limit - Nombre max de résultats (default: 150)
   * @returns {Array<string>} - Noms d'icônes triés par score
   */
  search(query, category = 'all', limit = 150) {
    // Si pas de query, retourner icônes de la catégorie
    if (!query || query.trim() === '') {
      return this.getIconsByCategory(category).slice(0, limit);
    }

    const queryLower = query.toLowerCase().trim();
    const tokens = queryLower.split(/\s+/);

    // Multi-pass scoring system
    const scored = this.index.map(icon => {
      let score = 0;

      // Exact match (highest priority)
      if (icon.normalized === queryLower) {
        score += 1000;
      }

      // Starts with query
      if (icon.normalized.startsWith(queryLower)) {
        score += 500;
      }

      // Contains query
      if (icon.normalized.includes(queryLower)) {
        score += 100;
      }

      // Keyword matches (each token)
      tokens.forEach(token => {
        icon.keywords.forEach(keyword => {
          if (keyword === token) {
            score += 200; // Exact keyword match
          } else if (keyword.includes(token)) {
            score += 50; // Partial keyword match
          }
        });
      });

      // Alias matches
      if (matchesAlias(icon.name, queryLower)) {
        score += 300;
      }

      // Fuzzy matching (Levenshtein distance < 3)
      const fuzzyScore = this.fuzzyMatch(icon.normalized, queryLower);
      if (fuzzyScore > 0) {
        score += fuzzyScore;
      }

      return {
        name: icon.name,
        category: icon.category,
        score
      };
    });

    // Filter by category and score > 0
    const filtered = scored.filter(icon => {
      const matchesCategory = category === 'all' || icon.category === category;
      return matchesCategory && icon.score > 0;
    });

    // Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    // Return only icon names (slice to limit)
    return filtered.slice(0, limit).map(icon => icon.name);
  }

  /**
   * Fuzzy matching with Levenshtein distance
   * Returns score based on similarity (0 if no match)
   */
  fuzzyMatch(str1, str2) {
    // Skip if strings are too different in length
    const lengthDiff = Math.abs(str1.length - str2.length);
    if (lengthDiff > 5) return 0;

    const distance = this.levenshteinDistance(str1, str2);

    // Only consider close matches (distance < 3)
    if (distance >= 3) return 0;

    // Score: closer = better
    if (distance === 1) return 30;
    if (distance === 2) return 15;

    return 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create matrix
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Get icons by category (sans recherche)
   */
  getIconsByCategory(category) {
    if (category === 'all') {
      return this.icons;
    }

    return this.index
      .filter(icon => icon.category === category)
      .map(icon => icon.name);
  }

  /**
   * Get search suggestions for autocomplete
   * @param {string} query - Partial query
   * @returns {Array<string>} - Top 5 icon names
   */
  getSuggestions(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const results = this.search(query, 'all', limit);
    return results;
  }
}

/**
 * Custom hook pour utiliser IconSearchEngine avec memoization
 * (À utiliser dans les composants React)
 */
export function createSearchEngine(icons) {
  return new IconSearchEngine(icons);
}
