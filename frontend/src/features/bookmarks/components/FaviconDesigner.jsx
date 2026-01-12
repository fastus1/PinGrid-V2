import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * FaviconDesigner Component (V2)
 * Large, 2-column layout for designing favicons.
 *
 * Left Pane: Icon Browser (Grid of icons)
 * Right Pane: Editor (Preview + Controls)
 */
export default function FaviconDesigner({ onSave, onCancel, currentFaviconUrl }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIconName, setSelectedIconName] = useState('Sparkles');
    const [color, setColor] = useState('#3b82f6');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [padding, setPadding] = useState(40);
    const [saving, setSaving] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(150); // Show 150 initially

    const canvasRef = useRef(null);

    // Memoize icon list to avoid re-filtering constantly
    const iconList = useMemo(() => {
        return Object.keys(LucideIcons)
            .filter(name => {
                // Valid Lucide icons are exported as React components (TitleCase)
                // We filter out internal helpers like 'createLucideIcon', 'icons', 'default'
                // and check if start with Uppercase to be safe.
                if (name === 'default' || name === 'createLucideIcon' || name === 'icons') return false;
                if (/^[a-z]/.test(name)) return false; // Filter lowercase exports
                return name.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [searchTerm]);

    const displayedIcons = iconList.slice(0, displayLimit);

    // Load more icons on scroll? Or just button
    const handleLoadMore = () => {
        setDisplayLimit(prev => prev + 150);
    };

    // Canvas Drawing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const size = 256; // Render resolution

        ctx.clearRect(0, 0, size, size);

        // Serialization Trick for Lucide Icons
        const svgElement = document.getElementById('temp-icon-svg');
        if (svgElement) {
            const xml = new XMLSerializer().serializeToString(svgElement);
            const svg64 = btoa(xml);
            const b64Start = 'data:image/svg+xml;base64,';
            const image64 = b64Start + svg64;

            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, size, size);
                const drawSize = size - (padding * 2);
                const offset = padding;
                // Draw highly smoothed
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, offset, offset, drawSize, drawSize);
            };
            img.src = image64;
        }
    }, [selectedIconName, color, strokeWidth, padding]);

    const handleSave = () => {
        setSaving(true);
        const canvas = canvasRef.current;
        canvas.toBlob((blob) => {
            onSave(blob);
            setSaving(false);
        }, 'image/png');
    };

    const SelectedIcon = LucideIcons[selectedIconName];

    return (
        <div style={styles.container}>
            {/* LEFT PANE: Icon Browser */}
            <div style={styles.browserPane}>
                <div style={styles.searchBar}>
                    <div style={styles.searchIcon}>🔍</div>
                    <input
                        type="text"
                        placeholder={`Search ${iconList.length} icons...`}
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setDisplayLimit(150); }}
                        style={styles.searchInput}
                        autoFocus
                    />
                </div>

                <div style={styles.iconGrid}>
                    {displayedIcons.map(name => {
                        const Icon = LucideIcons[name];
                        const isSelected = selectedIconName === name;
                        return (
                            <button
                                key={name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedIconName(name);
                                }}
                                style={{
                                    ...styles.iconButton,
                                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                    borderColor: isSelected ? '#3b82f6' : 'transparent',
                                    color: isSelected ? '#2563eb' : '#4b5563'
                                }}
                                title={name}
                                type="button"
                            >
                                <Icon size={24} strokeWidth={1.5} />
                                {/* <span style={styles.iconName}>{name}</span> */}
                            </button>
                        );
                    })}

                    {displayLimit < iconList.length && (
                        <div style={styles.loadMoreContainer}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleLoadMore();
                                }}
                                style={styles.loadMoreButton}
                                type="button"
                            >
                                Load more icons...
                            </button>
                        </div>
                    )}

                    {iconList.length === 0 && (
                        <div style={styles.emptyState}>No icons found.</div>
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Editor */}
            <div style={styles.editorPane}>
                {/* Current Favicon Display */}
                <div style={styles.currentFaviconBar}>
                    <span style={styles.currentLabel}>Current:</span>
                    {currentFaviconUrl ? (
                        <img
                            src={currentFaviconUrl}
                            alt="Current favicon"
                            style={styles.currentFaviconImg}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <span style={styles.noFavicon}>None</span>
                    )}
                </div>
                <div style={styles.previewHeader}>
                    <h3 style={styles.paneTitle}>Customize Icon</h3>
                </div>

                <div style={styles.previewArea}>
                    <div style={styles.canvasWrapper}>
                        <canvas ref={canvasRef} width={256} height={256} style={styles.canvas} />
                        {/* Pattern background for transparency check */}
                        <div style={styles.transparencyGrid}></div>
                    </div>
                </div>

                {/* Parameters */}
                <div style={styles.controls}>
                    {/* Color */}
                    <div style={styles.controlGroup}>
                        <div style={styles.labelRow}>
                            <label style={styles.label}>Color</label>
                            <span style={styles.valueLabel}>{color}</span>
                        </div>
                        <div style={styles.colorPickerWrapper}>
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                style={styles.colorInput}
                            />
                            <div style={styles.quickColors}>
                                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#111827', '#ffffff'].map(c => (
                                    <div
                                        key={c}
                                        onClick={(e) => { e.stopPropagation(); setColor(c); }}
                                        style={{ ...styles.colorDot, backgroundColor: c, border: c === '#ffffff' ? '1px solid #e5e7eb' : 'none' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stroke */}
                    <div style={styles.controlGroup}>
                        <div style={styles.labelRow}>
                            <label style={styles.label}>Thickness</label>
                            <span style={styles.valueLabel}>{strokeWidth}px</span>
                        </div>
                        <input
                            type="range" min="0.5" max="4" step="0.25"
                            value={strokeWidth}
                            onChange={e => setStrokeWidth(parseFloat(e.target.value))}
                            style={styles.slider}
                        />
                    </div>

                    {/* Padding / Size */}
                    <div style={styles.controlGroup}>
                        <div style={styles.labelRow}>
                            <label style={styles.label}>Padding</label>
                            <span style={styles.valueLabel}>{padding}px</span>
                        </div>
                        <input
                            type="range" min="0" max="100" step="1"
                            value={padding}
                            onChange={e => setPadding(parseInt(e.target.value))}
                            style={styles.slider}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={styles.footer}>
                    <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
                    <button onClick={handleSave} style={styles.saveButton} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Icon'}
                    </button>
                </div>
            </div>

            {/* Hidden SVG for Serialization */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                {SelectedIcon && (
                    <SelectedIcon
                        id="temp-icon-svg"
                        color={color}
                        strokeWidth={strokeWidth}
                        size={256}
                        xmlns="http://www.w3.org/2000/svg"
                    />
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        height: '600px',
        backgroundColor: '#1a1a2e',
        borderTop: '1px solid #2d2d3f',
    },

    // Left Pane
    browserPane: {
        flex: '1 1 60%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #2d2d3f',
        backgroundColor: '#1a1a2e',
        minWidth: '300px'
    },
    searchBar: {
        padding: '16px',
        borderBottom: '1px solid #2d2d3f',
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    searchIcon: {
        position: 'absolute',
        left: '28px',
        color: '#71717a',
        fontSize: '14px'
    },
    searchInput: {
        width: '100%',
        padding: '10px 10px 10px 36px',
        fontSize: '14px',
        border: '1px solid #2d2d3f',
        borderRadius: '8px',
        outline: 'none',
        backgroundColor: '#252540',
        color: '#e4e4e7',
        transition: 'all 0.2s',
    },
    iconGrid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
        gridAutoRows: '60px',
        gap: '8px',
        padding: '16px',
        overflowY: 'auto',
        alignContent: 'start'
    },
    iconButton: {
        border: '1px solid transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        transition: 'all 0.1s',
        backgroundColor: '#252540',
        color: '#a1a1aa'
    },
    iconButtonHover: {
        backgroundColor: '#2d2d4f'
    },
    loadMoreContainer: {
        gridColumn: '1 / -1',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px'
    },
    loadMoreButton: {
        padding: '8px 16px',
        fontSize: '13px',
        color: '#a1a1aa',
        backgroundColor: '#252540',
        border: '1px solid #2d2d3f',
        borderRadius: '6px',
        cursor: 'pointer'
    },
    emptyState: {
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '40px',
        color: '#71717a'
    },

    // Right Pane
    editorPane: {
        flex: '0 0 350px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e30'
    },
    currentFaviconBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        backgroundColor: '#252540',
        borderBottom: '1px solid #2d2d3f'
    },
    currentLabel: {
        fontSize: '12px',
        color: '#71717a',
        fontWeight: '500'
    },
    currentFaviconImg: {
        width: '32px',
        height: '32px',
        borderRadius: '4px',
        objectFit: 'contain',
        backgroundColor: '#1a1a2e',
        border: '1px solid #2d2d3f'
    },
    noFavicon: {
        fontSize: '12px',
        color: '#71717a',
        fontStyle: 'italic'
    },
    previewHeader: {
        padding: '16px',
        borderBottom: '1px solid #2d2d3f',
        backgroundColor: '#1a1a2e'
    },
    paneTitle: {
        margin: 0,
        fontSize: '14px',
        fontWeight: '600',
        color: '#a1a1aa',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    previewArea: {
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#252540',
        borderBottom: '1px solid #2d2d3f'
    },
    canvasWrapper: {
        width: '180px',
        height: '180px',
        position: 'relative',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    canvas: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        zIndex: 2,
        position: 'relative'
    },
    transparencyGrid: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(45deg, #2d2d3f 25%, transparent 25%), linear-gradient(-45deg, #2d2d3f 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2d2d3f 75%), linear-gradient(-45deg, transparent 75%, #2d2d3f 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        zIndex: 1
    },

    controls: {
        flex: 1,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto'
    },
    controlGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    labelRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    label: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#a1a1aa'
    },
    valueLabel: {
        fontSize: '12px',
        color: '#71717a',
        fontFamily: 'monospace'
    },
    slider: {
        width: '100%',
        cursor: 'pointer',
        accentColor: '#667eea'
    },
    colorPickerWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    colorInput: {
        width: '100%',
        height: '40px',
        border: '1px solid #2d2d3f',
        borderRadius: '8px',
        padding: '2px',
        cursor: 'pointer',
        backgroundColor: '#252540'
    },
    quickColors: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
    },
    colorDot: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        transition: 'transform 0.1s'
    },

    footer: {
        padding: '16px 24px',
        borderTop: '1px solid #2d2d3f',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    cancelButton: {
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#a1a1aa',
        backgroundColor: '#252540',
        border: '1px solid #2d2d3f',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    saveButton: {
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#ffffff',
        backgroundColor: '#667eea',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(102, 126, 234, 0.4)'
    }
};
