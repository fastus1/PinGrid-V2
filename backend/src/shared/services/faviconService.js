const https = require('https');
const http = require('http');
const { URL } = require('url');
const pool = require('../config/database');

/**
 * FaviconService
 *
 * Service for fetching and caching favicons from external APIs.
 *
 * Strategy:
 * 1. Check cache (icons_cache table)
 * 2. Try FaviconExtractor API (256x256)
 * 3. Try Google Favicon API (128x128)
 * 4. Try DuckDuckGo API (32x32)
 * 5. Return default icon
 *
 * Timeout: 5 seconds per API call
 * Cache expiry: 30 days (optional for v1)
 */
class FaviconService {
  /**
   * Extract domain from URL
   * @param {string} url - Full URL (e.g., "https://github.com/user/repo")
   * @returns {string} - Domain only (e.g., "github.com")
   */
  extractDomain(url) {
    try {
      // Handle URLs without protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const parsedUrl = new URL(url);
      return parsedUrl.hostname.toLowerCase();
    } catch (error) {
      console.error('Error extracting domain from URL:', url, error.message);
      return null;
    }
  }

  /**
   * Get cached favicon from database
   * @param {string} domain - Domain name
   * @returns {Promise<object|null>} - Cached favicon object or null
   */
  async getCachedFavicon(domain) {
    try {
      const result = await pool.query(
        'SELECT favicon_url, size, format, last_checked_at FROM icons_cache WHERE domain = $1',
        [domain]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting cached favicon:', error.message);
      return null;
    }
  }

  /**
   * Cache favicon in database (INSERT or UPDATE)
   * @param {string} domain - Domain name
   * @param {string} faviconUrl - URL of the favicon
   * @param {string} size - Size of favicon (e.g., "256x256")
   * @param {string} format - Format of favicon (e.g., "png", "ico")
   */
  async cacheFavicon(domain, faviconUrl, size = 'unknown', format = 'unknown') {
    try {
      // UPSERT: Insert or update if exists
      await pool.query(
        `INSERT INTO icons_cache (domain, favicon_url, size, format, last_checked_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (domain)
         DO UPDATE SET
           favicon_url = EXCLUDED.favicon_url,
           size = EXCLUDED.size,
           format = EXCLUDED.format,
           last_checked_at = CURRENT_TIMESTAMP`,
        [domain, faviconUrl, size, format]
      );

      console.log(`✅ Cached favicon for ${domain}: ${faviconUrl}`);
    } catch (error) {
      console.error('Error caching favicon:', error.message);
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Clear cached favicon for a domain (for refresh purposes)
   * @param {string} domain - Domain name to clear from cache
   */
  async clearCache(domain) {
    try {
      await pool.query('DELETE FROM icons_cache WHERE domain = $1', [domain]);
      console.log(`🗑️ Cleared cache for ${domain}`);
    } catch (error) {
      console.error('Error clearing cache:', error.message);
      // Don't throw - cache clear failure shouldn't break the flow
    }
  }

  /**
   * Check if cached favicon should be refreshed
   * @param {Date} lastCheckedAt - Last check timestamp
   * @returns {boolean} - True if should refresh (>30 days old)
   */
  shouldRefresh(lastCheckedAt) {
    // For v1, we don't refresh cached favicons (always use cache)
    // In future: check if older than 30 days
    const CACHE_EXPIRY_DAYS = 30;
    const now = new Date();
    const diffTime = now - new Date(lastCheckedAt);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays > CACHE_EXPIRY_DAYS;
  }

  /**
   * Fetch URL with timeout
   * @param {string} url - URL to fetch
   * @param {number} timeout - Timeout in milliseconds (default 5000)
   * @returns {Promise<object>} - {success: boolean, url: string|null, error: string|null}
   */
  fetchWithTimeout(url, timeout = 5000) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;

      const timer = setTimeout(() => {
        resolve({ success: false, url: null, error: 'Timeout' });
      }, timeout);

      const request = protocol.get(url, (response) => {
        clearTimeout(timer);

        // Follow redirects (301, 302)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log(`Redirect: ${url} → ${response.headers.location}`);
          return resolve(this.fetchWithTimeout(response.headers.location, timeout));
        }

        if (response.statusCode === 200) {
          resolve({ success: true, url: url, error: null });
        } else {
          resolve({ success: false, url: null, error: `HTTP ${response.statusCode}` });
        }

        // Destroy response to prevent memory leak
        response.destroy();
      });

      request.on('error', (error) => {
        clearTimeout(timer);
        resolve({ success: false, url: null, error: error.message });
      });

      request.setTimeout(timeout, () => {
        request.destroy();
        clearTimeout(timer);
        resolve({ success: false, url: null, error: 'Socket timeout' });
      });
    });
  }

  /**
   * Try to fetch favicon from multiple APIs with fallback
   * @param {string} domain - Domain name
   * @returns {Promise<string>} - Favicon URL or default icon
   */
  async fetchFaviconWithFallback(domain) {
    // List of APIs to try (priority order - highest quality first)
    const apis = [
      {
        name: 'IconHorse',
        url: `https://icon.horse/icon/${domain}`,
        size: '256x256',
        format: 'png'
      },
      {
        name: 'FaviconExtractor',
        url: `https://www.faviconextractor.com/favicon/${domain}?size=256`,
        size: '256x256',
        format: 'png'
      },
      {
        name: 'Google',
        url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
        size: '256x256',
        format: 'png'
      },
      {
        name: 'FaviconIm',
        url: `https://favicon.im/${domain}?larger=true`,
        size: '128x128',
        format: 'png'
      },
      {
        name: 'DuckDuckGo',
        url: `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        size: '64x64',
        format: 'ico'
      }
    ];

    // Try each API sequentially
    for (const api of apis) {
      try {
        console.log(`Trying ${api.name} API for ${domain}...`);
        const result = await this.fetchWithTimeout(api.url, 5000);

        if (result.success) {
          console.log(`✅ ${api.name} API succeeded for ${domain}`);
          // Cache the successful result
          await this.cacheFavicon(domain, result.url, api.size, api.format);
          return result.url;
        } else {
          console.warn(`⚠️ ${api.name} API failed for ${domain}: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ ${api.name} API error for ${domain}:`, error.message);
      }
    }

    // All APIs failed, return default icon
    console.log(`Using default icon for ${domain}`);
    const defaultIcon = this.getDefaultIcon();
    await this.cacheFavicon(domain, defaultIcon, 'default', 'svg');
    return defaultIcon;
  }

  /**
   * Get default fallback icon (SVG data URL)
   * @returns {string} - SVG data URL
   */
  getDefaultIcon() {
    // Simple bookmark emoji as SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#e0e0e0" rx="10"/>
      <text x="50" y="65" font-size="50" text-anchor="middle" font-family="Arial">🔖</text>
    </svg>`;

    // Encode to base64 data URL
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Main public method: Get favicon for a URL
   * @param {string} url - Full URL
   * @returns {Promise<string>} - Favicon URL (from cache, API, or default)
   */
  async getFavicon(url) {
    try {
      // 1. Extract domain
      const domain = this.extractDomain(url);
      if (!domain) {
        console.warn('Invalid domain, using default icon');
        return this.getDefaultIcon();
      }

      // 2. Check cache first
      const cached = await this.getCachedFavicon(domain);
      if (cached && !this.shouldRefresh(cached.last_checked_at)) {
        console.log(`✅ Using cached favicon for ${domain}`);
        return cached.favicon_url;
      }

      // 3. Fetch from APIs with fallback
      console.log(`Fetching favicon for ${domain}...`);
      const faviconUrl = await this.fetchFaviconWithFallback(domain);

      return faviconUrl;
    } catch (error) {
      console.error('Error in getFavicon:', error.message);
      return this.getDefaultIcon();
    }
  }

  /**
   * Scan a website's HTML to find declared favicons
   * Looks for: apple-touch-icon, link rel="icon", manifest.json icons
   * @param {string} url - Full URL of the site to scan
   * @returns {Promise<Array>} - Array of found favicon objects { url, size, type }
   */
  async scanSiteForFavicons(url) {
    const foundIcons = [];

    try {
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const parsedUrl = new URL(url);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

      console.log(`🔍 Scanning ${baseUrl} for favicons...`);

      // Fetch HTML content
      const html = await this.fetchHtmlContent(baseUrl, 8000);
      if (!html) {
        console.log('Could not fetch HTML');
        return foundIcons;
      }

      // Parse link tags for icons
      const linkRegex = /<link[^>]*rel=["'](?:apple-touch-icon|icon|shortcut icon)[^>]*>/gi;
      const links = html.match(linkRegex) || [];

      for (const link of links) {
        // Extract href
        const hrefMatch = link.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) continue;

        let iconUrl = hrefMatch[1];

        // Make absolute URL
        if (iconUrl.startsWith('//')) {
          iconUrl = parsedUrl.protocol + iconUrl;
        } else if (iconUrl.startsWith('/')) {
          iconUrl = baseUrl + iconUrl;
        } else if (!iconUrl.startsWith('http')) {
          iconUrl = baseUrl + '/' + iconUrl;
        }

        // Extract size
        const sizeMatch = link.match(/sizes=["']([^"']+)["']/i);
        const size = sizeMatch ? sizeMatch[1] : 'unknown';

        // Extract type
        const isAppleTouch = /apple-touch-icon/i.test(link);
        const type = isAppleTouch ? 'apple-touch-icon' : 'icon';

        foundIcons.push({ url: iconUrl, size, type });
      }

      // Try to find and parse manifest.json
      const manifestMatch = html.match(/<link[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["']/i);
      if (manifestMatch) {
        let manifestUrl = manifestMatch[1];

        // Make absolute URL
        if (manifestUrl.startsWith('/')) {
          manifestUrl = baseUrl + manifestUrl;
        } else if (!manifestUrl.startsWith('http')) {
          manifestUrl = baseUrl + '/' + manifestUrl;
        }

        try {
          const manifestContent = await this.fetchHtmlContent(manifestUrl, 5000);
          if (manifestContent) {
            const manifest = JSON.parse(manifestContent);
            const icons = manifest.icons || [];

            for (const icon of icons) {
              let iconUrl = icon.src;

              // Make absolute URL
              if (iconUrl.startsWith('/')) {
                iconUrl = baseUrl + iconUrl;
              } else if (!iconUrl.startsWith('http')) {
                iconUrl = baseUrl + '/' + iconUrl;
              }

              foundIcons.push({
                url: iconUrl,
                size: icon.sizes || 'unknown',
                type: 'manifest'
              });
            }
          }
        } catch (e) {
          console.log('Could not parse manifest:', e.message);
        }
      }

      // Try common favicon paths (verify they actually exist)
      const commonPaths = [
        { path: '/apple-touch-icon.png', size: '180x180' },
        { path: '/apple-touch-icon-180x180.png', size: '180x180' },
        { path: '/apple-touch-icon-152x152.png', size: '152x152' },
        { path: '/apple-touch-icon-precomposed.png', size: '180x180' },
        { path: '/favicon-192x192.png', size: '192x192' },
        { path: '/favicon-96x96.png', size: '96x96' },
        { path: '/favicon-32x32.png', size: '32x32' },
        { path: '/favicon-16x16.png', size: '16x16' },
        { path: '/icon-192x192.png', size: '192x192' },
        { path: '/icon-512x512.png', size: '512x512' },
        { path: '/android-chrome-192x192.png', size: '192x192' },
        { path: '/android-chrome-512x512.png', size: '512x512' },
        { path: '/mstile-150x150.png', size: '150x150' },
        { path: '/favicon.ico', size: '32x32' },
        { path: '/favicon.png', size: 'unknown' },
      ];

      console.log(`Probing ${commonPaths.length} common paths...`);

      // Check common paths in parallel (limit concurrency)
      const probePromises = commonPaths.map(async ({ path, size }) => {
        const iconUrl = baseUrl + path;
        // Skip if already found
        if (foundIcons.some(i => i.url === iconUrl)) return null;

        const result = await this.fetchWithTimeout(iconUrl, 3000);
        if (result.success) {
          return { url: iconUrl, size, type: 'probed' };
        }
        return null;
      });

      const probeResults = await Promise.all(probePromises);
      for (const result of probeResults) {
        if (result) foundIcons.push(result);
      }

      console.log(`✅ Found ${foundIcons.length} icons on ${baseUrl}`);
      return foundIcons;

    } catch (error) {
      console.error('Error scanning site:', error.message);
      return foundIcons;
    }
  }

  /**
   * Fetch HTML content from URL
   * @param {string} url - URL to fetch
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<string|null>} - HTML content or null
   */
  fetchHtmlContent(url, timeout = 5000) {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;

      const timer = setTimeout(() => {
        resolve(null);
      }, timeout);

      const request = protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, (response) => {
        // Follow redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          clearTimeout(timer);
          return resolve(this.fetchHtmlContent(response.headers.location, timeout));
        }

        if (response.statusCode !== 200) {
          clearTimeout(timer);
          resolve(null);
          return;
        }

        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          clearTimeout(timer);
          resolve(data);
        });
      });

      request.on('error', () => {
        clearTimeout(timer);
        resolve(null);
      });

      request.setTimeout(timeout, () => {
        request.destroy();
        clearTimeout(timer);
        resolve(null);
      });
    });
  }
}

// Export singleton instance
module.exports = new FaviconService();
