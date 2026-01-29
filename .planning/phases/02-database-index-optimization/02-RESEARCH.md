# Phase 2: Database Index Optimization - Research

**Researched:** 2026-01-29
**Domain:** PostgreSQL indexing -- composite indexes for JOIN optimization, cache lookups, redundant index audit
**Confidence:** HIGH

## Summary

This phase optimizes database query performance by adding strategic indexes for the ownership verification JOIN patterns that traverse the page hierarchy (bookmarks -> groups -> sections -> pages -> users), adding a composite index for icons_cache TTL lookups, auditing for redundant indexes on the bookmarks table, and ensuring all new indexes are created with CONCURRENTLY to avoid blocking writes.

The existing codebase has four specific indexing opportunities that map to the four requirements:

1. **DBOPT-01:** Ownership verification queries use 3-table JOINs (groups->sections->pages or bookmarks->groups->sections->pages) with filtering on `pages.user_id`. Currently, no composite indexes exist to support these JOIN patterns. The sections and groups tables lack indexes on their foreign key columns that would enable efficient nested loop or merge joins.

2. **DBOPT-02:** The `icons_cache` table has an index on `last_checked_at DESC` alone (migration 006), but the favicon service queries by `domain` (primary key lookup) and the TTL check uses `last_checked_at`. A composite index on `(domain, last_checked_at)` would be redundant since `domain` is already the primary key. However, if bulk cache cleanup queries are added (e.g., `DELETE FROM icons_cache WHERE last_checked_at < NOW() - INTERVAL '30 days'`), the existing `idx_icons_cache_last_checked` index already supports this.

3. **DBOPT-03:** The bookmarks table has two indexes that may be redundant:
   - `idx_bookmarks_group_position` on `(group_id, position)` from migration 005
   - `idx_bookmarks_group_column` on `(group_id, "column", position)` from migration 007

   The first index is superseded by the second for queries that filter by group_id (leftmost prefix rule applies). The second index can serve queries that filter on `(group_id)` or `(group_id, column)` or `(group_id, column, position)`.

4. **DBOPT-04:** All new indexes must use `CREATE INDEX CONCURRENTLY` to avoid blocking INSERT/UPDATE/DELETE operations on production tables.

**Primary recommendation:** Add composite indexes on foreign key columns for sections and groups tables to support ownership verification JOINs. Drop the redundant `idx_bookmarks_group_position` index. Keep the existing `idx_icons_cache_last_checked` index as-is (domain lookups use the primary key). All operations must use CONCURRENTLY.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL | 14+ | Database with B-tree indexes and CREATE INDEX CONCURRENTLY | Already in use; native support for all required index features |
| pg | ^8.11.5 | Node.js PostgreSQL client | Already installed; used to run migrations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All requirements are satisfied by native PostgreSQL SQL commands |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| B-tree indexes | GiST indexes | B-tree is the right choice for equality and range queries on scalar columns |
| Manual SQL migrations | Flyway/Knex | Migration tooling would add complexity; manual SQL files match existing pattern |

**Installation:**
```bash
# No new dependencies needed -- this is pure SQL migration work
```

## Architecture Patterns

### Affected Files
```
backend/src/shared/migrations/
  009_add_ownership_indexes.sql    # NEW: Composite indexes for ownership verification
  010_remove_redundant_indexes.sql # NEW: Drop idx_bookmarks_group_position
```

### Pattern 1: Composite Index on Foreign Key for JOIN Optimization
**What:** Add composite indexes that include the foreign key column used in JOINs and any additional filter columns.
**When to use:** When queries JOIN tables and filter on columns from the joined parent table.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/indexes-multicolumn.html
-- Supports: SELECT ... FROM sections s INNER JOIN pages p ON s.page_id = p.id WHERE p.user_id = $1
CREATE INDEX CONCURRENTLY idx_sections_page_id ON sections(page_id);

-- Supports: SELECT ... FROM groups g INNER JOIN sections s ON g.section_id = s.id ...
CREATE INDEX CONCURRENTLY idx_groups_section_id ON groups(section_id);

-- Supports: SELECT ... FROM bookmarks b INNER JOIN groups g ON b.group_id = g.id ...
-- NOTE: idx_bookmarks_group_column already covers group_id (leftmost column)
```

### Pattern 2: CREATE INDEX CONCURRENTLY for Zero-Downtime Migrations
**What:** Use CONCURRENTLY to build indexes without blocking writes.
**When to use:** Always in production migrations. The only exception is temporary tables or initial database setup with no concurrent access.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/sql-createindex.html
-- NOTE: Cannot be run inside a transaction block
CREATE INDEX CONCURRENTLY idx_sections_page_id ON sections(page_id);

-- Verify index is valid (not marked as INVALID due to failed concurrent creation)
SELECT indexrelid::regclass, indisvalid
FROM pg_index
WHERE indexrelid = 'idx_sections_page_id'::regclass;
```

### Pattern 3: DROP INDEX CONCURRENTLY for Zero-Downtime Removal
**What:** Use CONCURRENTLY when dropping indexes to avoid blocking concurrent operations.
**When to use:** When removing redundant indexes on production tables.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/sql-dropindex.html
DROP INDEX CONCURRENTLY IF EXISTS idx_bookmarks_group_position;
```

### Pattern 4: EXPLAIN ANALYZE to Verify Index Usage
**What:** Run the actual ownership verification queries with EXPLAIN ANALYZE to confirm Index Scan is used.
**When to use:** After index creation to validate success criteria.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/using-explain.html
EXPLAIN ANALYZE
SELECT g.id
FROM groups g
INNER JOIN sections s ON g.section_id = s.id
INNER JOIN pages p ON s.page_id = p.id
WHERE g.id = 'some-uuid' AND p.user_id = 'some-user-uuid';

-- Expected: Should show "Index Scan" instead of "Seq Scan" on sections and groups
```

### Anti-Patterns to Avoid
- **Creating indexes inside a transaction block:** `CREATE INDEX CONCURRENTLY` cannot run inside BEGIN/COMMIT. Each index creation must be a separate statement.
- **Ignoring INVALID indexes:** If concurrent index creation fails (e.g., due to unique constraint violation or timeout), the index remains in INVALID state. Check `pg_index.indisvalid` and use `REINDEX CONCURRENTLY` to fix.
- **Over-indexing foreign keys:** Not every foreign key needs an index. Only add indexes for columns used in frequently-executed JOIN patterns.
- **Creating overlapping indexes:** Adding `(a)` when `(a, b)` already exists wastes space. The composite index covers the single-column case.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Index existence check | Manual SQL to parse pg_indexes | `CREATE INDEX IF NOT EXISTS` or `DROP INDEX IF EXISTS` | Built-in PostgreSQL syntax handles existence checks |
| Concurrent index progress monitoring | Custom polling of pg_stat_progress_create_index | PostgreSQL's pg_stat_activity for basic monitoring | Sufficient for this workload; dedicated monitoring tools (e.g., pg_stat_progress_create_index) exist for large tables |
| Redundant index detection | Manual inspection of all indexes | PostgreSQL wiki duplicate index query | Proven query that handles opclass, expressions, and predicates correctly |

**Key insight:** All four requirements are satisfied by standard PostgreSQL DDL statements. No application code changes are needed -- only new SQL migration files.

## Common Pitfalls

### Pitfall 1: CREATE INDEX CONCURRENTLY Fails Silently Leaving INVALID Index
**What goes wrong:** The index is created in INVALID state and does not speed up queries. Worse, it still slows down writes because PostgreSQL attempts to maintain it.
**Why it happens:** Concurrent index creation can fail due to deadlock, constraint violation (for unique indexes), or running out of memory/disk. Unlike regular CREATE INDEX, it does not roll back -- it leaves an INVALID index.
**How to avoid:** After each `CREATE INDEX CONCURRENTLY`, check `pg_index.indisvalid`. If false, either `REINDEX CONCURRENTLY` or `DROP INDEX CONCURRENTLY` and retry.
**Warning signs:** `EXPLAIN ANALYZE` still shows Seq Scan despite index existing; `\di+` in psql shows the index but queries don't use it.

### Pitfall 2: Running CONCURRENTLY Inside a Transaction
**What goes wrong:** PostgreSQL raises an error: "CREATE INDEX CONCURRENTLY cannot run inside a transaction block."
**Why it happens:** Concurrent index creation requires acquiring/releasing locks in a special way that's incompatible with normal transaction semantics.
**How to avoid:** Run each `CREATE INDEX CONCURRENTLY` as a standalone statement, not wrapped in BEGIN/COMMIT. If using a migration tool, configure it for non-transactional mode.
**Warning signs:** Migration fails immediately with the transaction block error.

### Pitfall 3: Dropping an Index That's Still Needed by Other Queries
**What goes wrong:** Performance regression for queries that were using the dropped index.
**Why it happens:** Index appears redundant based on one query pattern but is actually used by others.
**How to avoid:** Before dropping, check `pg_stat_user_indexes.idx_scan` to see if the index has been used recently. Query `pg_stat_statements` if enabled to find all queries using that table.
**Warning signs:** Sudden increase in query latency after migration; EXPLAIN shows Seq Scan where Index Scan was expected.

### Pitfall 4: Assuming Composite Index Order Doesn't Matter
**What goes wrong:** Index is created but queries don't use it because filter columns are in the wrong order.
**Why it happens:** B-tree indexes only efficiently support leftmost prefix queries. An index on `(a, b)` helps `WHERE a = X` or `WHERE a = X AND b = Y`, but not `WHERE b = Y` alone.
**How to avoid:** Match index column order to query filter patterns. Put the most-filtered column first.
**Warning signs:** EXPLAIN shows Seq Scan or Bitmap Heap Scan with recheck condition instead of Index Scan.

### Pitfall 5: Creating Index on Very Small Tables
**What goes wrong:** Index maintenance overhead outweighs benefits; PostgreSQL may still choose Seq Scan.
**Why it happens:** For small tables (under a few thousand rows), sequential scan is often faster than index lookup due to lower overhead.
**How to avoid:** Focus on tables that will grow (bookmarks, icons_cache). For PinGrid's usage pattern, sections and groups tables per-user are typically small, but the global table can grow large.
**Warning signs:** EXPLAIN consistently shows Seq Scan is faster in cost terms despite index existing.

## Code Examples

### Example 1: Migration 009 - Add Ownership Verification Indexes
```sql
-- Migration 009: Add composite indexes for ownership verification JOINs
-- These indexes support the ownership check patterns in models that JOIN up the hierarchy:
--   bookmarks -> groups -> sections -> pages (check pages.user_id)
--   groups -> sections -> pages (check pages.user_id)
--   sections -> pages (check pages.user_id)

-- Index on sections.page_id for JOIN from sections to pages
-- Supports: INNER JOIN pages p ON s.page_id = p.id WHERE p.user_id = $1
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_page_id
ON sections(page_id);

-- Index on groups.section_id for JOIN from groups to sections
-- Supports: INNER JOIN sections s ON g.section_id = s.id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_section_id
ON groups(section_id);

-- Note: bookmarks.group_id is already covered by idx_bookmarks_group_column (group_id, column, position)
-- from migration 007. No new index needed for bookmarks.
```

### Example 2: Migration 010 - Remove Redundant Indexes
```sql
-- Migration 010: Remove redundant bookmarks index
-- idx_bookmarks_group_position on (group_id, position) is superseded by
-- idx_bookmarks_group_column on (group_id, column, position) from migration 007.
-- The latter covers all queries that the former supported (leftmost prefix rule).

DROP INDEX CONCURRENTLY IF EXISTS idx_bookmarks_group_position;

-- Verify removal
-- SELECT indexname FROM pg_indexes WHERE tablename = 'bookmarks';
```

### Example 3: Verification Queries for Success Criteria
```sql
-- Verify DBOPT-01: Ownership verification uses Index Scan
-- Run this with actual UUIDs from your database

EXPLAIN ANALYZE
SELECT b.id
FROM bookmarks b
INNER JOIN groups g ON b.group_id = g.id
INNER JOIN sections s ON g.section_id = s.id
INNER JOIN pages p ON s.page_id = p.id
WHERE b.id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
  AND p.user_id = 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj';

-- Expected: Index Scan on sections using idx_sections_page_id
-- Expected: Index Scan on groups using idx_groups_section_id

-- Verify DBOPT-02: icons_cache lookup (domain is already PK, no new index needed)
EXPLAIN ANALYZE
SELECT favicon_url, size, format, last_checked_at
FROM icons_cache
WHERE domain = 'github.com';

-- Expected: Index Scan using icons_cache_pkey (primary key)

-- Verify DBOPT-03: No redundant indexes on bookmarks
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bookmarks'
ORDER BY indexname;

-- Expected: Should NOT see idx_bookmarks_group_position
-- Should see: idx_bookmarks_group_column, idx_bookmarks_user, idx_bookmarks_visit_count, idx_bookmarks_url

-- Verify DBOPT-04: All indexes are valid (no failed concurrent creations)
SELECT indexrelid::regclass as index_name, indisvalid as is_valid
FROM pg_index
WHERE indrelid IN ('sections'::regclass, 'groups'::regclass, 'bookmarks'::regclass);
```

### Example 4: Redundant Index Detection Query (from PostgreSQL Wiki)
```sql
-- Source: https://wiki.postgresql.org/wiki/Index_Maintenance
-- Find duplicate/redundant indexes across all tables
SELECT pg_size_pretty(sum(pg_relation_size(idx))::bigint) as size,
       (array_agg(idx))[1] as idx1, (array_agg(idx))[2] as idx2,
       (array_agg(idx))[3] as idx3, (array_agg(idx))[4] as idx4
FROM (
    SELECT indexrelid::regclass as idx,
           (indrelid::text ||E'\n'|| indclass::text ||E'\n'|| indkey::text ||E'\n'||
            coalesce(indexprs::text,'')||E'\n' || coalesce(indpred::text,'')) as key
    FROM pg_index
) sub
GROUP BY key HAVING count(*)>1
ORDER BY sum(pg_relation_size(idx)) DESC;
```

### Example 5: Check for Missing Foreign Key Indexes
```sql
-- Find foreign keys without corresponding indexes on the referencing column
-- Source: https://www.cybertec-postgresql.com/en/index-your-foreign-key/
SELECT
    c.conrelid::regclass AS table_name,
    a.attname AS column_name,
    c.confrelid::regclass AS referenced_table
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = c.conkey[1] AND a.attrelid = c.conrelid
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND a.attnum = ANY(i.indkey)
      AND i.indkey[0] = a.attnum  -- FK column is leftmost in index
)
ORDER BY pg_relation_size(c.conrelid) DESC;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `CREATE INDEX` blocking writes | `CREATE INDEX CONCURRENTLY` | Available since PostgreSQL 8.2 (2006) | Zero-downtime index creation |
| Separate single-column indexes | Composite indexes matching query patterns | Best practice, no specific change | Fewer indexes, better query coverage |
| Manual index audits | Automated queries from pg_index | Available since pg_stat_user_indexes | Proactive redundancy detection |

**Deprecated/outdated:**
- Using `CREATE INDEX` without `CONCURRENTLY` on production tables (blocks writes for duration of index build)
- Creating indexes on every foreign key without analyzing query patterns (over-indexing)

## Open Questions

1. **icons_cache TTL Index Need**
   - What we know: The requirement mentions `icons_cache(domain, last_checked_at)` for cache lookups with TTL. Currently, lookups are by `domain` (primary key) and TTL filtering happens in application code.
   - What's unclear: Whether a future bulk cleanup query (`DELETE WHERE last_checked_at < X`) will be added that would benefit from the existing `idx_icons_cache_last_checked` index.
   - Recommendation: The existing `idx_icons_cache_last_checked DESC` index already supports TTL-based range queries. Adding a composite `(domain, last_checked_at)` would be redundant since `domain` is the primary key. No new index needed for icons_cache.

2. **Table Size and Index Effectiveness**
   - What we know: For very small tables, PostgreSQL may choose Seq Scan even with indexes because it's faster.
   - What's unclear: The actual row counts in sections and groups tables for typical PinGrid deployments.
   - Recommendation: Create the indexes anyway. They have minimal overhead on small tables and will become beneficial as the user base grows. PostgreSQL's query planner will choose Seq Scan when appropriate.

## Sources

### Primary (HIGH confidence)
- [PostgreSQL CREATE INDEX Documentation](https://www.postgresql.org/docs/current/sql-createindex.html) - CONCURRENTLY option, IF NOT EXISTS, index types
- [PostgreSQL Multicolumn Indexes Documentation](https://www.postgresql.org/docs/current/indexes-multicolumn.html) - Leftmost prefix rule, column order importance
- [PostgreSQL EXPLAIN Documentation](https://www.postgresql.org/docs/current/using-explain.html) - Verifying index usage with EXPLAIN ANALYZE
- [PostgreSQL DROP INDEX Documentation](https://www.postgresql.org/docs/current/sql-dropindex.html) - CONCURRENTLY option for drop

### Secondary (MEDIUM confidence)
- [PostgreSQL Wiki: Index Maintenance](https://wiki.postgresql.org/wiki/Index_Maintenance) - Duplicate index detection query
- [CYBERTEC: Foreign Key Indexing](https://www.cybertec-postgresql.com/en/index-your-foreign-key/) - Why and when to index foreign keys
- [Heroku: Efficient Use of PostgreSQL Indexes](https://devcenter.heroku.com/articles/postgresql-indexes) - Composite index best practices
- [Bytebase: CREATE INDEX CONCURRENTLY](https://www.bytebase.com/blog/postgres-create-index-concurrently/) - CONCURRENTLY edge cases and failure handling

### Tertiary (LOW confidence)
- (none -- all findings verified with primary or secondary sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All features are native PostgreSQL DDL with well-documented behavior
- Architecture: HIGH - Index patterns directly derived from analyzing actual queries in codebase models
- Pitfalls: HIGH - All pitfalls documented in official PostgreSQL docs or widely-known PostgreSQL community knowledge

**Research date:** 2026-01-29
**Valid until:** 2026-03-29 (60 days -- PostgreSQL indexing is stable and mature)
