import { useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { useTheme } from '../../../../../shared/theme/useTheme';
import { SPACING } from '../../../utils/spacing';

/**
 * EditorPanel Component
 *
 * Panneau d'édition compact:
 * - Preview (80px)
 * - Mini sizes en ligne
 * - Color picker + quick colors
 * - Stroke/Padding sliders compacts
 */
export default function EditorPanel({
  selectedIcon,
  color,
  strokeWidth,
  padding,
  onColorChange,
  onStrokeWidthChange,
  onPaddingChange,
  onSave,
  onCancel,
  saving
}) {
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const styles = getStyles(theme);

  const IconComponent = LucideIcons[selectedIcon];

  // 12 quick colors sur 2 lignes
  const quickColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#84cc16', '#111827', '#6b7280', '#d1d5db', '#ffffff'
  ];

  // Canvas rendering for export
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedIcon) return;

    const ctx = canvas.getContext('2d');
    const size = 256;
    ctx.clearRect(0, 0, size, size);

    const svgElement = document.getElementById('temp-icon-svg-editor');
    if (svgElement) {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svg64 = btoa(xml);
      const image64 = 'data:image/svg+xml;base64,' + svg64;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        const drawSize = size - (padding * 2);
        const offset = padding;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offset, offset, drawSize, drawSize);
      };
      img.src = image64;
    }
  }, [selectedIcon, color, strokeWidth, padding]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => onSave(blob), 'image/png');
  };

  if (!selectedIcon) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>🎨</span>
          <p style={styles.emptyText}>Select an icon</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Hidden SVG + Canvas */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        {IconComponent && (
          <IconComponent
            id="temp-icon-svg-editor"
            size={256}
            color={color}
            strokeWidth={strokeWidth}
          />
        )}
      </div>
      <canvas ref={canvasRef} width={256} height={256} style={{ display: 'none' }} />

      {/* Content */}
      <div style={styles.content}>
        {/* Preview */}
        <div style={styles.previewSection}>
          <div style={styles.previewLarge}>
            {IconComponent && (
              <IconComponent size={80} color={color} strokeWidth={strokeWidth} />
            )}
          </div>
          <div style={styles.miniSizes}>
            {[32, 24, 16].map(size => (
              <div key={size} style={styles.miniItem}>
                {IconComponent && <IconComponent size={size} color={color} strokeWidth={strokeWidth} />}
              </div>
            ))}
          </div>
        </div>

        {/* Color */}
        <div style={styles.section}>
          <div style={styles.colorRow}>
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              style={styles.colorPicker}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              style={styles.colorInput}
            />
          </div>
          <div style={styles.quickColors}>
            {quickColors.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                style={{
                  ...styles.colorDot,
                  background: c,
                  ...(color === c ? styles.colorDotActive : {}),
                }}
                type="button"
              />
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div style={styles.sliderSection}>
          <div style={styles.sliderRow}>
            <span style={styles.sliderLabel}>Stroke</span>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.25"
              value={strokeWidth}
              onChange={(e) => onStrokeWidthChange(parseFloat(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{strokeWidth}</span>
          </div>
          <div style={styles.sliderRow}>
            <span style={styles.sliderLabel}>Padding</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={padding}
              onChange={(e) => onPaddingChange(parseInt(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{padding}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button onClick={onCancel} style={styles.cancelBtn} type="button" disabled={saving}>
          Cancel
        </button>
        <button onClick={handleSave} style={styles.saveBtn} type="button" disabled={saving}>
          {saving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    width: '260px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: theme.colors.background,
    overflow: 'hidden',
  },

  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  emptyIcon: { fontSize: '32px', opacity: 0.5 },
  emptyText: { margin: 0, fontSize: '12px', color: theme.colors.textMuted },

  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    gap: '12px',
    overflow: 'hidden',
  },

  previewSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  previewLarge: {
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    flexShrink: 0,
  },
  miniSizes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  miniItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.textPrimary,
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  colorRow: {
    display: 'flex',
    gap: '8px',
  },
  colorPicker: {
    width: '36px',
    height: '28px',
    padding: '2px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    background: theme.colors.cardBg,
    cursor: 'pointer',
  },
  colorInput: {
    flex: 1,
    height: '28px',
    padding: '0 8px',
    fontSize: '11px',
    color: theme.colors.textPrimary,
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  quickColors: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '4px',
  },
  colorDot: {
    width: '100%',
    aspectRatio: '1',
    border: '2px solid transparent',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  colorDotActive: {
    borderColor: '#fff',
    transform: 'scale(1.1)',
  },

  sliderSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sliderLabel: {
    width: '50px',
    fontSize: '11px',
    color: theme.colors.textSecondary,
  },
  slider: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    appearance: 'none',
    background: theme.colors.cardBg,
    cursor: 'pointer',
  },
  sliderValue: {
    width: '24px',
    fontSize: '11px',
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },

  footer: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderTop: `1px solid ${theme.colors.border}`,
  },
  cancelBtn: {
    flex: 1,
    padding: '8px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    border: `1px solid ${theme.colors.border}`,
    background: 'transparent',
    color: theme.colors.textSecondary,
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 1,
    padding: '8px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    border: 'none',
    background: theme.colors.primary,
    color: '#fff',
    cursor: 'pointer',
  },
});
