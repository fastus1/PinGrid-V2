# 📋 PinGrid V2.0 - Plan des Itérations

## ✅ Itérations Complétées (0-5)

### Itération 0: Setup & Foundation
- ✅ Structure projet (backend/frontend)
- ✅ Docker Compose (PostgreSQL + Redis)
- ✅ Configuration de base

### Itération 1: Authentification
- ✅ Register / Login (JWT)
- ✅ Protected routes
- ✅ User management

### Itération 2: Pages Management
- ✅ CRUD Pages
- ✅ Page tabs navigation
- ✅ Drag & drop pour réorganiser

### Itération 3: Sections
- ✅ CRUD Sections
- ✅ Sections verticales dans pages
- ✅ Drag & drop vertical
- ✅ Collapse/expand

### Itération 4: Groups
- ✅ CRUD Groups
- ✅ Groups manuels et dynamiques
- ✅ Column layout (1-6 colonnes)
- ✅ Drag & drop horizontal

### Itération 5: Bookmarks ← **ACTUELLEMENT ICI**
- ✅ CRUD Bookmarks
- ✅ Click tracking (visit_count)
- ✅ Drag & drop dans groups
- ✅ Modals create/edit
- ✅ Display avec favicons

---

## 🎯 Prochaines Itérations (6-12)

### Itération 6: Favicon Fetching Automatique
**Durée estimée**: 2-3 heures

**Objectif**: Récupérer automatiquement les favicons des sites web

**Features**:
- Service backend pour fetcher favicons
- Google Favicon API: `https://www.google.com/s2/favicons?domain=example.com`
- Fallback vers DuckDuckGo API si Google échoue
- Cache des favicons en DB (table `icons_cache`)
- Auto-fetch lors de la création d'un bookmark
- Retry logic si fetch échoue
- Default icon si aucun favicon disponible

**Fichiers à créer**:
- `backend/src/shared/services/faviconService.js`
- `backend/src/shared/migrations/006_create_icons_cache.sql`

**Modifications**:
- `bookmarks.service.js` - Appeler favicon service lors du create
- `BookmarkCard.jsx` - Afficher favicon ou fallback

**Tests**:
- Créer bookmark avec URL valide → favicon s'affiche
- Créer bookmark avec URL invalide → default icon
- Cache fonctionne (pas de re-fetch si déjà en DB)

---

### Itération 7: Groups Dynamiques "Top Used"
**Durée estimée**: 3-4 heures

**Objectif**: Groups auto-remplis avec bookmarks les plus cliqués

**Features**:
- Créer group type "dynamic-top-used"
- Configurer `bookmark_limit` (ex: 10)
- Query automatique pour récupérer top bookmarks par `visit_count`
- Mise à jour en temps réel quand on clique
- Affichage badge "Auto" sur groups dynamiques
- Read-only (pas d'edit/delete dans group dynamique)

**Fichiers à modifier**:
- `groups.service.js` - Logique pour peupler groups dynamiques
- `bookmarks.model.js` - Query `getTopUsedForUser(userId, limit)`
- `GroupCard.jsx` - Display différent pour groups dynamiques
- `CreateGroupModal.jsx` - Option pour choisir type dynamic

**Tests**:
- Créer group "Top 10"
- Cliquer sur plusieurs bookmarks
- Vérifier que group "Top 10" se met à jour automatiquement

---

### Itération 8: Recherche & Filtres
**Durée estimée**: 4-5 heures

**Objectif**: Rechercher et filtrer bookmarks rapidement

**Features**:
- Search bar globale dans header
- Recherche par titre/URL/description
- Filtrer par page/section/group
- Tri par: date, nom, fréquence d'utilisation
- Highlight résultats de recherche
- Keyboard shortcut (Ctrl+K ou Cmd+K)
- Résultats en temps réel (debounce 300ms)

**Fichiers à créer**:
- `frontend/src/features/search/SearchBar.jsx`
- `frontend/src/features/search/SearchResults.jsx`
- `backend/src/modules/bookmarks/bookmarks.search.js`

**Endpoints à ajouter**:
- `GET /api/bookmarks/search?q=github&userId=X`

**Tests**:
- Rechercher "github" → trouve tous bookmarks avec "github"
- Filtrer par group spécifique
- Tri par visit_count fonctionne

---

### Itération 9: Import / Export Bookmarks
**Durée estimée**: 5-6 heures

**Objectif**: Importer bookmarks depuis navigateurs, exporter données

**Features Import**:
- Parser HTML bookmarks (Chrome, Firefox, Safari)
- Parser JSON (format custom PinGrid)
- Wizard multi-étapes (upload → preview → confirm → import)
- Détecter structure hiérarchique existante
- Mapper vers pages/sections/groups
- Progress bar pendant import
- Rapport d'import (success/failed/duplicates)

**Features Export**:
- Export en JSON (backup complet)
- Export en HTML (compatible navigateurs)
- Export en CSV (pour Excel)
- Choisir scope (toutes pages ou page spécifique)
- Download file automatiquement

**Fichiers à créer**:
- `backend/src/modules/import/importService.js`
- `backend/src/modules/export/exportService.js`
- `frontend/src/features/import/ImportWizard.jsx`
- `frontend/src/features/export/ExportDialog.jsx`

**Endpoints**:
- `POST /api/import/bookmarks` (multipart/form-data)
- `POST /api/export/bookmarks` (JSON body, returns file)

---

### Itération 10: Tags & Advanced Organization
**Durée estimée**: 3-4 heures

**Objectif**: Tags pour organisation cross-hierarchy

**Features**:
- Ajouter tags aux bookmarks (array PostgreSQL)
- Autocomplete tags existants
- Filtrer par tag
- Tag cloud / popular tags
- Color-coded tags
- Manage tags (rename, merge, delete)

**Schema changes**:
```sql
bookmarks:
  - tags TEXT[] -- Array de tags
```

**Fichiers à créer**:
- `frontend/src/features/tags/TagManager.jsx`
- `frontend/src/features/tags/TagInput.jsx`
- `backend/src/modules/tags/tagsService.js`

---

### Itération 11: Keyboard Shortcuts
**Durée estimée**: 2-3 heures

**Objectif**: Navigation rapide au clavier

**Shortcuts**:
- `Ctrl/Cmd + K` - Recherche
- `Ctrl/Cmd + N` - Nouveau bookmark
- `Ctrl/Cmd + ,` - Settings
- `Esc` - Fermer modal/dialog
- `Arrow Keys` - Navigation dans résultats
- `Enter` - Ouvrir bookmark sélectionné
- `?` - Afficher help overlay avec tous les shortcuts

**Implémentation**:
- Hook `useKeyboard.js` pour gérer shortcuts
- Context `KeyboardContext` pour état global
- Modal "Keyboard Shortcuts" (trigger avec `?`)

---

### Itération 12: Statistiques & Analytics
**Durée estimée**: 4-5 heures

**Objectif**: Dashboard avec statistiques d'utilisation

**Features**:
- Total bookmarks par page/section/group
- Top 10 bookmarks les plus cliqués
- Timeline d'activité (clics par jour/semaine)
- Bookmarks jamais utilisés (visit_count = 0)
- Tendances (bookmarks qui montent)
- Export stats en CSV
- Charts avec Chart.js ou Recharts

**Fichiers à créer**:
- `frontend/src/features/stats/StatsPage.jsx`
- `frontend/src/features/stats/Charts.jsx`
- `backend/src/modules/stats/statsService.js`

**Endpoints**:
- `GET /api/stats/overview` - Statistiques globales
- `GET /api/stats/timeline?start=X&end=Y` - Timeline
- `GET /api/stats/unused` - Bookmarks non utilisés

---

### Itération 13: Partage & Collaboration (Future)
**Durée estimée**: 8-10 heures

**Objectif**: Partager pages avec d'autres users

**Features**:
- Partager une page publiquement (URL unique)
- Permissions (view-only / edit)
- Fork page partagée vers son compte
- Invite users par email
- Real-time collaboration (WebSockets)
- Activity log (qui a modifié quoi)

---

### Itération 14: PWA & Offline Mode (Future)
**Durée estimée**: 6-8 heures

**Objectif**: Progressive Web App avec support offline

**Features**:
- Service Worker pour cache
- Manifest.json pour install
- Offline detection
- Sync queue pour actions offline
- IndexedDB pour cache local
- Background sync

---

### Itération 15: Performance & Optimization (Future)
**Durée estimée**: 4-5 heures

**Objectif**: Optimiser performance pour grandes collections

**Features**:
- Lazy loading bookmarks (pagination)
- Virtual scrolling pour grandes listes
- Image lazy loading (favicons)
- Redis cache pour queries fréquentes
- DB indexes optimization
- Bundle size optimization (code splitting)
- CDN pour static assets

---

## 🏆 Version 1.0 Goals

Pour atteindre la version 1.0, compléter les itérations 6-11:

- [x] **Itération 0-5**: Core features (CRUD complet)
- [ ] **Itération 6**: Favicons automatiques
- [ ] **Itération 7**: Groups dynamiques
- [ ] **Itération 8**: Recherche
- [ ] **Itération 9**: Import/Export
- [ ] **Itération 10**: Tags
- [ ] **Itération 11**: Keyboard shortcuts
- [ ] **Itération 12**: Stats

**Total estimé pour v1.0**: ~25-35 heures additionnelles

---

## 📝 Notes

### Priorités Recommandées

**Court terme** (Prochaines 2-3 sessions):
1. ✅ **Itération 6: Favicons** - Très visible, améliore l'UX immédiatement
2. ✅ **Itération 7: Groups dynamiques** - Feature cool qui utilise click tracking
3. **Itération 8: Recherche** - Essential pour collections importantes

**Moyen terme**:
4. **Itération 9: Import/Export** - Critical pour adoption (migration facile)
5. **Itération 10: Tags** - Organisation avancée
6. **Itération 11: Shortcuts** - Power users

**Long terme**:
7. **Itération 12+**: Analytics, partage, PWA, performance

### Features "Nice to Have" (Post-v1.0)

- Themes (dark/light modes)
- Browser extensions (Chrome, Firefox)
- Mobile apps (React Native)
- AI-powered categorization
- Duplicate detection
- Broken link checker
- Screenshot capture des sites
- Notes/annotations sur bookmarks
- Reminders (revisit bookmark)

---

**Dernière mise à jour**: 2026-01-07
**Statut actuel**: Itération 5 complétée, prêt pour Itération 6
