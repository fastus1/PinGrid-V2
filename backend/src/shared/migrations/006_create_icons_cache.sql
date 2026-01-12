-- Migration 006: Create icons_cache table for favicon caching
-- Purpose: Store fetched favicons to avoid repeated API calls
-- Date: 2026-01-07

-- Create icons_cache table
CREATE TABLE IF NOT EXISTS icons_cache (
    domain VARCHAR(255) PRIMARY KEY,
    favicon_url TEXT NOT NULL,
    size VARCHAR(20),          -- "256x256", "128x128", "64x64", etc.
    format VARCHAR(10),         -- "png", "ico", "svg", "jpg"
    last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_domain_not_empty CHECK (LENGTH(TRIM(domain)) > 0),
    CONSTRAINT check_favicon_url_not_empty CHECK (LENGTH(TRIM(favicon_url)) > 0)
);

-- Index for performance (query by last_checked_at for cache expiry logic)
CREATE INDEX IF NOT EXISTS idx_icons_cache_last_checked ON icons_cache(last_checked_at DESC);

-- Add comment to table
COMMENT ON TABLE icons_cache IS 'Cache table for storing fetched favicons to reduce external API calls';
COMMENT ON COLUMN icons_cache.domain IS 'Domain name extracted from URL (e.g., "github.com")';
COMMENT ON COLUMN icons_cache.favicon_url IS 'Full URL to the fetched favicon image';
COMMENT ON COLUMN icons_cache.size IS 'Size of the favicon (e.g., "256x256")';
COMMENT ON COLUMN icons_cache.format IS 'Image format (e.g., "png", "ico", "svg")';
COMMENT ON COLUMN icons_cache.last_checked_at IS 'Last time we checked/updated this favicon (for cache expiry)';
COMMENT ON COLUMN icons_cache.created_at IS 'Timestamp when this favicon was first cached';
