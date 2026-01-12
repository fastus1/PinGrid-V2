import { useState, useMemo, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import CategorySidebar from './CategorySidebar';
import IconBrowser from './IconBrowser';
import EditorPanel from './EditorPanel';
import { IconSearchEngine } from './IconSearchEngine';
import { filterIconsByCategory, getIconCountsByCategory } from '../../../utils/iconCategories';

/**
 * IconDesignerTab Component
 *
 * Layout 3-colonnes minimaliste:
 * - Colonne 1 (180px): CategorySidebar
 * - Colonne 2 (480px): IconBrowser (virtualisé)
 * - Colonne 3 (240px): EditorPanel
 *
 * Total: 900px width, 530px height
 */
export default function IconDesignerTab({ onSave, onCancel, currentFaviconUrl }) {
  // Extract all valid Lucide icon names
  const allIcons = useMemo(() => {
    return Object.keys(LucideIcons)
      .filter(name => {
        if (name === 'default' || name === 'createLucideIcon' || name === 'icons') return false;
        if (/^[a-z]/.test(name)) return false; // Filter lowercase exports
        return true;
      });
  }, []);

  // Initialize search engine
  const searchEngine = useMemo(() => {
    return new IconSearchEngine(allIcons);
  }, [allIcons]);

  // Icon counts by category
  const iconCounts = useMemo(() => {
    return getIconCountsByCategory(allIcons);
  }, [allIcons]);

  // State
  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [color, setColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [padding, setPadding] = useState(40);
  const [saving, setSaving] = useState(false);

  // Filtered icons based on search and category
  const filteredIcons = useMemo(() => {
    if (searchTerm.trim()) {
      // Use search engine
      return searchEngine.search(searchTerm, activeCategory, 150);
    } else {
      // Filter by category only
      return filterIconsByCategory(allIcons, activeCategory);
    }
  }, [searchTerm, activeCategory, allIcons, searchEngine]);

  // Handlers
  const handleCategoryChange = useCallback((categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm(''); // Clear search when changing category
  }, []);

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleIconSelect = useCallback((iconName) => {
    setSelectedIcon(iconName);
  }, []);

  const handleSave = async (blob) => {
    setSaving(true);
    try {
      await onSave(blob);
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
    },
  };

  return (
    <div style={styles.container}>
      {/* Column 1: Category Sidebar */}
      <CategorySidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        iconCounts={iconCounts}
      />

      {/* Column 2: Icon Browser */}
      <IconBrowser
        filteredIcons={filteredIcons}
        selectedIcon={selectedIcon}
        onIconSelect={handleIconSelect}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {/* Column 3: Editor Panel */}
      <EditorPanel
        selectedIcon={selectedIcon}
        color={color}
        strokeWidth={strokeWidth}
        padding={padding}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onPaddingChange={setPadding}
        onSave={handleSave}
        onCancel={onCancel}
        saving={saving}
      />
    </div>
  );
}
