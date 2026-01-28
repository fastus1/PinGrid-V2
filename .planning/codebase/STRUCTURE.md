# Codebase Structure

**Analysis Date:** 2026-01-28

## Directory Layout

```
PinGrid V2.0/
├── backend/                    # Node.js Express API (Port 5000)
│   ├── src/
│   │   ├── server.js           # Entry point (startup, connection testing)
│   │   ├── app.js              # Express app configuration (middleware, routes)
│   │   ├── modules/            # Feature modules (auth, pages, sections, groups, bookmarks, upload, import)
│   │   │   ├── auth/           # User registration, login, JWT
│   │   │   ├── pages/          # Level 1 hierarchy (Pages CRUD, reorder)
│   │   │   ├── sections/       # Level 2 hierarchy (Sections CRUD, reorder, toggle-collapsed)
│   │   │   ├── groups/         # Level 3 hierarchy (Groups CRUD, manual + dynamic)
│   │   │   ├── bookmarks/      # Level 4 hierarchy (Bookmarks CRUD, click tracking, favicon)
│   │   │   ├── upload/         # File upload handling
│   │   │   └── import/         # Bookmark import utilities
│   │   └── shared/             # Cross-module utilities
│   │       ├── config/         # Database & Redis connections
│   │       ├── middleware/     # Auth, error handling
│   │       ├── migrations/     # SQL migration files
│   │       ├── services/       # Shared services (favicon handling)
│   │       ├── utils/          # Helper functions
│   │       ├── routes/         # Development routes (migrations)
│   │       └── scripts/        # Database scripts
│   ├── public/
│   │   └── uploads/            # Favicon storage (favicons/)
│   ├── .env                    # Environment variables (gitignored)
│   ├── .env.example            # Template for .env
│   ├── package.json
│   └── Procfile                # Deployment configuration
│
├── frontend/                   # React Vite App (Port 3000)
│   ├── src/
│   │   ├── main.jsx            # Vite entry point
│   │   ├── App.jsx             # Router setup, context providers
│   │   ├── pages/
│   │   │   └── Dashboard.jsx   # Main dashboard page (only page in application)
│   │   ├── features/           # Feature-based modules
│   │   │   ├── auth/           # Login, register, auth store, services
│   │   │   ├── pages/          # Page management (sidebar, CRUD, store, services)
│   │   │   ├── sections/       # Section management (list, modals, store, services)
│   │   │   ├── groups/         # Group display, drag context, store, services
│   │   │   ├── bookmarks/      # Bookmark cards, columns, drag context, store, services
│   │   │   └── import/         # Import dialog and utilities
│   │   └── shared/             # Global utilities
│   │       ├── components/     # Reusable UI components (SearchResults, ViewModeToggle, etc)
│   │       ├── store/          # Zustand stores (viewMode, search)
│   │       ├── services/       # HTTP clients (axios wrappers)
│   │       ├── context/        # React contexts (keyboard nav, drag contexts)
│   │       ├── theme/          # Theme provider and utilities
│   │       ├── hooks/          # Reusable React hooks
│   │       └── utils/          # Helper functions
│   ├── public/                 # Static assets
│   ├── .env                    # Environment variables (gitignored)
│   ├── .env.example            # Template for .env
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml          # PostgreSQL + Redis services
├── nixpacks.toml               # Nix package configuration (deployment)
├── .gitignore
├── CLAUDE.md                   # Claude project instructions
├── PLAN.md                     # Full architectural planning document
├── PLAN_ITERATIF.md            # Iteration-by-iteration implementation guide
├── PROGRESS.md                 # Overall development progress tracker
└── README.md                   # User-facing documentation
```

## Directory Purposes

**Backend Structure:**

**`backend/src/modules/`:**
- Purpose: Feature-based organization for CRUD operations and business logic
- Contains: [feature]/[feature].routes.js, [feature].controller.js, [feature].service.js, [feature].model.js
- Each module is self-contained: auth, pages, sections, groups, bookmarks, upload, import

**`backend/src/modules/auth/`:**
- Purpose: User authentication (register, login, JWT generation/validation)
- Key files:
  - `auth.routes.js` - Public POST /register, POST /login; Protected GET /me, POST /logout
  - `auth.controller.js` - HTTP request/response handling
  - `auth.service.js` - Password validation, JWT token generation, email validation
  - `auth.model.js` - User CRUD and password hashing (bcrypt)

**`backend/src/modules/pages/`:**
- Purpose: Level 1 of hierarchy - Top-level containers (e.g., "Work", "Personal")
- Key files:
  - `pages.routes.js` - GET /, POST /, GET /:id, PUT /:id, DELETE /:id, POST /reorder, GET /stats
  - `pages.controller.js` - Request validation and error handling
  - `pages.service.js` - Business logic (validation, name uniqueness checks)
  - `pages.model.js` - Database operations with auto-position calculation

**`backend/src/modules/sections/`:**
- Purpose: Level 2 of hierarchy - Vertical drag & drop blocks within pages
- Key files: Similar structure to pages
- Route params: Query `?pageId=X` for getting sections

**`backend/src/modules/groups/`:**
- Purpose: Level 3 of hierarchy - Grid containers (1-6 columns) within sections
- Additional features: Column count, group type (manual/dynamic), bookmark limit
- Key files: Similar structure with additional group-specific validation

**`backend/src/modules/bookmarks/`:**
- Purpose: Level 4 of hierarchy - Individual bookmark cards
- Additional features: Click tracking, favicon URL, column assignment, visit count
- Routes include: /top-used, /stats, /:id/click, /:id/refresh-favicon, /scan-site
- Key files:
  - `bookmarks.controller.js` - Handles all bookmark CRUD + click tracking
  - `bookmarks.model.js` - Column-aware position calculation (`MAX(position) WHERE column = X`)

**`backend/src/modules/upload/`:**
- Purpose: File upload handling (favicons, site screenshots)
- Key files: `upload.controller.js`, `upload.routes.js`
- Saves to: `backend/public/uploads/favicons/`

**`backend/src/modules/import/`:**
- Purpose: Bulk bookmark import (from browser bookmarks, CSV, etc)
- Key files: `importRoutes.js` and associated utilities

**`backend/src/shared/`:**
- Purpose: Cross-module functionality
- `config/` - Database pool, Redis connection setup
- `middleware/` - auth.middleware (JWT validation), errorHandler (global error catching)
- `migrations/` - SQL files for database schema (008_add_group_width.sql, etc)
- `services/` - faviconService (favicon discovery and caching)
- `utils/` - Common helper functions
- `routes/` - Development-only routes (migrations endpoint)

**Frontend Structure:**

**`frontend/src/features/`:**
- Purpose: Feature-based organization, mirrors backend modules
- Each feature module: components/, store/, services/, context/, hooks/, utils/

**`frontend/src/features/auth/`:**
- Purpose: Authentication UI and state
- Key files:
  - `components/LoginForm.jsx` - Login UI
  - `components/RegisterForm.jsx` - Registration UI
  - `components/ProtectedRoute.jsx` - Route guard (redirects unauthenticated to /login)
  - `store/authStore.js` - Zustand store for user/token (with persist middleware)
  - `services/authService.js` - Axios wrapper for /api/auth endpoints

**`frontend/src/features/pages/`:**
- Purpose: Page management UI and state
- Key files:
  - `components/Sidebar.jsx` - List of pages, current page selection
  - `components/PageView.jsx` - Displays sections for current page
  - `components/CreatePageModal.jsx` - Modal for new page
  - `components/EditPageModal.jsx` - Modal for editing page
  - `components/PageTabs.jsx` - (possibly unused or for future use)
  - `store/pagesStore.js` - Zustand store (pages[], currentPage, loading, error)
  - `services/pagesService.js` - Axios GET/POST/PUT/DELETE /api/pages

**`frontend/src/features/sections/`:**
- Purpose: Section management UI and state
- Key files:
  - `components/SectionList.jsx` - Renders sections for current page
  - `components/SectionCard.jsx` - Individual section card with header
  - `components/CreateSectionModal.jsx` - Modal for new section
  - `components/EditSectionModal.jsx` - Modal for editing section
  - `store/sectionsStore.js` - Zustand store (sectionsMap by pageId)
  - `services/sectionsService.js` - Axios wrapper for /api/sections

**`frontend/src/features/groups/`:**
- Purpose: Group display and drag context
- Key files:
  - `components/GroupCard.jsx` - Individual group container with column grid
  - `context/GroupDragContext.jsx` - React Context for group drag & drop (future feature)
  - `store/groupsStore.js` - Zustand store (groupsMap by sectionId)
  - `services/groupsService.js` - Axios wrapper for /api/groups

**`frontend/src/features/bookmarks/`:**
- Purpose: Bookmark display, interaction, and drag context
- Key files:
  - `components/BookmarkList.jsx` - Renders columns of bookmarks for a group
  - `components/BookmarkColumn.jsx` - Individual column container
  - `components/BookmarkCard.jsx` - Individual bookmark card with favicon, title
  - `components/CreateBookmarkModal.jsx` - Modal for new bookmark
  - `components/EditBookmarkModal/` - Modal for editing bookmark
  - `components/FaviconDesigner.jsx` - UI for selecting/uploading favicons
  - `components/QuickAddBar.jsx` - Quick add button
  - `context/BookmarkDragContext.jsx` - React Context for bookmark drag & drop within/between columns
  - `store/bookmarksStore.js` - Zustand store (bookmarksMap by groupId)
  - `services/bookmarksService.js` - Axios wrapper for /api/bookmarks
  - `hooks/` - Custom hooks (potentially for bookmark logic)
  - `utils/` - Helper functions (position calculation, etc)

**`frontend/src/features/import/`:**
- Purpose: Bookmark import dialog and utilities
- Key files: `ImportDialog.jsx` and associated utilities

**`frontend/src/shared/`:**
- Purpose: Global functionality used by multiple features

**`frontend/src/shared/components/`:**
- Purpose: Reusable UI components (not feature-specific)
- Key files:
  - `SearchResultsView.jsx` - Display search results overlay
  - `StaticPageView.jsx` - Static page rendering (for caching/export)
  - `ViewModeToggle.jsx` - Switch between view/edit modes
  - `ThemeSwitcher.jsx` - Dark/light theme toggle

**`frontend/src/shared/store/`:**
- Purpose: Global application state
- `authStore.js` - User and authentication state (in features/auth/store, not here)
- `viewModeStore.js` - Edit/View mode toggle, cached page snapshots
- `searchStore.js` - Search query and results state

**`frontend/src/shared/services/`:**
- Purpose: HTTP client configuration
- `cacheService.js` - IndexedDB/localStorage caching for offline mode

**`frontend/src/shared/context/`:**
- Purpose: React Context API utilities
- `KeyboardNavigationContext.jsx` - Keyboard shortcut handling (arrow keys, enter for opening bookmarks)

**`frontend/src/shared/theme/`:**
- Purpose: Theme management (dark/light mode)
- Key files:
  - `ThemeProvider.jsx` - Provides theme context to entire app
  - `ThemeContext.jsx` - Theme context definition
  - `useTheme.js` - Hook for accessing theme
  - `themeUtils.js` - Color utilities and theme definitions
  - `themes.js` - Light/dark theme configurations

**`frontend/src/shared/hooks/`:**
- Purpose: Reusable React hooks
- Potentially: useFetch, useDebounce, etc (implementation specific)

**`frontend/src/pages/`:**
- Purpose: Page-level components (only Dashboard.jsx currently)
- `Dashboard.jsx` - Main application page containing sidebar + page view

## Key File Locations

**Entry Points:**
- `backend/src/server.js` - Backend startup (creates Express app, tests connections, listens)
- `backend/src/app.js` - Express app configuration (middleware, route mounting, error handler)
- `frontend/src/main.jsx` - Vite entry point (mounts React app)
- `frontend/src/App.jsx` - Router configuration and provider setup

**Configuration:**
- `backend/src/shared/config/database.js` - PostgreSQL connection pool (pg)
- `backend/src/shared/config/redis.js` - Redis client configuration
- `frontend/vite.config.js` - Vite build configuration
- `docker-compose.yml` - Docker services (PostgreSQL, Redis)
- `.env` files - Environment variables (both backend and frontend)

**Database & Migrations:**
- `backend/src/shared/migrations/` - SQL migration files (001_, 002_, ..., 008_add_group_width.sql)
- `backend/src/shared/config/database.js` - Connection setup
- Models in each module call database.query() for CRUD

**Core Logic:**
- `backend/src/modules/*/[feature].service.js` - Business logic (validation, transformation)
- `backend/src/modules/*/[feature].model.js` - Database queries and data operations
- `frontend/src/features/*/store/[feature]Store.js` - Frontend state management (Zustand)
- `frontend/src/shared/theme/ThemeProvider.jsx` - Global theme application

**Testing:**
- `backend/tests/` - Test files (if present; minimal based on exploration)
- Test files use `.test.js` or `.spec.js` suffix (based on conventions)

**Shared Utilities:**
- `backend/src/shared/middleware/auth.middleware.js` - JWT validation
- `backend/src/shared/middleware/errorHandler.js` - Global error handling
- `backend/src/shared/services/faviconService.js` - Favicon fetching and caching
- `frontend/src/shared/services/cacheService.js` - LocalStorage/IndexedDB caching

## Naming Conventions

**Files:**
- Models: `[feature].model.js` (e.g., `pages.model.js`, `bookmarks.model.js`)
- Controllers: `[feature].controller.js` (e.g., `pages.controller.js`)
- Services: `[feature].service.js` (e.g., `pages.service.js`) - Backend business logic
- Services: `[feature]Service.js` (e.g., `pagesService.js`) - Frontend HTTP clients
- Routes: `[feature].routes.js` (e.g., `pages.routes.js`)
- Stores: `[feature]Store.js` (e.g., `pagesStore.js`, `authStore.js`) - Zustand stores
- Contexts: `[Feature]Context.jsx` (e.g., `BookmarkDragContext.jsx`, `GroupDragContext.jsx`)
- Components: `PascalCase.jsx` (e.g., `LoginForm.jsx`, `BookmarkCard.jsx`)
- Hooks: `useHook.js` (e.g., `useTheme.js`, `useKeyboardNavigation()`)
- Utilities: `camelCase.js` (e.g., `cacheService.js`, `themeUtils.js`)

**Directories:**
- Feature modules: `lowercase` (e.g., `auth`, `pages`, `bookmarks`)
- Components: `components/` folder per feature
- Stores: `store/` folder per feature
- Services: `services/` folder per feature
- Contexts: `context/` folder per feature
- Utilities: `utils/` folder per feature

**Variables & Functions:**
- Constants: `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`, `PORT`)
- Functions: `camelCase` (e.g., `generateToken`, `findAllByUser`)
- React Components: `PascalCase` (e.g., `LoginForm`, `BookmarkCard`)
- React Hooks: `useHook` prefix (e.g., `useAuthStore`, `useTheme`)
- State variables: `camelCase` (e.g., `isLoading`, `currentPage`)

**Database:**
- Tables: `lowercase_plural` (e.g., `users`, `pages`, `sections`, `groups`, `bookmarks`)
- Columns: `snake_case` (e.g., `user_id`, `created_at`, `visit_count`, `favicon_url`)
- Primary keys: `id` (UUID type)
- Foreign keys: `[table]_id` (e.g., `page_id`, `section_id`, `group_id`)

## Where to Add New Code

**New Feature:**
- Primary code: `backend/src/modules/[feature]/` - Create routes.js, controller.js, service.js, model.js
- Tests: `backend/tests/[feature].test.js` - Unit and integration tests
- Frontend: `frontend/src/features/[feature]/` - Create components/, store/, services/ subdirectories

**New Component/Module:**
- React Component: `frontend/src/features/[feature]/components/[Component].jsx`
- Associated store: `frontend/src/features/[feature]/store/[feature]Store.js`
- Associated services: `frontend/src/features/[feature]/services/[feature]Service.js`

**Shared Backend Utilities:**
- Middleware: `backend/src/shared/middleware/[concern].js`
- Services: `backend/src/shared/services/[domain]Service.js`
- Utilities: `backend/src/shared/utils/[domain].js`
- Database config: `backend/src/shared/config/[db].js`

**Shared Frontend Utilities:**
- Reusable components: `frontend/src/shared/components/[Component].jsx`
- Global stores: `frontend/src/shared/store/[domain]Store.js`
- Context providers: `frontend/src/shared/context/[Concern]Context.jsx`
- Custom hooks: `frontend/src/shared/hooks/useHook.js`
- Theme utilities: `frontend/src/shared/theme/[utility].js`

**API Routes:**
- All routes mounted at `backend/src/app.js` line 56-62
- New routes added as: `app.use('/api/[feature]', require('./modules/[feature]/[feature].routes'))`
- Within module routes: `router.get()`, `router.post()`, `router.put()`, `router.delete()`, `router.post('/action')`

## Special Directories

**`backend/public/uploads/`:**
- Purpose: Stores uploaded files (favicons, images)
- Generated: Yes (created by upload controller)
- Committed: No (ignored in .gitignore)
- Subdirectories: `favicons/` for favicon files

**`backend/src/shared/migrations/`:**
- Purpose: Database schema evolution scripts
- Files: `001_initial_schema.sql`, `002_*.sql`, ..., `008_add_group_width.sql`
- Generated: No (manually created)
- Committed: Yes (part of version control)
- Execution: Via development endpoint `/api/migrations` (NODE_ENV === 'development' only)

**`frontend/dist/`:**
- Purpose: Built production assets (Vite output)
- Generated: Yes (by `npm run build`)
- Committed: No (ignored in .gitignore)
- Contains: index.html, assets/ (JS bundles, CSS)

**`frontend/public/`:**
- Purpose: Static assets served directly (favicons, manifest, etc)
- Generated: No
- Committed: Yes (part of source)
- Contents: health file (index.html fallback), potentially favicon.ico

**`node_modules/` (both directories):**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (ignored in .gitignore)

**`.env` files (both directories):**
- Purpose: Environment variables per environment
- Generated: No (copied from .env.example)
- Committed: No (ignored in .gitignore, security risk)
- Required vars:
  - Backend: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, REDIS_URL
  - Frontend: VITE_API_URL

---

*Structure analysis: 2026-01-28*
