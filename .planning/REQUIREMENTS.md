# Requirements: PinGrid V2.0 — Performance Hardening

**Defined:** 2026-01-28
**Core Value:** Bookmark creation and page loading must feel instant, regardless of how many bookmarks exist.

## v1 Requirements

### Foundation (FOUND)

- [x] **FOUND-01**: Connection pool uses configurable max/min/maxUses/statement_timeout via env vars
- [x] **FOUND-02**: Pool error handler logs errors without crashing the process (remove process.exit)
- [x] **FOUND-03**: Transaction patterns guard client.release() against null client
- [x] **FOUND-04**: Response compression (gzip/Brotli) enabled via Express middleware
- [ ] **FOUND-05**: Slow query logging for queries exceeding 100ms threshold

### Redis Removal (REDIS)

- [ ] **REDIS-01**: All Redis imports and references removed from codebase
- [ ] **REDIS-02**: Redis removed from docker-compose.yml services
- [ ] **REDIS-03**: Redis removed from package.json dependencies
- [ ] **REDIS-04**: SIGTERM handler updated to remove Redis disconnect
- [ ] **REDIS-05**: Click tracking migrated from Redis to PostgreSQL (if applicable)

### Database Optimization (DBOPT)

- [x] **DBOPT-01**: Composite indexes added for ownership verification JOINs (sections, groups, bookmarks)
- [x] **DBOPT-02**: Index on icons_cache(domain, last_checked_at) for cache lookups with TTL
- [x] **DBOPT-03**: Audit and remove redundant indexes (e.g., idx_bookmarks_group_position superseded by idx_bookmarks_group_column)
- [x] **DBOPT-04**: All new indexes created with CONCURRENTLY to avoid write locks

### Page Load Optimization (LOAD)

- [ ] **LOAD-01**: Aggregated page load endpoint GET /api/pages/:id/content returns entire hierarchy in one response
- [ ] **LOAD-02**: Single SQL query with JOINs (pages → sections → groups → bookmarks)
- [ ] **LOAD-03**: Service layer transforms flat rows into nested JSON structure
- [ ] **LOAD-04**: Frontend uses aggregated endpoint for initial page load (replaces waterfall)

### Favicon Performance (FAVI)

- [ ] **FAVI-01**: Bookmark creation returns immediately with placeholder favicon (no blocking fetch)
- [ ] **FAVI-02**: Favicon fetched in background using fire-and-forget Promise with .catch()
- [ ] **FAVI-03**: Background favicon fetch updates bookmark record when complete
- [ ] **FAVI-04**: Favicon appears on next page load (no polling/WebSocket needed)
- [ ] **FAVI-05**: Favicon APIs called in parallel using Promise.any() instead of sequential fallback
- [ ] **FAVI-06**: Per-probe timeout via AbortSignal.timeout(5000)
- [ ] **FAVI-07**: Cache-first lookup in icons_cache table with 30-day TTL
- [ ] **FAVI-08**: Background task runner utility with error handling and active task tracking
- [ ] **FAVI-09**: Graceful shutdown waits for in-flight background tasks (with timeout)

### Cache Management (CACHE)

- [ ] **CACHE-01**: Icons cache uses stale-while-revalidate pattern (return cached, async refresh if expired)
- [ ] **CACHE-02**: Periodic cleanup of icons_cache entries older than 90 days (setInterval-based)
- [ ] **CACHE-03**: Background refresh of expired favicon entries in batches (10 at a time, rate-limited)

### Pagination (PAGE)

- [ ] **PAGE-01**: Bookmarks endpoint supports optional ?page=&limit= query parameters
- [ ] **PAGE-02**: Pagination is opt-in — no params returns all results (backward compatible)
- [ ] **PAGE-03**: Default limit 50, max limit 200, validated and capped server-side
- [ ] **PAGE-04**: Response includes pagination metadata when pagination params are present

## v2 Requirements

### Future Performance

- **PERF-01**: HTTP cache headers (ETag, Cache-Control) for read endpoints
- **PERF-02**: Frontend request deduplication (prevent duplicate concurrent API calls)
- **PERF-03**: Optimistic UI updates for all mutations (create/update/delete)
- **PERF-04**: Batch reorder using PostgreSQL unnest instead of N individual UPDATE queries
- **PERF-05**: Backend search endpoint with PostgreSQL trigram indexes (replace client-side search)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Redis re-implementation | Being removed — PostgreSQL sufficient at current scale |
| PgBouncer / connection pooler | Single-instance deployment, pg.Pool is sufficient |
| CDN / reverse proxy compression | Express compression middleware sufficient for this scale |
| Cursor-based pagination | Overkill — bookmark groups rarely exceed 500 items |
| Full-text search (tsvector) | ILIKE with trigram index sufficient for short text fields |
| ORM migration (Prisma, Knex) | Raw pg queries are already the most performant approach |
| Worker Threads | Favicon fetching is I/O-bound, not CPU-bound |
| Message queue (Bull, RabbitMQ) | Requires Redis — use Promise-based background tasks |
| UNLOGGED tables for cache | Risk of data loss on crash, minimal write performance gain |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 6 | Pending |
| DBOPT-01 | Phase 2 | Complete |
| DBOPT-02 | Phase 2 | Complete |
| DBOPT-03 | Phase 2 | Complete |
| DBOPT-04 | Phase 2 | Complete |
| LOAD-01 | Phase 3 | Pending |
| LOAD-02 | Phase 3 | Pending |
| LOAD-03 | Phase 3 | Pending |
| LOAD-04 | Phase 3 | Pending |
| REDIS-01 | Phase 4 | Pending |
| REDIS-02 | Phase 4 | Pending |
| REDIS-03 | Phase 4 | Pending |
| REDIS-04 | Phase 4 | Pending |
| REDIS-05 | Phase 4 | Pending |
| FAVI-01 | Phase 5 | Pending |
| FAVI-02 | Phase 5 | Pending |
| FAVI-03 | Phase 5 | Pending |
| FAVI-04 | Phase 5 | Pending |
| FAVI-05 | Phase 5 | Pending |
| FAVI-06 | Phase 5 | Pending |
| FAVI-07 | Phase 5 | Pending |
| FAVI-08 | Phase 5 | Pending |
| FAVI-09 | Phase 5 | Pending |
| CACHE-01 | Phase 5 | Pending |
| CACHE-02 | Phase 5 | Pending |
| CACHE-03 | Phase 5 | Pending |
| PAGE-01 | Phase 6 | Pending |
| PAGE-02 | Phase 6 | Pending |
| PAGE-03 | Phase 6 | Pending |
| PAGE-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-29 after Phase 2 completion*
