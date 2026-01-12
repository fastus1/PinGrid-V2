/**
 * Icon Categories System
 *
 * Organise les 5725+ Lucide icons en 11 catégories logiques
 * pour faciliter la navigation et la découverte
 */

export const ICON_CATEGORIES = [
  {
    id: 'popular',
    name: 'Popular',
    icon: '⭐',
    description: 'Most commonly used icons',
    // Ces icônes seront définies manuellement (top 50)
    icons: [
      'Home', 'Settings', 'User', 'Mail', 'Calendar', 'Search', 'Heart', 'Star',
      'Bell', 'Check', 'X', 'Plus', 'Minus', 'Edit', 'Trash', 'Save',
      'Download', 'Upload', 'Share', 'Link', 'Eye', 'EyeOff', 'Lock', 'Unlock',
      'Menu', 'MoreHorizontal', 'MoreVertical', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ExternalLink', 'Maximize', 'Minimize',
      'Copy', 'Clipboard', 'FileText', 'Folder', 'Image', 'Video', 'Music',
      'Phone', 'MessageCircle', 'Send', 'Users', 'Clock'
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: '🎯',
    description: 'Buttons, controls, and interactions',
    keywords: [
      'add', 'delete', 'edit', 'save', 'close', 'check', 'x', 'plus', 'minus',
      'create', 'remove', 'trash', 'cancel', 'confirm', 'done', 'complete',
      'refresh', 'reload', 'undo', 'redo', 'copy', 'paste', 'cut', 'duplicate'
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: '💬',
    description: 'Messages, emails, and social',
    keywords: [
      'mail', 'message', 'chat', 'phone', 'send', 'inbox', 'envelope',
      'conversation', 'comment', 'reply', 'forward', 'call', 'video',
      'voicemail', 'notification', 'bell', 'alert'
    ],
  },
  {
    id: 'files',
    name: 'Files',
    icon: '📁',
    description: 'Documents, folders, and storage',
    keywords: [
      'file', 'folder', 'document', 'save', 'upload', 'download',
      'archive', 'attach', 'clip', 'paper', 'sheet', 'page',
      'note', 'text', 'pdf', 'zip', 'storage', 'drive'
    ],
  },
  {
    id: 'development',
    name: 'Development',
    icon: '💻',
    description: 'Code, terminal, and developer tools',
    keywords: [
      'code', 'terminal', 'git', 'github', 'database', 'server', 'api',
      'bug', 'debug', 'console', 'command', 'bracket', 'tag', 'package',
      'npm', 'node', 'variable', 'function', 'component', 'laptop', 'monitor'
    ],
  },
  {
    id: 'social',
    name: 'Social',
    icon: '🌐',
    description: 'Social media and networking',
    keywords: [
      'facebook', 'twitter', 'linkedin', 'github', 'youtube', 'instagram',
      'share', 'network', 'globe', 'world', 'web', 'link', 'social',
      'feed', 'post', 'like', 'follow', 'subscribe'
    ],
  },
  {
    id: 'media',
    name: 'Media',
    icon: '🎬',
    description: 'Images, videos, and audio',
    keywords: [
      'video', 'audio', 'music', 'play', 'pause', 'stop', 'image', 'camera',
      'photo', 'picture', 'film', 'movie', 'mic', 'microphone', 'speaker',
      'volume', 'mute', 'headphones', 'radio', 'podcast', 'gallery'
    ],
  },
  {
    id: 'business',
    name: 'Business',
    icon: '💼',
    description: 'Charts, analytics, and commerce',
    keywords: [
      'briefcase', 'chart', 'graph', 'analytics', 'finance', 'dollar',
      'credit', 'card', 'payment', 'shopping', 'cart', 'store', 'building',
      'office', 'bank', 'trending', 'growth', 'report', 'presentation'
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: '🌤️',
    description: 'Weather and nature',
    keywords: [
      'sun', 'cloud', 'rain', 'snow', 'storm', 'wind', 'weather',
      'moon', 'sunrise', 'sunset', 'cloudy', 'lightning', 'umbrella',
      'temperature', 'thermometer', 'droplet', 'snowflake'
    ],
  },
  {
    id: 'arrows',
    name: 'Arrows',
    icon: '➡️',
    description: 'Directions and navigation',
    keywords: [
      'arrow', 'chevron', 'direction', 'navigate', 'up', 'down', 'left', 'right',
      'move', 'corner', 'turn', 'diagonal', 'return', 'back', 'forward',
      'next', 'previous', 'expand', 'collapse', 'minimize', 'maximize'
    ],
  },
  {
    id: 'shapes',
    name: 'Shapes',
    icon: '⬛',
    description: 'Geometric shapes and symbols',
    keywords: [
      'circle', 'square', 'triangle', 'rectangle', 'polygon', 'diamond',
      'hexagon', 'octagon', 'shape', 'geometric', 'box', 'round'
    ],
  },
  {
    id: 'all',
    name: 'All Icons',
    icon: '📦',
    description: 'Browse all available icons',
    // Pas de keywords - retournera tous les icônes
    keywords: [],
  }
];

/**
 * Détermine la catégorie d'une icône basée sur son nom
 * @param {string} iconName - Nom de l'icône (ex: "ArrowUpRight")
 * @returns {string} - ID de la catégorie
 */
export function detectIconCategory(iconName) {
  const nameLower = iconName.toLowerCase();

  // Check popular first
  const popularCategory = ICON_CATEGORIES.find(cat => cat.id === 'popular');
  if (popularCategory.icons.includes(iconName)) {
    return 'popular';
  }

  // Check other categories by keywords
  for (const category of ICON_CATEGORIES) {
    if (category.id === 'popular' || category.id === 'all') continue;

    if (category.keywords) {
      // Check if any keyword is in the icon name
      for (const keyword of category.keywords) {
        if (nameLower.includes(keyword.toLowerCase())) {
          return category.id;
        }
      }
    }
  }

  // Default to 'all' if no match
  return 'all';
}

/**
 * Filtre les icônes par catégorie
 * @param {Array<string>} allIcons - Liste de tous les noms d'icônes
 * @param {string} categoryId - ID de la catégorie
 * @returns {Array<string>} - Icônes filtrées
 */
export function filterIconsByCategory(allIcons, categoryId) {
  if (categoryId === 'all') {
    return allIcons;
  }

  const category = ICON_CATEGORIES.find(cat => cat.id === categoryId);
  if (!category) {
    return allIcons;
  }

  // Si la catégorie a des icônes définies manuellement (popular)
  if (category.icons && category.icons.length > 0) {
    return category.icons.filter(icon => allIcons.includes(icon));
  }

  // Sinon, filtrer par keywords
  return allIcons.filter(iconName => {
    const detected = detectIconCategory(iconName);
    return detected === categoryId;
  });
}

/**
 * Obtenir le nombre d'icônes par catégorie
 * @param {Array<string>} allIcons - Liste de tous les noms d'icônes
 * @returns {Object} - Map de categoryId → count
 */
export function getIconCountsByCategory(allIcons) {
  const counts = {};

  ICON_CATEGORIES.forEach(category => {
    const filtered = filterIconsByCategory(allIcons, category.id);
    counts[category.id] = filtered.length;
  });

  return counts;
}
