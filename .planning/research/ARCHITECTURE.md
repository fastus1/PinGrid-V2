# Architecture Patterns: PostgreSQL Performance Optimization

**Project:** PinGrid V2.0
**Domain:** PostgreSQL performance for hierarchical bookmark manager
**Researched:** 2026-01-28
**Overall Confidence:** HIGH (based on codebase analysis + PostgreSQL official documentation + node-postgres docs)

---

## 1. Current State Analysis

### Schema Summary (from migrations 001-008)

```
users (PK: id UUID)
  |-- idx_users_email ON users(email)
  |
  +-> pages (PK: id UUID, FK: user_id -> users)
  |     |-- idx_pages_user_position ON pages(user_id, position)
  |     |-- idx_pages_user_name ON pages(user_id, LOWER(name))  [UNIQUE]
  |     |
  |     +-> sections (PK: id UUID, FK: page_id -> pages)
  |           |-- idx_sections_page_position ON sections(page_id, position)
  |           |-- idx_sections_page_name ON sections(page_id, LOWER(name))  [UNIQUE]
  |           |
  |           +-> groups (PK: id UUID, FK: section_id -> sections)
  |                 |-- idx_groups_section_position ON groups(section_id, position)
  |                 |-- idx_groups_section_name ON groups(section_id, LOWER(name))  [UNIQUE]
  |                 |
  |                 +-> bookmarks (PK: id UUID, FK: group_id -> groups, FK: user_id -> users)
  |                       |-- idx_bookmarks_group_position ON bookmarks(group_id, position)
  |                       |-- idx_bookmarks_group_column ON bookmarks(group_id, "column", position)
  |                       |-- idx_bookmarks_user ON bookmarks(user_id)
  |                       |-- idx_bookmarks_visit_count ON bookmarks(visit_count DESC)
  |                       |-- idx_bookmarks_url ON bookmarks(url)

icons_cache (PK: domain VARCHAR(255))
  |-- idx_icons_cache_last_checked ON icons_cache(last_checked_at DESC)
```

### Existing Indexes: What Already Works

The migration files already include reasonable composite indexes for the parent-child position lookups:
- `(user_id, position)` on pages -- correct for fetching a user's pages in order
- `(page_id, position)` on sections -- correct for fetching a page's sections
- `(section_id, position)` on groups -- correct for fetching a section's groups
- `(group_id, position)` and `(group_id, "column", position)` on bookmarks -- correct for fetching a group's bookmarks

### Critical Problem: N+1 Query Waterfall

The frontend loads a page by cascading through 4 levels of API calls:

```
1. GET /api/pages                    -> fetches user's pages
2. GET /api/sections?pageId=X        -> fetches sections for selected page
3. GET /api/groups?sectionId=Y       -> fetches groups for EACH section (N calls)
4. GET /api/bookmarks?groupId=Z      -> fetches bookmarks for EACH group (M calls per section)
```

For a page with 3 sections, 3 groups each, this produces:
- 1 (pages) + 1 (sections) + 3 (groups per section) + 9 (bookmarks per group) = **14 queries**

Each ownership verification query adds more: `verifyGroupOwnership` does a 3-table JOIN (groups -> sections -> pages) for every bookmark operation. `findById` for bookmarks does a 4-table JOIN (bookmarks -> groups -> sections -> pages).

### Current Connection Pool

```javascript
// backend/src/shared/config/database.js
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

Missing: `statement_timeout`, `min`, `maxLifetimeSeconds`. The `max: 20` is a reasonable starting value but has no documented rationale.

### Icons Cache: Underutilized

The `faviconService.js` already implements cache-first lookup with a 30-day TTL via `shouldRefresh()`. However:
- No TTL is enforced at the SQL level (relies on application-side check)
- No background refresh (blocks the bookmark creation request)
- No batch operations for bulk favicon fetching

---

## 2. Recommended Architecture Changes

### Phase 1: Index Optimization (Zero-Downtime, Read-Only Changes)

These indexes target actual query patterns found in the model files. All can be added with `CREATE INDEX CONCURRENTLY` to avoid locking.

**Confidence: HIGH** -- Based on direct analysis of actual SQL queries in the model files.

#### 2.1 Missing Indexes for Ownership Verification Joins

Every mutation on bookmarks, groups, and sections runs an ownership verification query that joins up the hierarchy to check `pages.user_id`. These JOINs currently rely only on primary keys for the intermediate tables. Adding explicit foreign key indexes ensures the planner can do efficient nested loop joins.

```sql
-- Migration 009: Performance indexes

-- =========================================================
-- OWNERSHIP VERIFICATION INDEXES
-- =========================================================
-- The verifyGroupOwnership query (bookmarks.model.js line 16-24):
--   SELECT g.id FROM groups g
--   INNER JOIN sections s ON g.section_id = s.id
--   INNER JOIN pages p ON s.page_id = p.id
--   WHERE g.id = $1 AND p.user_id = $2
--
-- g.id is covered by PK. s.id is covered by PK. p.id is covered by PK.
-- p.user_id is covered by idx_pages_user_position.
-- g.section_id needs an index for the JOIN lookup direction.
-- s.page_id needs an index for the JOIN lookup direction.
--
-- NOTE: PostgreSQL does NOT automatically create indexes on foreign key columns.
-- The FK constraint only ensures referential integrity, not query performance.

-- sections.page_id: used in every section->page ownership join
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_page_id
  ON sections(page_id);

-- groups.section_id: used in every group->section ownership join
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_section_id
  ON groups(section_id);

-- bookmarks.group_id: used in every bookmark->group ownership join
-- NOTE: idx_bookmarks_group_position already covers (group_id, position)
-- but a plain group_id index is more efficient for pure FK lookups
-- that don't filter on position. The existing composite index CAN
-- serve as a group_id index (leftmost prefix), so this is OPTIONAL.
-- Skipping this one -- the composite index handles it.
```

**Rationale:** PostgreSQL foreign keys do NOT create indexes automatically. The composite indexes `(page_id, position)` and `(section_id, position)` already exist, and PostgreSQL can use a composite index for lookups on the leftmost column(s). So `idx_sections_page_position` already covers `page_id` lookups. However, the standalone FK indexes are smaller and more cache-friendly for pure join operations that don't need position. The benefit is marginal when the composite index is already present.

**Verdict: The existing composite indexes already serve as FK indexes.** The explicit FK indexes above are optional -- add them only if EXPLAIN ANALYZE shows sequential scans on the ownership verification queries with a meaningful data set (100+ rows per table).

#### 2.2 Indexes for "Top Used" Bookmarks Query

```sql
-- bookmarks.model.js getTopUsed (line 291-305):
--   SELECT b.* FROM bookmarks b
--   INNER JOIN groups g ON b.group_id = g.id
--   INNER JOIN sections s ON g.section_id = s.id
--   INNER JOIN pages p ON s.page_id = p.id
--   WHERE p.user_id = $1
--   ORDER BY b.visit_count DESC, b.created_at DESC
--   LIMIT $2
--
-- Current idx_bookmarks_visit_count is ON (visit_count DESC) globally.
-- This cannot help because the query filters by user_id first.
-- The planner must join all 4 tables, filter by user_id, then sort.

-- Composite index for user's bookmarks sorted by visit_count
-- This replaces the global visit_count index with a user-scoped one.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_user_visits
  ON bookmarks(user_id, visit_count DESC, created_at DESC);

-- The existing idx_bookmarks_visit_count (global, all users) is now redundant
-- for the primary use case. Consider dropping it after verifying no other
-- queries use a global visit_count sort:
-- DROP INDEX IF EXISTS idx_bookmarks_visit_count;
```

**Rationale:** The existing `idx_bookmarks_visit_count` on `(visit_count DESC)` covers all users globally. But the `getTopUsed` query always filters by `user_id` first, meaning PostgreSQL cannot use the visit_count index to avoid a sort -- it must join 4 tables to find the user's bookmarks, then sort. The composite index `(user_id, visit_count DESC, created_at DESC)` allows PostgreSQL to seek directly to the user's bookmarks already sorted by visit count.

#### 2.3 Index for URL-Based Lookups

```sql
-- bookmarks.model.js findByUrl (line 103-112):
--   SELECT * FROM bookmarks WHERE group_id = $1 AND url = $2
--
-- Current idx_bookmarks_url is ON (url) alone.
-- This query filters by group_id AND url. A composite index is better.
-- However, this function is currently commented out in the service.
-- Keep the existing url index for now; revisit when URL deduplication is enabled.
```

**Verdict: No change needed.** The `findByUrl` method exists but is not called (commented out in `bookmarks.service.js` line 58). The global URL index is useful for search features if added later.

#### 2.4 Partial Index for Icons Cache TTL

```sql
-- faviconService.js getCachedFavicon (line 47-63):
--   SELECT * FROM icons_cache WHERE domain = $1
--   (Then checks shouldRefresh in application code)
--
-- The domain column is already the PRIMARY KEY, so lookups are O(log n).
-- No additional index needed for the primary lookup.
--
-- BUT: for a future cleanup job that expires old cache entries:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_icons_cache_stale
  ON icons_cache(last_checked_at)
  WHERE last_checked_at < NOW() - INTERVAL '30 days';
```

**Note:** This partial index is small (only stale entries) and useful for a background cleanup job. However, the `WHERE` clause with `NOW()` makes this a static partial index that won't dynamically update its boundary. A better approach is a plain `last_checked_at` index (which already exists as `idx_icons_cache_last_checked`) and a query with `WHERE last_checked_at < NOW() - INTERVAL '30 days'`.

**Verdict: The existing `idx_icons_cache_last_checked` is sufficient.** Skip the partial index.

#### 2.5 Summary of Index Changes

```sql
-- =========================================================
-- MIGRATION 009: Performance Indexes
-- =========================================================
-- Only add indexes that address verified query patterns.
-- Run with CONCURRENTLY to avoid table locks.

-- 1. User-scoped top-used bookmarks (replaces global visit_count index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_user_visits
  ON bookmarks(user_id, visit_count DESC, created_at DESC);

-- 2. Optional: Drop the now-redundant global visit_count index
-- Only after confirming no other queries rely on it.
-- DROP INDEX CONCURRENTLY IF EXISTS idx_bookmarks_visit_count;

-- 3. Optional standalone FK indexes (only if EXPLAIN ANALYZE shows need):
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sections_page_id ON sections(page_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_section_id ON groups(section_id);
```

**What we are NOT adding (and why):**
- No GIN indexes: PinGrid does not do full-text search or JSONB queries.
- No BRIN indexes: Tables are small (not millions of rows) and UUIDs are random (not sequential), making BRIN useless.
- No hash indexes: B-tree handles UUID equality lookups well enough. Hash indexes provide marginal gains only at extreme scale.
- No covering indexes: The ownership verification queries already return minimal data (just `g.id` or `s.id`). The overhead of maintaining covering indexes is not justified.

---

### Phase 2: Connection Pool Architecture

**Confidence: HIGH** -- Based on official node-postgres documentation and production best practices.

#### 2.6 Recommended Pool Configuration

```javascript
// backend/src/shared/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pingrid',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  // -- Pool Sizing --
  // PinGrid is a single-instance app (1 Node process).
  // PostgreSQL default max_connections = 100.
  // Reserve 5 for admin tools (psql, pgAdmin, migrations).
  // Reserve 5 for Redis/background tasks.
  // Available for pool: ~90. Single instance -> max: 20 is safe.
  max: 20,

  // Keep 2 warm connections to avoid cold-start latency on first queries
  // after idle periods. Default is 0 (no minimum).
  min: 2,

  // -- Timeouts --
  // Fail fast if pool is exhausted (all 20 in use).
  // 3 seconds: long enough for transient spikes, short enough to unblock
  // the Express request with a 503 error rather than hanging.
  connectionTimeoutMillis: 3000,

  // Close idle connections after 30 seconds.
  // Prevents stale connections from accumulating.
  // Default is 10000ms (10s); 30s is more forgiving for bursty traffic.
  idleTimeoutMillis: 30000,

  // Kill any query running longer than 30 seconds.
  // PinGrid queries should complete in <100ms. A 30s query indicates
  // a bug (missing index, infinite loop, lock contention).
  // This prevents runaway queries from holding connections.
  statement_timeout: 30000,

  // Recycle connections every 30 minutes.
  // Prevents issues with long-lived TCP connections going stale
  // behind load balancers, firewalls, or Docker networks.
  maxLifetimeSeconds: 1800,
});

// -- Error Handling --
pool.on('connect', (client) => {
  if (!isProduction) {
    console.log('DB pool: client connected');
  }
});

pool.on('error', (err, client) => {
  console.error('DB pool: unexpected error on idle client', err);
  // Do NOT process.exit here -- let the pool recover.
  // Only exit on truly unrecoverable errors.
});

// -- Health Check Helper --
pool.healthCheck = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT 1 AS ok');
    return result.rows[0].ok === 1;
  } finally {
    client.release();
  }
};

module.exports = pool;
```

#### 2.7 Pool Sizing Rationale

| Parameter | Current | Recommended | Why |
|-----------|---------|-------------|-----|
| `max` | 20 | 20 | Single Node process, Postgres max_connections ~100. 20 leaves headroom for admin + other tools. |
| `min` | (default 0) | 2 | Keeps 2 warm connections to avoid cold-start on first request after idle. |
| `connectionTimeoutMillis` | 2000 | 3000 | 2s is aggressive; 3s handles Docker network jitter while still failing fast. |
| `idleTimeoutMillis` | 30000 | 30000 | Already correct. Matches recommended range (10-30s). |
| `statement_timeout` | (none) | 30000 | **Critical addition.** Prevents runaway queries from consuming pool connections indefinitely. |
| `maxLifetimeSeconds` | (none) | 1800 | Recycles connections to avoid stale TCP sockets behind Docker/proxy. |

**When to scale beyond 20:** If PinGrid runs multiple Node processes (e.g., PM2 cluster mode with 4 workers), reduce to `max: 5` per worker (5 x 4 = 20 total). Alternatively, add PgBouncer as a connection multiplexer.

---

### Phase 3: Icons Cache Architecture

**Confidence: HIGH** -- Based on direct analysis of `faviconService.js` which already implements the core pattern.

#### 2.8 Current Cache Flow (Already Implemented)

```
getFavicon(url)
  1. extractDomain(url) -> "github.com"
  2. getCachedFavicon("github.com") -> SELECT from icons_cache WHERE domain = $1
  3. If cached AND not expired (< 30 days) -> return cached favicon_url
  4. If not cached OR expired:
     a. Try IconHorse API (5s timeout)
     b. Try FaviconExtractor API (5s timeout)
     c. Try Google Favicon API (5s timeout)
     d. Try FaviconIm API (5s timeout)
     e. Try DuckDuckGo API (5s timeout)
     f. UPSERT result into icons_cache
  5. Return favicon_url
```

This is a solid cache-first pattern. The main problem: **step 4 blocks the bookmark creation request** for up to 25 seconds (5 APIs x 5s timeout each) on cache miss.

#### 2.9 Recommended Cache Improvements

**Improvement A: Decouple favicon fetching from bookmark creation**

```javascript
// In bookmarks.service.js createBookmark:
// Instead of:
//   finalFaviconUrl = await faviconService.getFavicon(url.trim());
// Do:
//   1. Check cache synchronously
//   2. If cache hit -> use it
//   3. If cache miss -> use placeholder, schedule background fetch

async createBookmark(userId, groupId, bookmarkData) {
  const { title, url, description, favicon_url } = bookmarkData;
  // ... validation ...

  let finalFaviconUrl = favicon_url ? favicon_url.trim() : null;

  if (!finalFaviconUrl) {
    // Try cache first (fast, ~1ms)
    const domain = faviconService.extractDomain(url.trim());
    const cached = domain ? await faviconService.getCachedFavicon(domain) : null;

    if (cached && !faviconService.shouldRefresh(cached.last_checked_at)) {
      finalFaviconUrl = cached.favicon_url;
    } else {
      // Use placeholder immediately, fetch in background
      finalFaviconUrl = faviconService.getDefaultIcon();
      // Fire-and-forget background fetch
      faviconService.fetchAndUpdateBookmark(url.trim(), bookmarkId)
        .catch(err => console.error('Background favicon fetch failed:', err.message));
    }
  }

  // ... create bookmark with finalFaviconUrl ...
}
```

**Improvement B: SQL-level TTL check**

Move the TTL check into the SQL query to avoid fetching expired cache entries:

```sql
-- Cache-first lookup with TTL check in one query:
SELECT favicon_url, size, format, last_checked_at
FROM icons_cache
WHERE domain = $1
  AND last_checked_at > NOW() - INTERVAL '30 days';

-- If no rows returned: cache miss or expired. Fetch from APIs.
```

This eliminates the application-level `shouldRefresh()` check and avoids transferring expired data over the wire.

**Improvement C: Background cache cleanup**

```javascript
// Run periodically (e.g., once per hour via setInterval or cron)
async function cleanupStaleCache() {
  const result = await pool.query(
    `DELETE FROM icons_cache
     WHERE last_checked_at < NOW() - INTERVAL '90 days'
     RETURNING domain`
  );
  console.log(`Cleaned ${result.rowCount} stale cache entries`);
}

// Start cleanup on server boot
setInterval(cleanupStaleCache, 60 * 60 * 1000); // every hour
```

**Improvement D: Batch favicon refresh for existing bookmarks**

```javascript
// Find bookmarks with expired or missing favicons
async function findBookmarksNeedingFaviconRefresh(limit = 50) {
  const result = await pool.query(`
    SELECT DISTINCT ON (ic.domain)
      b.id AS bookmark_id,
      b.url,
      ic.domain,
      ic.last_checked_at
    FROM bookmarks b
    LEFT JOIN icons_cache ic ON ic.domain = (
      -- Extract domain from URL (simplified; real extraction in JS)
      SUBSTRING(b.url FROM 'https?://([^/]+)')
    )
    WHERE b.favicon_url IS NULL
       OR b.favicon_url LIKE 'data:image/svg%'  -- default placeholder
       OR ic.last_checked_at IS NULL
       OR ic.last_checked_at < NOW() - INTERVAL '30 days'
    ORDER BY ic.domain, b.created_at DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}
```

---

### Phase 4: N+1 Query Elimination (API-Level Change)

**Confidence: HIGH** -- This is the single biggest performance win available.

#### 2.10 The Problem: Waterfall Loading

Current page load triggers this cascade:

```
Frontend                    Backend                    Database
--------                    -------                    --------
GET /sections?pageId=X  ->  findAllByPage(X)       ->  1 query
  for each section:
  GET /groups?sectionId=Y -> findAllBySection(Y)   ->  N queries (1 per section)
    for each group:
    GET /bookmarks?groupId=Z -> findAllByGroup(Z)  ->  M queries (1 per group)
```

For a page with 4 sections, 3 groups each: 1 + 4 + 12 = **17 HTTP requests and 17+ DB queries**.

#### 2.11 The Solution: Single "Load Page Content" Endpoint

Add a new endpoint that returns the full page hierarchy in one response:

```sql
-- Single query to load entire page content:
SELECT
  s.id AS section_id,
  s.name AS section_name,
  s.position AS section_position,
  s.collapsed AS section_collapsed,
  g.id AS group_id,
  g.name AS group_name,
  g.position AS group_position,
  g.column_count,
  g.group_type,
  g.bookmark_limit,
  g.width AS group_width,
  b.id AS bookmark_id,
  b.title AS bookmark_title,
  b.url AS bookmark_url,
  b.description AS bookmark_description,
  b.position AS bookmark_position,
  b."column" AS bookmark_column,
  b.visit_count,
  b.favicon_url
FROM sections s
INNER JOIN pages p ON s.page_id = p.id
LEFT JOIN groups g ON g.section_id = s.id
LEFT JOIN bookmarks b ON b.group_id = g.id
WHERE s.page_id = $1
  AND p.user_id = $2
ORDER BY
  s.position ASC,
  g.position ASC,
  b."column" ASC,
  b.position ASC;
```

The Express controller transforms flat rows into nested JSON:

```javascript
// GET /api/pages/:pageId/content
async getPageContent(req, res) {
  const { pageId } = req.params;
  const userId = req.userId;

  const result = await pool.query(FULL_PAGE_QUERY, [pageId, userId]);

  // Transform flat rows into nested structure
  const sections = [];
  const sectionMap = new Map();
  const groupMap = new Map();

  for (const row of result.rows) {
    // Build section
    if (!sectionMap.has(row.section_id)) {
      const section = {
        id: row.section_id,
        name: row.section_name,
        position: row.section_position,
        collapsed: row.section_collapsed,
        groups: []
      };
      sectionMap.set(row.section_id, section);
      sections.push(section);
    }

    // Build group (if exists -- LEFT JOIN may produce nulls)
    if (row.group_id && !groupMap.has(row.group_id)) {
      const group = {
        id: row.group_id,
        name: row.group_name,
        position: row.group_position,
        column_count: row.column_count,
        group_type: row.group_type,
        bookmark_limit: row.bookmark_limit,
        width: row.group_width,
        bookmarks: []
      };
      groupMap.set(row.group_id, group);
      sectionMap.get(row.section_id).groups.push(group);
    }

    // Build bookmark (if exists)
    if (row.bookmark_id && row.group_id) {
      groupMap.get(row.group_id).bookmarks.push({
        id: row.bookmark_id,
        title: row.bookmark_title,
        url: row.bookmark_url,
        description: row.bookmark_description,
        position: row.bookmark_position,
        column: row.bookmark_column,
        visit_count: row.visit_count,
        favicon_url: row.favicon_url
      });
    }
  }

  res.json({ success: true, data: { sections }, timestamp: new Date().toISOString() });
}
```

**Performance impact:**
- Before: 17+ HTTP requests, 17+ DB queries, ~200-500ms total
- After: 1 HTTP request, 1 DB query, ~5-20ms total
- Reduction: **95-97% fewer round trips**

**Index support:** The existing composite indexes already support this query:
- `idx_sections_page_position` for the `WHERE s.page_id = $1` + `ORDER BY s.position`
- `idx_groups_section_position` for the `JOIN g ON g.section_id = s.id` + `ORDER BY g.position`
- `idx_bookmarks_group_column` for the `JOIN b ON b.group_id = g.id` + `ORDER BY b."column", b.position`

---

### Phase 5: Background Task Architecture (Without Message Queues)

**Confidence: MEDIUM** -- Standard Node.js patterns, but untested in this specific codebase.

#### 2.12 Simple setInterval-Based Background Tasks

PinGrid does not need a message queue (Redis Bull, RabbitMQ, etc.). The workload is:
- Favicon refresh for expired cache entries (I/O-bound, low frequency)
- Stale cache cleanup (one-shot SQL, very low frequency)

```javascript
// backend/src/shared/tasks/backgroundTasks.js

const faviconService = require('../services/faviconService');
const pool = require('../config/database');

class BackgroundTasks {
  constructor() {
    this.intervals = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Task 1: Clean up stale cache entries (every 6 hours)
    this.intervals.push(
      setInterval(() => this.cleanupStaleCache(), 6 * 60 * 60 * 1000)
    );

    // Task 2: Refresh expired favicons in batches (every 10 minutes)
    this.intervals.push(
      setInterval(() => this.refreshExpiredFavicons(), 10 * 60 * 1000)
    );

    console.log('Background tasks started');
  }

  stop() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.isRunning = false;
    console.log('Background tasks stopped');
  }

  async cleanupStaleCache() {
    try {
      const result = await pool.query(
        `DELETE FROM icons_cache
         WHERE last_checked_at < NOW() - INTERVAL '90 days'
         RETURNING domain`
      );
      if (result.rowCount > 0) {
        console.log(`Background: cleaned ${result.rowCount} stale cache entries`);
      }
    } catch (err) {
      console.error('Background cleanup error:', err.message);
    }
  }

  async refreshExpiredFavicons() {
    try {
      // Find up to 10 expired cache entries
      const expired = await pool.query(
        `SELECT domain FROM icons_cache
         WHERE last_checked_at < NOW() - INTERVAL '30 days'
         ORDER BY last_checked_at ASC
         LIMIT 10`
      );

      for (const row of expired.rows) {
        try {
          await faviconService.fetchFaviconWithFallback(row.domain);
        } catch (err) {
          console.error(`Background refresh failed for ${row.domain}:`, err.message);
        }
        // Rate limit: wait 2 seconds between API calls
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error('Background refresh error:', err.message);
    }
  }
}

module.exports = new BackgroundTasks();
```

Wire it into `server.js`:

```javascript
const backgroundTasks = require('./shared/tasks/backgroundTasks');

async function startServer() {
  await testConnections();
  backgroundTasks.start();

  app.listen(PORT, '0.0.0.0', () => { /* ... */ });
}

process.on('SIGTERM', async () => {
  backgroundTasks.stop();
  await pool.end();
  process.exit(0);
});
```

---

## 3. Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Pool (database.js)** | Connection management, timeouts, health checks | All models |
| **Models (*.model.js)** | SQL queries, parameterized statements | Pool |
| **Services (*.service.js)** | Business logic, validation, orchestration | Models, FaviconService |
| **FaviconService** | Cache-first favicon lookup, external API calls | Pool (icons_cache), external APIs |
| **BackgroundTasks** | Periodic cache cleanup, favicon refresh | Pool, FaviconService |
| **Controllers** | HTTP handling, response formatting | Services |

### Data Flow for Page Load (After Optimization)

```
Browser -> GET /api/pages/:id/content
        -> Controller.getPageContent()
        -> pool.query(FULL_PAGE_QUERY)      -- 1 SQL query, 1 connection
        -> Transform flat rows to nested JSON
        -> Response: { sections: [{ groups: [{ bookmarks: [...] }] }] }
```

### Data Flow for Bookmark Creation (After Optimization)

```
Browser -> POST /api/bookmarks { groupId, title, url }
        -> Controller.create()
        -> Service.createBookmark()
           -> Model.verifyGroupOwnership()   -- 1 query (3-table join)
           -> FaviconService.getCachedFavicon()  -- 1 query (PK lookup, ~1ms)
              -> Cache HIT: use cached favicon
              -> Cache MISS: use placeholder, fire background fetch
           -> Model.create()                 -- 1 query (INSERT)
        -> Response: { bookmark }            -- Total: 3 queries, <10ms
        -> (background) FaviconService.fetchAndUpdateBookmark()
```

---

## 4. Build Order and Dependencies

The phases are ordered by impact-to-effort ratio and dependency chain:

```
Phase 1: Index Optimization
  |-- No dependencies. Can be deployed independently.
  |-- Zero downtime (CONCURRENTLY).
  |-- Estimated impact: 10-30% faster ownership verification queries.
  |
Phase 2: Connection Pool Hardening
  |-- No dependencies. Can be deployed independently.
  |-- Zero downtime (config change + restart).
  |-- Estimated impact: Prevents cascading failures under load.
  |
Phase 3: Icons Cache Improvements
  |-- Depends on: Phase 2 (pool config for statement_timeout).
  |-- Requires: New background task module.
  |-- Estimated impact: Bookmark creation 5-25x faster on cache miss.
  |
Phase 4: N+1 Query Elimination
  |-- Depends on: Phase 1 (indexes support the big JOIN query).
  |-- Requires: New API endpoint + frontend store changes.
  |-- Estimated impact: Page load 10-20x faster (biggest win).
  |-- NOTE: Existing individual endpoints must remain for mutations.
  |         The new endpoint is read-only, additive.
  |
Phase 5: Background Tasks
  |-- Depends on: Phase 3 (cache improvements define what to refresh).
  |-- Requires: New module + server.js integration.
  |-- Estimated impact: Eliminates stale cache entries over time.
```

**Recommended implementation order:** Phase 2 -> Phase 1 -> Phase 4 -> Phase 3 -> Phase 5

**Rationale:**
- Phase 2 first because it is purely defensive (prevents pool exhaustion) and requires only a config change.
- Phase 1 next because indexes are low-risk, zero-downtime, and set up the foundation for Phase 4's JOIN query.
- Phase 4 is the biggest performance win and should come early. It is an additive change (new endpoint, no breaking changes).
- Phase 3 and 5 are quality-of-life improvements that reduce favicon-related latency.

---

## 5. Anti-Patterns to Avoid

### Anti-Pattern 1: Premature Over-Indexing
**What:** Adding indexes on every column "just in case."
**Why bad:** Each index slows down INSERT/UPDATE/DELETE. For a bookmark manager where users frequently reorder items, write performance matters.
**Instead:** Only index columns that appear in WHERE, JOIN ON, and ORDER BY clauses of actual queries. Use EXPLAIN ANALYZE to verify.

### Anti-Pattern 2: SELECT * in JOIN Queries
**What:** Using `SELECT *` in multi-table JOINs.
**Why bad:** Returns duplicate data (e.g., section name repeated for every bookmark in that section), wastes bandwidth and memory.
**Instead:** Select only needed columns with explicit aliases, as shown in the full-page query above.

### Anti-Pattern 3: Individual UPDATE Loops for Reordering
**What:** The current reorder methods (e.g., `reorderPositions`) loop through each ID and run a separate UPDATE.
**Why bad:** For 20 bookmarks, this is 20 individual UPDATE queries inside a transaction.
**Instead:** Use a single UPDATE with `unnest`:

```sql
-- Batch reorder in one query instead of N queries:
UPDATE bookmarks
SET position = data.new_position,
    updated_at = CURRENT_TIMESTAMP
FROM (
  SELECT unnest($1::uuid[]) AS id,
         generate_series(0, array_length($1::uuid[], 1) - 1) AS new_position
) AS data
WHERE bookmarks.id = data.id
  AND bookmarks.group_id = $2;
```

This replaces N queries with 1 query inside the transaction.

### Anti-Pattern 4: Exiting on Pool Errors
**What:** The current code calls `process.exit(-1)` on pool error events.
**Why bad:** A single failed idle connection kills the entire server. The pool can recover from transient errors.
**Instead:** Log the error and let the pool self-heal. Only exit on truly fatal conditions (e.g., database credentials invalid on startup).

---

## 6. Scalability Considerations

| Concern | At 10 users (~500 bookmarks) | At 100 users (~5,000 bookmarks) | At 1,000 users (~50,000 bookmarks) |
|---------|-----|------|------|
| **Query speed** | Fine with current indexes | Phase 4 (single-query load) becomes important | Indexes critical; consider materialized views for "top used" |
| **Pool connections** | max: 20 is overkill | max: 20 is appropriate | Consider PgBouncer or PM2 cluster mode |
| **Favicon cache** | ~300 domains, no issue | ~3,000 domains, no issue | ~15,000 domains; background refresh becomes important |
| **Reorder operations** | N-loop acceptable | Batch UPDATE recommended | Batch UPDATE required |

---

## 7. Sources

- [node-postgres Pool API](https://node-postgres.com/apis/pool) -- Official pool configuration reference (HIGH confidence)
- [node-postgres Pool Sizing Guide](https://node-postgres.com/guides/pool-sizing) -- Official sizing recommendations (HIGH confidence)
- [PostgreSQL 18 Index Types Documentation](https://www.postgresql.org/docs/current/indexes-types.html) -- B-tree, Hash, GIN, GiST official docs (HIGH confidence)
- [PostgreSQL 18 Partial Indexes Documentation](https://www.postgresql.org/docs/current/indexes-partial.html) -- When and how to use partial indexes (HIGH confidence)
- [Heroku: Efficient Use of PostgreSQL Indexes](https://devcenter.heroku.com/articles/postgresql-indexes) -- Practical index guidance (MEDIUM confidence)
- [pganalyze: Benchmarking Multi-Column, Covering and Hash Indexes](https://pganalyze.com/blog/5mins-postgres-benchmarking-indexes) -- Composite vs separate index benchmarks (MEDIUM confidence)
- [CYBERTEC: Unexpected Downsides of UUID Keys](https://www.cybertec-postgresql.com/en/unexpected-downsides-of-uuid-keys-in-postgresql/) -- UUID v4 B-tree cache thrashing (MEDIUM confidence)
- [Crunchy Data: Control Runaway Queries with statement_timeout](https://www.crunchydata.com/blog/control-runaway-postgres-queries-with-statement-timeout) -- statement_timeout best practices (HIGH confidence)
- [Heap: Speeding Up PostgreSQL with Partial Indexes](https://www.heap.io/blog/speeding-up-postgresql-queries-with-partial-indexes) -- Real-world partial index case study (MEDIUM confidence)
- [PlanetScale: N+1 Query Problem](https://planetscale.com/blog/what-is-n-1-query-problem-and-how-to-solve-it) -- N+1 query explanation and solutions (MEDIUM confidence)
- [DEV Community: The N+1 Insert Loop (Dec 2025)](https://dev.to/ofri-peretz/the-n1-insert-loop-that-slowed-our-api-to-a-crawl-4534) -- UNNEST batch pattern for Node.js (MEDIUM confidence)
- PinGrid V2.0 codebase analysis: All migration files, model files, service files, and store files (HIGH confidence -- primary source)
