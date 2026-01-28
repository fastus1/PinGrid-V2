# External Integrations

**Analysis Date:** 2026-01-28

## APIs & External Services

**Not Detected:**
- No third-party API integrations (Stripe, AWS, Slack, etc.) are present in current codebase
- No analytics services (Sentry, Datadog, etc.)
- No email service integrations (SendGrid, Mailgun, etc.)

## Data Storage

**Databases:**
- PostgreSQL 15 (Alpine container)
  - Connection: `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=pingrid`, `DB_USER=postgres`, `DB_PASSWORD=postgres`
  - Client: `pg` package (v8.11.5) with connection pooling (max 20 connections)
  - Location: `backend/src/shared/config/database.js`
  - Pool settings: 30s idle timeout, 2s connection timeout
  - Management: 8 migration files in `backend/src/shared/migrations/`

**File Storage:**
- Local filesystem only
  - Favicon uploads: `backend/public/uploads/favicons/`
  - Image processing via Sharp (resize to 256x256 PNG with transparent background)
  - Endpoint: `POST /api/upload` (multer + sharp)
  - URL format: `/uploads/favicons/{filename}` (served via Express static middleware)

**Caching:**
- Redis 7 (Alpine container) - Optional/graceful degradation
  - Connection: `REDIS_HOST=localhost`, `REDIS_PORT=6379`
  - Client: `redis` package (v4.6.12)
  - Location: `backend/src/shared/config/redis.js`
  - Behavior: If unavailable, uses mock client that returns null/empty responses
  - Use cases: Click tracking, "Top Used" groups (dynamic bookmark grouping)

**Frontend Client-Side Storage:**
- IndexedDB - Page cache for static view mode
  - Service: `frontend/src/shared/services/cacheService.js`
  - DB Name: `pingrid-cache` (version 1)
  - Store: `page-cache` (keyed by pageId)
  - Data: Serialized page/section/group/bookmark hierarchy (Inbox groups filtered out)
  - Persistence: Browser-managed, survives page reloads

- localStorage - User preferences
  - `pingrid_faviconSize` - Favicon size preference (12-64px)
  - `pingrid_fontSize` - Font size preference (10-24px)

## Authentication & Identity

**Auth Provider:**
- Custom JWT implementation
  - Library: `jsonwebtoken` (v9.0.2)
  - Token strategy: Bearer tokens in Authorization header (`Authorization: Bearer <token>`)
  - Secret: `JWT_SECRET` environment variable (must be changed in production)
  - Expiry: Configurable via `JWT_EXPIRES_IN` (default: 7d)
  - Verification: `backend/src/modules/auth/auth.service.js`

**Implementation Details:**
- Register endpoint: `POST /api/auth/register` - Creates user with bcrypt-hashed password
- Login endpoint: `POST /api/auth/login` - Returns JWT token + user data
- Protected routes: Use `authMiddleware` (`backend/src/shared/middleware/auth.middleware.js`)
- Rate limiting: 5 attempts/15min on login, 3 attempts/15min on register
- Frontend persistence: Zustand store with localStorage (`frontend/src/features/auth/store/authStore.js`)
  - Persists: `user`, `token`, `isAuthenticated`
  - Storage key: `pingrid-auth-storage`

**Password Hashing:**
- Algorithm: bcrypt (v5.1.1)
- Used in: `backend/src/modules/auth/` (register, login, password validation)

## Monitoring & Observability

**Error Tracking:**
- Not implemented
- Unhandled rejections logged to console

**Logs:**
- Console-based (development)
- Request logging: Basic method + URL logging in `backend/src/app.js`
- Database connection status: Logged on connect/error events
- Redis connection status: Logged on connect/error events
- Health check endpoint: `GET /api/health` - Returns JSON status

**No External Services:**
- No Sentry, DataDog, New Relic, etc.

## CI/CD & Deployment

**Hosting:**
- Docker Compose (development/local)
  - Services: PostgreSQL, Redis, backend (Node.js), frontend (Vite dev server)
  - File: `docker-compose.yml` (v3.8 syntax)
  - Network: `pingrid-network` (bridge)
  - Volumes: `postgres_data`, `redis_data` (persistent)

**Container Images:**
- PostgreSQL: `postgres:15-alpine`
- Redis: `redis:7-alpine`
- Node.js backend: Custom image (built from project Dockerfile, not included in exploration)
- Frontend: Node.js dev server or Vite preview (not containerized in docker-compose)

**Deployment Configuration:**
- Backend Procfile: `backend/Procfile` (Heroku-style, referenced in git status)
- Backend nixpacks: `backend/nixpacks.toml` (Nix-based build definition)
- Frontend nixpacks: `frontend/nixpacks.toml` (Nix-based build definition)
- Root nixpacks: `nixpacks.toml` (Nix-based build definition)

**CI Pipeline:**
- Not detected in codebase (no .github/workflows, .gitlab-ci.yml, etc.)

## Environment Configuration

**Required Environment Variables - Backend:**
```
# Core
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pingrid
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=pingrid-dev-secret-key-2024-change-in-production-very-long-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Required Environment Variables - Frontend:**
```
VITE_API_URL=http://localhost:5000
```

**Secrets Location:**
- `.env` files (gitignored, not committed)
- Template files: `.env.example` in both backend and frontend directories
- Production: Must be provided via deployment platform (Docker secrets, environment variables, etc.)

**Configuration Variations:**
- `.env.docker.example` - Docker Compose setup
- `.env.local.example` - Local PostgreSQL installation (referenced in backend/.env.example)
- `.env.portainer` - Portainer deployment (referenced in git status)

## Webhooks & Callbacks

**Incoming:**
- Not detected
- Health check endpoint only: `GET /api/health`

**Outgoing:**
- Not detected
- No external API calls to third-party services

**Internal Messaging:**
- No message queue (no RabbitMQ, Bull, etc.)
- No WebSocket communication
- Synchronous HTTP-based architecture

## Health & Readiness Checks

**Database Connection Test:**
- Runs on server startup: `backend/src/server.js`
- Query: `SELECT NOW()` to verify PostgreSQL connectivity
- Logs success/failure with connection parameters
- Non-blocking: Server starts even if DB is unavailable

**Redis Connection Test:**
- Tested asynchronously on connection event
- Gracefully degrades: Mock client used if unavailable
- Non-critical for MVP

**HTTP Health Endpoint:**
- `GET /api/health`
- Response:
  ```json
  {
    "success": true,
    "message": "PinGrid API is running!",
    "timestamp": "2026-01-28T...",
    "environment": "development"
  }
  ```

---

*Integration audit: 2026-01-28*
