-- ============================================
-- MIGRATION 010: Remove Redundant Bookmarks Index
-- Description: Remove idx_bookmarks_group_position which is covered by idx_bookmarks_group_column
-- Author: Claude AI
-- Date: 2026-01-29
-- ============================================

-- Redundancy Analysis:
-- Migration 005 created: idx_bookmarks_group_position ON bookmarks(group_id, position)
-- Migration 007 created: idx_bookmarks_group_column ON bookmarks(group_id, "column", position)
--
-- The second index (idx_bookmarks_group_column) covers ALL queries that the first
-- index supported, via PostgreSQL's leftmost prefix rule:
-- - Queries filtering on (group_id) alone: covered by idx_bookmarks_group_column
-- - Queries filtering on (group_id, position): covered by idx_bookmarks_group_column
--
-- Benefits of removal:
-- - Reduced storage space (one less B-tree index to maintain)
-- - Faster writes (INSERTs/UPDATEs don't need to update redundant index)
-- - No query regression (all patterns covered by the remaining index)

-- Note: DO NOT wrap in a transaction.
-- DROP INDEX CONCURRENTLY cannot run inside BEGIN/COMMIT blocks.

DROP INDEX CONCURRENTLY IF EXISTS idx_bookmarks_group_position;

-- ============================================
-- Verification
-- ============================================
-- Run this query to verify the index has been removed:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'bookmarks' ORDER BY indexname;
-- Expected: Should NOT include idx_bookmarks_group_position
-- Should include: idx_bookmarks_group_column, idx_bookmarks_url, idx_bookmarks_user, idx_bookmarks_visit_count
