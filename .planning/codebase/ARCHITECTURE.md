# Architecture

**Analysis Date:** 2026-01-28

## Pattern Overview

**Overall:** Feature-Based Modular with Layered Architecture (MVC-inspired backend, Component-driven frontend)

**Key Characteristics:**
- Clear separation of concerns: Routes → Controllers → Services → Models
- API-first design with RESTful endpoints
- Zustand-based state management on frontend
- JWT authentication protecting all protected routes
- Hierarchical CRUD operations: Page → Section → Group → Bookmark
- Stateless backend with database as source of truth

## Layers

**Frontend (React/Vite):**
- Purpose: UI rendering and user interaction
- Location: `frontend/src/`
- Entry point: `frontend/src/main.jsx`
- Contains: React components, hooks, stores (Zustand), services (Axios)
- Depends on: React 18, Vite, Zustand, Axios
- Used by: Browser/HTTP clients

**Backend (Express/Node.js):**
- Purpose: API service and business logic
- Location: `backend/src/`
- Entry point: `backend/src/server.js`
- Contains: Controllers, services, models, middleware
- Depends on: Express, PostgreSQL, Redis, JWT
- Used by: Frontend and external clients

**Database (PostgreSQL):**
- Purpose: Persistent data storage
- Connection: `backend/src/shared/config/database.js`
- Tables: users, pages, sections, groups, bookmarks, click_logs
- Accessed by: All backend models via pg Pool

**Cache (Redis):**
- Purpose: Session and ephemeral data caching
- Connection: `backend/src/shared/config/redis.js`
- Used by: Click tracking and metrics (potential)
- Accessed by: Backend services

## Data Flow

**Authentication Flow:**
1. User submits credentials → `LoginForm` component
2. Frontend calls `authService.login()` with POST to `/api/auth/login`
3. Backend `auth.controller.login()` receives request
4. `authService.login()` validates email/password via `User.verifyPassword()`
5. JWT token generated via `authService.generateToken()`
6. Token stored in `useAuthStore` (Zustand + localStorage)
7. Frontend attaches token to all subsequent requests in Authorization header

**Page Data Fetch Flow:**
1. User navigates to Dashboard
2. `Dashboard` component calls `usePagesStore.fetchPages()`
3. Frontend calls `pagesService.getAll(token)` with GET to `/api/pages`
4. Request hits `authMiddleware` for token validation
5. Backend `pages.controller.getAll()` extracts `userId` from `req.user.id` (set by middleware)
6. `pagesService.getUserPages(userId)` called
7. `Page.findAllByUser(userId)` queries database
8. Results stored in Zustand store, triggers re-render

**Creating a Bookmark Flow:**
1. User clicks "Add Bookmark" in `BookmarkList`
2. `CreateBookmarkModal` collects input
3. Frontend calls `bookmarksService.create(bookmarkData, token)`
4. POST to `/api/bookmarks` with body `{ groupId, title, url, description, favicon_url }`
5. `authMiddleware` validates token → sets `req.user`
6. `bookmarks.controller.create()` validates input
7. `bookmarksService.createBookmark()` calls `Bookmark.create(groupId, userId, bookmarkData)`
8. Auto-increment position logic in model: `MAX(position) + 1`
9. INSERT into bookmarks table
10. Response with 201 status and created bookmark
11. Frontend updates `useBookmarksStore`
12. UI re-renders with new bookmark

**Update Flow with Ownership Verification:**
1. User updates a page name
2. Frontend calls `pagesService.update(pageId, updates, token)`
3. PUT request to `/api/pages/:id`
4. `pages.controller.update()` checks if page exists AND belongs to user
5. `pagesService.updatePage()` calls `Page.findById(pageId, userId)`
6. Query uses both `id` AND `user_id` in WHERE clause (ownership check)
7. If null, throws "Page not found or access denied"
8. Only updates if verified ownership
9. Frontend updates store on success

## Key Abstractions

**Hierarchical Structure:**
- Purpose: Organize bookmarks into logical containers with 4 levels
- Examples: `Page.findAllByUser()`, `Section.findAllByPage()`, `Group.findAllBySection()`, `Bookmark.findAllByGroup()`
- Pattern: Each level contains parent_id foreign key, verified during CRUD operations

**Models (M in MVC):**
- Purpose: Database interaction and queries
- Examples: `backend/src/modules/pages/pages.model.js`, `backend/src/modules/bookmarks/bookmarks.model.js`
- Pattern: Static methods, parameterized queries to prevent SQL injection, auto-position calculation

**Services (Business Logic):**
- Purpose: Validation, transformation, orchestration
- Examples: `backend/src/modules/pages/pages.service.js`, `backend/src/modules/bookmarks/bookmarks.service.js`
- Pattern: Dependency injection (receives data from controller), throws validation errors caught by controller

**Controllers (C in MVC):**
- Purpose: HTTP request handling and response formatting
- Examples: `backend/src/modules/pages/pages.controller.js`, `backend/src/modules/bookmarks/bookmarks.controller.js`
- Pattern: Try-catch blocks, status code selection based on error type, consistent JSON response format

**Zustand Stores (Frontend State):**
- Purpose: Global application state management
- Examples: `usePagesStore`, `useSectionsStore`, `useGroupsStore`, `useBookmarksStore`, `useAuthStore`
- Pattern: `(set, get) => ({ state, actions })`, async actions with loading/error states, persist middleware for localStorage

**Middleware:**
- Purpose: Cross-cutting concerns (auth, error handling)
- Examples: `authMiddleware` (token validation), `errorHandler` (global error catching)
- Pattern: Express middleware chain, attached to routes or globally

## Entry Points

**Backend Entry:**
- Location: `backend/src/server.js`
- Triggers: `npm run dev` in backend directory
- Responsibilities: Start Express app, test database/Redis connections, listen on PORT 5000

**Frontend Entry:**
- Location: `frontend/src/main.jsx`
- Triggers: `npm run dev` in frontend directory
- Responsibilities: Mount React app to DOM, initialize providers (Theme, DragContexts), render Router

**API Entry Points:**
- Health: `GET /health` - Returns server status
- Auth: `POST /api/auth/login`, `POST /api/auth/register`
- Pages: `GET /api/pages`, `POST /api/pages`, `PUT /api/pages/:id`, `DELETE /api/pages/:id`
- Sections: `GET /api/sections`, `POST /api/sections`, `PUT /api/sections/:id`, `DELETE /api/sections/:id`
- Groups: `GET /api/groups`, `POST /api/groups`, `PUT /api/groups/:id`, `DELETE /api/groups/:id`
- Bookmarks: `GET /api/bookmarks`, `POST /api/bookmarks`, `PUT /api/bookmarks/:id`, `DELETE /api/bookmarks/:id`, `POST /api/bookmarks/:id/click`

## Error Handling

**Strategy:** Consistent error format with status codes, global error handler catches unhandled rejections

**Patterns:**

Backend error responses:
```javascript
// 400 Bad Request
{ success: false, error: "Validation message" }

// 401 Unauthorized
{ success: false, error: "Invalid token" }

// 404 Not Found
{ success: false, error: "Page not found or access denied" }

// 500 Server Error (caught by global handler)
{ success: false, error: "Internal Server Error", stack: "..." (dev only) }
```

Error sources:
- Route validation (missing required query params/body) → Controller → `res.status(400)`
- Business logic validation (duplicate names, invalid formats) → Service throws → Controller catches → `res.status(400)`
- Authentication/Authorization → authMiddleware → `res.status(401)`
- Resource not found or ownership denied → Service throws → Controller catches → `res.status(404)`
- Unhandled errors → Catch-all `errorHandler` middleware → `res.status(500)`

Frontend error handling:
- Axios interceptors catch HTTP errors
- Zustand actions wrap in try-catch
- Errors stored in store state: `{ error, loading }`
- Components display error messages or fallback UI

## Cross-Cutting Concerns

**Logging:** Console-based (development only)
- Backend: `console.log()` for request info, `console.error()` for errors
- Frontend: `console.log()` for debugging hooks and state changes
- Files: `backend/src/app.js` (debug logger middleware), Dashboard and hooks

**Validation:** Occurs at three levels
- Frontend: Input fields (HTML5 + custom JS in components)
- Controller: Request shape validation (required params, array checks)
- Service: Business logic validation (name uniqueness, format rules, ownership)
- Model: Database constraints (foreign keys, NOT NULL, unique constraints)

**Authentication:**
- Mechanism: JWT tokens in Authorization header: `Bearer <token>`
- Protected Routes: All non-auth routes require `authMiddleware`
- Token Generation: `authService.generateToken(user)` using JWT_SECRET
- Token Validation: `authMiddleware` calls `authService.verifyToken(token)`
- Session: Token stored in browser localStorage, attached to all requests

**Authorization (Ownership Verification):**
- Pattern: Query includes `user_id` in WHERE clause at model level
- Examples:
  - `Page.findById(id, userId)` - WHERE `id` AND `user_id`
  - `Section.findById(id, userId)` - INNER JOIN pages to check `user_id`
  - `Group.findById(id, userId)` - INNER JOIN sections → pages to check `user_id`
  - `Bookmark.findById(id, userId)` - INNER JOIN groups → sections → pages to check `user_id`

**Rate Limiting:**
- Auth routes only: `express-rate-limit` middleware
- Login: 5 attempts per 15 minutes per IP
- Register: 3 attempts per 15 minutes per IP
- Files: `backend/src/modules/auth/auth.routes.js`

---

*Architecture analysis: 2026-01-28*
