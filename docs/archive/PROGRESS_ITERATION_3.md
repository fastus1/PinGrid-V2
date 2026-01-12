# 📄 ITÉRATION 3: Sections Management - Progression Détaillée

## 🎯 Objectif
User peut créer, voir, éditer, supprimer des **Sections** dans une Page (niveau 2 de la hiérarchie: Page → **Section** → Group → Bookmark)

---

## 📊 Vue d'ensemble

### Ce qu'on va créer
- **Backend**: Table `sections` + Module complet (Model, Service, Controller, Routes)
- **Frontend**: Store Zustand + Composants UI (SectionList, SectionCard, Modals)
- **Feature**: Sections empilées verticalement dans PageView
- **Feature**: Collapse/Expand sections
- **Tests**: Validation complète CRUD

### Schéma de données
```sql
sections
  - id (UUID, PK)
  - page_id (UUID, FK → pages)
  - name (VARCHAR 100) -- "Daily Tools", "Work Projects", "Resources"
  - position (INTEGER) -- Ordre vertical dans la page
  - collapsed (BOOLEAN, default false) -- Section repliée ou non
  - created_at, updated_at (TIMESTAMP)
```

### Hiérarchie
```
📄 PAGE (Work, Personnel) ✅ Itération 2
  └─ 📦 SECTION (Daily Tools, Projects) ⏳ Itération 3
      └─ 🗂️ GROUP (Coming Soon) 🔜 Itération 4
          └─ 🔖 BOOKMARK (Coming Soon) 🔜 Itération 5
```

---

## 📋 CHECKLIST COMPLÈTE

### PHASE 1: Backend - Database Migration ⏳ À FAIRE
- [ ] 1.1 - Créer fichier `003_create_sections.sql`
- [ ] 1.2 - Écrire CREATE TABLE avec tous les champs
- [ ] 1.3 - Ajouter FK constraint `page_id → pages(id) ON DELETE CASCADE`
- [ ] 1.4 - Ajouter index `idx_sections_page_position`
- [ ] 1.5 - Ajouter index unique `idx_sections_page_name` (nom unique par page)
- [ ] 1.6 - Ajouter trigger `update_updated_at_column`
- [ ] 1.7 - Exécuter la migration
- [ ] 1.8 - Vérifier la table existe (`\dt` dans psql)
- [ ] 1.9 - Vérifier les FK (`\d sections` dans psql)

### PHASE 2: Backend - Sections Model ⏳ À FAIRE
- [ ] 2.1 - Créer `backend/src/modules/sections/sections.model.js`
- [ ] 2.2 - Méthode `create(pageId, sectionData)` avec validation
- [ ] 2.3 - Méthode `findAllByPage(pageId)` triée par position
- [ ] 2.4 - Méthode `findById(id, userId)` avec vérification ownership via page
- [ ] 2.5 - Méthode `update(id, userId, updates)`
- [ ] 2.6 - Méthode `delete(id, userId)`
- [ ] 2.7 - Méthode `reorderPositions(pageId, sectionIds)` pour drag & drop
- [ ] 2.8 - Méthode `findByName(pageId, name)` pour vérifier doublons
- [ ] 2.9 - Méthode `countByPage(pageId)` pour statistiques
- [ ] 2.10 - Méthode `toggleCollapsed(id, userId)` pour replier/déplier

### PHASE 3: Backend - Sections Service ⏳ À FAIRE
- [ ] 3.1 - Créer `backend/src/modules/sections/sections.service.js`
- [ ] 3.2 - Méthode `createSection(userId, pageId, sectionData)` avec business logic
  - [ ] Vérifier que la page appartient au user
  - [ ] Vérifier nom unique par page
  - [ ] Calculer position automatique (max + 1)
  - [ ] Valider name (required, max 100 chars)
- [ ] 3.3 - Méthode `getPageSections(userId, pageId)`
  - [ ] Vérifier ownership de la page
  - [ ] Retourner sections triées par position
- [ ] 3.4 - Méthode `getSectionById(id, userId)`
  - [ ] Vérifier ownership via page_id
- [ ] 3.5 - Méthode `updateSection(id, userId, updates)`
  - [ ] Vérifier ownership
  - [ ] Vérifier nom unique si changé
  - [ ] Empêcher modification de page_id
- [ ] 3.6 - Méthode `deleteSection(id, userId)`
  - [ ] Vérifier ownership
  - [ ] TODO future: Gérer groups/bookmarks enfants (CASCADE)
- [ ] 3.7 - Méthode `reorderSections(userId, pageId, sectionIds)`
  - [ ] Vérifier ownership de la page
  - [ ] Mettre à jour positions
- [ ] 3.8 - Méthode `toggleSectionCollapsed(id, userId)`
- [ ] 3.9 - Méthode `getPageSectionsStats(userId, pageId)` pour statistiques

### PHASE 4: Backend - Sections Controller ⏳ À FAIRE
- [ ] 4.1 - Créer `backend/src/modules/sections/sections.controller.js`
- [ ] 4.2 - Handler `getAll(req, res, next)`
  - [ ] Récupérer userId depuis req.user
  - [ ] Récupérer pageId depuis req.query.pageId (requis)
  - [ ] Appeler service
  - [ ] Retourner JSON { success: true, data: sections }
- [ ] 4.3 - Handler `getOne(req, res, next)`
  - [ ] Valider req.params.id
  - [ ] Appeler service
  - [ ] Gérer 404 si non trouvé
- [ ] 4.4 - Handler `create(req, res, next)`
  - [ ] Valider req.body (name requis, pageId requis)
  - [ ] Appeler service
  - [ ] Retourner 201 avec section créée
- [ ] 4.5 - Handler `update(req, res, next)`
  - [ ] Valider id + body
  - [ ] Appeler service
  - [ ] Retourner 200 avec section modifiée
- [ ] 4.6 - Handler `delete(req, res, next)`
  - [ ] Valider id
  - [ ] Appeler service
  - [ ] Retourner 204 (no content)
- [ ] 4.7 - Handler `reorder(req, res, next)`
  - [ ] Valider req.body.pageId et req.body.sectionIds (array)
  - [ ] Appeler service
  - [ ] Retourner 200
- [ ] 4.8 - Handler `toggleCollapsed(req, res, next)`
  - [ ] Valider id
  - [ ] Appeler service
  - [ ] Retourner 200 avec section modifiée
- [ ] 4.9 - Handler `getStats(req, res, next)` pour statistiques

### PHASE 5: Backend - Sections Routes ⏳ À FAIRE
- [ ] 5.1 - Créer `backend/src/modules/sections/sections.routes.js`
- [ ] 5.2 - Route: `GET /api/sections?pageId=X` → getAll (protected)
- [ ] 5.3 - Route: `GET /api/sections/stats?pageId=X` → getStats (protected)
- [ ] 5.4 - Route: `GET /api/sections/:id` → getOne (protected)
- [ ] 5.5 - Route: `POST /api/sections` → create (protected)
- [ ] 5.6 - Route: `PUT /api/sections/:id` → update (protected)
- [ ] 5.7 - Route: `DELETE /api/sections/:id` → delete (protected)
- [ ] 5.8 - Route: `POST /api/sections/reorder` → reorder (protected)
- [ ] 5.9 - Route: `POST /api/sections/:id/toggle-collapsed` → toggleCollapsed (protected)
- [ ] 5.10 - Intégrer dans `app.js`: `app.use('/api/sections', sectionsRoutes)`

### PHASE 6: Backend - Tests API (curl/Postman) ⏳ À FAIRE
- [ ] 6.1 - Test: POST /api/sections (créer "Daily Tools" dans page "Work")
  - [ ] Réponse 201 avec section créée
  - [ ] Vérifier position = 0
  - [ ] Vérifier collapsed = false
- [ ] 6.2 - Test: POST /api/sections (créer "Work Projects" dans page "Work")
  - [ ] Réponse 201
  - [ ] Vérifier position = 1
- [ ] 6.3 - Test: GET /api/sections?pageId=X (lister toutes les sections de la page)
  - [ ] Réponse 200 avec array de 2 sections
  - [ ] Vérifier ordre par position
- [ ] 6.4 - Test: GET /api/sections/:id (récupérer "Daily Tools")
  - [ ] Réponse 200 avec détails section
- [ ] 6.5 - Test: PUT /api/sections/:id (renommer en "Daily Essentials")
  - [ ] Réponse 200 avec section modifiée
- [ ] 6.6 - Test: POST /api/sections (créer avec même nom)
  - [ ] Réponse 409 erreur "Name already exists in this page"
- [ ] 6.7 - Test: POST /api/sections/:id/toggle-collapsed
  - [ ] Réponse 200 avec collapsed = true
  - [ ] Re-toggle → collapsed = false
- [ ] 6.8 - Test: DELETE /api/sections/:id (supprimer "Work Projects")
  - [ ] Réponse 204
  - [ ] Vérifier GET retourne 1 seule section
- [ ] 6.9 - Test: POST /api/sections/reorder
  - [ ] Réorganiser l'ordre
  - [ ] Vérifier positions mises à jour
- [ ] 6.10 - Test: Créer 3 sections de test (Daily Tools, Projects, Resources)
  - [ ] 3 sections créées pour tests frontend

### PHASE 7: Frontend - Sections Store (Zustand) ⏳ À FAIRE
- [ ] 7.1 - Créer `frontend/src/features/sections/store/sectionsStore.js`
- [ ] 7.2 - State: `sections` (array)
- [ ] 7.3 - State: `sectionsByPage` (object: { pageId: [sections] })
- [ ] 7.4 - State: `loading`, `error`
- [ ] 7.5 - Action: `fetchSections(pageId)` → GET /api/sections?pageId=X
- [ ] 7.6 - Action: `createSection(pageId, sectionData)` → POST /api/sections
- [ ] 7.7 - Action: `updateSection(id, updates)` → PUT /api/sections/:id
- [ ] 7.8 - Action: `deleteSection(id)` → DELETE /api/sections/:id
- [ ] 7.9 - Action: `reorderSections(pageId, sectionIds)` → POST /api/sections/reorder
- [ ] 7.10 - Action: `toggleCollapsed(id)` → POST /api/sections/:id/toggle-collapsed
- [ ] 7.11 - Action: `clearError()`, `reset()`
- [ ] 7.12 - Intégration avec authStore pour JWT token
- [ ] 7.13 - Grouper sections par pageId dans state

### PHASE 8: Frontend - Sections Service (API) ⏳ À FAIRE
- [ ] 8.1 - Créer `frontend/src/features/sections/services/sectionsService.js`
- [ ] 8.2 - Setup axios avec base URL (VITE_API_URL)
- [ ] 8.3 - Méthode `getAll(pageId, token)` avec Authorization header
- [ ] 8.4 - Méthode `getOne(id, token)`
- [ ] 8.5 - Méthode `create(pageId, sectionData, token)`
- [ ] 8.6 - Méthode `update(id, updates, token)`
- [ ] 8.7 - Méthode `delete(id, token)`
- [ ] 8.8 - Méthode `reorder(pageId, sectionIds, token)`
- [ ] 8.9 - Méthode `toggleCollapsed(id, token)`

### PHASE 9: Frontend - SectionList Component ⏳ À FAIRE
- [ ] 9.1 - Créer `frontend/src/features/sections/components/SectionList.jsx`
- [ ] 9.2 - Afficher sections empilées verticalement
- [ ] 9.3 - Props: `pageId` (required)
- [ ] 9.4 - useEffect: fetchSections(pageId) quand pageId change
- [ ] 9.5 - Bouton "Add Section" en haut ou en bas
- [ ] 9.6 - Empty state: "No sections yet. Create your first section!"
- [ ] 9.7 - Loading/error states
- [ ] 9.8 - Mapper sections → <SectionCard />
- [ ] 9.9 - Style: Espacement vertical entre sections

### PHASE 10: Frontend - SectionCard Component ⏳ À FAIRE
- [ ] 10.1 - Créer `frontend/src/features/sections/components/SectionCard.jsx`
- [ ] 10.2 - Props: `section` (object)
- [ ] 10.3 - Header avec:
  - [ ] Icon collapse/expand (▼/▶)
  - [ ] Nom de la section
  - [ ] Boutons "Edit" et "Delete" (visible au hover)
- [ ] 10.4 - Body (si !collapsed):
  - [ ] Placeholder: "Groups Coming Soon (Iteration 4)"
  - [ ] Empty state: "Add groups to organize bookmarks"
- [ ] 10.5 - Cliquer icon → toggleCollapsed()
- [ ] 10.6 - Cliquer "Edit" → ouvrir EditSectionModal
- [ ] 10.7 - Cliquer "Delete" → confirmation → deleteSection()
- [ ] 10.8 - Style: Card avec border, padding, shadow
- [ ] 10.9 - Animation collapse/expand (transition height)
- [ ] 10.10 - Footer: Stats "0 groups, 0 bookmarks" (hardcoded pour maintenant)

### PHASE 11: Frontend - CreateSectionModal Component ⏳ À FAIRE
- [ ] 11.1 - Créer `frontend/src/features/sections/components/CreateSectionModal.jsx`
- [ ] 11.2 - Modal avec overlay semi-transparent
- [ ] 11.3 - Props: `isOpen`, `onClose`, `pageId`
- [ ] 11.4 - Form: Input "Section Name" (required)
- [ ] 11.5 - Validation: Name non vide, max 100 chars
- [ ] 11.6 - Character counter (X/100)
- [ ] 11.7 - Bouton "Cancel" et "Create"
- [ ] 11.8 - Submit → appeler store.createSection(pageId, { name })
- [ ] 11.9 - Afficher loading pendant création
- [ ] 11.10 - Fermer modal après succès
- [ ] 11.11 - Afficher erreur si échec (duplicate name, etc.)
- [ ] 11.12 - Style: Suivre pattern modals Itération 2

### PHASE 12: Frontend - EditSectionModal Component ⏳ À FAIRE
- [ ] 12.1 - Créer `frontend/src/features/sections/components/EditSectionModal.jsx`
- [ ] 12.2 - Props: `isOpen`, `onClose`, `section`
- [ ] 12.3 - Pré-remplir avec section.name (useEffect)
- [ ] 12.4 - Submit → appeler store.updateSection(section.id, { name })
- [ ] 12.5 - Validation: même que CreateSectionModal
- [ ] 12.6 - Error handling (duplicate names, etc.)
- [ ] 12.7 - Style: Même que CreateSectionModal

### PHASE 13: Frontend - Intégration PageView ⏳ À FAIRE
- [ ] 13.1 - Modifier `frontend/src/features/pages/components/PageView.jsx`
- [ ] 13.2 - Importer SectionList, CreateSectionModal, EditSectionModal
- [ ] 13.3 - Remplacer placeholder "Sections Coming Soon" par <SectionList />
- [ ] 13.4 - Passer currentPage.id comme pageId
- [ ] 13.5 - State management pour modals:
  - [ ] isCreateSectionOpen
  - [ ] isEditSectionOpen
  - [ ] editingSection
- [ ] 13.6 - Handlers: handleCreateSection, handleEditSection, handleDeleteSection
- [ ] 13.7 - Confirmation dialog pour delete section
- [ ] 13.8 - Layout: Sections prennent toute la largeur
- [ ] 13.9 - Bouton "Add Section" bien visible

### PHASE 14: Tests Manuels Complets ⏳ À FAIRE
- [ ] 14.1 - **Test: Créer première section**
  - [ ] Ouvrir page "Work"
  - [ ] Cliquer "Add Section"
  - [ ] Remplir "Daily Tools"
  - [ ] Submit
  - [ ] ✅ Section "Daily Tools" apparaît
  - [ ] ✅ Section est expanded par défaut
- [ ] 14.2 - **Test: Créer deuxième section**
  - [ ] Créer "Work Projects"
  - [ ] ✅ 2 sections visibles, empilées verticalement
- [ ] 14.3 - **Test: Collapse/Expand section**
  - [ ] Cliquer icon collapse "Daily Tools"
  - [ ] ✅ Section se replie (animation)
  - [ ] Cliquer à nouveau
  - [ ] ✅ Section s'ouvre
- [ ] 14.4 - **Test: Éditer section**
  - [ ] Hover "Daily Tools" → cliquer "Edit"
  - [ ] Changer nom en "Daily Essentials"
  - [ ] Submit
  - [ ] ✅ Nom mis à jour
- [ ] 14.5 - **Test: Supprimer section**
  - [ ] Hover "Work Projects" → cliquer "Delete"
  - [ ] Confirmer
  - [ ] ✅ Section disparaît
- [ ] 14.6 - **Test: Créer section avec nom existant**
  - [ ] Essayer créer "Daily Essentials" (déjà existe)
  - [ ] ✅ Erreur affichée
- [ ] 14.7 - **Test: Sections persistantes**
  - [ ] Refresh page (F5)
  - [ ] ✅ Sections toujours là
  - [ ] ✅ État collapsed preserved
- [ ] 14.8 - **Test: Navigation entre pages**
  - [ ] Créer sections dans page "Personnel"
  - [ ] Switcher entre pages "Work" et "Personnel"
  - [ ] ✅ Sections différentes pour chaque page
- [ ] 14.9 - **Test: Supprimer page avec sections**
  - [ ] Créer page avec 2 sections
  - [ ] Supprimer la page
  - [ ] Vérifier en DB que sections sont aussi supprimées (CASCADE)
- [ ] 14.10 - **Test: Empty state**
  - [ ] Créer nouvelle page sans sections
  - [ ] ✅ Message "No sections yet"
  - [ ] ✅ Bouton "Add Section" visible

### PHASE 15: Vérifications Database ⏳ À FAIRE
- [ ] 15.1 - Query: `SELECT * FROM sections ORDER BY page_id, position;`
  - [ ] ✅ Sections créées visibles
  - [ ] ✅ Positions correctes (0, 1, 2...)
  - [ ] ✅ page_id correspond aux pages
  - [ ] ✅ collapsed correctement stocké
  - [ ] ✅ created_at, updated_at présents
- [ ] 15.2 - Query: `SELECT p.name, s.name, s.position FROM pages p LEFT JOIN sections s ON p.id = s.page_id ORDER BY p.name, s.position;`
  - [ ] ✅ Voir hiérarchie Pages → Sections
- [ ] 15.3 - Test CASCADE delete:
  - [ ] Supprimer une page
  - [ ] Vérifier que ses sections sont aussi supprimées

---

## 🎯 Critères de Succès Globaux

### Backend ⏳ À FAIRE
- [ ] Migration 003_create_sections.sql exécutée
- [ ] Module sections complet (Model, Service, Controller, Routes)
- [ ] API testée avec curl (tous les endpoints)
- [ ] Validation: Noms uniques par page
- [ ] Authorization: User ne voit que ses sections (via ownership pages)
- [ ] FK cascade: Supprimer page → supprime sections
- [ ] 3 sections de test créées par page

### Frontend ⏳ À FAIRE
- [ ] Store Zustand fonctionnel
- [ ] Service API avec auth integration
- [ ] SectionList component
- [ ] SectionCard component (avec collapse/expand)
- [ ] CreateSectionModal component
- [ ] EditSectionModal component
- [ ] PageView integration
- [ ] Tests manuels complets

### Tests ⏳ À FAIRE
- [ ] Tous les tests manuels passés (14.1 à 14.10)
- [ ] Database vérifiée (CASCADE delete fonctionne)

---

## 📦 Livrables de l'Itération 3

1. ⏳ Table `sections` dans PostgreSQL
2. ⏳ Backend: Module `sections/` complet
3. ⏳ Frontend: Feature `sections/` complète
4. ⏳ UI: Components créés (SectionList, SectionCard, Modals)
5. ⏳ CRUD complet (backend + frontend testés)
6. ⏳ PageView mis à jour avec sections
7. ⏳ Feature collapse/expand fonctionnelle

---

## 📂 Fichiers à Créer/Modifier

### Backend (À CRÉER)
- `backend/src/shared/migrations/003_create_sections.sql` - Migration table sections
- `backend/src/modules/sections/sections.model.js` - Model avec 10 méthodes
- `backend/src/modules/sections/sections.service.js` - Service avec validation business
- `backend/src/modules/sections/sections.controller.js` - Controller avec 9 handlers
- `backend/src/modules/sections/sections.routes.js` - Routes protégées
- `backend/src/app.js` - Ajout route `/api/sections` (À MODIFIER)

### Frontend (À CRÉER)
- `frontend/src/features/sections/store/sectionsStore.js` - Zustand store
- `frontend/src/features/sections/services/sectionsService.js` - Service API axios
- `frontend/src/features/sections/components/SectionList.jsx` - Liste sections
- `frontend/src/features/sections/components/SectionCard.jsx` - Card individuelle
- `frontend/src/features/sections/components/CreateSectionModal.jsx` - Modal création
- `frontend/src/features/sections/components/EditSectionModal.jsx` - Modal édition
- `frontend/src/features/pages/components/PageView.jsx` - Integration sections (À MODIFIER)

---

## 🚀 Prochaine Action

**MAINTENANT**: PHASE 1 - Créer la migration database pour la table sections

**Étapes immédiates**:
1. Créer `003_create_sections.sql`
2. Définir schéma avec FK vers pages
3. Ajouter index et constraints
4. Exécuter migration
5. Vérifier dans PostgreSQL

**STATUS**: ⏳ 0% - Prêt à démarrer!

---

## 📝 Notes de Session

### 🎨 Design Decisions (À DÉFINIR)
- **Collapse icon**: ▼ (expanded) / ▶ (collapsed)
- **Layout**: Sections empilées verticalement, pleine largeur
- **Animation**: Smooth transition height pour collapse/expand
- **Empty state**: Message encourageant + gros bouton "Add Section"
- **Hover actions**: Boutons Edit/Delete visibles au hover
- **Color scheme**: Suivre theme principal (#667eea)

### 🔄 Différences vs Itération 2 (Pages)
- **Relation**: Sections appartiennent à une Page (FK page_id)
- **Feature unique**: Collapse/Expand (boolean `collapsed`)
- **Pas de**: Icon picker, color picker (plus simple)
- **Query param**: GET /api/sections?pageId=X (obligatoire)
- **Ownership**: Via page (vérifier user_id de la page)

### 📊 Statistiques Attendues
- Backend: ~400-500 lignes de code
- Frontend: ~500-600 lignes de code
- Migration: ~30 lignes SQL
- Tests API: ~10-15 requêtes curl

---

## 🎯 Objectif Final Itération 3

**Fin de l'itération, user doit pouvoir:**
1. ✅ Créer plusieurs sections dans une page
2. ✅ Voir sections empilées verticalement
3. ✅ Replier/déplier sections (collapse/expand)
4. ✅ Éditer nom de section
5. ✅ Supprimer section
6. ✅ Sections persistent après refresh
7. ✅ Chaque page a ses propres sections

**Prêt pour Itération 4: Groups Management**
