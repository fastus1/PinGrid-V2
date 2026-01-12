import { useTheme } from '../../../../shared/theme/useTheme';
import { SPACING } from '../../utils/spacing';

/**
 * BasicInfoTab Component
 *
 * Formulaire minimaliste pour les informations de base du bookmark:
 * - Title (required, max 200)
 * - URL (required, http/https format)
 * - Description (optional, max 500)
 * - Current favicon display
 */
export default function BasicInfoTab({ formData, onChange, currentFavicon }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const isUrlValid = formData.url && (formData.url.startsWith('http://') || formData.url.startsWith('https://'));
  const titleLength = formData.title.length;
  const descLength = formData.description.length;

  // Show character count only if > 50% of limit
  const showTitleCount = titleLength > 100;
  const showDescCount = descLength > 250;

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        {/* Title Field */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            Title <span style={styles.required}>*</span>
          </label>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Enter bookmark title"
              style={styles.input}
              maxLength={200}
            />
            {showTitleCount && (
              <span style={styles.charCount}>{titleLength}/200</span>
            )}
          </div>
        </div>

        {/* URL Field */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            URL <span style={styles.required}>*</span>
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => onChange('url', e.target.value)}
            placeholder="https://example.com"
            style={styles.input}
          />
          {formData.url && (
            <div style={styles.hint}>
              {isUrlValid ? (
                <span style={{ ...styles.validation, color: theme.colors.success }}>
                  ✓ Valid URL
                </span>
              ) : (
                <span style={{ ...styles.validation, color: theme.colors.error }}>
                  ✗ Must start with http:// or https://
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            Description <span style={styles.optional}>(optional)</span>
          </label>
          <div style={styles.inputWrapper}>
            <textarea
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Add a description for this bookmark..."
              style={styles.textarea}
              maxLength={500}
              rows={3}
            />
            {showDescCount && (
              <span style={styles.charCount}>{descLength}/500</span>
            )}
          </div>
        </div>
      </div>

      {/* Separator */}
      <div style={styles.separator}></div>

      {/* Current Favicon Display */}
      <div style={styles.section}>
        <label style={styles.label}>Current Favicon</label>
        <div style={styles.faviconCard}>
          {currentFavicon ? (
            <>
              <img
                src={currentFavicon}
                alt=""
                style={styles.faviconImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ ...styles.faviconPlaceholder, display: 'none' }}>
                🔖
              </div>
              <div style={styles.faviconInfo}>
                <div style={styles.faviconDomain}>
                  {formData.url ? new URL(formData.url).hostname.replace('www.', '') : 'No URL'}
                </div>
                <div style={styles.faviconSource}>
                  {currentFavicon.includes('uploads') ? 'Custom upload' : 'Auto-detected source'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={styles.faviconPlaceholder}>🔖</div>
              <div style={styles.faviconInfo}>
                <div style={styles.faviconDomain}>No favicon selected</div>
                <div style={styles.faviconSource}>
                  Choose a favicon in the other tabs
                </div>
              </div>
            </>
          )}
        </div>

        <div style={styles.infoBox}>
          ⓘ Complete this tab, then choose a favicon source or design a custom icon in the other tabs.
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    height: '530px',
    overflowY: 'auto',
    padding: SPACING.xl,
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.lg,
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.sm,
  },

  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  required: {
    color: theme.colors.error,
  },

  optional: {
    fontSize: '12px',
    fontWeight: '400',
    color: theme.colors.textMuted,
  },

  inputWrapper: {
    position: 'relative',
  },

  input: {
    width: '100%',
    height: '44px',
    padding: `0 ${SPACING.md}`,
    fontSize: '14px',
    color: theme.colors.textPrimary,
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    '::placeholder': {
      color: theme.colors.textMuted,
    },
  },

  textarea: {
    width: '100%',
    padding: SPACING.md,
    fontSize: '14px',
    color: theme.colors.textPrimary,
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s ease',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },

  charCount: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '11px',
    color: theme.colors.textMuted,
    pointerEvents: 'none',
  },

  hint: {
    marginTop: SPACING.xs,
  },

  validation: {
    fontSize: '12px',
    fontWeight: '500',
  },

  separator: {
    height: '1px',
    background: theme.colors.border,
    margin: `${SPACING.lg} 0`,
  },

  faviconCard: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    background: theme.colors.cardBg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
  },

  faviconImage: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
    borderRadius: '4px',
  },

  faviconPlaceholder: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    background: theme.colors.background,
    borderRadius: '4px',
  },

  faviconInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  faviconDomain: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },

  faviconSource: {
    fontSize: '12px',
    color: theme.colors.textMuted,
  },

  infoBox: {
    padding: SPACING.md,
    background: `${theme.colors.info}15`,
    border: `1px solid ${theme.colors.info}30`,
    borderRadius: '8px',
    fontSize: '13px',
    color: theme.colors.textSecondary,
    lineHeight: '1.5',
  },
});
