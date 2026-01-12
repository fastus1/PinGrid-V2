/**
 * Icon Aliases System
 *
 * Map d'aliases pour améliorer la recherche d'icônes
 * Permet de trouver des icônes avec des synonymes et termes alternatifs
 *
 * Example: rechercher "email" trouvera l'icône "Mail"
 */

export const ICON_ALIASES = {
  // Communication
  'Mail': ['email', 'envelope', 'inbox', 'letter', 'message'],
  'MailOpen': ['read', 'opened'],
  'MessageCircle': ['chat', 'conversation', 'bubble', 'talk'],
  'MessageSquare': ['comment', 'chat', 'reply'],
  'Phone': ['call', 'telephone', 'mobile', 'contact'],
  'PhoneCall': ['calling', 'ringing'],
  'Send': ['submit', 'deliver', 'forward'],
  'Bell': ['notification', 'alert', 'alarm', 'ring'],
  'BellOff': ['mute', 'silent', 'quiet'],

  // Actions
  'Plus': ['add', 'new', 'create', 'insert'],
  'Minus': ['remove', 'subtract', 'delete'],
  'X': ['close', 'cancel', 'exit', 'dismiss', 'cross'],
  'Check': ['checkmark', 'tick', 'done', 'complete', 'confirm', 'ok', 'yes'],
  'Trash': ['delete', 'remove', 'bin', 'garbage', 'discard'],
  'Trash2': ['delete', 'remove', 'bin', 'garbage'],
  'Edit': ['pencil', 'modify', 'change', 'update', 'write'],
  'Edit2': ['pen', 'write'],
  'Edit3': ['compose'],
  'Save': ['disk', 'floppy', 'store', 'keep'],
  'Copy': ['duplicate', 'clone', 'replicate'],
  'Clipboard': ['paste', 'copy', 'buffer'],
  'Scissors': ['cut', 'snip'],
  'RefreshCw': ['reload', 'sync', 'update', 'restart'],
  'RotateCw': ['rotate', 'turn', 'spin', 'clockwise'],
  'RotateCcw': ['counterclockwise', 'reverse'],

  // Files & Folders
  'File': ['document', 'paper', 'page'],
  'FileText': ['doc', 'document', 'note', 'text'],
  'Folder': ['directory', 'dir', 'container'],
  'FolderOpen': ['opened', 'expanded'],
  'Download': ['save', 'get', 'pull', 'import'],
  'Upload': ['send', 'push', 'export', 'publish'],
  'Archive': ['zip', 'compress', 'backup'],
  'Package': ['box', 'parcel', 'npm'],

  // Navigation
  'Home': ['house', 'main', 'start', 'dashboard'],
  'Search': ['find', 'magnify', 'lookup', 'query', 'lens'],
  'Menu': ['hamburger', 'navigation', 'nav', 'bars', 'list'],
  'MoreVertical': ['options', 'dots', 'ellipsis', 'kebab'],
  'MoreHorizontal': ['options', 'dots', 'ellipsis', 'meatballs'],
  'ExternalLink': ['open', 'outside', 'external', 'newwindow'],
  'Link': ['url', 'hyperlink', 'chain', 'connection'],
  'Link2': ['chain', 'connect'],

  // Arrows
  'ArrowUp': ['up', 'north', 'top'],
  'ArrowDown': ['down', 'south', 'bottom'],
  'ArrowLeft': ['left', 'west', 'back'],
  'ArrowRight': ['right', 'east', 'forward', 'next'],
  'ChevronUp': ['caret', 'collapse'],
  'ChevronDown': ['caret', 'expand', 'dropdown'],
  'ChevronLeft': ['previous', 'back'],
  'ChevronRight': ['next', 'forward'],

  // Display
  'Eye': ['view', 'see', 'show', 'visible', 'preview'],
  'EyeOff': ['hide', 'hidden', 'invisible', 'private'],
  'Monitor': ['screen', 'display', 'desktop', 'computer'],
  'Laptop': ['notebook', 'computer', 'pc'],
  'Smartphone': ['mobile', 'phone', 'device', 'cell'],
  'Tablet': ['ipad', 'device'],
  'Maximize': ['fullscreen', 'expand', 'enlarge'],
  'Maximize2': ['fullscreen'],
  'Minimize': ['shrink', 'collapse', 'reduce'],
  'Minimize2': ['shrink'],

  // Security
  'Lock': ['secure', 'private', 'protected', 'locked'],
  'Unlock': ['open', 'public', 'unlocked'],
  'Key': ['password', 'access', 'credential'],
  'Shield': ['security', 'protect', 'safe'],
  'ShieldOff': ['vulnerable', 'unprotected'],

  // User
  'User': ['person', 'profile', 'account', 'avatar'],
  'Users': ['people', 'group', 'team', 'members'],
  'UserPlus': ['invite', 'add', 'signup'],
  'UserMinus': ['remove', 'delete', 'unfollow'],
  'UserCheck': ['verified', 'approved'],
  'UserX': ['blocked', 'banned', 'rejected'],

  // Settings
  'Settings': ['gear', 'preferences', 'config', 'options', 'configure'],
  'Tool': ['wrench', 'fix', 'repair', 'maintenance'],
  'Sliders': ['adjust', 'controls', 'settings', 'tune'],

  // Media
  'Play': ['start', 'resume', 'begin'],
  'Pause': ['stop', 'halt', 'wait'],
  'Stop': ['end', 'finish', 'terminate'],
  'SkipForward': ['next', 'forward'],
  'SkipBack': ['previous', 'back', 'rewind'],
  'FastForward': ['ff', 'speed'],
  'Rewind': ['rw', 'backward'],
  'Volume': ['sound', 'audio', 'speaker'],
  'Volume2': ['loud', 'sound'],
  'VolumeX': ['mute', 'silent', 'off'],
  'Mic': ['microphone', 'record', 'voice'],
  'MicOff': ['mute', 'silent'],
  'Camera': ['photo', 'picture', 'snapshot'],
  'Video': ['camera', 'record', 'film'],
  'VideoOff': ['disabled', 'mute'],
  'Image': ['picture', 'photo', 'jpeg', 'png'],
  'Film': ['movie', 'video', 'cinema'],
  'Music': ['audio', 'song', 'sound', 'tune'],

  // Time
  'Clock': ['time', 'watch', 'timer', 'schedule'],
  'Calendar': ['date', 'schedule', 'day', 'event'],
  'Watch': ['time', 'timer', 'stopwatch'],

  // Social
  'Heart': ['like', 'love', 'favorite', 'star'],
  'Star': ['favorite', 'rating', 'bookmark'],
  'ThumbsUp': ['like', 'approve', 'good', 'yes'],
  'ThumbsDown': ['dislike', 'disapprove', 'bad', 'no'],
  'Share': ['forward', 'send', 'distribute'],
  'Share2': ['export', 'distribute'],

  // Business
  'Briefcase': ['work', 'job', 'business', 'portfolio'],
  'TrendingUp': ['growth', 'increase', 'rise', 'profit'],
  'TrendingDown': ['decline', 'decrease', 'loss'],
  'BarChart': ['graph', 'stats', 'analytics', 'data'],
  'PieChart': ['chart', 'graph', 'statistics'],
  'DollarSign': ['money', 'price', 'cost', 'payment', 'currency'],
  'CreditCard': ['payment', 'card', 'pay', 'purchase'],
  'ShoppingCart': ['cart', 'basket', 'buy', 'purchase'],
  'ShoppingBag': ['bag', 'purchase', 'shop'],

  // Development
  'Code': ['programming', 'developer', 'brackets', 'html'],
  'Terminal': ['console', 'command', 'cli', 'shell', 'bash'],
  'Github': ['git', 'repository', 'repo', 'version'],
  'Gitlab': ['git', 'repository', 'repo'],
  'Database': ['db', 'storage', 'sql', 'data'],
  'Server': ['backend', 'api', 'host'],
  'Box': ['container', 'package', 'module'],
  'Package': ['npm', 'module', 'library'],
  'Bug': ['error', 'issue', 'problem', 'debug'],

  // Weather
  'Sun': ['sunny', 'day', 'light', 'bright'],
  'Moon': ['night', 'dark', 'lunar'],
  'Cloud': ['cloudy', 'overcast', 'weather'],
  'CloudRain': ['rain', 'rainy', 'wet'],
  'CloudSnow': ['snow', 'snowy', 'winter'],
  'CloudLightning': ['storm', 'thunder', 'lightning'],
  'Wind': ['breeze', 'air', 'gust'],
  'Droplet': ['water', 'drop', 'liquid', 'rain'],
  'Umbrella': ['rain', 'protect', 'weather'],

  // Status
  'AlertCircle': ['warning', 'caution', 'info'],
  'AlertTriangle': ['warning', 'caution', 'danger', 'error'],
  'Info': ['information', 'help', 'about'],
  'HelpCircle': ['question', 'faq', 'support', 'help'],
  'XCircle': ['error', 'failed', 'wrong', 'no'],
  'CheckCircle': ['success', 'done', 'complete', 'yes'],
  'AlertOctagon': ['stop', 'danger', 'prohibited'],

  // Layout
  'Layout': ['grid', 'structure', 'template'],
  'Sidebar': ['panel', 'menu', 'navigation'],
  'Grid': ['table', 'layout', 'tiles'],
  'List': ['menu', 'items', 'bullets'],
  'Columns': ['layout', 'split', 'divide'],

  // Location
  'MapPin': ['location', 'place', 'marker', 'pin', 'address'],
  'Map': ['location', 'navigation', 'place', 'gps'],
  'Navigation': ['compass', 'direction', 'gps'],
  'Globe': ['world', 'earth', 'international', 'web'],
  'Compass': ['direction', 'navigate', 'north'],

  // Misc
  'Zap': ['lightning', 'bolt', 'flash', 'power', 'energy'],
  'Award': ['badge', 'medal', 'prize', 'achievement'],
  'Gift': ['present', 'reward', 'prize'],
  'Bookmark': ['save', 'favorite', 'mark'],
  'Tag': ['label', 'category', 'taxonomy'],
  'Filter': ['sort', 'refine', 'search'],
  'Wifi': ['wireless', 'internet', 'network', 'connection'],
  'WifiOff': ['offline', 'disconnected'],
  'Bluetooth': ['wireless', 'connect', 'pair'],
  'Battery': ['power', 'charge', 'energy'],
  'BatteryCharging': ['charging', 'power'],
  'Power': ['on', 'off', 'button', 'shutdown'],
  'Cpu': ['processor', 'chip', 'hardware'],
  'HardDrive': ['disk', 'storage', 'drive'],
};

/**
 * Obtenir tous les aliases pour un nom d'icône
 * @param {string} iconName - Nom de l'icône
 * @returns {Array<string>} - Liste des aliases
 */
export function getAliasesForIcon(iconName) {
  return ICON_ALIASES[iconName] || [];
}

/**
 * Rechercher des icônes par alias
 * @param {string} query - Terme de recherche
 * @param {Array<string>} allIcons - Liste de tous les noms d'icônes
 * @returns {Array<string>} - Icônes matchant l'alias
 */
export function searchByAlias(query, allIcons) {
  const queryLower = query.toLowerCase();
  const matches = [];

  allIcons.forEach(iconName => {
    const aliases = getAliasesForIcon(iconName);
    if (aliases.some(alias => alias.includes(queryLower))) {
      matches.push(iconName);
    }
  });

  return matches;
}

/**
 * Vérifier si une icône matche un alias
 * @param {string} iconName - Nom de l'icône
 * @param {string} query - Terme de recherche
 * @returns {boolean} - True si match
 */
export function matchesAlias(iconName, query) {
  const aliases = getAliasesForIcon(iconName);
  const queryLower = query.toLowerCase();
  return aliases.some(alias => alias.includes(queryLower));
}
