# Technology Stack

**Analysis Date:** 2026-01-28

## Languages

**Primary:**
- JavaScript (Node.js) - Backend API and server runtime
- JavaScript (React/JSX) - Frontend UI and state management
- SQL (PostgreSQL) - Database queries and migrations

**Secondary:**
- CSS/SCSS - Styling (Lucide React icons, custom themes)

## Runtime

**Environment:**
- Node.js 18+ - Primary runtime (no `.nvmrc` file present; version defined in package.json engines or Docker)

**Package Manager:**
- npm - Package management for both backend and frontend
- Lockfile: Not visible in exploration (likely present but not committed)

## Frameworks

**Core:**
- React 18.2.0 - Frontend UI framework
- Express 4.18.2 - Backend API framework

**Routing:**
- React Router v6.20.1 - Client-side routing (`frontend/src/App.jsx`)

**Build/Dev:**
- Vite 5.0.8 - Frontend bundler and dev server
- nodemon 3.0.2 - Backend auto-reload during development
- @vitejs/plugin-react 4.2.1 - Vite React plugin

**Testing:**
- Not yet implemented (placeholder test script in `backend/package.json`)

## Key Dependencies

**Frontend State & Data:**
- Zustand 4.4.7 - Global state management (`frontend/src/features/*/store/`, `frontend/src/shared/store/`)
  - Auth store: `frontend/src/features/auth/store/authStore.js`
  - Groups store: `frontend/src/features/groups/store/groupsStore.js`
  - Sections store: `frontend/src/features/sections/store/sectionsStore.js`
  - Bookmarks store: `frontend/src/features/bookmarks/store/bookmarksStore.js`
  - View mode store: `frontend/src/shared/store/viewModeStore.js`
  - Search store: `frontend/src/shared/store/searchStore.js`

- Axios 1.6.2 - HTTP client for API calls
- react-window 1.8.10 - Virtual scrolling for large lists
- lucide-react 0.562.0 - Icon library

**Frontend UI:**
- react-dom 18.2.0 - React rendering to DOM
- @types/react 18.2.43 - TypeScript types (dev only)
- @types/react-dom 18.2.17 - TypeScript types (dev only)

**Backend Security & Auth:**
- jsonwebtoken 9.0.2 - JWT token generation and verification
- bcrypt 5.1.1 - Password hashing (used in `backend/src/modules/auth/`)
- helmet 7.1.0 - Security headers middleware (`backend/src/app.js`)
- cors 2.8.5 - CORS configuration (`backend/src/app.js`)
- express-rate-limit 8.2.1 - Rate limiting for auth endpoints (`backend/src/modules/auth/auth.routes.js`)

**Backend Database:**
- pg 8.11.5 - PostgreSQL client (connection pool: `backend/src/shared/config/database.js`)
- redis 4.6.12 - Redis client (optional, graceful degradation: `backend/src/shared/config/redis.js`)

**Backend Media & Processing:**
- multer 2.0.2 - File upload handling (`backend/src/modules/upload/upload.routes.js`)
- sharp 0.34.5 - Image processing (resize, format conversion: `backend/src/modules/upload/upload.controller.js`)
- cheerio 1.1.2 - HTML parsing (likely for import/scraping features)

**Backend Environment:**
- dotenv 16.3.1 - Environment variable loading (`backend/src/app.js`, `backend/src/shared/config/`)

**Development Tools:**
- ESLint 9.39.2 - Code linting (`backend/.eslintrc.js`)
- Prettier 3.7.4 - Code formatting (`backend/.prettierrc`)
- eslint-config-prettier 10.1.8 - ESLint + Prettier integration

## Configuration

**Environment Variables - Backend:**
Location: `backend/.env` (template: `backend/.env.example`)

Core variables:
- `NODE_ENV` - Application environment (development/production)
- `PORT` - Server port (default: 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `JWT_SECRET` - Token signing key (must be changed in production)
- `JWT_EXPIRES_IN` - Token expiry duration (default: 7d)
- `CORS_ORIGIN` - Frontend origin for CORS (default: http://localhost:3000)

**Environment Variables - Frontend:**
Location: `frontend/.env` (template: `frontend/.env.example`)

Core variables:
- `VITE_API_URL` - Backend API base URL (default: http://localhost:5000)

**Build Configuration:**
- Vite config: `frontend/vite.config.js` - Minimal React setup, port 3000, auto-open
- ESLint config: `backend/.eslintrc.js` - JavaScript linting rules
- Prettier config: `backend/.prettierrc` - Code formatting rules

## Platform Requirements

**Development:**
- Node.js 18+
- npm or yarn
- Docker + Docker Compose (for PostgreSQL + Redis)
- Ports: 3000 (frontend), 5000 (backend), 5432 (PostgreSQL), 6379 (Redis)

**Production:**
- Node.js 18+ runtime
- PostgreSQL 15+ database
- Redis 7+ for caching (optional, graceful fallback)
- Static file serving (for favicon uploads)
- Reverse proxy (nginx recommended) for CORS and SSL

**Database Schema:**
- PostgreSQL 15 (Alpine)
- Migrations: `backend/src/shared/migrations/` (8 SQL files)
  - 001_create_users.sql - User table with hashing
  - 002_create_pages.sql - Pages hierarchy level 1
  - 003_create_sections.sql - Sections hierarchy level 2
  - 004_create_groups.sql - Groups hierarchy level 3
  - 005_create_bookmarks.sql - Bookmarks hierarchy level 4
  - 006_create_icons_cache.sql - Favicon caching
  - 007_add_column_to_bookmarks.sql - Additional bookmark columns
  - 008_add_group_width.sql - Column count for group layout

**Caching:**
- Redis 7 (Alpine) - Optional, used for bookmark click tracking and "Top Used" groups
- Graceful degradation: If Redis unavailable, app continues with mock client

**Static File Serving:**
- Uploaded favicons: `backend/public/uploads/favicons/`
- Served via Express static middleware: `app.use(express.static(...))`

---

*Stack analysis: 2026-01-28*
