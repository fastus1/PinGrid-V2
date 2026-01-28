# Codebase Concerns

**Analysis Date:** 2026-01-28

## Tech Debt

**Incomplete Cascade Delete Operations:**
- Issue: Delete operations (pages, sections, groups) are not implemented with CASCADE deletes for child entities. Controllers only delete the parent, leaving orphaned child records.
- Files: `backend/src/modules/pages/pages.model.js`, `backend/src/modules/sections/sections.model.js`, `backend/src/modules/groups/groups.model.js`
- Impact: Database grows with orphaned bookmarks, sections, and groups. No data cleanup on cascade deletes. Future data integrity issues.
- Fix approach: Implement ON DELETE CASCADE in migration SQL or explicitly delete children in service layer before parent delete.

**Redis Integration Disabled/Mocked:**
- Issue: Redis client is mocked with fallback returns instead of actual Redis operations. Connection not established; silently ignored errors.
- Files: `backend/src/shared/config/redis.js` (lines 17-35)
- Impact: Caching not functional. Click tracking and stats may not persist. Performance gains from Redis unavailable.
- Fix approach: Either implement proper Redis connection with graceful degradation or remove Redis from stack entirely. Current state is confusing.

**Database Connection Default Fallback:**
- Issue: Database connection uses hardcoded 'postgres' password default if DB_PASSWORD not set (line 9 in database.js).
- Files: `backend/src/shared/config/database.js`
- Impact: Will fail in any non-development environment unless .env is perfectly configured. Silent failure risk.
- Fix approach: Require DB_PASSWORD env var explicitly or fail at startup with clear error message.

**Missing Test Suite:**
- Issue: No unit tests, integration tests, or E2E tests exist for backend or frontend.
- Files: Entire `backend/src/`, entire `frontend/src/`
- Impact: No protection against regressions. Difficult to refactor safely. Unknown code coverage. Cannot verify feature completeness.
- Fix approach: Add Jest/Vitest test framework. Start with critical paths: auth flows, CRUD operations, validation logic.

**Incomplete Deletion Flow:**
- Issue: Deletion endpoints exist but don't handle cascading soft deletes or foreign key constraints properly.
- Files: `backend/src/modules/pages/pages.controller.js` DELETE handler, similar in sections/groups/bookmarks
- Impact: Users can delete parents leaving orphaned children. UI may show inconsistent data.
- Fix approach: Add constraint checks before delete, or implement soft delete pattern with is_deleted flag.

## Known Bugs

**Inconsistent userId Field Extraction:**
- Symptoms: Some controllers use `req.user.id`, others use `req.userId`. Different auth middleware implementations.
- Files: `backend/src/modules/groups/groups.controller.js` (uses req.user.id), `backend/src/modules/bookmarks/bookmarks.controller.js` (uses req.userId)
- Trigger: Varies by endpoint. Groups endpoints expect req.user.id, bookmarks expect req.userId.
- Workaround: Check auth middleware setup before calling each controller.
- Fix approach: Standardize on single field name. Update auth.middleware.js and all controllers consistently.

**Favicon Service Error Handling Silent Fails:**
- Symptoms: Favicon fetch failures don't propagate errors clearly. Falls back to default icon without logging useful info.
- Files: `backend/src/shared/services/faviconService.js` (lines 175-234)
- Trigger: Any API timeout, redirect, or HTTP error. Gets silently swallowed.
- Workaround: None - silently returns default icon.
- Fix approach: Distinguish between expected failures (404s) and real errors (timeouts). Log only unexpected failures.

**parseInt Without Radix:**
- Symptoms: parseInt calls without explicit radix can parse octal numbers incorrectly if prefixed with 0.
- Files: `backend/src/modules/bookmarks/bookmarks.controller.js` (line parsing limit), `backend/src/modules/groups/groups.model.js`, `backend/src/modules/bookmarks/bookmarks.model.js`, `backend/src/modules/sections/sections.model.js`, `backend/src/modules/pages/pages.model.js`
- Trigger: When parsing numeric strings that may have leading zeros.
- Workaround: Pass explicit radix 10.
- Fix approach: Add radix 10 to all parseInt calls: `parseInt(string, 10)`.

## Security Considerations

**Exposed .env Files in Repository:**
- Risk: `.env` and `.env.portainer` files are committed with real credentials (JWT_SECRET, DB_PASSWORD).
- Files: `/backend/.env`, `/frontend/.env`, `/.env.portainer`
- Current mitigation: .gitignore exists but files already committed.
- Recommendations: Remove from git history using `git filter-repo` or `BFG Repo Cleaner`. Regenerate JWT_SECRET and DB passwords. Store in secrets manager for deployment.

**CSP Disabled in Helmet:**
- Risk: Content Security Policy disabled (line 13 in app.js). Opens door to XSS attacks from injected content.
- Files: `backend/src/app.js`
- Current mitigation: None. Explicitly disabled.
- Recommendations: Enable CSP with strict policy. At minimum: `default-src 'self'`, whitelist external favicon APIs.

**Query Parameter Integer Parsing:**
- Risk: `parseInt(req.query.limit)` converts user input without validation. Could be NaN or crash if not numeric.
- Files: `backend/src/modules/bookmarks/bookmarks.controller.js`
- Current mitigation: Fallback to 10 if falsy.
- Recommendations: Use schema validation (joi, zod) on all query/body params. Never trust user input.

**File Upload Without Virus Scanning:**
- Risk: Favicon uploads accept any image file without scanning for malicious content.
- Files: `backend/src/modules/upload/upload.routes.js`, `backend/src/modules/upload/upload.controller.js`
- Current mitigation: File type check (image/* mimetype only). Size limit 5MB.
- Recommendations: Add virus scanning (ClamAV or third-party API). Implement rate limiting per user for uploads.

**Hardcoded Default Database Password:**
- Risk: Fallback password 'postgres' used if DB_PASSWORD env var not set.
- Files: `backend/src/shared/config/database.js` (line 9)
- Current mitigation: .env example provided, but easy to forget in production.
- Recommendations: Fail fast with clear error if DB_PASSWORD not set. No fallbacks for passwords.

**No Rate Limiting on CRUD Endpoints:**
- Risk: Only auth routes have rate limiting. Users/attackers can hammer API endpoints (delete, create, etc.) without throttling.
- Files: `backend/src/modules/*/routes.js` (all lack rate limit middleware)
- Current mitigation: Auth endpoints only have `express-rate-limit` (5 attempts/15min for login).
- Recommendations: Add rate limiting to all write endpoints: POST, PUT, DELETE. Limit by user ID, not just IP.

**localStorage Storing UI Preferences Without Encryption:**
- Risk: Theme, favicon size stored in localStorage. Not sensitive but demonstrates lack of data protection.
- Files: `frontend/src/shared/theme/ThemeProvider.jsx`, `frontend/src/shared/store/viewModeStore.js`
- Current mitigation: Only UI preferences stored, no auth tokens.
- Recommendations: Continue current approach for UI data. Never store auth tokens in localStorage (current code correct).

## Performance Bottlenecks

**Favicon Fetching On Every Bookmark Create:**
- Problem: Every new bookmark triggers synchronous favicon API calls with 5-second timeout. Creates user-facing latency.
- Files: `backend/src/modules/bookmarks/bookmarks.service.js` (lines 63-75), `backend/src/shared/services/faviconService.js`
- Cause: Sequential try of 5 different favicon APIs. Each API call waits up to 5 seconds.
- Improvement path:
  - Move favicon fetch to background job/queue (Bull, RabbitMQ)
  - Cache favicon responses aggressively (30-day TTL in icons_cache table)
  - Return bookmark immediately, fetch favicon asynchronously
  - Notify frontend when favicon ready via WebSocket or polling

**No Database Indexing Strategy:**
- Problem: No indexes defined on common queries (user_id, group_id, domain in icons_cache).
- Files: All model files, no migration defines indexes.
- Cause: Sequential table scans for every lookup query.
- Improvement path: Add indexes on foreign keys (user_id, page_id, section_id, group_id). Index frequently filtered columns (domain in icons_cache).

**Missing Pagination:**
- Problem: /api/bookmarks endpoint fetches all bookmarks for group without limit/offset.
- Files: `backend/src/modules/bookmarks/bookmarks.controller.js` (getAll method), `backend/src/modules/bookmarks/bookmarks.service.js`
- Cause: No pagination implemented. Large groups will cause slow response times and high memory usage.
- Improvement path: Implement limit/offset pagination. Default limit 50, max 200. Add cursor-based pagination for better UX.

**Icon Scanning Parallelism:**
- Problem: Favicon scanning tries common paths sequentially, then probes in parallel with no concurrency limit.
- Files: `backend/src/shared/services/faviconService.js` (lines 403-419)
- Cause: `Promise.all()` could fire 15+ requests simultaneously. Resource intensive.
- Improvement path: Use `pLimit` or similar to limit concurrent requests to 3-5. Add timeout per individual probe.

## Fragile Areas

**Favicon Service Complex Fallback Chain:**
- Files: `backend/src/shared/services/faviconService.js`
- Why fragile: 5 different APIs tried sequentially. Each can timeout, redirect, or return wrong image. Manifest parsing regex fragile. Common paths hardcoded.
- Safe modification:
  - Add unit tests for each API strategy before modifying
  - Mock HTTP responses with known-good test data
  - Log exactly which API succeeded for debugging
- Test coverage: None exists. No tests for fallback scenarios.

**Auth Middleware User Lookup:**
- Files: `backend/src/shared/middleware/auth.middleware.js` (lines 25-26)
- Why fragile: Looks up user from token payload every request. If user deleted but token still valid, returns 404. No caching.
- Safe modification: Cache verified users in Redis with 1-hour TTL. Invalidate on logout.
- Test coverage: No tests verify behavior when user deleted mid-session.

**Pagination and Limits Parsing:**
- Files: `backend/src/modules/bookmarks/bookmarks.controller.js`
- Why fragile: `parseInt(req.query.limit)` without radix. `req.query.offset` never used. Inconsistent paging strategy.
- Safe modification: Add Joi schema validation in all routes. Define min/max limits centrally.
- Test coverage: No tests for edge cases (limit=0, limit=-1, limit=999999).

**Delete Cascade Logic Incomplete:**
- Files: All model delete methods
- Why fragile: Parent deletes don't check for children. If child foreign key constraints aren't set, orphans created.
- Safe modification: Write service-layer cascade deletes. Test with data fixtures containing real parent-child relationships.
- Test coverage: No tests for deletion cascades.

**Favicon URL Redirect Following:**
- Files: `backend/src/shared/services/faviconService.js` (lines 141-145)
- Why fragile: Recursively follows redirects without max depth limit. Could infinite loop on circular redirects.
- Safe modification: Add redirect depth counter. Throw error if depth > 5.
- Test coverage: No tests for redirect loop scenarios.

## Scaling Limits

**PostgreSQL Connection Pool Size Fixed at 20:**
- Current capacity: Pool size 20 concurrent connections.
- Limit: With concurrent users, 20 connections will fill. Queries queue and timeout.
- Scaling path: Increase pool size to 50-100 for production. Consider pgBouncer for connection pooling proxy.

**No Horizontal Scaling Strategy:**
- Current capacity: Single backend instance. No load balancing configured.
- Limit: Cannot handle more than 1 concurrent server. Single point of failure.
- Scaling path: Run backend in Docker Swarm or Kubernetes. Use load balancer (nginx, HAProxy). Session state must be Redis-backed (currently not).

**IndexedDB Storage Quota:**
- Current capacity: Browser IndexedDB typically 50MB (varies by browser).
- Limit: Caching full page hierarchies for large bookmark collections will exceed quota.
- Scaling path: Implement cache expiration policy. Warn users when approaching quota. Offer cache clear option.

**Favicon API Rate Limits:**
- Current capacity: Each favicon API (Google, DuckDuckGo) has rate limits (100-1000 req/day typical).
- Limit: Large import (1000 bookmarks) could exhaust API quotas.
- Scaling path: Implement request queuing with backoff. Cache aggressively. Consider premium icon APIs.

## Dependencies at Risk

**Redis Not Actually Used:**
- Risk: Dependency listed but not functioning. Will cause confusion in future development.
- Impact: Click tracking stats not persisted. No session caching.
- Migration plan: Either fully implement Redis (fix config, connect properly) or remove from docker-compose.yml and package.json.

**Sharp Image Library Large Binary:**
- Risk: Sharp includes native bindings. Large download, platform-specific. Could break builds on different architectures.
- Impact: Favicon upload feature requires Sharp. Deployment to different OS could fail.
- Migration plan: Test build on target deployment environment. Consider switching to lightweight image-processing library if Sharp proves problematic.

**Express-Rate-Limit Memory Leak Potential:**
- Risk: Default in-memory store. Requests never cleared = memory leak over time.
- Impact: Long-running servers will consume more and more memory.
- Migration plan: Switch to Redis-backed rate limiter. Or implement manual cleanup with TTL.

## Missing Critical Features

**No Backup/Export System:**
- Problem: Users cannot export their bookmarks. No backup system implemented.
- Blocks: Data portability. User lock-in risk. No recovery if database corrupted.

**No Refresh Token Strategy:**
- Problem: JWT tokens valid for 7 days. No refresh token rotation. Long token lifetime = larger compromise window.
- Blocks: Secure token refresh flow. Cannot revoke tokens server-side.

**No Soft Delete Implementation:**
- Problem: Hard deletes permanent. No audit trail. Cannot recover deleted data.
- Blocks: Compliance with data retention policies. Recovery from accidental deletes.

**No Email Verification:**
- Problem: Any email accepted during registration. No verification step.
- Blocks: Detection of typos in email. No password reset functionality.

## Test Coverage Gaps

**No Auth Flow Testing:**
- What's not tested: Register validation, login with wrong password, expired token verification, token refresh (if added).
- Files: `backend/src/modules/auth/*`
- Risk: Auth bugs silently shipped. Unauthorized access possible.
- Priority: **High** - Auth is security-critical.

**No CRUD Operation Testing:**
- What's not tested: Create validation, update partial fields, delete cascade behavior, permission checks.
- Files: `backend/src/modules/pages/`, `backend/src/modules/sections/`, `backend/src/modules/groups/`, `backend/src/modules/bookmarks/`
- Risk: Silent data corruption. Orphaned records. Users seeing others' data.
- Priority: **High** - Data integrity depends on this.

**No Frontend Component Testing:**
- What's not tested: Form validation, modal state management, drag-drop behavior, error handling.
- Files: `frontend/src/features/`
- Risk: UI bugs, broken workflows. Poor user experience.
- Priority: **Medium** - UX issues but not data loss.

**No Favicon Service Testing:**
- What's not tested: API fallback chain, redirect handling, timeout behavior, cache hits.
- Files: `backend/src/shared/services/faviconService.js`
- Risk: Silent failures on favicon fetch. Users see default icon unexpectedly.
- Priority: **Medium** - Non-critical feature but widely used.

**No Database Query Testing:**
- What's not tested: Query correctness, SQL injection vulnerability, N+1 queries, transaction integrity.
- Files: All `*.model.js` files
- Risk: SQL injection, slow queries, data loss from failed transactions.
- Priority: **High** - Security and performance critical.

**No Integration Testing:**
- What's not tested: Full request-response cycle, middleware chain, error handler, auth + data access together.
- Files: Entire `backend/src/`
- Risk: Features work individually but break when combined. Silent failure modes in production.
- Priority: **High** - Most realistic test scenarios.

---

*Concerns audit: 2026-01-28*
