# PinGrid V2.0 — Performance Hardening

## What This Is

PinGrid is a visual bookmark management system with a 4-level hierarchy: Pages > Sections > Groups > Bookmarks. It uses React 18/Vite on the frontend, Express/Node.js on the backend, and PostgreSQL for storage. This milestone focuses on performance hardening — making the app fast and scalable before the data grows.

## Core Value

Bookmark creation and page loading must feel instant, regardless of how many bookmarks exist.

## Requirements

### Validated

- ✓ User authentication (register, login, JWT, protected routes) — existing
- ✓ Pages CRUD with reordering — existing
- ✓ Sections CRUD with reordering and collapse toggle — existing
- ✓ Groups CRUD (manual + dynamic types, 1-6 column grid) — existing
- ✓ Bookmarks CRUD with click tracking and favicon fetching — existing
- ✓ File upload for custom favicons (Sharp image processing) — existing
- ✓ Bookmark import from browser exports — existing
- ✓ Theme system (dark/light mode, glassmorphism) — existing
- ✓ Drag & drop contexts for groups and bookmarks — existing
- ✓ Search functionality across bookmarks — existing
- ✓ View mode toggle (edit/view) with static page caching — existing
- ✓ Keyboard navigation — existing
- ✓ Rate limiting on auth endpoints — existing

### Active

- [ ] Async favicon fetch — bookmark creation returns immediately, favicon fetched in background
- [ ] Aggressive favicon caching — icons_cache table with long TTL, skip fetch for known domains
- [ ] Remove Redis dependency — clean out mocked Redis, simplify stack to PostgreSQL only
- [ ] Database indexes — add indexes on all foreign keys and frequently queried columns
- [ ] Pagination — add limit/offset to bookmarks endpoint and other unbounded list queries
- [ ] Favicon scanning concurrency control — limit parallel probes to 3-5, add per-probe timeouts
- [ ] Connection pool tuning — make pool size configurable via env var with production-ready defaults

### Out of Scope

- Test suite — important but separate milestone
- Security hardening (CSP, input validation, .env cleanup) — separate milestone
- Data integrity fixes (cascade deletes, soft deletes) — separate milestone
- Horizontal scaling (load balancing, Docker Swarm) — premature for current usage
- Backup/export system — feature work, not performance
- Email verification / refresh tokens — feature work, not performance

## Context

- This is a brownfield project with a working codebase (auth, full CRUD hierarchy, theming, search, DnD)
- Redis is listed as a dependency but is mocked/non-functional — this milestone removes it
- An `icons_cache` PostgreSQL table already exists for favicon caching
- The favicon service tries 5 different APIs sequentially with 5-second timeouts each — worst case 25 seconds blocking bookmark creation
- No database indexes exist on any table beyond primary keys
- No pagination on any endpoint — all queries return full result sets
- PostgreSQL connection pool is hardcoded at 20 connections
- The user is doing this preventively — app works fine now but wants it ready for growth

## Constraints

- **Tech stack**: React 18 + Express + PostgreSQL (no Redis after this milestone)
- **Compatibility**: Must not break existing frontend behavior — favicon appears on next page load instead of inline
- **No new dependencies for queuing**: Use Node.js built-in mechanisms (setImmediate, Promise) for background favicon fetch — no Bull/RabbitMQ

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Remove Redis entirely | Mocked/broken, adds deployment complexity, PostgreSQL sufficient at current scale | — Pending |
| Async favicon with "next load" display | Simplest approach, no WebSocket/polling needed, user accepted tradeoff | — Pending |
| PostgreSQL-only caching via icons_cache | Table already exists, avoids new dependencies, sufficient for favicon use case | — Pending |

---
*Last updated: 2026-01-28 after initialization*
