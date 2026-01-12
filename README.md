# 🚀 PinGrid V2.0

Application moderne de gestion de bookmarks avec organisation hiérarchique à 4 niveaux.

## 🏗️ Architecture

```
📄 PAGE → 📦 SECTION → 🗂️ GROUP → 🔖 BOOKMARK
```

- **Pages**: Conteneurs de haut niveau (ex: "Travail", "Personnel")
- **Sections**: Blocs verticaux drag & drop dans une page
- **Groups**: Conteneurs en grille (1-6 colonnes)
- **Bookmarks**: Cartes individuelles avec favicons et click tracking

## 🛠️ Stack Technique

- **Frontend**: React 18 + Vite + Zustand + React Router
- **Backend**: Node.js 18 + Express + PostgreSQL + Redis
- **Authentification**: JWT (email/password)
- **Drag & Drop**: HTML5 native API

## 📁 Structure du Projet

```
PinGrid V2.0/
├── backend/              # API Node.js Express
│   ├── src/
│   │   ├── modules/      # Auth, pages, sections, groups, bookmarks
│   │   ├── shared/       # Config, middleware, migrations
│   │   └── server.js
│   └── package.json
├── frontend/             # Application React
│   ├── src/
│   │   ├── features/     # Composants par feature
│   │   ├── shared/       # Composants réutilisables
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml    # PostgreSQL + Redis
├── README.md            # Ce fichier
├── ITERATIONS.md        # Plan des prochaines itérations
└── CLAUDE.md           # Instructions pour Claude Code
```

---

## ⚡ Démarrage Rapide

### Prérequis

- **Node.js 18+** (`node --version`)
- **PostgreSQL 15+** - Installation locale OU Docker

### Option A: PostgreSQL Local (Windows)

Si vous avez PostgreSQL installé localement:

```bash
# 1. Créer la base de données
psql -U postgres
CREATE DATABASE pingrid;
\c pingrid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q

# 2. Backend
cd backend
npm install
cp .env.local.example .env
# Éditer .env: DB_PASSWORD=password (votre mot de passe PostgreSQL)
npm run dev

# 3. Frontend (nouveau terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Option B: Docker Compose (Recommandé)

Si vous préférez Docker:

```bash
# 1. Démarrer PostgreSQL + Redis
docker-compose up -d

# 2. Backend
cd backend
npm install
cp .env.docker.example .env
# DB_PASSWORD=postgres (défini dans docker-compose.yml)
npm run dev

# 3. Frontend (nouveau terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Accès

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health check**: http://localhost:5000/health

---

## 🧪 Premier Test

1. Ouvrir http://localhost:3000
2. Créer un compte (Register)
3. Créer une Page (ex: "Work")
4. Ajouter une Section (ex: "Daily Tools")
5. Ajouter un Group (ex: "Communication")
6. Ajouter des Bookmarks (ex: "Gmail", "Slack")
7. Tester le drag & drop pour réorganiser

---

## 📊 État Actuel

### ✅ Itérations Complétées

- **Itération 0**: Setup & Foundation
- **Itération 1**: Authentification JWT
- **Itération 2**: Pages Management
- **Itération 3**: Sections avec Drag & Drop
- **Itération 4**: Groups (Manual + Dynamic)
- **Itération 5**: Bookmarks CRUD + Click Tracking

### 🔜 Prochaines Itérations

Voir `ITERATIONS.md` pour le plan détaillé des prochaines fonctionnalités.

---

## 🗄️ Base de Données

### Tables Actuelles

```sql
users          -- Utilisateurs (email/password, JWT)
pages          -- Pages de l'utilisateur (Work, Personal, etc.)
sections       -- Sections dans une page (vertical blocks)
groups         -- Groups dans une section (grid containers)
bookmarks      -- Bookmarks dans un group (avec click tracking)
```

### Vérifier les Données

```bash
# Se connecter à PostgreSQL
psql -U postgres -d pingrid

# Voir toutes les tables
\dt

# Voir vos bookmarks
SELECT b.title, b.url, b.visit_count, g.name as group_name
FROM bookmarks b
JOIN groups g ON b.group_id = g.id
ORDER BY b.visit_count DESC;

\q
```

---

## 🐛 Dépannage

### Port Déjà Utilisé

**Backend (5000)**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**Frontend (3000)**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erreur "password authentication failed"

Vérifiez que `DB_PASSWORD` dans `backend/.env` correspond à votre installation:
- **Docker**: `DB_PASSWORD=postgres`
- **Local**: `DB_PASSWORD=password` (ou votre mot de passe)

### Tables Manquantes

Si vous avez l'erreur "relation does not exist":
```bash
cd backend
# Exécuter toutes les migrations
node src/shared/scripts/runMigration.js
```

### Docker ne Démarre Pas

```bash
# Arrêter tout
docker-compose down

# Supprimer les volumes (⚠️ efface les données)
docker-compose down -v

# Redémarrer
docker-compose up -d
```

---

## 📚 API Endpoints

### Auth
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Profil utilisateur

### Pages
- `GET /api/pages` - Liste des pages
- `POST /api/pages` - Créer une page
- `PUT /api/pages/:id` - Modifier
- `DELETE /api/pages/:id` - Supprimer
- `POST /api/pages/reorder` - Réorganiser

### Sections
- `GET /api/sections?pageId=X` - Liste des sections
- `POST /api/sections` - Créer
- `PUT /api/sections/:id` - Modifier
- `DELETE /api/sections/:id` - Supprimer
- `POST /api/sections/reorder` - Réorganiser

### Groups
- `GET /api/groups?sectionId=X` - Liste des groups
- `POST /api/groups` - Créer
- `PUT /api/groups/:id` - Modifier
- `DELETE /api/groups/:id` - Supprimer
- `POST /api/groups/reorder` - Réorganiser

### Bookmarks
- `GET /api/bookmarks?groupId=X` - Liste des bookmarks
- `GET /api/bookmarks/top-used?limit=10` - Top utilisés
- `GET /api/bookmarks/stats?groupId=X` - Statistiques
- `POST /api/bookmarks` - Créer
- `PUT /api/bookmarks/:id` - Modifier
- `DELETE /api/bookmarks/:id` - Supprimer
- `POST /api/bookmarks/reorder` - Réorganiser
- `POST /api/bookmarks/:id/click` - Tracker un clic

---

## 🛠️ Commandes Utiles

### Backend
```bash
npm run dev      # Mode développement (auto-reload)
npm start        # Mode production
```

### Frontend
```bash
npm run dev      # Mode développement (HMR)
npm run build    # Build production
npm run preview  # Preview du build
```

### Docker
```bash
docker-compose up -d        # Démarrer
docker-compose down         # Arrêter
docker-compose logs -f      # Voir les logs
docker-compose restart      # Redémarrer
```

---

## 📞 Support

- **Plan des itérations**: `ITERATIONS.md`
- **Instructions Claude**: `CLAUDE.md`
- **Architecture**: Page → Section → Group → Bookmark

---

**Version**: 2.0.0
**Dernière mise à jour**: 2026-01-07
**Auteur**: Yannick
**License**: MIT

🚀 **Ready to organize your bookmarks!**
w
