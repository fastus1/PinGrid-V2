# Phase 1: Foundation Hardening - Research

**Researched:** 2026-01-28
**Domain:** Node.js/Express backend resilience -- PostgreSQL connection pooling, error handling, HTTP response compression
**Confidence:** HIGH

## Summary

This phase hardens the PinGrid backend against connection failures, runaway queries, and uncompressed responses. The work touches three specific files: `database.js` (pool configuration and error handling), the model files with transaction patterns (5 files), and `app.js` (compression middleware).

The existing codebase has four concrete problems that map to the four requirements:
1. **FOUND-01:** The Pool constructor in `database.js` hardcodes `max: 20` and omits `min`, `maxUses`, and `statement_timeout`. These should be env-configurable.
2. **FOUND-02:** The `pool.on('error')` handler in `database.js` calls `process.exit(-1)`, which is unnecessary because pg-pool automatically removes and replaces broken idle clients.
3. **FOUND-03:** All 5 transaction patterns (pages, sections, groups, bookmarks x2, import) call `client.release()` in `finally` without guarding against a null client if `pool.connect()` itself threw.
4. **FOUND-04:** No compression middleware is registered in `app.js`. The `compression` npm package (v1.8.1) supports both gzip and Brotli out of the box.

**Primary recommendation:** Make all four changes to the three affected files (`database.js`, `app.js`, and the 5 model/service files), add `compression` to dependencies, and add new env vars to `.env.example`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pg | ^8.11.5 | PostgreSQL client with built-in connection pooling | Already installed; pg.Pool is the standard Node.js PostgreSQL connection pool |
| compression | ^1.8.1 | Express middleware for gzip/Brotli/deflate response compression | Official Express middleware, supports Brotli since v1.8.0, zero-config defaults |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All requirements are satisfied by pg and compression alone |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| compression | http-compression | More granular control, but compression is the official Express middleware and already battle-tested |
| compression | @polka/compression | Lighter, but designed for Polka -- compression is the Express-native solution |

**Installation:**
```bash
cd backend && npm install compression
```

No other new packages are needed. `pg` is already installed at ^8.11.5.

## Architecture Patterns

### Affected Files
```
backend/src/
  shared/config/database.js          # Pool config + error handler (FOUND-01, FOUND-02)
  modules/pages/pages.model.js       # Transaction pattern (FOUND-03)
  modules/sections/sections.model.js # Transaction pattern (FOUND-03)
  modules/groups/groups.model.js     # Transaction pattern (FOUND-03)
  modules/bookmarks/bookmarks.model.js # Two transaction patterns (FOUND-03)
  modules/import/importService.js    # Transaction pattern (FOUND-03)
  app.js                             # Compression middleware (FOUND-04)
backend/.env.example                 # New env vars (FOUND-01)
```

### Pattern 1: Environment-Configurable Pool with Safe Error Handler
**What:** Replace hardcoded pool values with `parseInt(process.env.X, 10) || default` pattern. Replace `process.exit(-1)` with `console.error()` only.
**When to use:** Always -- this is the single pool configuration point.
**Example:**
```javascript
// Source: https://node-postgres.com/apis/pool + https://node-postgres.com/apis/client
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'pingrid',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // Pool sizing
  max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  // Connection lifecycle
  maxUses: parseInt(process.env.DB_POOL_MAX_USES, 10) || 7500,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT, 10) || 5000,
  // Query safety
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 30000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Log idle client errors but DO NOT crash -- pg-pool auto-removes and replaces the client
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err.message);
});

module.exports = pool;
```

### Pattern 2: Null-Safe Transaction with try/catch/finally
**What:** Declare `client` as `let` outside try, assign in try, guard release in finally with `if (client)`.
**When to use:** Every transaction pattern that uses `pool.connect()`.
**Example:**
```javascript
// Source: https://node-postgres.com/features/pooling + https://github.com/brianc/node-postgres/issues/1252
async function transactionExample() {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // ... business logic queries ...

    await client.query('COMMIT');
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
```

### Pattern 3: Compression Middleware (early in stack)
**What:** Add `compression()` as one of the first middlewares in Express, before routes.
**When to use:** Always -- it compresses all compressible responses automatically.
**Example:**
```javascript
// Source: https://expressjs.com/en/resources/middleware/compression.html
const compression = require('compression');

// Add BEFORE routes, AFTER security middleware (helmet)
app.use(compression());
// ... existing middleware and routes follow
```

### Anti-Patterns to Avoid
- **`process.exit()` in pool error handler:** The pool auto-recovers broken idle clients. Exiting kills the entire process for a non-fatal event. Use `console.error()` only.
- **Assigning client inside try without outer declaration:** If `pool.connect()` throws, `client` is undefined in `finally`, causing `TypeError: Cannot read property 'release' of undefined`.
- **Using `pool.query()` for transactions:** Pool dispatches each query to a random idle client. Transactions MUST use a single checked-out client via `pool.connect()`.
- **Putting compression after routes:** Compression must be early in the middleware stack to wrap response writes. If placed after routes, it has no effect.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Response compression | Custom gzip streams or manual Accept-Encoding parsing | `compression` npm package | Handles content-type detection, threshold, Accept-Encoding negotiation, streaming, and Brotli fallback automatically |
| Connection pool lifecycle | Manual connection counting or recycling logic | pg Pool `maxUses` option | Built into pg-pool; handles the counting, close, and replacement transparently |
| Statement timeout | Manual `setTimeout` + query cancellation | pg Client `statement_timeout` option | Maps directly to PostgreSQL server-side `statement_timeout` parameter; the server cancels the query, not the client |
| Pool error recovery | Custom reconnection logic or health-check polling | pg Pool built-in error handling | Pool automatically removes dead clients and creates replacements; just log the error |

**Key insight:** All four requirements are satisfied by configuring existing library features, not writing new functionality. The only new dependency is `compression` (an official Express middleware). Everything else is built into `pg`.

## Common Pitfalls

### Pitfall 1: TypeError on client.release() When pool.connect() Fails
**What goes wrong:** If `pool.connect()` throws (e.g., connection timeout, pool exhausted), the `client` variable is never assigned. The `finally` block calls `client.release()` on `undefined`, producing `TypeError: Cannot read properties of undefined (reading 'release')`.
**Why it happens:** The current code pattern declares `const client = await pool.connect()` inside the `try` block. If `pool.connect()` itself throws, execution jumps to `catch`, then `finally`, where `client` is undefined.
**How to avoid:** Declare `let client;` before the `try` block. Assign `client = await pool.connect()` inside `try`. Guard `finally` with `if (client) client.release()`.
**Warning signs:** Intermittent `TypeError` crashes during high load or database restarts.

### Pitfall 2: process.exit(-1) Kills the Server on Transient Network Errors
**What goes wrong:** Any momentary network glitch (DNS blip, brief PostgreSQL restart, TCP reset) kills the entire Node.js process.
**Why it happens:** The `pool.on('error')` handler calls `process.exit(-1)`. This was copied from old node-postgres documentation that has since been acknowledged as overly aggressive (see GitHub issue #2843).
**How to avoid:** Replace `process.exit(-1)` with `console.error()`. The pool automatically removes and replaces the broken client.
**Warning signs:** Server restarts in production logs correlating with brief database connectivity events.

### Pitfall 3: Forgetting to Guard ROLLBACK Against a Dead Connection
**What goes wrong:** If the database connection drops mid-transaction, the `catch` block tries `await client.query('ROLLBACK')` on a dead connection, which throws a second error that masks the original error.
**Why it happens:** The ROLLBACK call assumes the client connection is still alive.
**How to avoid:** Wrap the ROLLBACK in its own try/catch inside the outer catch block.
**Warning signs:** Error logs showing ROLLBACK failures or "connection terminated" instead of the actual business logic error.

### Pitfall 4: Compression Middleware Placed After Routes
**What goes wrong:** Responses are not compressed because the middleware never wraps the response stream.
**Why it happens:** Express middleware executes in registration order. If `compression()` is added after routes, routes have already sent their responses.
**How to avoid:** Register `compression()` early -- after security middleware (helmet, cors) but before any routes.
**Warning signs:** `Content-Encoding` header absent from API responses despite `compression` being installed.

### Pitfall 5: statement_timeout Too Aggressive
**What goes wrong:** Legitimate long-running queries (like large imports with many bookmarks) are killed.
**Why it happens:** `statement_timeout` applies to every query, including intentionally slow ones.
**How to avoid:** Set a reasonable default (30s) and consider per-query overrides if needed later. The current import transaction loops through bookmarks one-by-one, but each individual INSERT is fast.
**Warning signs:** PostgreSQL error "canceling statement due to statement timeout" in logs for valid operations.

## Code Examples

### Example 1: Complete database.js Replacement
```javascript
// Source: https://node-postgres.com/apis/pool + https://node-postgres.com/apis/client
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'pingrid',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  maxUses: parseInt(process.env.DB_POOL_MAX_USES, 10) || 7500,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT, 10) || 5000,
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 30000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message);
});

module.exports = pool;
```

### Example 2: Null-Safe Transaction (pages.model.js pattern)
```javascript
// Source: https://node-postgres.com/features/pooling
static async reorderPositions(userId, pageIds) {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    for (let i = 0; i < pageIds.length; i++) {
      await client.query(
        'UPDATE pages SET position = $1 WHERE id = $2 AND user_id = $3',
        [i, pageIds[i], userId]
      );
    }

    await client.query('COMMIT');
    return this.findAllByUser(userId);
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
```

### Example 3: Compression Middleware in app.js
```javascript
// Source: https://expressjs.com/en/resources/middleware/compression.html
const compression = require('compression');

// Add after helmet/cors, before routes
app.use(compression());
```

### Example 4: .env.example Additions
```bash
# Database Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_MAX_USES=7500
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=5000
DB_STATEMENT_TIMEOUT=30000
```

### Example 5: Verifying Compression Works
```bash
# Verify gzip
curl -s -H "Accept-Encoding: gzip" -D - http://localhost:5000/health -o /dev/null | grep Content-Encoding
# Expected: Content-Encoding: gzip

# Verify Brotli
curl -s -H "Accept-Encoding: br" -D - http://localhost:5000/health -o /dev/null | grep Content-Encoding
# Expected: Content-Encoding: br
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `process.exit(-1)` in pool error handler | Log-only error handler; pool auto-recovers | Acknowledged in node-postgres issue #2843 (2023) | Server stays up during transient DB errors |
| No `maxUses` on pool connections | `maxUses: 7500` for connection recycling | Added in pg-pool (available in pg ^8.x) | Enables load rebalancing when replicas are added |
| `compression` without Brotli | `compression` v1.8.0+ supports Brotli | July 2025 (v1.8.1 latest) | Better compression ratios for modern browsers |
| No `statement_timeout` | Client-level `statement_timeout` | Available in pg since early versions | Prevents runaway queries from holding connections |

**Deprecated/outdated:**
- Old node-postgres docs recommended `process.exit(-1)` in pool error handlers. This is now widely considered overly aggressive. The pool handles recovery automatically.

## Open Questions

1. **statement_timeout value for import operations**
   - What we know: The import service loops through bookmarks, running one INSERT per bookmark inside a transaction. Each individual statement is fast, but a large import could have many statements.
   - What's unclear: Whether the 30s statement_timeout applies per-statement (it does -- PostgreSQL applies it to each individual statement) or per-transaction (it does not).
   - Recommendation: 30s is safe. `statement_timeout` applies per-statement, not per-transaction. Even a large import with individual fast INSERTs will not hit a 30s per-statement limit.

2. **Compression threshold for small API responses**
   - What we know: The default threshold is 1KB. Many API responses (e.g., single bookmark CRUD) may be under 1KB.
   - What's unclear: Whether the health check and small CRUD responses will benefit from compression.
   - Recommendation: Keep the 1KB default. Compressing tiny payloads wastes CPU for negligible bandwidth savings. The aggregated page load (Phase 3) will produce large responses that benefit significantly.

## Sources

### Primary (HIGH confidence)
- [node-postgres Pool API](https://node-postgres.com/apis/pool) - Pool configuration options (max, min, idleTimeoutMillis, connectionTimeoutMillis, maxLifetimeSeconds, allowExitOnIdle)
- [node-postgres Client API](https://node-postgres.com/apis/client) - Client timeout options (statement_timeout, query_timeout, lock_timeout, idle_in_transaction_session_timeout)
- [node-postgres Pooling Guide](https://node-postgres.com/features/pooling) - Transaction patterns, client release requirements, pool.on('error') event
- [pg-pool README (GitHub)](https://github.com/brianc/node-postgres/blob/master/packages/pg-pool/README.md) - maxUses configuration and rationale
- [Express compression middleware](https://expressjs.com/en/resources/middleware/compression.html) - All options including Brotli configuration, threshold, filter

### Secondary (MEDIUM confidence)
- [node-postgres issue #2843](https://github.com/brianc/node-postgres/issues/2843) - Discussion on removing process.exit recommendation from pool error handler docs
- [node-postgres issue #1252](https://github.com/brianc/node-postgres/issues/1252) - Recommended async/await transaction pattern with try/catch/finally
- [node-postgres issue #418](https://github.com/brianc/node-postgres/issues/418) - Historical issue where pool.connect could return null client

### Tertiary (LOW confidence)
- (none -- all findings verified with primary or secondary sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official documentation; pg already installed, compression is official Express middleware
- Architecture: HIGH - Patterns directly sourced from node-postgres official docs and GitHub issues; verified against actual codebase
- Pitfalls: HIGH - All pitfalls observed in actual codebase code and confirmed by official node-postgres documentation and issue tracker

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (60 days -- all libraries are stable/mature with infrequent breaking changes)
