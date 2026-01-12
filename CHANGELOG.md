# 📝 Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

---

## [2.0.0] - 2026-01-07

### ✅ Itérations Complétées

#### Itération 5: Bookmarks Management
- ✅ Backend complet (Model, Service, Controller, Routes)
- ✅ Frontend complet (Store, Service, Components, Modals)
- ✅ CRUD bookmarks avec validation complète
- ✅ Click tracking (visit_count)
- ✅ Drag & drop pour réorganiser
- ✅ Display avec favicons et actions
- ✅ Tests API complets (10 endpoints)

#### Itération 4: Groups
- ✅ CRUD groups dans sections
- ✅ Groups manuels et dynamiques
- ✅ Column layout configurable (1-6)
- ✅ Drag & drop horizontal
- ✅ Width responsive (1=100%, 2=50%, 3+=33%)

#### Itération 3: Sections
- ✅ CRUD sections dans pages
- ✅ Drag & drop vertical
- ✅ Collapse/expand sections
- ✅ Réorganisation optimiste

#### Itération 2: Pages Management
- ✅ CRUD pages avec tabs
- ✅ Icons et couleurs personnalisées
- ✅ Navigation entre pages
- ✅ Drag & drop pour réorganiser

#### Itération 1: Authentification
- ✅ Register / Login avec JWT
- ✅ Protected routes avec middleware
- ✅ User model avec bcrypt
- ✅ Token expiration (7 jours)

#### Itération 0: Setup & Foundation
- ✅ Structure backend (Express + PostgreSQL)
- ✅ Structure frontend (React + Vite + Zustand)
- ✅ Docker Compose (PostgreSQL + Redis)
- ✅ Migrations système

### 📚 Documentation
- Fusion QUICKSTART.md + README.md → README.md unique
- Création ITERATIONS.md avec plan clair des 10+ prochaines itérations
- Archivage anciens documents dans `docs/archive/`
- Structure simplifiée: README.md + ITERATIONS.md + CLAUDE.md

### 🛠️ Infrastructure
- 5 tables PostgreSQL: users, pages, sections, groups, bookmarks
- 11 migrations exécutées
- Backend: 5 modules complets (auth, pages, sections, groups, bookmarks)
- Frontend: 5 features complètes avec stores, services, components

---

## Versions Précédentes

### [1.0.0] - Concept Initial
- Architecture 4 niveaux: Page → Section → Group → Bookmark
- Plan complet des 12+ itérations
- Stack technique défini

---

## 🎯 Prochaine Version

### [2.1.0] - En Préparation
**Itération 6: Favicon Fetching Automatique**
- Service backend pour récupération favicons
- Cache en DB avec table `icons_cache`
- Fallback icons par défaut
- Auto-fetch lors création bookmarks

**Itération 7: Groups Dynamiques "Top Used"**
- Auto-population basée sur `visit_count`
- Configuration `bookmark_limit`
- Mise à jour temps réel
- Badge "Auto" sur groups dynamiques

---

**Format**: [Version] - Date
**Types de changements**:
- ✅ Ajouté - Nouvelles fonctionnalités
- 🔧 Modifié - Changements dans fonctionnalités existantes
- 🐛 Corrigé - Corrections de bugs
- 🗑️ Supprimé - Fonctionnalités retirées
- 📚 Documentation - Changements dans documentation
