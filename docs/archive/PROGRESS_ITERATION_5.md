# 🔖 ITÉRATION 5: Bookmarks Management - Progression Détaillée

## 🎯 Objectif
User peut créer, voir, éditer, supprimer des **Bookmarks** dans un Group (niveau 4 de la hiérarchie: Page → Section → Group → **Bookmark**)

---

## 📊 Vue d'ensemble

### Ce qu'on va créer
- **Backend**: Module complet Bookmarks (Model, Service, Controller, Routes)
- **Frontend**: Store Zustand + Composants UI (BookmarkCard, BookmarkList, Modals)
- **Feature**: Bookmarks affichés dans GroupCard avec layout en grille
- **Feature**: Favicon fetching automatique depuis URLs
- **Feature**: Click tracking pour statistiques (visit_count)
- **Feature**: Drag & Drop pour réorganiser les bookmarks
- **Tests**: Validation complète CRUD + click tracking

### Schéma de données
```sql
bookmarks
  - id (UUID, PK)
  - group_id (UUID, FK → groups) -- Parent group
  - user_id (UUID, FK → users) -- Owner (pour requêtes globales)
  - title (VARCHAR 200) -- "Google", "GitHub", "Stack Overflow"
  - url (TEXT) -- URL complète du bookmark
  - description (TEXT, nullable) -- Description optionnelle
  - position (INTEGER, default 0) -- Ordre dans le group
  - visit_count (INTEGER, default 0) -- Nombre de clics (pour "Top Used")
  - favicon_url (TEXT, nullable) -- URL du favicon (fetched ou custom)
  - created_at, updated_at (TIMESTAMP)
```

### Hiérarchie
```
📄 PAGE (Work, Personnel) ✅ Itération 2
  └─ 📦 SECTION (Daily Tools, Projects) ✅ Itération 3
      └─ 🗂️ GROUP (Communication, Top 10) ✅ Itération 4
          └─ 🔖 BOOKMARK (Gmail, GitHub) ⏳ Itération 5
```

### Features clés

#### 1. CRUD Bookmarks
- Créer bookmark avec title + URL (minimum)
- Éditer title, URL, description, favicon_url
- Supprimer bookmark avec confirmation
- Lister bookmarks d'un group triés par position

#### 2. Favicon Fetching
- **Automatique**: Extraire domain de l'URL → Fetch favicon via service (Google/DuckDuckGo)
- **Manuel**: User peut override avec URL custom
- **Fallback**: Icon par défaut si fetch échoue
- **Cache**: Stocker favicons pour éviter re-fetch

#### 3. Click Tracking
- Cliquer sur bookmark → Ouvrir URL dans nouveau tab
- Incrémenter visit_count dans DB
- Afficher compteur de visites (optionnel UI)
- Utiliser pour groups dynamiques "Top Used" (Itération future)

#### 4. Display Layout
- Afficher bookmarks en grille (column_count du group)
- Card compact: Favicon + Title + URL (tronquée)
- Hover: Afficher actions (Edit, Delete, Copy URL)
- Responsive: Adapter colonnes selon screen size

#### 5. Drag & Drop
- Réorganiser bookmarks dans un group
- Visual feedback pendant drag
- Sauvegarder nouvelles positions en DB
- Optimistic update côté frontend

---

## 📋 CHECKLIST COMPLÈTE

### PHASE 1: Backend - Database Migration ✅ TERMINÉ (2026-01-07)
- [x] 1.1 - Table `bookmarks` créée (migration 005)
- [x] 1.2 - FK constraint `group_id → groups(id) ON DELETE CASCADE`
- [x] 1.3 - FK constraint `user_id → users(id) ON DELETE CASCADE`
- [x] 1.4 - CHECK constraint: `url NOT EMPTY`
- [x] 1.5 - CHECK constraint: `visit_count >= 0`
- [x] 1.6 - Index `idx_bookmarks_group_position` sur (group_id, position)
- [x] 1.7 - Index `idx_bookmarks_user` sur (user_id)
- [x] 1.8 - Index `idx_bookmarks_visit_count` sur (visit_count DESC)
- [x] 1.9 - Index `idx_bookmarks_url` sur (url)
- [x] 1.10 - Trigger `update_bookmarks_updated_at`
- [x] 1.11 - Vérifier structure table (`\d bookmarks`)

### PHASE 2: Backend - Bookmarks Model ⏳ À FAIRE
- [ ] 2.1 - Créer `backend/src/modules/bookmarks/bookmarks.model.js`
- [ ] 2.2 - Helper: `verifyGroupOwnership(groupId, userId)` - Vérifier ownership via group→section→page→user
- [ ] 2.3 - Méthode `create(groupId, userId, bookmarkData)` avec validation
  - [ ] Valider title (required, max 200 chars)
  - [ ] Valider url (required, format URL valide)
  - [ ] Valider description (optionnel, max 500 chars)
  - [ ] Calculer position automatique (SELECT MAX(position) + 1 WHERE group_id)
  - [ ] INSERT avec RETURNING
- [ ] 2.4 - Méthode `findAllByGroup(groupId)` triée par position ASC
- [ ] 2.5 - Méthode `findById(id, userId)` avec JOIN groups→sections→pages pour ownership
- [ ] 2.6 - Méthode `findByUrl(groupId, url)` pour vérifier doublons
- [ ] 2.7 - Méthode `update(id, userId, updates)`
  - [ ] Empêcher modification de group_id et user_id
  - [ ] Valider title si présent
  - [ ] Valider url si présent
  - [ ] UPDATE avec RETURNING
- [ ] 2.8 - Méthode `delete(id, userId)`
  - [ ] Vérifier ownership via JOIN
  - [ ] DELETE bookmark
- [ ] 2.9 - Méthode `reorderPositions(groupId, bookmarkIds)` pour drag & drop
  - [ ] Transaction: UPDATE position pour chaque bookmark
  - [ ] Valider que tous les IDs appartiennent au même group
- [ ] 2.10 - Méthode `incrementVisitCount(id)` pour click tracking
  - [ ] UPDATE visit_count = visit_count + 1
  - [ ] UPDATE updated_at (via trigger)
- [ ] 2.11 - Méthode `countByGroup(groupId)` pour statistiques
- [ ] 2.12 - Méthode `getTopUsed(userId, limit)` pour récupérer top bookmarks globaux
  - [ ] ORDER BY visit_count DESC
  - [ ] LIMIT X
  - [ ] WHERE user_id = userId

### PHASE 3: Backend - Bookmarks Service ⏳ À FAIRE
- [ ] 3.1 - Créer `backend/src/modules/bookmarks/bookmarks.service.js`
- [ ] 3.2 - Méthode `createBookmark(userId, groupId, bookmarkData)` avec business logic
  - [ ] Vérifier ownership du group (via model helper)
  - [ ] Valider URL format (regex ou library)
  - [ ] Extraire domain de l'URL
  - [ ] Fetch favicon si favicon_url non fourni (optionnel - phase 8)
  - [ ] Appeler model.create()
  - [ ] Retourner bookmark créé
- [ ] 3.3 - Méthode `getGroupBookmarks(userId, groupId)`
  - [ ] Vérifier ownership du group
  - [ ] Appeler model.findAllByGroup()
  - [ ] Retourner liste triée par position
- [ ] 3.4 - Méthode `getBookmarkById(userId, id)`
  - [ ] Appeler model.findById()
  - [ ] Retourner bookmark ou 404
- [ ] 3.5 - Méthode `updateBookmark(userId, id, updates)`
  - [ ] Vérifier ownership
  - [ ] Valider updates
  - [ ] Si URL changée: Re-fetch favicon (optionnel)
  - [ ] Appeler model.update()
  - [ ] Retourner bookmark mis à jour
- [ ] 3.6 - Méthode `deleteBookmark(userId, id)`
  - [ ] Vérifier ownership
  - [ ] Appeler model.delete()
  - [ ] Retourner succès
- [ ] 3.7 - Méthode `reorderBookmarks(userId, groupId, bookmarkIds)`
  - [ ] Vérifier ownership du group
  - [ ] Valider que tous les IDs appartiennent au group
  - [ ] Appeler model.reorderPositions()
  - [ ] Retourner bookmarks réorganisés
- [ ] 3.8 - Méthode `trackBookmarkClick(userId, id)`
  - [ ] Vérifier ownership
  - [ ] Appeler model.incrementVisitCount()
  - [ ] Retourner succès
- [ ] 3.9 - Méthode `getTopUsedBookmarks(userId, limit = 10)`
  - [ ] Appeler model.getTopUsed()
  - [ ] Retourner top bookmarks avec visit_count
- [ ] 3.10 - Méthode `getGroupStats(userId, groupId)`
  - [ ] Count total bookmarks
  - [ ] Total visit_count
  - [ ] Most used bookmark
  - [ ] Retourner stats

### PHASE 4: Backend - Bookmarks Controller ⏳ À FAIRE
- [ ] 4.1 - Créer `backend/src/modules/bookmarks/bookmarks.controller.js`
- [ ] 4.2 - Handler `getAll(req, res, next)`
  - [ ] Récupérer userId depuis req.user
  - [ ] Récupérer groupId depuis req.query.groupId
  - [ ] Appeler service.getGroupBookmarks()
  - [ ] Retourner JSON { success: true, data: { bookmarks } }
- [ ] 4.3 - Handler `getOne(req, res, next)`
  - [ ] Valider req.params.id
  - [ ] Appeler service.getBookmarkById()
  - [ ] Gérer 404 si non trouvé
  - [ ] Retourner JSON
- [ ] 4.4 - Handler `create(req, res, next)`
  - [ ] Valider req.body (title, url requis)
  - [ ] Valider req.body.groupId
  - [ ] Appeler service.createBookmark()
  - [ ] Retourner 201 avec bookmark créé
- [ ] 4.5 - Handler `update(req, res, next)`
  - [ ] Valider id + body
  - [ ] Appeler service.updateBookmark()
  - [ ] Retourner 200 avec bookmark modifié
- [ ] 4.6 - Handler `delete(req, res, next)`
  - [ ] Valider id
  - [ ] Appeler service.deleteBookmark()
  - [ ] Retourner 204 (no content)
- [ ] 4.7 - Handler `reorder(req, res, next)`
  - [ ] Valider req.body.groupId
  - [ ] Valider req.body.bookmarkIds (array)
  - [ ] Appeler service.reorderBookmarks()
  - [ ] Retourner 200
- [ ] 4.8 - Handler `trackClick(req, res, next)`
  - [ ] Valider req.params.id
  - [ ] Appeler service.trackBookmarkClick()
  - [ ] Retourner 200 { success: true }
- [ ] 4.9 - Handler `getTopUsed(req, res, next)`
  - [ ] Récupérer userId
  - [ ] Récupérer limit depuis req.query.limit (default 10)
  - [ ] Appeler service.getTopUsedBookmarks()
  - [ ] Retourner 200
- [ ] 4.10 - Handler `getStats(req, res, next)`
  - [ ] Valider req.query.groupId
  - [ ] Appeler service.getGroupStats()
  - [ ] Retourner 200 avec stats

### PHASE 5: Backend - Bookmarks Routes ⏳ À FAIRE
- [ ] 5.1 - Créer `backend/src/modules/bookmarks/bookmarks.routes.js`
- [ ] 5.2 - Route: `GET /api/bookmarks?groupId=UUID` → getAll (protected)
- [ ] 5.3 - Route: `GET /api/bookmarks/top-used?limit=10` → getTopUsed (protected)
- [ ] 5.4 - Route: `GET /api/bookmarks/stats?groupId=UUID` → getStats (protected)
- [ ] 5.5 - Route: `GET /api/bookmarks/:id` → getOne (protected)
- [ ] 5.6 - Route: `POST /api/bookmarks` → create (protected)
- [ ] 5.7 - Route: `PUT /api/bookmarks/:id` → update (protected)
- [ ] 5.8 - Route: `DELETE /api/bookmarks/:id` → delete (protected)
- [ ] 5.9 - Route: `POST /api/bookmarks/reorder` → reorder (protected)
- [ ] 5.10 - Route: `POST /api/bookmarks/:id/click` → trackClick (protected)
- [ ] 5.11 - Intégrer dans `app.js`: `app.use('/api/bookmarks', bookmarksRoutes)`

### PHASE 6: Backend - Tests API (curl/Postman) ⏳ À FAIRE
- [ ] 6.1 - Test: POST /api/bookmarks (créer "Google")
  - [ ] Body: { groupId, title: "Google", url: "https://google.com" }
  - [ ] Réponse 201 avec bookmark créé
  - [ ] Vérifier position = 0
  - [ ] Vérifier visit_count = 0
- [ ] 6.2 - Test: POST /api/bookmarks (créer "GitHub")
  - [ ] Body: { groupId, title: "GitHub", url: "https://github.com" }
  - [ ] Réponse 201
  - [ ] Vérifier position = 1
- [ ] 6.3 - Test: GET /api/bookmarks?groupId=UUID (lister tous)
  - [ ] Réponse 200 avec array de 2 bookmarks
  - [ ] Vérifier ordre par position
- [ ] 6.4 - Test: GET /api/bookmarks/:id (récupérer "Google")
  - [ ] Réponse 200 avec détails bookmark
- [ ] 6.5 - Test: PUT /api/bookmarks/:id (modifier title)
  - [ ] Réponse 200 avec bookmark modifié
- [ ] 6.6 - Test: POST /api/bookmarks/:id/click (tracker clic)
  - [ ] Réponse 200
  - [ ] Vérifier visit_count incrémenté
- [ ] 6.7 - Test: POST /api/bookmarks/reorder (réorganiser)
  - [ ] Body: { groupId, bookmarkIds: [id2, id1] }
  - [ ] Réponse 200
  - [ ] Vérifier GET retourne nouvel ordre
- [ ] 6.8 - Test: DELETE /api/bookmarks/:id (supprimer "GitHub")
  - [ ] Réponse 204
  - [ ] Vérifier GET retourne 1 seul bookmark

### PHASE 7: Frontend - Bookmarks Store (Zustand) ⏳ À FAIRE
- [ ] 7.1 - Créer `frontend/src/features/bookmarks/store/bookmarksStore.js`
- [ ] 7.2 - State: `bookmarksByGroup` (object { groupId: [bookmarks] })
- [ ] 7.3 - State: `loading`, `error`, `stats`
- [ ] 7.4 - Action: `fetchBookmarks(groupId)` → GET /api/bookmarks?groupId=X
- [ ] 7.5 - Action: `createBookmark(groupId, bookmarkData)` → POST /api/bookmarks
- [ ] 7.6 - Action: `updateBookmark(id, updates)` → PUT /api/bookmarks/:id
- [ ] 7.7 - Action: `deleteBookmark(id, groupId)` → DELETE /api/bookmarks/:id
- [ ] 7.8 - Action: `reorderBookmarks(groupId, bookmarkIds)` → POST /api/bookmarks/reorder
- [ ] 7.9 - Action: `trackClick(id)` → POST /api/bookmarks/:id/click
- [ ] 7.10 - Action: `getTopUsed(limit)` → GET /api/bookmarks/top-used
- [ ] 7.11 - Action: `getStats(groupId)` → GET /api/bookmarks/stats
- [ ] 7.12 - Helper: `getBookmarksForGroup(groupId)` - Récupérer depuis state
- [ ] 7.13 - Action: `clearError()`, `reset()`
- [ ] 7.14 - Intégration avec authStore pour JWT token

### PHASE 8: Frontend - Bookmarks Service (API) ⏳ À FAIRE
- [ ] 8.1 - Créer `frontend/src/features/bookmarks/services/bookmarksService.js`
- [ ] 8.2 - Setup axios avec base URL (VITE_API_URL)
- [ ] 8.3 - Méthode `getAll(groupId, token)` avec Authorization header
- [ ] 8.4 - Méthode `getOne(id, token)`
- [ ] 8.5 - Méthode `create(groupId, bookmarkData, token)`
- [ ] 8.6 - Méthode `update(id, updates, token)`
- [ ] 8.7 - Méthode `delete(id, token)`
- [ ] 8.8 - Méthode `reorder(groupId, bookmarkIds, token)`
- [ ] 8.9 - Méthode `trackClick(id, token)`
- [ ] 8.10 - Méthode `getTopUsed(limit, token)`
- [ ] 8.11 - Méthode `getStats(groupId, token)`

### PHASE 9: Frontend - BookmarkCard Component ⏳ À FAIRE
- [ ] 9.1 - Créer `frontend/src/features/bookmarks/components/BookmarkCard.jsx`
- [ ] 9.2 - Afficher favicon (ou fallback icon)
- [ ] 9.3 - Afficher title (bold, tronqué si trop long)
- [ ] 9.4 - Afficher URL (tronquée, grisée)
- [ ] 9.5 - Click sur card → ouvrir URL dans nouveau tab + trackClick
- [ ] 9.6 - Actions visibles: Edit, Delete, Copy URL
- [ ] 9.7 - Drag handle (⋮⋮) pour drag & drop
- [ ] 9.8 - Style: Card moderne avec hover effet
- [ ] 9.9 - Loading state pour favicon
- [ ] 9.10 - Tooltip avec description au hover
- [ ] 9.11 - Badge visit_count (optionnel)
- [ ] 9.12 - Support draggable attribute

### PHASE 10: Frontend - BookmarkList Component ⏳ À FAIRE
- [ ] 10.1 - Créer `frontend/src/features/bookmarks/components/BookmarkList.jsx`
- [ ] 10.2 - Afficher bookmarks en grille (colonnes selon group.column_count)
- [ ] 10.3 - Fetch bookmarks au mount (useEffect avec groupId)
- [ ] 10.4 - Loading state pendant fetch
- [ ] 10.5 - Error state si erreur
- [ ] 10.6 - Empty state: "No bookmarks yet. Add your first bookmark!"
- [ ] 10.7 - Bouton "+ Add Bookmark"
- [ ] 10.8 - Map bookmarks → <BookmarkCard />
- [ ] 10.9 - Drag & Drop handlers (handleDragStart, handleDragOver, handleDrop)
- [ ] 10.10 - Appeler reorderBookmarks du store
- [ ] 10.11 - Responsive: Adapter colonnes selon screen size

### PHASE 11: Frontend - CreateBookmarkModal Component ⏳ À FAIRE
- [ ] 11.1 - Créer `frontend/src/features/bookmarks/components/CreateBookmarkModal.jsx`
- [ ] 11.2 - Modal avec overlay semi-transparent
- [ ] 11.3 - Form: Input "Title" (required, max 200 chars)
- [ ] 11.4 - Form: Input "URL" (required, valider format URL)
- [ ] 11.5 - Form: Textarea "Description" (optionnel, max 500 chars)
- [ ] 11.6 - Form: Input "Favicon URL" (optionnel, override auto-fetch)
- [ ] 11.7 - Preview: Afficher favicon + title + URL pendant saisie
- [ ] 11.8 - Bouton "Cancel" et "Create"
- [ ] 11.9 - Validation: Title et URL non vides
- [ ] 11.10 - Validation: URL format valide (regex ou browser API)
- [ ] 11.11 - Submit → appeler store.createBookmark()
- [ ] 11.12 - Afficher loading pendant création
- [ ] 11.13 - Fermer modal après succès
- [ ] 11.14 - Afficher erreur si échec
- [ ] 11.15 - Character counters (Title: X/200, Desc: X/500)

### PHASE 12: Frontend - EditBookmarkModal Component ⏳ À FAIRE
- [ ] 12.1 - Créer `frontend/src/features/bookmarks/components/EditBookmarkModal.jsx`
- [ ] 12.2 - Similaire à CreateBookmarkModal
- [ ] 12.3 - Pré-remplir avec données bookmark existant (useEffect)
- [ ] 12.4 - Submit → appeler store.updateBookmark()
- [ ] 12.5 - Validation: même que CreateBookmarkModal
- [ ] 12.6 - Preview en temps réel
- [ ] 12.7 - Error handling

### PHASE 13: Frontend - Intégration dans GroupCard ⏳ À FAIRE
- [ ] 13.1 - Modifier `frontend/src/features/groups/components/GroupCard.jsx`
- [ ] 13.2 - Remplacer placeholder "0 bookmarks" par <BookmarkList />
- [ ] 13.3 - Passer groupId à BookmarkList
- [ ] 13.4 - State management pour modals (isCreateOpen, isEditOpen, editingBookmark)
- [ ] 13.5 - Handlers: handleCreate, handleEdit, handleDelete
- [ ] 13.6 - Confirmation dialog pour delete
- [ ] 13.7 - Afficher count de bookmarks dans header groupe
- [ ] 13.8 - Style: Intégrer BookmarkList dans GroupCard layout

### PHASE 14: Frontend - Favicon Fetching (Optionnel avancé) ⏳ À FAIRE
- [ ] 14.1 - Créer utilitaire `getFaviconUrl(url)`
  - [ ] Extraire domain de l'URL
  - [ ] Tenter: `https://www.google.com/s2/favicons?domain=${domain}`
  - [ ] Fallback: `https://icons.duckduckgo.com/ip3/${domain}.ico`
  - [ ] Fallback final: Icon par défaut (🔗)
- [ ] 14.2 - Appeler lors de création bookmark (côté service)
- [ ] 14.3 - Cacher dans localStorage (éviter re-fetch)
- [ ] 14.4 - Error handling si fetch échoue

### PHASE 15: Tests Manuels Complets ⏳ À FAIRE
- [ ] 15.1 - **Test: Créer premier bookmark**
  - [ ] Ouvrir un group
  - [ ] Cliquer "+ Add Bookmark"
  - [ ] Remplir: Title "Google", URL "https://google.com"
  - [ ] Submit
  - [ ] ✅ BookmarkCard apparaît avec favicon
- [ ] 15.2 - **Test: Créer deuxième bookmark**
  - [ ] Créer "GitHub", "https://github.com"
  - [ ] ✅ 2 bookmarks visibles en grille
- [ ] 15.3 - **Test: Cliquer sur bookmark**
  - [ ] Cliquer sur "Google"
  - [ ] ✅ Ouvre dans nouveau tab
  - [ ] ✅ visit_count incrémenté (vérifier DB)
- [ ] 15.4 - **Test: Éditer bookmark**
  - [ ] Hover "Google" → cliquer "Edit"
  - [ ] Changer title en "Google Search"
  - [ ] ✅ BookmarkCard mis à jour
- [ ] 15.5 - **Test: Supprimer bookmark**
  - [ ] Hover "GitHub" → cliquer "Delete"
  - [ ] Confirmer
  - [ ] ✅ BookmarkCard disparaît
- [ ] 15.6 - **Test: Drag & Drop bookmarks**
  - [ ] Créer 3 bookmarks
  - [ ] Drag bookmark 3 vers position 1
  - [ ] ✅ Ordre change en temps réel
  - [ ] ✅ Refresh page → ordre persisté
- [ ] 15.7 - **Test: Grille responsive**
  - [ ] Group avec 3 colonnes: 3 bookmarks sur 1 ligne
  - [ ] Group avec 2 colonnes: 2 bookmarks par ligne
  - [ ] ✅ Layout adapté
- [ ] 15.8 - **Test: Favicon fallback**
  - [ ] Créer bookmark avec URL invalide
  - [ ] ✅ Icon par défaut affiché
- [ ] 15.9 - **Test: Validation formulaire**
  - [ ] Essayer créer sans title
  - [ ] ✅ Erreur affichée
  - [ ] Essayer créer avec URL invalide
  - [ ] ✅ Erreur affichée

### PHASE 16: Vérifications Database ⏳ À FAIRE
- [ ] 16.1 - Query: `SELECT * FROM bookmarks ORDER BY group_id, position;`
  - [ ] ✅ Bookmarks créés visibles
  - [ ] ✅ Positions correctes (0, 1, 2...)
  - [ ] ✅ group_id et user_id corrects
  - [ ] ✅ visit_count incrémenté après clicks
  - [ ] ✅ favicon_url présent
  - [ ] ✅ created_at, updated_at présents

---

## 🎯 Critères de Succès Globaux

### Backend ⏳ À FAIRE
- [ ] Migration 005_create_bookmarks.sql ✅ (déjà exécutée)
- [ ] Module bookmarks complet (Model, Service, Controller, Routes)
- [ ] API testée avec curl (tous les endpoints)
- [ ] Validation: URL format valide
- [ ] Authorization: User ne voit que ses bookmarks
- [ ] Click tracking fonctionnel

### Frontend ⏳ À FAIRE
- [ ] Store Zustand fonctionnel
- [ ] Service API avec auth integration
- [ ] BookmarkCard component
- [ ] BookmarkList component
- [ ] CreateBookmarkModal component
- [ ] EditBookmarkModal component
- [ ] GroupCard integration
- [ ] Drag & Drop fonctionnel
- [ ] Tests manuels complets

### Tests ⏳ À FAIRE
- [ ] Tous les tests manuels passés (15.1 à 15.9)
- [ ] Database vérifiée
- [ ] Click tracking testé

---

## 📦 Livrables de l'Itération 5

1. ✅ Table `bookmarks` dans PostgreSQL (déjà créée)
2. ⏳ Backend: Module `bookmarks/` complet
3. ⏳ Frontend: Feature `bookmarks/` complète
4. ⏳ UI: Components créés (BookmarkCard, BookmarkList, Modals)
5. ⏳ CRUD complet (backend + frontend testés)
6. ⏳ Click tracking implémenté
7. ⏳ Favicon fetching implémenté
8. ⏳ Drag & Drop fonctionnel
9. ⏳ GroupCard mis à jour avec bookmarks

---

## 📂 Fichiers à Créer/Modifier

### Backend ⏳
- `backend/src/modules/bookmarks/bookmarks.model.js` - Model avec 12 méthodes
- `backend/src/modules/bookmarks/bookmarks.service.js` - Service avec validation business
- `backend/src/modules/bookmarks/bookmarks.controller.js` - Controller avec 10 handlers
- `backend/src/modules/bookmarks/bookmarks.routes.js` - Routes protégées
- `backend/src/app.js` - Ajout route `/api/bookmarks`

### Frontend ⏳
- `frontend/src/features/bookmarks/store/bookmarksStore.js` - Zustand store
- `frontend/src/features/bookmarks/services/bookmarksService.js` - Service API axios
- `frontend/src/features/bookmarks/components/BookmarkCard.jsx` - Card individuelle
- `frontend/src/features/bookmarks/components/BookmarkList.jsx` - Liste avec grille
- `frontend/src/features/bookmarks/components/CreateBookmarkModal.jsx` - Modal création
- `frontend/src/features/bookmarks/components/EditBookmarkModal.jsx` - Modal édition
- `frontend/src/features/groups/components/GroupCard.jsx` - Intégration BookmarkList

---

## 🚀 Prochaine Action

**DÉMARRER PAR**: PHASE 2 - Créer Bookmarks Model (backend/src/modules/bookmarks/bookmarks.model.js)

**Plan d'exécution recommandé**:
1. Backend complet (Phases 2-6) - ~2-3h
2. Frontend Store + Service (Phases 7-8) - ~1h
3. Frontend Components (Phases 9-12) - ~2-3h
4. Intégration GroupCard (Phase 13) - ~30min
5. Tests complets (Phases 15-16) - ~1h

**TOTAL ESTIMÉ**: ~7-9 heures de développement

**STATUS**: ⏳ PAS ENCORE COMMENCÉE - Prêt à démarrer!

---

## 📝 Notes importantes

### Design Decisions à prendre
- **Favicon Service**: Google Favicons API vs DuckDuckGo vs Custom solution?
- **Click Tracking**: Track côté backend (secure) ou frontend (faster)?
- **Grid Layout**: Fixed colonnes (group.column_count) ou responsive breakpoints?
- **Empty State**: Simple text ou image illustration?
- **Visit Count Display**: Toujours visible ou hover only?

### Contraintes techniques
- URL validation: Utiliser library (validator.js) ou regex custom?
- Favicon caching: localStorage ou state management Zustand?
- Drag & Drop: Même pattern que sections/groups (native HTML5)
- Click tracking: POST async (await ou fire-and-forget?)

### Évolutions futures (post-Itération 5)
- Import bookmarks depuis Chrome/Firefox
- Export bookmarks en HTML
- Recherche/filtrage bookmarks
- Tags/catégories
- Notes sur bookmarks
- Partage de bookmarks

---

**Dernière mise à jour**: 2026-01-07 07:00 - Fichier créé, migration table déjà effectuée
