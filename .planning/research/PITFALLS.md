# Domain Pitfalls: Node.js/Express Performance Optimization

**Domain:** Node.js + Express + PostgreSQL performance optimization for PinGrid V2.0
**Researched:** 2026-01-28
**Overall confidence:** HIGH (verified against official docs, community post-mortems, and codebase analysis)

---

## Critical Pitfalls

Mistakes that cause production outages, data loss, or force rewrites.

---

### Pitfall 1: Synchronous Favicon Fetch Blocking Bookmark Creation

**What goes wrong:** The current `createBookmark` method in `bookmarks.service.js` (line 67-74) calls `faviconService.getFavicon(url)` synchronously inside the request handler. This favicon fetch hits up to 5 external APIs sequentially (IconHorse, FaviconExtractor, Google, FaviconIm, DuckDuckGo), each with a 5-second timeout. In the worst case, bookmark creation takes **25+ seconds** before responding to the user, because all 5 APIs time out sequentially.

**Why it happens:** The original design was "fetch favicon before responding." Converting to async (fire-and-forget) seems simple -- just remove `await` -- but that creates multiple hidden failure modes.

**Consequences:**
- Without `await`, the favicon fetch promise runs detached. If it rejects without a `.catch()`, Node.js leaks memory (confirmed Node.js issue #47158: unhandled rejections prevent garbage collection when running with `--unhandled-rejections=warn`).
- Detached promises that acquire database connections (the `cacheFavicon` method in `faviconService.js` line 75 calls `pool.query`) can exhaust the connection pool if many bookmarks are created simultaneously. The favicon fetch holds a pool connection for its cache write, but the main request handler has already released its own connection -- leading to pool contention.
- If the Express process restarts (deploy, crash) while detached favicon fetches are in flight, those fetches silently disappear with no retry mechanism. Users see permanent default icons.

**Prevention strategy:**
1. Always attach `.catch()` to fire-and-forget promises. The pattern is:
   ```javascript
   // WRONG - unhandled rejection, memory leak
   faviconService.getFavicon(url);

   // CORRECT - caught errors, logged
   faviconService.getFavicon(url).catch(err => {
     console.error(`Background favicon fetch failed for ${url}:`, err.message);
   });
   ```
2. Add a timeout wrapper around the entire fire-and-forget operation (not just per-API). Cap total background work at 15 seconds.
3. Return the bookmark immediately with a placeholder/null favicon_url, then update it asynchronously. The frontend should handle `null` favicon gracefully.
4. Track in-flight background tasks so graceful shutdown (`SIGTERM` handler in `server.js` line 49) can wait for them to complete.

**Detection (warning signs):**
- Bookmark creation response times > 2 seconds
- `process.on('unhandledRejection')` firing (already exists at `server.js` line 43, but calls `process.exit(1)` -- this is actually dangerous with fire-and-forget)
- Pool `waitingCount` increasing during bulk bookmark creation

**Maps to task:** Async favicon fetching conversion

**Confidence:** HIGH -- verified against current codebase (`bookmarks.service.js` lines 64-75, `faviconService.js` lines 130-168, `server.js` lines 43-46)

---

### Pitfall 2: CREATE INDEX Locks Table, Blocks All Writes

**What goes wrong:** Running `CREATE INDEX` on existing tables with data acquires a SHARE lock that blocks all INSERT, UPDATE, and DELETE operations for the duration of index creation. For the `bookmarks` table, which already has 4 indexes from migration 005 and 1 from migration 007, adding new indexes with standard `CREATE INDEX` will block all bookmark operations.

**Why it happens:** PostgreSQL's default `CREATE INDEX` must build the index in a single table scan with a consistent snapshot, requiring a SHARE lock. This is safe for empty tables (migrations 005-008 ran on empty tables), but dangerous for tables with data.

**Consequences:**
- All bookmark CRUD operations hang during index creation
- The lock queue effect amplifies damage: even if the index builds in 2 seconds, pending write transactions queue up, and new reads also queue behind those writes, creating a cascading blockage
- For PinGrid's hierarchy (Page -> Section -> Group -> Bookmark), bookmark operations are the most frequent. A 30-second lock on bookmarks effectively means 30 seconds of total application downtime

**Prevention strategy:**
1. **Always use `CREATE INDEX CONCURRENTLY`** for any index added to tables with existing data:
   ```sql
   -- WRONG: blocks writes
   CREATE INDEX idx_bookmarks_domain ON bookmarks(domain);

   -- CORRECT: allows concurrent writes
   CREATE INDEX CONCURRENTLY idx_bookmarks_domain ON bookmarks(domain);
   ```
2. `CONCURRENTLY` cannot run inside a transaction block. Migration scripts that use `BEGIN/COMMIT` wrappers must exclude concurrent index creation.
3. If a concurrent index build fails, it leaves an INVALID index. Check with:
   ```sql
   SELECT * FROM pg_indexes WHERE indexdef LIKE '%INVALID%';
   ```
   Then drop and retry: `DROP INDEX CONCURRENTLY idx_name; CREATE INDEX CONCURRENTLY ...;`
4. Set a `lock_timeout` before index creation as a safety net:
   ```sql
   SET lock_timeout = '5s';
   CREATE INDEX CONCURRENTLY ...;
   ```
5. New indexes should be added in a **separate migration file** from any data modifications, so failures are isolated.

**Detection (warning signs):**
- Migration script hangs during deployment
- Application requests suddenly timeout during migration
- `pg_stat_activity` shows `wait_event_type = 'Lock'` for many connections

**Maps to task:** Database index optimization

**Confidence:** HIGH -- verified against [PostgreSQL 18 CREATE INDEX documentation](https://www.postgresql.org/docs/current/sql-createindex.html)

---

### Pitfall 3: Removing Redis Breaks SIGTERM Graceful Shutdown

**What goes wrong:** The current `server.js` (line 51-53) calls `redisClient.quit()` during SIGTERM handling. If Redis is removed from the stack but this code remains, the shutdown handler crashes or hangs on a stale reference. More subtly, if the Redis config module (`redis.js`) is removed but still `require()`-ed by `server.js` (line 3), the application fails to start entirely.

**Why it happens:** Redis removal is treated as "just delete the code that uses Redis" without tracing all import chains and lifecycle hooks. The mock client in `redis.js` (line 27-33) currently prevents crashes when Redis is unavailable, but if the entire module is deleted, all consumers break.

**Consequences:**
- Application crash on startup if `require('./shared/config/redis')` fails
- Graceful shutdown fails, causing in-flight requests to be dropped during deployments
- Docker health checks may pass (via `/health` endpoint) while the Redis connection error silently logs on startup, masking the issue

**Prevention strategy:**
1. **Map all Redis import paths before removal.** Currently Redis is imported in:
   - `server.js` line 3 (SIGTERM handler)
   - `redis.js` itself (the config module)
   - Potentially any other module importing from `shared/config/redis`
2. Remove references in this order:
   a. Replace Redis usage with PostgreSQL cache equivalent
   b. Update `server.js` SIGTERM handler to remove `redisClient.quit()`
   c. Remove `redis.js` config file
   d. Remove `redis` from `package.json` dependencies
   e. Update `docker-compose.yml` to remove Redis service
3. Search the entire codebase for `redis` (case-insensitive) before declaring removal complete.
4. Update environment documentation (`.env.example`, `CLAUDE.md`, `README.md`) to remove Redis references.

**Detection (warning signs):**
- Application crash on startup with `MODULE_NOT_FOUND` error
- SIGTERM handler errors in logs during deployment
- Docker Compose still starting a Redis container nobody connects to

**Maps to task:** Redis removal / PostgreSQL cache migration

**Confidence:** HIGH -- verified against current codebase (`server.js` lines 3, 51-53; `redis.js` full file)

---

### Pitfall 4: PostgreSQL Connection Pool Exhaustion During Background Tasks

**What goes wrong:** The current pool is configured with `max: 20` connections (`database.js` line 10). When synchronous favicon fetching is converted to async fire-and-forget, each background favicon fetch uses a pool connection for its cache write (`cacheFavicon` in `faviconService.js`). If a user bulk-creates 20+ bookmarks rapidly (e.g., import feature), all 20 pool connections are consumed by background favicon fetches, and the main request handlers cannot get a connection. All subsequent requests timeout at `connectionTimeoutMillis: 2000` (2 seconds).

**Why it happens:** The pool `max: 20` setting was appropriate when each request used 1 connection synchronously. With background tasks running concurrently, effective connection demand doubles: N connections for request handlers + N connections for background tasks.

**Consequences:**
- `connectionTimeoutMillis` (2 seconds) causes hard failures -- not slow responses, but **error responses**
- The `pool.on('error')` handler at `database.js` line 22 calls `process.exit(-1)`, meaning a pool error crashes the entire process
- Reorder operations (`reorderColumn`, `reorderPositions` in `bookmarks.model.js`) already use `pool.connect()` explicitly for transactions, consuming dedicated connections. Combined with background tasks, pool exhaustion risk is high.

**Prevention strategy:**
1. **Limit background task concurrency.** Use a simple semaphore or queue:
   ```javascript
   const MAX_CONCURRENT_FAVICON_FETCHES = 5;
   let activeFetches = 0;
   const fetchQueue = [];

   async function queuedFaviconFetch(url) {
     if (activeFetches >= MAX_CONCURRENT_FAVICON_FETCHES) {
       await new Promise(resolve => fetchQueue.push(resolve));
     }
     activeFetches++;
     try {
       return await faviconService.getFavicon(url);
     } finally {
       activeFetches--;
       if (fetchQueue.length > 0) fetchQueue.shift()();
     }
   }
   ```
2. **Do NOT increase pool max blindly.** Each PostgreSQL connection uses ~10MB of server memory. With max=20, that is 200MB. Doubling to 40 means 400MB. Instead, limit concurrency of background tasks.
3. **Remove `process.exit(-1)` from pool error handler.** An idle client error should log and recover, not crash the process. The current handler (`database.js` line 22-24) is dangerous:
   ```javascript
   // CURRENT (dangerous):
   pool.on('error', (err) => {
     console.error('Unexpected error on idle client', err);
     process.exit(-1);  // kills entire process!
   });

   // BETTER:
   pool.on('error', (err) => {
     console.error('Unexpected error on idle client', err);
     // Don't exit -- the pool will remove this client and create a new one
   });
   ```
4. **Monitor pool health.** Add a `/health` endpoint check:
   ```javascript
   app.get('/health', (req, res) => {
     res.json({
       pool: {
         total: pool.totalCount,
         idle: pool.idleCount,
         waiting: pool.waitingCount
       }
     });
   });
   ```

**Detection (warning signs):**
- `pool.waitingCount > 0` consistently
- Requests timing out with connection timeout errors
- Process crashes from pool error handler

**Maps to task:** Connection pool tuning + Async favicon fetching

**Confidence:** HIGH -- verified against current codebase (`database.js` lines 4-25, `bookmarks.model.js` lines 179-211)

---

## Moderate Pitfalls

Mistakes that cause delays, regressions, or technical debt.

---

### Pitfall 5: Pagination Breaking Existing Frontend Clients

**What goes wrong:** Adding pagination to existing endpoints (e.g., `GET /api/bookmarks?groupId=UUID`) changes the response shape. The current response wraps data in `{ success: true, data: [...bookmarks] }` (array directly in data). Pagination requires metadata: `{ success: true, data: { items: [...], page: 1, totalPages: 5, totalCount: 47 } }`. Every frontend component consuming these endpoints breaks.

**Why it happens:** PinGrid's current API already uses a response envelope (`{ success, data, message, timestamp }`) which is good, but the `data` field contains a raw array for list endpoints. Changing `data` from an array to an object is a breaking change for every `data.map()`, `data.length`, and `data.forEach()` call in the frontend.

**Consequences:**
- Frontend crashes with `data.map is not a function` (because data is now an object, not an array)
- The search store (`searchStore.js`) iterates over bookmarks from multiple stores -- if any store changes its response shape, search breaks silently
- Zustand stores (`bookmarksStore`, `groupsStore`, etc.) parse API responses directly -- all need updating simultaneously

**Prevention strategy:**
1. **Make pagination opt-in, not default.** Endpoints without `?page=` or `?limit=` should return all results in the current format. Only when pagination params are present should the response shape change:
   ```javascript
   // No pagination params: backward compatible
   GET /api/bookmarks?groupId=xxx
   // Returns: { success: true, data: [...bookmarks] }

   // With pagination params: new shape
   GET /api/bookmarks?groupId=xxx&page=1&limit=20
   // Returns: { success: true, data: { items: [...], page: 1, totalPages: 3, total: 47 } }
   ```
2. **Update frontend and backend in the same commit/deployment.** Since both live in the same repo, coordinate changes.
3. **Start pagination on endpoints that genuinely need it.** For PinGrid's hierarchy, bookmarks within a single group rarely exceed 50. Pagination is most valuable for:
   - `GET /api/bookmarks/top-used` (across all groups)
   - Search results (future backend search endpoint)
   - NOT for `GET /api/bookmarks?groupId=` (small per-group counts)

**Detection (warning signs):**
- Frontend rendering errors after API deployment
- `TypeError: data.map is not a function` in browser console
- Empty bookmark grids with no error displayed

**Maps to task:** API pagination implementation

**Confidence:** HIGH -- verified against current API response format in controllers and frontend stores

---

### Pitfall 6: UNLOGGED Table Cache Data Lost on PostgreSQL Crash

**What goes wrong:** When replacing Redis with PostgreSQL for the `icons_cache` table, using an UNLOGGED table for performance means all cached favicon URLs are lost if PostgreSQL crashes or restarts. After a crash, every bookmark displays a broken favicon image or default icon until the cache is rebuilt.

**Why it happens:** UNLOGGED tables skip WAL (Write-Ahead Logging), which is what makes them fast for writes (roughly 2x faster). But WAL is also what enables crash recovery. The `icons_cache` table currently uses a regular (logged) table, so converting to UNLOGGED is a conscious performance optimization that introduces this risk.

**Consequences:**
- After PostgreSQL restart, all favicons revert to default icons
- Users see a degraded experience until favicons are re-fetched
- If the application tries to bulk-refetch all favicons at startup, it creates a thundering herd of external API calls
- The existing `icons_cache` table already has data -- converting it to UNLOGGED requires `ALTER TABLE ... SET UNLOGGED` (PostgreSQL 15+), which takes an ACCESS EXCLUSIVE lock

**Prevention strategy:**
1. **Keep `icons_cache` as a regular (LOGGED) table.** The write volume for favicon caching is low (only on new bookmark creation or 30-day refresh). The performance difference between logged and unlogged is negligible at this scale. UNLOGGED tables are justified for high-write caches (sessions, rate-limiting counters) -- not for favicon URL caches that change infrequently.
2. If UNLOGGED is chosen anyway, implement a **lazy rebuild strategy** rather than bulk rebuild:
   - When a bookmark is rendered and its favicon_url points to a cached entry that no longer exists, trigger a background re-fetch for that single domain
   - Do NOT attempt to re-fetch all cached favicons at startup
3. Add a `WHERE expires_at > NOW()` filter to cache reads, so stale entries are never served even if they survive a restart.

**Detection (warning signs):**
- All favicons showing default icon after a deploy/restart
- Spike in external API calls after PostgreSQL restart
- Error logs showing "cached favicon not found" for all domains

**Maps to task:** Redis removal / PostgreSQL cache migration

**Confidence:** MEDIUM -- based on community reports and PostgreSQL documentation; PinGrid's actual cache write volume is low enough that this pitfall may not warrant UNLOGGED tables at all

---

### Pitfall 7: Cache TTL Cleanup Without pg_cron

**What goes wrong:** The current `icons_cache` table has a `last_checked_at` column and `shouldRefresh()` method (30-day TTL check in `faviconService.js` line 113-122), but no mechanism to actually delete expired entries. Without Redis's built-in EXPIRE/TTL, stale cache entries accumulate indefinitely, consuming disk space and potentially serving outdated favicon URLs.

**Why it happens:** Redis handles TTL natively. PostgreSQL doesn't. When removing Redis, developers add a `last_checked_at` column but forget to implement the cleanup mechanism.

**Consequences:**
- `icons_cache` table grows without bound (one row per unique domain, but still)
- Stale favicon URLs served if the `shouldRefresh` check is skipped or buggy
- No automatic eviction -- unlike Redis, PostgreSQL won't auto-delete old entries

**Prevention strategy:**
1. **Application-level cleanup with setInterval** (simplest for PinGrid's scale):
   ```javascript
   // Run every 24 hours
   setInterval(async () => {
     try {
       const result = await pool.query(
         "DELETE FROM icons_cache WHERE last_checked_at < NOW() - INTERVAL '30 days'"
       );
       console.log(`Cache cleanup: removed ${result.rowCount} expired entries`);
     } catch (err) {
       console.error('Cache cleanup failed:', err.message);
     }
   }, 24 * 60 * 60 * 1000);
   ```
2. **Lazy expiration at read time** (already partially implemented in `shouldRefresh`):
   - Current code checks `shouldRefresh` but only triggers a re-fetch, doesn't delete the old entry
   - Ensure the `ON CONFLICT ... DO UPDATE` in `cacheFavicon` overwrites stale entries
3. For PinGrid's scale (hundreds to low thousands of cached domains), a daily cleanup is sufficient. Do NOT over-engineer with partitioned tables or `pg_cron`.

**Detection (warning signs):**
- `icons_cache` row count growing monotonically (never decreasing)
- `last_checked_at` timestamps older than 60+ days in the table
- Favicons displaying outdated icons for sites that changed their branding

**Maps to task:** Redis removal / PostgreSQL cache migration

**Confidence:** HIGH -- verified against current codebase (`faviconService.js` lines 47-106, 113-122)

---

### Pitfall 8: Reorder Transactions Leak Connections on Partial Failure

**What goes wrong:** The `reorderColumn` and `reorderPositions` methods in `bookmarks.model.js` use `pool.connect()` with `try/catch/finally` for transactions. However, after the `COMMIT`, a second query runs on the same client (lines 196-202) to fetch results. If this post-commit query fails, the error propagates but the client has already been released in `finally`. This is correct. BUT -- if `pool.connect()` itself throws (pool exhausted), the `finally` block calls `client.release()` on an undefined client, throwing a secondary error that masks the original.

**Why it happens:** The pattern `const client = await pool.connect()` is outside the try block. If pool.connect fails, `client` is undefined, and `finally { client.release() }` throws `TypeError: Cannot read property 'release' of undefined`.

**Consequences:**
- The original "pool exhausted" error is masked by the TypeError
- Error logs show misleading `TypeError` instead of the real `TimeoutError`
- Debugging becomes difficult because the root cause is hidden

**Prevention strategy:**
1. Initialize `client` as `null` and guard the release:
   ```javascript
   let client = null;
   try {
     client = await pool.connect();
     await client.query('BEGIN');
     // ... work ...
     await client.query('COMMIT');
   } catch (error) {
     if (client) await client.query('ROLLBACK').catch(() => {});
     throw error;
   } finally {
     if (client) client.release();
   }
   ```
2. This pattern should be applied to all 3 transaction blocks in the codebase:
   - `bookmarks.model.js` `reorderColumn` (line 180)
   - `bookmarks.model.js` `reorderPositions` (line 221)
   - `pages.model.js` `reorderPositions` (line 159)

**Detection (warning signs):**
- TypeError in error logs when pool is under stress
- Reorder operations failing with unhelpful error messages
- Pool connections not being returned after errors

**Maps to task:** Connection pool tuning

**Confidence:** HIGH -- verified against current codebase (`bookmarks.model.js` lines 179-211, 220-252; `pages.model.js` lines 157-182)

---

### Pitfall 9: Adding Indexes to Columns Already Indexed Differently

**What goes wrong:** The bookmarks table already has 5 indexes from migrations 005 and 007:
- `idx_bookmarks_group_position` on `(group_id, position)` -- from 005
- `idx_bookmarks_user` on `(user_id)` -- from 005
- `idx_bookmarks_visit_count` on `(visit_count DESC)` -- from 005
- `idx_bookmarks_url` on `(url)` -- from 005
- `idx_bookmarks_group_column` on `(group_id, "column", position)` -- from 007

Adding new indexes without reviewing existing ones leads to redundant indexes. For example, `idx_bookmarks_group_position` on `(group_id, position)` is already covered by `idx_bookmarks_group_column` on `(group_id, "column", position)` for queries that filter on `group_id` (the leading column). The old index is now partially redundant.

**Why it happens:** Each migration is written independently without reviewing the cumulative index set. Over time, indexes overlap, consuming disk space and slowing write operations (every INSERT/UPDATE/DELETE must update all indexes).

**Consequences:**
- Each redundant index slows every write operation proportionally
- Disk space wasted on duplicate index data
- PostgreSQL query planner may choose suboptimal indexes when multiple candidates exist
- More indexes = longer `VACUUM` and `ANALYZE` operations

**Prevention strategy:**
1. **Audit existing indexes before adding new ones:**
   ```sql
   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'bookmarks';
   ```
2. Consider dropping `idx_bookmarks_group_position` since `idx_bookmarks_group_column` covers all queries that filter by `group_id` (and most queries now also filter by `column`).
3. For any new index, verify it is actually used by running `EXPLAIN ANALYZE` on the target query first.
4. After adding/removing indexes, run `ANALYZE bookmarks;` to update statistics.

**Detection (warning signs):**
- Multiple indexes with the same leading column(s)
- `pg_stat_user_indexes` showing indexes with `idx_scan = 0` (never used)
- Write performance degrading as more indexes are added

**Maps to task:** Database index optimization

**Confidence:** HIGH -- verified against migration files 005, 007

---

## Minor Pitfalls

Mistakes that cause annoyance or minor technical debt.

---

### Pitfall 10: Search Store N+1 Query Problem Worsened by Pagination

**What goes wrong:** The current `searchStore.js` (lines 71-133) iterates through all pages, then all sections per page, then all groups per section, then all bookmarks per group -- making individual API calls for each level. This is already an N+1 problem. If pagination is added to the bookmarks endpoint, search would need to make even MORE requests (multiple pages per group).

**Why it happens:** There is no backend search endpoint. Search is done entirely client-side by loading all data into Zustand stores. The comment at line 69 acknowledges this: "Only searches in bookmarks that are already loaded in memory."

**Consequences:**
- Search with 10 pages x 5 sections x 3 groups = 150 API calls minimum
- Adding pagination multiplies this further
- Users experience multi-second delays when searching

**Prevention strategy:**
1. **Build a backend search endpoint** before or alongside pagination:
   ```sql
   SELECT b.*, g.name as group_name, s.name as section_name, p.name as page_name
   FROM bookmarks b
   JOIN groups g ON b.group_id = g.id
   JOIN sections s ON g.section_id = s.id
   JOIN pages p ON s.page_id = p.id
   WHERE p.user_id = $1
     AND (b.title ILIKE $2 OR b.url ILIKE $2)
   ORDER BY b.visit_count DESC
   LIMIT 50;
   ```
2. Add a PostgreSQL GIN/trigram index for fast text search:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX CONCURRENTLY idx_bookmarks_title_trgm ON bookmarks USING gin (title gin_trgm_ops);
   CREATE INDEX CONCURRENTLY idx_bookmarks_url_trgm ON bookmarks USING gin (url gin_trgm_ops);
   ```
3. Keep the client-side search as a fallback for already-loaded data, but prefer the backend endpoint for global search.

**Detection (warning signs):**
- Search taking > 2 seconds
- Network tab showing dozens of API calls during search
- Frontend memory usage growing as search loads all bookmarks

**Maps to task:** API pagination / Backend search endpoint (future)

**Confidence:** HIGH -- verified against `searchStore.js` and absence of backend search endpoint

---

### Pitfall 11: Missing Pagination Defaults Cause Full Table Scan

**What goes wrong:** If a paginated endpoint is called without explicit `limit` parameter and the default is too high (or missing), PostgreSQL returns all rows. For `getTopUsed` (currently capped at 100 in `bookmarks.service.js` line 317), this is safe. But if new paginated endpoints forget to set a default limit, a single API call could return thousands of rows.

**Why it happens:** Developers add `LIMIT $1` to queries but forget to validate/default the limit parameter in the controller or service layer.

**Prevention strategy:**
1. **Set sensible defaults at the middleware/controller level:**
   ```javascript
   const page = Math.max(1, parseInt(req.query.page) || 1);
   const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
   const offset = (page - 1) * limit;
   ```
2. Always cap maximum page size (e.g., 100) even if the client requests more.
3. Add input validation as middleware, not in each controller.

**Detection (warning signs):**
- API responses containing hundreds/thousands of items
- Slow response times on list endpoints
- PostgreSQL `seq_scan` counts increasing on large tables

**Maps to task:** API pagination implementation

**Confidence:** HIGH -- general best practice, verified against existing pattern in `bookmarks.service.js` line 317

---

### Pitfall 12: pool.on('error') Causing Process Exit

**What goes wrong:** The current `database.js` (line 22-24) calls `process.exit(-1)` when a pool error occurs. Pool errors include transient issues like a PostgreSQL server restart, network blip, or idle connection timeout. Crashing the entire Node.js process for a transient pool error is overly aggressive.

**Why it happens:** The error handler was copied from a template that treats any database error as fatal. For an application with background tasks and graceful degradation, this is inappropriate.

**Consequences:**
- A single idle connection timeout crashes the entire application
- During PostgreSQL maintenance windows, every minor connection hiccup kills the process
- Combined with fire-and-forget background tasks, pool errors become more frequent, making crashes more likely

**Prevention strategy:**
1. Log the error but do NOT exit:
   ```javascript
   pool.on('error', (err) => {
     console.error('Unexpected error on idle client:', err.message);
     // Pool automatically removes the errored client and creates a new one
   });
   ```
2. Only exit for truly fatal errors (e.g., authentication failure on ALL connection attempts).
3. Add health check monitoring that detects sustained pool errors and alerts.

**Detection (warning signs):**
- Application restarts in Docker/process manager logs
- Intermittent downtime correlated with PostgreSQL maintenance
- `process.exit` in pool error handler code

**Maps to task:** Connection pool tuning

**Confidence:** HIGH -- verified against `database.js` lines 20-24

---

## Phase-Specific Warnings

Summary table mapping pitfalls to specific optimization tasks:

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| **Async favicon fetching** | Unhandled rejection memory leaks (#1) | CRITICAL | Always `.catch()` fire-and-forget promises |
| **Async favicon fetching** | Pool exhaustion from concurrent fetches (#4) | CRITICAL | Limit concurrent background tasks to 5 |
| **Redis removal** | Broken import chain / SIGTERM handler (#3) | CRITICAL | Map all Redis references before deletion |
| **Redis removal** | No cache TTL cleanup mechanism (#7) | MODERATE | Add setInterval-based cleanup |
| **Redis removal** | UNLOGGED table data loss on crash (#6) | MODERATE | Keep icons_cache as LOGGED table |
| **Database indexing** | CREATE INDEX locks writes (#2) | CRITICAL | Always use `CREATE INDEX CONCURRENTLY` |
| **Database indexing** | Redundant overlapping indexes (#9) | MODERATE | Audit existing indexes before adding new ones |
| **Pagination** | Breaking frontend API contracts (#5) | MODERATE | Make pagination opt-in via query params |
| **Pagination** | Search N+1 problem worsened (#10) | MINOR | Build backend search endpoint |
| **Pagination** | Missing default limits (#11) | MINOR | Always default and cap limit parameter |
| **Pool tuning** | process.exit on transient errors (#12) | MODERATE | Remove process.exit from pool error handler |
| **Pool tuning** | Transaction connection leak on failure (#8) | MODERATE | Guard client.release() with null check |

## Recommended Task Ordering (Based on Pitfall Dependencies)

1. **Pool tuning first** -- Fix `process.exit(-1)` in pool error handler and transaction patterns. These are prerequisites for safe background task execution.
2. **Redis removal second** -- Replace Redis with PostgreSQL cache, trace all import chains, add TTL cleanup. Must be complete before async favicon work can use the new cache.
3. **Async favicon fetching third** -- Convert to fire-and-forget with proper error handling and concurrency limits. Depends on pool tuning and cache migration being done.
4. **Database indexing fourth** -- Audit existing indexes, add new ones with `CONCURRENTLY`. Can run independently but benefits from stable pool configuration.
5. **Pagination last** -- Least urgent for PinGrid's current scale. Focus on making it opt-in to avoid breaking changes.

---

## Sources

**Official Documentation:**
- [PostgreSQL CREATE INDEX Documentation](https://www.postgresql.org/docs/current/sql-createindex.html) -- CONCURRENTLY option, lock behavior
- [PostgreSQL Index Locking Considerations](https://www.postgresql.org/docs/current/index-locking.html) -- Lock types during index operations
- [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) -- SHARE lock vs SHARE UPDATE EXCLUSIVE
- [node-postgres Pool API](https://node-postgres.com/apis/pool) -- Pool configuration, release patterns
- [node-postgres Transactions](https://node-postgres.com/features/transactions) -- Transaction + client.release() pattern
- [node-postgres Pooling](https://node-postgres.com/features/pooling) -- Pool best practices

**Community Research (MEDIUM confidence):**
- [PostgreSQL Performance Tuning for Node.js (2025)](https://medium.com/@deval93/postgresql-performance-nodejs-part-1-32c347e98189) -- Pool tuning patterns
- [We Removed Redis - authentik (2025)](https://goauthentik.io/blog/2025-11-13-we-removed-redis/) -- Real-world Redis removal case study
- [I Replaced Redis with PostgreSQL (And It's Faster)](https://dev.to/polliog/i-replaced-redis-with-postgresql-and-its-faster-4942) -- PostgreSQL UNLOGGED table caching patterns
- [Redis is fast - I'll cache in Postgres (2025)](https://dizzy.zone/2025/09/24/Redis-is-fast-Ill-cache-in-Postgres/) -- Honest assessment of PostgreSQL vs Redis tradeoffs
- [PostgreSQL as a Cache (Martin Heinz)](https://martinheinz.dev/blog/105) -- UNLOGGED tables, TTL strategies
- [Analyze Fire-and-Forget in Node.js](https://medium.com/@onu.khatri/analyze-the-fire-forget-in-nodejs-7a60f91628ec) -- Background task patterns
- [Node.js Memory Leak from Unhandled Rejections (Issue #47158)](https://github.com/nodejs/node/issues/47158) -- Confirmed memory leak behavior
- [Express.js Common Mistakes](https://pguso.medium.com/express-js-10-common-mistakes-with-optimized-solutions-0090794fee08) -- Async error handling patterns
- [How to Prevent Table Lock in Postgres](https://blog.thnkandgrow.com/how-to-prevent-table-lock-when-add-drop-index-in-postgres/) -- CONCURRENTLY patterns
- [API Pagination Best Practices 2026](https://www.merge.dev/blog/api-pagination-best-practices) -- Breaking change avoidance
- [Avoiding Breaking Changes in APIs](https://medium.com/@breako/avoiding-breaking-changes-in-apis-lessons-from-the-field-ffe43d451cf3) -- Response envelope patterns
