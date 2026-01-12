# PinGrid V2.0 - Plan d'implémentation complet

## Vue d'ensemble du projet

**PinGrid** est une application web moderne de gestion de bookmarks avec interface visuelle intuitive. Elle offre une organisation flexible avec drag-and-drop, récupération intelligente de favicons, catégories hiérarchiques, et import/export de bookmarks.

### Stack technique choisie
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de données**: PostgreSQL
- **Authentification**: JWT (Phase 1: Email/Password → Phase 2: Google + Facebook OAuth)
- **État**: Zustand (state management)
- **Drag & Drop**: @dnd-kit/core

---

## 1. Structure du projet

```
pingrid-v2/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, JWT, passport, storage
│   │   ├── middleware/      # Auth, admin, error, rate limiter, upload
│   │   ├── models/          # User, Bookmark, Category, Icon, Session
│   │   ├── controllers/     # Auth, user, bookmark, category, icon, import, export, admin
│   │   ├── routes/          # API routes (/api/auth, /api/bookmarks, etc.)
│   │   ├── services/        # Favicon, import, export, email, storage
│   │   ├── utils/           # Logger, crypto, validators, helpers
│   │   ├── db/
│   │   │   └── migrations/  # SQL migration files
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/               # Unit, integration tests
│   ├── uploads/icons/       # Uploaded custom icons
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Button, Input, Modal, Dropdown, Toast
│   │   │   ├── layout/      # Header, Sidebar, MainLayout
│   │   │   ├── auth/        # LoginForm, RegisterForm, OAuthButtons
│   │   │   ├── bookmarks/   # BookmarkCard, BookmarkGrid, BookmarkList, BookmarkKanban
│   │   │   ├── categories/  # CategoryForm, CategoryManager, CategoryTree
│   │   │   ├── import/      # ImportWizard (multi-step)
│   │   │   ├── export/      # ExportDialog
│   │   │   └── admin/       # Dashboard, UserManagement, SystemStats
│   │   ├── pages/           # Login, Register, Dashboard, Settings, AdminDashboard
│   │   ├── hooks/           # useAuth, useBookmarks, useCategories, useDragDrop
│   │   ├── context/         # AuthContext, BookmarkContext, UIContext, ThemeContext
│   │   ├── stores/          # Zustand stores
│   │   ├── services/        # API clients (authService, bookmarkService, etc.)
│   │   ├── utils/           # Validators, formatters, constants, helpers
│   │   ├── App.jsx
│   │   └── index.jsx
│   └── package.json
│
└── docker-compose.yml
```

---

## 2. Schéma de base de données PostgreSQL

### Tables principales

**users**
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR) -- NULL pour OAuth
- first_name, last_name (VARCHAR)
- avatar_url (TEXT)
- is_admin (BOOLEAN) -- Pour dashboard admin
- is_active (BOOLEAN) -- Pour bloquer/débloquer users
- auth_provider (VARCHAR) -- 'local', 'google', 'facebook'
- oauth_id (VARCHAR)
- created_at, updated_at, last_login_at (TIMESTAMP)
```

**sessions** (Refresh tokens)
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- refresh_token (VARCHAR, UNIQUE)
- user_agent, ip_address
- expires_at (TIMESTAMP)
- created_at
```

**categories** (Modèle Nested Set pour hiérarchie)
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- parent_id (UUID, FK → categories)
- name (VARCHAR)
- description, color, icon (VARCHAR)
- position (INTEGER) -- Pour ordering manuel
- lft, rgt, depth (INTEGER) -- Nested set boundaries
- created_at, updated_at
```

**bookmarks**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- category_id (UUID, FK → categories)
- icon_id (UUID, FK → icons)
- title (VARCHAR 500)
- url (TEXT)
- description, notes (TEXT)
- tags (TEXT[]) -- Array PostgreSQL
- position (INTEGER) -- Pour drag-and-drop
- is_favorite (BOOLEAN)
- visit_count (INTEGER)
- last_visited_at, created_at, updated_at (TIMESTAMP)
```

**icons** (Cache favicons + custom icons)
```sql
- id (UUID, PK)
- user_id (UUID, FK → users) -- NULL pour cached favicons partagés
- domain (VARCHAR) -- Pour cached favicons
- icon_type (VARCHAR) -- 'custom', 'favicon', 'fallback'
- file_path (TEXT)
- file_size, mime_type, width, height
- is_public (BOOLEAN) -- Pour partage cache favicon
- created_at
```

**import_history**
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- source_type (VARCHAR) -- 'chrome', 'firefox', 'safari', 'html', 'json', 'csv'
- file_name, total_bookmarks, imported_count, failed_count
- status (VARCHAR) -- 'pending', 'completed', 'failed'
- error_log (TEXT)
- created_at
```

**activity_log** (Pour statistiques admin)
```sql
- id (BIGSERIAL, PK)
- user_id (UUID, FK → users)
- action (VARCHAR) -- 'login', 'bookmark_create', etc.
- resource_type, resource_id
- metadata (JSONB)
- ip_address, user_agent
- created_at
```

### Index clés
- `idx_bookmarks_user_category_position` pour tri drag-and-drop
- `idx_categories_tree (user_id, lft, rgt)` pour requêtes arbre
- `idx_bookmarks_tags` (GIN) pour recherche tags
- `idx_sessions_token` pour validation refresh token rapide

---

## 3. API Endpoints

### Authentication (/api/auth)
```
POST   /register              → { user, accessToken, refreshToken }
POST   /login                 → { user, accessToken, refreshToken }
POST   /logout                → Invalidate refresh token
POST   /refresh               → { accessToken, refreshToken }
GET    /me                    → { user }
POST   /forgot-password       → Send reset email
POST   /reset-password        → Reset with token

# Phase 2: OAuth
GET    /google                → Redirect to Google OAuth
GET    /google/callback       → Handle callback, return tokens
GET    /facebook              → Redirect to Facebook OAuth
GET    /facebook/callback     → Handle callback, return tokens
```

### Bookmarks (/api/bookmarks)
```
GET    /                      → List with filters (category, search, tags, favorite, pagination)
GET    /:id                   → Get single bookmark
POST   /                      → Create bookmark (auto-fetch favicon)
PUT    /:id                   → Update bookmark
DELETE /:id                   → Delete bookmark
POST   /bulk-delete           → Delete multiple
POST   /bulk-move             → Move multiple to category
PUT    /:id/position          → Update position (drag-and-drop)
POST   /:id/visit             → Increment visit count
GET    /stats                 → User's bookmark statistics
```

### Categories (/api/categories)
```
GET    /                      → Get full tree structure
GET    /:id                   → Get single category
POST   /                      → Create category
PUT    /:id                   → Update category
DELETE /:id                   → Delete (with option to move bookmarks)
PUT    /:id/move              → Move in tree (change parent)
```

### Icons (/api/icons)
```
POST   /fetch-favicon         → Fetch favicon for URL
POST   /upload                → Upload custom icon
DELETE /:id                   → Delete custom icon
```

### Import/Export (/api/import, /api/export)
```
POST   /import/parse          → Parse file, return preview
POST   /import/execute        → Execute import with options
GET    /import/history        → User's import history

POST   /export                → Export bookmarks (format: html, json, csv, chrome, firefox)
```

### Admin (/api/admin) - Requires admin role
```
GET    /stats                 → Global statistics (users, bookmarks, growth charts)
GET    /users                 → List all users (with filters, pagination)
GET    /users/:id             → Get user details + stats
PUT    /users/:id/status      → Block/unblock user
DELETE /users/:id             → Delete user account
GET    /activity              → Activity log (filtered)
```

---

## 4. Fonctionnalités clés et implémentation

### 4.1 Drag-and-Drop (@dnd-kit)

**Capacités**:
- Réorganiser bookmarks dans même catégorie
- Déplacer bookmarks vers autres catégories (drop sur sidebar)
- Réorganiser catégories dans arbre
- Support tactile pour mobile
- Feedback visuel pendant drag

**Implementation**:
```javascript
// Wrapper DndContext au niveau Dashboard
// SortableContext pour bookmarks
// Droppable zones sur CategoryTree nodes
// handleDragEnd → API call pour persister position
```

### 4.2 Récupération Favicon (Multi-source fallback)

**Stratégie**:
1. Vérifier cache PostgreSQL (table `icons` par domain)
2. Si non-caché, essayer sources dans l'ordre:
   - Google Favicon API
   - DuckDuckGo Icons
   - Clearbit Logo API
   - Favicon Kit API
   - Direct fetch (domain/favicon.ico)
3. Si échec total → Générer icon fallback (lettre + couleur)
4. Cacher result pour partage entre users

**Backend service**: `faviconService.js`
- Télécharge et stocke dans `uploads/icons/` ou S3 (production)
- Enregistre dans table `icons` avec `is_public=true`

### 4.3 Catégories hiérarchiques (Nested Set Model)

**Pourquoi Nested Set?**
- Récupérer arbre complet en 1 requête (pas de récursion)
- Trouver descendants directs efficacement
- Vérifier ancestor/descendant rapidement

**Operations**:
- Insert: Ajuster `lft`/`rgt` de siblings
- Move: Recalculer `lft`/`rgt` du sous-arbre
- Delete: Option 1 = move bookmarks to parent, Option 2 = delete cascade

**Component**: `CategoryTree.jsx`
- Affiche arbre dans sidebar
- Expand/collapse nodes
- Droppable zones pour drag-and-drop
- Context menu (edit, delete, add subcategory)

### 4.4 Import/Export

**Import supporté**:
- Chrome bookmarks (HTML Netscape format)
- Firefox bookmarks (HTML Netscape format)
- Safari bookmarks (HTML Netscape format)
- HTML générique (Netscape Bookmark File Format)
- JSON (format natif PinGrid)
- CSV (simple: title, url, description, category, tags)

**Workflow import**:
1. Upload file → Parse côté backend
2. Retourner preview (bookmarks + categories détectées)
3. User confirme options:
   - Merge duplicates (by URL)?
   - Create categories automatiquement?
4. Execute import → Save to database
5. Log dans `import_history`

**Export supporté**:
- HTML (Netscape format, compatible tous browsers)
- JSON (format complet PinGrid)
- CSV (simple export)

### 4.5 Vues multiples

**Grid View (Vue principale)**:
- Layout type Pinterest (masonry grid)
- Cartes visuelles avec favicon, titre, description
- Hover effects, quick actions
- Lazy loading images

**List View**:
- Vue compacte, densité haute
- Lignes simples: favicon + title + URL + actions
- Bon pour scan rapide

**Kanban View**:
- Colonnes = catégories
- Bookmarks dans colonnes
- Drag entre colonnes = move category

**Sidebar Category Tree**:
- Navigation arborescente
- Expand/collapse
- Badge avec count bookmarks
- Sticky position

### 4.6 Dashboard Admin

**Statistiques globales**:
- Total users, active users (30 days)
- Total bookmarks, total categories
- New users today/week/month
- Chart croissance users (Recharts)
- Top users (plus de bookmarks)
- Recent activity log

**Gestion utilisateurs**:
- Table tous users avec filters (search, status, pagination)
- Actions par user:
  - View details (stats: bookmark count, last active)
  - Block/Unblock (toggle `is_active`)
  - Delete account (avec confirmation)

---

## 5. Sécurité

### Authentification JWT
- **Access Token**: 15 minutes, stocké en mémoire (variable React)
- **Refresh Token**: 7 jours, stocké en httpOnly cookie
- Auto-refresh via interceptor Axios avant expiration

### Protection
- Bcrypt password hashing (12 rounds)
- Rate limiting: 100 req/min par IP, 1000/hour par user
- Validation input avec Joi (backend) + React Hook Form (frontend)
- SQL injection: Requêtes paramétrées (pg)
- XSS: React échappe automatiquement, DOMPurify si HTML
- CSRF: csurf middleware
- Security headers: Helmet.js

---

## 6. State Management (Zustand)

**Stores**:

**bookmarkStore.js**:
```javascript
{
  bookmarks: [],
  categories: [],
  currentCategory: null,
  viewMode: 'grid', // 'grid' | 'list' | 'kanban'
  filters: { search: '', tags: [], favorite: false },
  loading: false,
  error: null,

  // Actions
  fetchBookmarks(params),
  addBookmark(bookmark),
  updateBookmark(id, updates),
  deleteBookmark(id),
  setViewMode(mode),
  setFilters(filters),
  setCurrentCategory(id)
}
```

**authStore.js**:
```javascript
{
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,

  // Actions
  login(email, password),
  register(userData),
  logout(),
  refreshToken(),
  updateProfile(updates)
}
```

**Persistence**: Zustand persist middleware pour viewMode, filters

---

## 7. Performance

### Optimizations
1. **Database**:
   - Index sur toutes FK et colonnes filtrées
   - Connection pooling (max 20 connections)
   - Pagination (50 items par défaut, max 200)

2. **Backend**:
   - Redis caching pour category trees (TTL 1h)
   - Favicon caching dans database (TTL 30 days)
   - Compression gzip/brotli des responses

3. **Frontend**:
   - React.memo pour BookmarkCard
   - useMemo pour calculs coûteux (tree building)
   - useCallback pour event handlers
   - Virtual scrolling (react-window) si >100 bookmarks
   - Lazy loading images (Intersection Observer)
   - Code splitting par route

---

## 8. Tests

### Backend
- **Unit tests**: Models, services, utils
- **Integration tests**: API endpoints avec supertest
- **DB tests**: Migration tests

### Frontend
- **Component tests**: React Testing Library
- **Hook tests**: Custom hooks
- **E2E tests**: Playwright
  - Login flow
  - Bookmark CRUD
  - Drag-and-drop
  - Import/export
  - Admin operations

---

## 9. Environnement

### Backend .env
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pingrid
DB_USER=postgres
DB_PASSWORD=***

JWT_ACCESS_SECRET=***  # min 32 chars
JWT_REFRESH_SECRET=*** # min 32 chars

# Phase 2
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
FACEBOOK_APP_ID=***
FACEBOOK_APP_SECRET=***

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB

REDIS_HOST=localhost
REDIS_PORT=6379

CORS_ORIGIN=http://localhost:3000
```

### Frontend .env
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENABLE_OAUTH=false  # true en Phase 2
```

---

## 10. Docker Setup

**docker-compose.yml**:
- Service `postgres`: PostgreSQL 15
- Service `redis`: Redis 7 (caching)
- Service `backend`: Node.js app
- Service `frontend`: React app (Vite dev server)

**Commandes**:
```bash
docker-compose up -d          # Start all services
docker-compose logs -f backend # View logs
docker-compose down           # Stop all services
```

---

## 11. Phases d'implémentation

### Phase 1: Foundation (Semaines 1-2)
- Setup projet (folders, Docker, PostgreSQL)
- Database schema + migrations
- User model + JWT authentication
- Login/Register UI
- Basic API structure

**Deliverable**: Users peuvent register/login

### Phase 2: Bookmark CRUD (Semaines 3-4)
- Bookmark + Category models
- Basic favicon fetching (1 source)
- Bookmark CRUD API + UI
- Category tree sidebar
- BookmarkCard component
- Zustand state management

**Deliverable**: Users peuvent créer/éditer/supprimer bookmarks avec catégories

### Phase 3: Advanced UI (Semaines 5-6)
- Grid/List/Kanban views
- View switcher
- Drag-and-drop (@dnd-kit)
- Position tracking
- Responsive design
- UI animations

**Deliverable**: UI complète avec drag-and-drop

### Phase 4: Icons & Import/Export (Semaines 7-8)
- Multi-source favicon service
- Custom icon upload
- Chrome/Firefox/Safari parsers
- Import wizard UI
- Export (HTML/JSON/CSV)

**Deliverable**: Import/export fonctionnel

### Phase 5: Admin Dashboard (Semaine 9)
- Admin middleware
- User management table
- Block/unblock/delete users
- Statistics queries + charts
- Activity log

**Deliverable**: Admin dashboard complet

### Phase 6: OAuth (Semaine 10)
- Passport.js Google/Facebook
- OAuth callbacks
- OAuth buttons UI
- Account linking

**Deliverable**: Social login fonctionnel

### Phase 7: Performance & Security (Semaine 11)
- Database optimization
- Redis caching
- Rate limiting
- Security review
- Lazy loading
- Bundle optimization

**Deliverable**: App optimisée et sécurisée

### Phase 8: Testing (Semaine 12)
- Unit tests
- Integration tests
- E2E tests
- Documentation API (Swagger)

**Deliverable**: App testée

### Phase 9: Deployment (Semaine 13)
- Production setup
- SSL certificates
- CI/CD pipeline
- Monitoring (Sentry)
- Backup strategy

**Deliverable**: App déployée

### Phase 10: Polish (Semaine 14)
- User feedback
- Bug fixes
- Performance tuning
- Analytics
- PWA features (optional)

**Deliverable**: App production-ready

---

## 12. Packages principaux

### Backend
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.0",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "passport": "^0.6.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-facebook": "^3.0.0",
  "multer": "^1.4.5-lts.1",
  "joi": "^17.9.2",
  "express-rate-limit": "^6.7.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "redis": "^4.6.7",
  "axios": "^1.4.0",
  "cheerio": "^1.0.0-rc.12"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.11.2",
  "zustand": "^4.3.8",
  "@dnd-kit/core": "^6.0.8",
  "@dnd-kit/sortable": "^7.0.2",
  "axios": "^1.4.0",
  "react-query": "^3.39.3",
  "react-hook-form": "^7.44.3",
  "react-window": "^1.8.9",
  "react-hot-toast": "^2.4.1",
  "recharts": "^2.7.2"
}
```

---

## 13. Fichiers critiques à créer en premier

1. **backend/src/db/migrations/001_create_schema.sql**
   - Schema complet PostgreSQL
   - Foundation de tout le data model

2. **backend/src/app.js**
   - Express setup avec middleware
   - Routes configuration
   - Error handling

3. **backend/src/routes/bookmarks.js**
   - Endpoints bookmarks (API la plus critique)

4. **frontend/src/stores/bookmarkStore.js**
   - State management Zustand
   - Central state pour bookmarks + categories

5. **frontend/src/components/bookmarks/BookmarkGrid/BookmarkGrid.jsx**
   - UI principale que users verront
   - Avec drag-and-drop

---

## Résumé des décisions architecturales

1. **PostgreSQL + Nested Set Model**: Queries arbre efficaces
2. **JWT + Refresh Tokens**: Sécurité + auto-refresh
3. **Zustand**: State management léger vs Redux
4. **@dnd-kit**: Drag-and-drop moderne + accessible
5. **Multi-source Favicon**: Robustesse avec fallbacks
6. **Parsers modulaires**: Facile d'ajouter formats import
7. **Pagination + Virtual Scrolling**: Handle large collections
8. **Rate Limiting**: Protection contre abus
9. **Docker Compose**: Dev environment simplifié
10. **Tests complets**: Unit + Integration + E2E

---

## Prochaines étapes

1. Créer structure folders
2. Setup Docker Compose
3. Créer database migrations
4. Implémenter authentication (JWT)
5. Créer API bookmarks de base
6. Créer UI React de base
7. Suivre phases d'implémentation séquentiellement

**Ready to start building! 🚀**
