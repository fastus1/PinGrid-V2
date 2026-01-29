-- ============================================
-- MIGRATION 009: Add Ownership Verification Indexes
-- Description: Indexes for efficient ownership verification JOINs
-- Purpose: Enable Index Scan instead of Seq Scan when traversing
--          the page hierarchy (bookmarks -> groups -> sections -> pages -> users)
-- Author: Claude AI
-- Date: 2026-01-29
-- ============================================

-- Note: DO NOT wrap these statements in a transaction.
-- CREATE INDEX CONCURRENTLY cannot run inside BEGIN/COMMIT blocks.

-- Index: idx_sections_page_id
-- Purpose: Optimize JOINs from sections to pages for ownership verification
-- Existing idx_sections_page_position (page_id, position) is suboptimal for
-- pure FK JOINs where we filter only on page_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_page_id
ON sections(page_id);

COMMENT ON INDEX idx_sections_page_id IS 'Single-column index for ownership verification JOINs from sections to pages';

-- Index: idx_groups_section_id
-- Purpose: Optimize JOINs from groups to sections for ownership verification
-- Existing idx_groups_section_position (section_id, position) is suboptimal for
-- pure FK JOINs where we filter only on section_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_section_id
ON groups(section_id);

COMMENT ON INDEX idx_groups_section_id IS 'Single-column index for ownership verification JOINs from groups to sections';

-- Note: bookmarks.group_id does NOT need a new index because
-- idx_bookmarks_group_column (group_id, column, position) already covers
-- queries filtering on group_id via the leftmost prefix rule.

-- ============================================
-- Verification
-- ============================================
-- Run this query to verify indexes are valid after creation:
-- SELECT indexrelid::regclass as index_name, indisvalid as is_valid
-- FROM pg_index
-- WHERE indexrelid IN ('idx_sections_page_id'::regclass, 'idx_groups_section_id'::regclass);
-- Expected: Both indexes with is_valid = true
