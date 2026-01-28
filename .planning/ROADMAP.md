# Roadmap: PinGrid V2.0 — Performance Hardening

## Overview

This milestone makes PinGrid fast and scalable before the data grows. The work flows from defensive foundation hardening (pool config, error handling) through database optimization (indexes, aggregated queries), then removes the broken Redis dependency, converts favicon fetching from synchronous-blocking to async-background, and finishes with pagination and observability polish. Each phase builds on the stability of previous phases, with the highest-impact win (aggregated page load) landing in Phase 3 after indexes are in place.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation Hardening** - Connection pool tuning, error handling fixes, and response compression
- [ ] **Phase 2: Database Index Optimization** - Strategic indexes for ownership JOINs and cache lookups
- [ ] **Phase 3: Aggregated Page Load** - Single-query page load replaces N+1 waterfall
- [ ] **Phase 4: Redis Removal** - Remove broken Redis dependency, simplify stack to PostgreSQL only
- [ ] **Phase 5: Async Favicon Fetching + Cache** - Background favicon fetch with PostgreSQL-backed cache
- [ ] **Phase 6: Pagination + Observability** - Opt-in pagination and slow query logging

## Phase Details

### Phase 1: Foundation Hardening
**Goal**: The backend is resilient to connection failures and runaway queries, and responses are compressed for fast delivery
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. Connection pool max/min/maxUses/statement_timeout are configurable via environment variables without code changes
  2. A database connection error is logged but does not crash the Node.js process
  3. A transaction that fails to acquire a client does not throw a TypeError on release
  4. API responses are gzip/Brotli compressed (verifiable via Content-Encoding header)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Database Index Optimization
**Goal**: Database queries that traverse the page hierarchy use indexes instead of sequential scans
**Depends on**: Phase 1
**Requirements**: DBOPT-01, DBOPT-02, DBOPT-03, DBOPT-04
**Success Criteria** (what must be TRUE):
  1. EXPLAIN ANALYZE on ownership verification JOINs (sections, groups, bookmarks) shows Index Scan instead of Seq Scan
  2. Icons cache lookups by domain with TTL filtering use an index (verifiable via EXPLAIN)
  3. No redundant overlapping indexes exist on the bookmarks table (audit complete)
  4. All new indexes were created with CONCURRENTLY (no table locks during creation)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Aggregated Page Load
**Goal**: A full page with all its sections, groups, and bookmarks loads in a single API call instead of 20+ waterfall requests
**Depends on**: Phase 2
**Requirements**: LOAD-01, LOAD-02, LOAD-03, LOAD-04
**Success Criteria** (what must be TRUE):
  1. GET /api/pages/:id/content returns the complete hierarchy (sections, groups, bookmarks) in one response
  2. The endpoint executes a single SQL query (verifiable via query logging or EXPLAIN)
  3. The frontend loads a page using the aggregated endpoint with no visible behavior change from the user's perspective
  4. Existing individual endpoints (GET /sections, GET /groups, GET /bookmarks) still work unchanged
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Redis Removal
**Goal**: Redis is completely removed from the project with no remaining references, and the app starts and shuts down cleanly without it
**Depends on**: Phase 1
**Requirements**: REDIS-01, REDIS-02, REDIS-03, REDIS-04, REDIS-05
**Success Criteria** (what must be TRUE):
  1. No Redis imports, requires, or references exist anywhere in the codebase (grep confirms zero matches)
  2. docker-compose.yml has no Redis service and the app starts without Redis running
  3. The SIGTERM handler shuts down gracefully without attempting Redis disconnect
  4. Click tracking continues to work correctly using PostgreSQL (if it was previously Redis-backed)
  5. npm install produces no Redis-related packages in node_modules
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Async Favicon Fetching + Cache
**Goal**: Bookmark creation returns instantly with a placeholder favicon, and favicons are fetched in the background with aggressive caching
**Depends on**: Phase 1, Phase 4
**Requirements**: FAVI-01, FAVI-02, FAVI-03, FAVI-04, FAVI-05, FAVI-06, FAVI-07, FAVI-08, FAVI-09, CACHE-01, CACHE-02, CACHE-03
**Success Criteria** (what must be TRUE):
  1. Creating a bookmark returns immediately (under 200ms) with a placeholder favicon -- no 5-25 second wait
  2. The favicon appears on the next page reload without any user action (background fetch completed)
  3. Creating a bookmark for a domain that was previously fetched returns the cached favicon instantly (cache hit, no background fetch)
  4. The server shuts down gracefully even when background favicon fetches are in-flight (no orphaned promises or crashes)
  5. Expired cache entries are refreshed in the background without blocking user requests (stale-while-revalidate)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Pagination + Observability
**Goal**: Large bookmark lists can be paginated, and slow queries are logged for proactive performance monitoring
**Depends on**: Phase 3
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. GET /bookmarks?page=1&limit=50 returns paginated results with metadata (page, totalPages, totalItems)
  2. GET /bookmarks without pagination params returns all results in the existing format (backward compatible)
  3. Requesting limit=999 is capped to 200 server-side (no unbounded queries via API abuse)
  4. Queries exceeding 100ms are logged with their duration and SQL text (verifiable in server logs)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
(Note: Phases 3 and 4 could execute in parallel since they depend on different prerequisites, but sequential is simpler for a solo workflow.)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Hardening | 0/TBD | Not started | - |
| 2. Database Index Optimization | 0/TBD | Not started | - |
| 3. Aggregated Page Load | 0/TBD | Not started | - |
| 4. Redis Removal | 0/TBD | Not started | - |
| 5. Async Favicon + Cache | 0/TBD | Not started | - |
| 6. Pagination + Observability | 0/TBD | Not started | - |
