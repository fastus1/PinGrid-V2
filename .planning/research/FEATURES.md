# Feature Landscape: Performance Optimization

**Domain:** Node.js/Express + PostgreSQL performance optimization for bookmark management app
**Researched:** 2026-01-28
**Scale:** 1,000-10,000 bookmarks per user, single-server deployment

## Current State Analysis

Before listing features, here is what the codebase currently lacks (confirmed by code inspection):

| Gap | Evidence | Impact |
|-----|----------|--------|
| N+1 query waterfall | Frontend makes separate API calls: fetchSections(pageId) -> fetchGroups(sectionId) -> fetchBookmarks(groupId) for EACH level | Page load requires 1 + N + M + K round trips (pages -> sections -> groups -> bookmarks). With 5 sections, 3 groups each, and bookmarks per group: ~20+ API calls per page view |
| No response compression | No `compression` middleware in Express app. No gzip/brotli. | JSON payloads for 10,000 bookmarks sent uncompressed |
| No API pagination | `findAllByGroup()` returns ALL bookmarks with no LIMIT | Single group with 500+ bookmarks returns everything |
| Hardcoded connection pool | `max: 20` hardcoded in database.js, no `min`, no `maxUses`, no `statement_timeout` | No connection recycling, no query timeout protection, no cold-start optimization |
| Favicon fetching is synchronous per-import | Import service fetches favicons one-by-one in a loop with 5s timeout each, trying up to 5 APIs sequentially | Importing 100 bookmarks can take 100 x 5s = 500 seconds worst case |
| No full-page API endpoint | No single endpoint to get page + sections + groups + bookmarks in one call | Frontend must orchestrate multiple sequential API calls |
| Icons cache has no TTL enforcement | `shouldRefresh()` method exists but is only called on individual favicon lookups, not proactively | Stale favicons persist indefinitely unless manually refreshed |
| Missing composite indexes for ownership JOINs | Ownership verification JOINs across pages -> sections -> groups -> bookmarks have no composite indexes to optimize them | Every bookmark operation requires a 3-table JOIN for ownership check |

---

## Table Stakes

Features users expect from a responsive web app. Missing = noticeably slow UX.

### TS-1: Aggregated Page Load Endpoint (Batch Query)

| Aspect | Detail |
|--------|--------|
| **What** | Single API endpoint `GET /api/pages/:id/full` that returns entire page hierarchy (sections, groups, bookmarks) in one response |
| **Why Expected** | Current N+1 waterfall causes visible loading cascades. Users see sections appear, then groups, then bookmarks popping in sequentially. Any app at this scale loads a page in one request. |
| **Complexity** | Medium |
| **Approach** | Single PostgreSQL query with JOINs: `pages LEFT JOIN sections ON ... LEFT JOIN groups ON ... LEFT JOIN bookmarks ON ...` filtered by `page_id` and `user_id`. Restructure flat rows into nested JSON in the service layer. |
| **Impact** | Reduces page load from 20+ API calls to 1 API call. Eliminates waterfall latency entirely. This is the single highest-impact optimization. |
| **Confidence** | HIGH -- standard pattern, well-documented in PostgreSQL and Node.js ecosystems |

### TS-2: Database Index Optimization

| Aspect | Detail |
|--------|--------|
| **What** | Add strategic composite indexes for the ownership verification JOIN pattern used across all CRUD operations |
| **Why Expected** | Every bookmark/group/section operation traverses pages -> sections -> groups -> bookmarks via JOINs to verify ownership. Without composite indexes, these JOINs do sequential scans as data grows. |
| **Complexity** | Low |
| **Indexes Needed** | (1) `sections(page_id, id)` -- for ownership JOINs. (2) `groups(section_id, id)` -- for ownership JOINs. (3) `bookmarks(group_id, "column", position)` -- for the most common query pattern (bookmarks by group sorted by column then position). (4) `icons_cache(domain, last_checked_at)` -- for cache lookups with TTL check. Note: Some of these may already exist from migrations; verify with `\d+ tablename` before adding. |
| **Impact** | Ownership verification JOINs go from sequential scan to index lookup. Estimated 50-70% reduction in query time for read operations at 10,000+ bookmarks. |
| **Confidence** | HIGH -- PostgreSQL indexing is well-understood; migrations already define some indexes (e.g., `idx_bookmarks_group_position`) but the composite ownership pattern is not covered |

### TS-3: Response Compression (gzip/Brotli)

| Aspect | Detail |
|--------|--------|
| **What** | Add `compression` middleware to Express for automatic gzip/Brotli compression of JSON API responses |
| **Why Expected** | JSON responses with 10,000 bookmarks can be 500KB+. Gzip typically achieves 85-90% compression on repetitive JSON. Without it, every API response transfers at full size. |
| **Complexity** | Low |
| **Approach** | `npm install compression` then `app.use(compression())` early in middleware stack. Default settings (level 6, 1KB threshold) are appropriate. |
| **Impact** | 500KB JSON -> ~50KB compressed. Dramatically faster page loads on slower connections. Virtually no CPU cost for this payload size. |
| **Confidence** | HIGH -- Express official documentation recommends this. Source: [Express Performance Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html) |

### TS-4: Connection Pool Configuration

| Aspect | Detail |
|--------|--------|
| **What** | Make PostgreSQL connection pool configurable via environment variables with production-appropriate defaults |
| **Why Expected** | Current config has hardcoded `max: 20` with no `min`, `maxUses`, or `statement_timeout`. This is a reliability issue: runaway queries can hold connections indefinitely, and connections are never recycled (potential memory leaks). |
| **Complexity** | Low |
| **Configuration** | `max: env.DB_POOL_MAX or 20`, `min: env.DB_POOL_MIN or 2`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`, `maxUses: 7500` (recycle connections), `statement_timeout: 30000` (kill queries after 30s). |
| **Impact** | Prevents connection exhaustion under load, protects against runaway queries, enables deployment-specific tuning. |
| **Confidence** | HIGH -- node-postgres official documentation recommends `maxUses` for connection recycling. Source: [node-postgres Pool Sizing](https://node-postgres.com/guides/pool-sizing) |

### TS-5: Favicon Cache TTL Enforcement

| Aspect | Detail |
|--------|--------|
| **What** | Implement proper cache-first pattern with TTL-based revalidation for the `icons_cache` table |
| **Why Expected** | The `shouldRefresh()` method exists (30-day TTL) but is only checked when a single favicon is looked up. There is no background revalidation, no batch refresh, and stale entries accumulate. Favicons that become broken (404'd) stay cached forever. |
| **Complexity** | Low-Medium |
| **Approach** | (1) On favicon lookup: if cached AND not expired, return immediately (cache-first). (2) If cached BUT expired: return cached value immediately, queue async revalidation (stale-while-revalidate pattern). (3) If not cached: fetch synchronously. (4) Add periodic cleanup of entries older than 90 days. |
| **Impact** | Ensures favicons stay fresh without blocking user requests. Reduces external API calls by serving from cache while revalidating in background. |
| **Confidence** | HIGH -- stale-while-revalidate is a well-established caching pattern |

---

## Differentiators

Features that improve experience beyond baseline expectations. Not required for MVP performance, but valued.

### D-1: Batch Favicon Fetching (Parallel with Concurrency Limit)

| Aspect | Detail |
|--------|--------|
| **What** | During import, fetch favicons in parallel batches (e.g., 5 concurrent) instead of one-by-one sequential |
| **Value Proposition** | Import of 100 bookmarks currently takes up to 500 seconds (5s timeout x 100 sequential). With 5-concurrent batching: ~100 seconds. With cache hits: even faster. |
| **Complexity** | Medium |
| **Approach** | Use `Promise.allSettled()` with a concurrency limiter (e.g., `p-limit` library or manual chunking). Process bookmarks in groups of 5-10 concurrently. Cache hits skip external API calls entirely. |
| **Notes** | Must respect rate limits of favicon APIs (IconHorse, Google, DuckDuckGo). A concurrency of 5 is conservative and safe. |
| **Confidence** | HIGH -- standard async pattern in Node.js |

### D-2: API Pagination for Large Groups

| Aspect | Detail |
|--------|--------|
| **What** | Add offset/limit pagination to bookmark listing endpoints for groups with many bookmarks |
| **Value Proposition** | Groups with 500+ bookmarks send all data at once. Pagination enables progressive loading and reduces initial payload. |
| **Complexity** | Medium |
| **Approach** | Offset-based pagination is appropriate here because: (1) Bookmark count per group is bounded (rarely >500), (2) Users navigate by group, not by infinite scroll, (3) Offset is simpler to implement than cursor-based. Add `?page=1&limit=50` to `GET /api/bookmarks?groupId=X`. Default: no limit (backward compatible). |
| **Why Not Cursor-Based** | Cursor-based pagination excels for infinite scroll with 100K+ records. At PinGrid's scale (max ~500 per group), offset with proper index is performant and simpler. The `idx_bookmarks_group_position` index already supports efficient offset queries. |
| **Confidence** | HIGH -- straightforward pattern; offset is fine at this data scale |

### D-3: Query Monitoring and Slow Query Logging

| Aspect | Detail |
|--------|--------|
| **What** | Log queries that exceed a time threshold (e.g., 100ms) with query text and duration |
| **Value Proposition** | Makes performance issues visible before users report them. Essential for ongoing optimization. |
| **Complexity** | Low |
| **Approach** | Wrap `pool.query()` with timing. If duration > threshold, log warning with query text (first 200 chars) and duration. Alternatively, enable `log_min_duration_statement = 100` in PostgreSQL config. |
| **Confidence** | HIGH -- standard observability practice |

### D-4: HTTP Cache Headers for API Responses

| Aspect | Detail |
|--------|--------|
| **What** | Add `Cache-Control`, `ETag`, and `Last-Modified` headers to read endpoints so browsers and proxies can cache responses |
| **Value Proposition** | Repeat visits to the same page return 304 Not Modified instead of re-downloading the full response. Works with the browser cache and any CDN/proxy. |
| **Complexity** | Medium |
| **Approach** | For the full-page endpoint: set `ETag` based on the latest `updated_at` timestamp across all entities. Return `304 Not Modified` if `If-None-Match` matches. For static assets (favicons): set `Cache-Control: public, max-age=86400` (1 day). |
| **Notes** | Must be careful with user-specific data -- never cache authenticated responses in shared caches. Use `Cache-Control: private` for authenticated endpoints. |
| **Confidence** | MEDIUM -- correct implementation requires care with auth tokens and per-user data |

### D-5: Optimistic UI Updates for Mutations

| Aspect | Detail |
|--------|--------|
| **What** | Update Zustand store immediately on user action (create/update/delete), then sync with backend. Revert on failure. |
| **Value Proposition** | UI feels instant even on slow connections. Already partially done for click tracking; extend to all mutations. |
| **Complexity** | Medium-High |
| **Approach** | On mutation: (1) Save current state snapshot, (2) Apply optimistic update to Zustand store, (3) Send API request, (4) On failure: revert to snapshot and show error toast. |
| **Notes** | Already partially implemented for `trackClick`. The pattern should extend to reorder operations (which are latency-sensitive due to drag & drop). |
| **Confidence** | HIGH -- Zustand supports this pattern well |

### D-6: Frontend Request Deduplication

| Aspect | Detail |
|--------|--------|
| **What** | Prevent duplicate concurrent API calls for the same resource (e.g., two components both calling `fetchSections(pageId)` simultaneously) |
| **Value Proposition** | Eliminates redundant network requests during React re-renders and concurrent component mounts |
| **Complexity** | Low-Medium |
| **Approach** | Maintain a Map of in-flight promises keyed by endpoint+params. If a request is already in-flight, return the existing promise instead of creating a new one. Clear on completion. |
| **Confidence** | MEDIUM -- depends on actual duplication frequency in the current UI; may have limited impact |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

### AF-1: Do NOT Add Redis for Caching

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Adding Redis as a caching layer | The project context explicitly states Redis is being removed. PostgreSQL's `icons_cache` table already provides caching. Adding Redis introduces infrastructure complexity (another service to manage, monitor, and keep running) for an app that serves a single user or small team. At 10,000 bookmarks, PostgreSQL handles all queries in <50ms with proper indexes. | Use PostgreSQL materialized views or the existing `icons_cache` table pattern. PostgreSQL is the cache for this scale. |

### AF-2: Do NOT Implement Full-Text Search in PostgreSQL

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Building PostgreSQL `tsvector`-based full-text search | Over-engineered for bookmark titles and URLs. At 10,000 records, `ILIKE '%term%'` with a GIN trigram index is simpler and sufficient. Full-text search adds parsing complexity, stemming configuration, and search ranking logic that is unnecessary for short-text fields. | Use `ILIKE` for title/URL search. If needed later, add a `pg_trgm` GIN index for fast substring matching. |

### AF-3: Do NOT Use Cursor-Based Pagination Everywhere

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Implementing cursor-based pagination for all list endpoints | Cursor-based pagination is designed for unbounded datasets with infinite scroll (Twitter feeds, chat messages). PinGrid's data is bounded: max ~20 pages, ~50 sections per page, ~50 groups per section, ~500 bookmarks per group. Cursor pagination adds implementation complexity (encoding/decoding cursors, handling sort key changes) with no benefit at this scale. | Use simple offset/limit only where needed (large bookmark groups). Most endpoints need no pagination at all -- a page has at most ~20 sections. |

### AF-4: Do NOT Add a CDN or Reverse Proxy for Compression

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Setting up Nginx/Cloudflare as a reverse proxy for compression | This is a single-server Docker Compose deployment for personal/small-team use. Adding a reverse proxy increases infrastructure complexity, configuration surface, and debugging difficulty. The `compression` middleware in Express handles this adequately at this scale. | Use Express `compression` middleware directly. Consider reverse proxy only if deploying to production with multiple instances. |

### AF-5: Do NOT Premature-Optimize with Connection Poolers (PgBouncer)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Adding PgBouncer between Express and PostgreSQL | PgBouncer is for apps with 100+ concurrent connections across multiple instances. A single Express instance with `max: 20` pool connections is well within PostgreSQL's default `max_connections = 100`. Adding PgBouncer adds a network hop, another Docker service, and transaction pooling complexity. | Configure `pg.Pool` properly (max, min, maxUses, timeouts). This handles the scale. |

### AF-6: Do NOT Build a Custom Query Builder or ORM

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Adopting Knex, Prisma, or TypeORM to "optimize" queries | The codebase uses raw `pg` queries with parameterized SQL. This is actually the most performant approach -- ORMs add overhead (query generation, result mapping) and hide query plans. Switching ORMs mid-project introduces migration risk with no performance benefit. | Keep raw `pg` queries. They are already parameterized and directly optimizable with `EXPLAIN ANALYZE`. |

---

## Feature Dependencies

```
TS-1 (Aggregated Page Load) --depends-on--> TS-2 (Index Optimization)
  The aggregated query needs proper indexes to be fast.

TS-3 (Compression) --independent--
  Can be added at any time with zero code changes elsewhere.

TS-4 (Pool Config) --independent--
  Configuration change only, no API impact.

TS-5 (Favicon TTL) --enables--> D-1 (Batch Favicon Fetching)
  TTL enforcement ensures cache is trustworthy before optimizing fetch patterns.

D-2 (Pagination) --depends-on--> TS-1 (Aggregated Page Load)
  Pagination only matters for endpoints not replaced by the aggregated load.
  If full-page endpoint exists, pagination is only needed for the individual
  bookmark listing endpoint (used by edit mode, not view mode).

D-4 (HTTP Cache Headers) --depends-on--> TS-1 (Aggregated Page Load)
  Cache headers are most effective on the endpoint that carries the most data.

D-5 (Optimistic UI) --independent--
  Frontend-only change, no backend dependency.
```

---

## MVP Recommendation

For the performance optimization milestone, prioritize in this order:

### Phase 1: Immediate Wins (Low effort, high impact)
1. **TS-3: Response Compression** -- 5 minutes to add, immediate benefit
2. **TS-4: Connection Pool Config** -- 15 minutes, prevents reliability issues
3. **TS-2: Index Optimization** -- 30 minutes, speeds up all existing queries

### Phase 2: Core Performance (Medium effort, highest impact)
4. **TS-1: Aggregated Page Load Endpoint** -- The single biggest performance improvement. Eliminates the N+1 waterfall that is the primary performance bottleneck.
5. **TS-5: Favicon Cache TTL** -- Makes favicon caching reliable

### Phase 3: Polish (Medium effort, good impact)
6. **D-1: Batch Favicon Fetching** -- Dramatically speeds up imports
7. **D-3: Slow Query Logging** -- Ongoing observability
8. **D-5: Optimistic UI Updates** -- Perceived performance improvement

### Defer to Post-Milestone
- **D-2: Pagination** -- Only relevant for edge cases with 500+ bookmarks per group
- **D-4: HTTP Cache Headers** -- Meaningful optimization but requires careful auth handling
- **D-6: Request Deduplication** -- Low impact unless duplication is measured

---

## Sources

### Official Documentation (HIGH confidence)
- [Express Performance Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [node-postgres Pool API](https://node-postgres.com/apis/pool)
- [node-postgres Pool Sizing Guide](https://node-postgres.com/guides/pool-sizing)
- [PostgreSQL Performance Tips (Official Docs v18)](https://www.postgresql.org/docs/current/performance-tips.html)

### Community Sources (MEDIUM confidence)
- [Node.js + PostgreSQL Connection Pooling (OneUpTime, Jan 2026)](https://oneuptime.com/blog/post/2026-01-06-nodejs-connection-pooling-postgresql-mysql/view)
- [PostgreSQL Performance Tuning for Node.js (Medium, Dec 2025)](https://medium.com/@deval93/postgresql-performance-nodejs-part-1-32c347e98189)
- [The N+1 Database Query Problem (Medium, Feb 2025)](https://medium.com/databases-in-simple-words/the-n-1-database-query-problem-a-simple-explanation-and-solutions-ef11751aef8a)
- [Making a Postgres Query 1,000x Faster (Mattermost)](https://mattermost.com/blog/making-a-postgres-query-1000-times-faster/)
- [PostgreSQL Performance Tuning (Last9, Aug 2025)](https://last9.io/blog/postgresql-performance/)
- [Implementing Data Compression in REST APIs (Zuplo)](https://zuplo.com/learning-center/implementing-data-compression-in-rest-apis-with-gzip-and-brotli)
- [HTTP Compression in Node.js (Ayrshare)](https://www.ayrshare.com/http-compression-in-node-js-a-dive-into-gzip-deflate-and-brotli/)
- [expressjs/compression (GitHub)](https://github.com/expressjs/compression)

### Codebase Analysis (HIGH confidence)
- Direct inspection of `backend/src/shared/config/database.js` -- hardcoded pool config confirmed
- Direct inspection of `backend/src/modules/bookmarks/bookmarks.model.js` -- no pagination confirmed
- Direct inspection of `backend/src/shared/services/faviconService.js` -- sequential fetching confirmed
- Direct inspection of `backend/src/modules/import/importService.js` -- synchronous per-bookmark favicon fetch confirmed
- Direct inspection of `frontend/src/pages/Dashboard.jsx` -- N+1 waterfall pattern confirmed (fetchPages -> fetchSections -> fetchGroups -> fetchBookmarks cascade)
- Direct inspection of all migration SQL files -- existing indexes documented, missing indexes identified
