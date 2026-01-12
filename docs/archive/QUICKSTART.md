# 🚀 PinGrid V2.0 - Quick Start Guide

Guide de démarrage rapide pour lancer l'application PinGrid V2.0 (backend + frontend).

> **⚠️ ATTENTION - Mot de passe PostgreSQL**
>
> Le mot de passe PostgreSQL diffère selon votre méthode d'installation:
> - **Docker Compose**: Utilisez `DB_PASSWORD=postgres`
> - **PostgreSQL Local**: Utilisez `DB_PASSWORD=password` (ou votre mot de passe d'installation)
>
> Voir la section "Configuration Backend" pour plus de détails.

---

## 📋 Prérequis

Vérifier que ces éléments sont installés:

- **Node.js** 18+ (`node --version`)
- **npm** ou **yarn** (`npm --version`)

**Option A (Recommandé)**:
- **Docker** & **Docker Compose** (`docker --version`)

**Option B (Manuel)**:
- **PostgreSQL** 15+ (`psql --version`)
- **Redis** (optionnel) (`redis-cli --version`)

---

## ⚡ Démarrage Rapide (5 minutes)

### Option A: Avec Docker (Recommandé - Plus Simple)

```bash
# Démarrer PostgreSQL et Redis avec Docker Compose
docker-compose up -d

# Vérifier que les services sont démarrés
docker-compose ps
```

**Avantages**: Pas besoin d'installer PostgreSQL et Redis localement. Tout est isolé dans des conteneurs.

**Important**: Avec Docker Compose, les credentials sont:
- **User**: `postgres`
- **Password**: `postgres` (défini dans docker-compose.yml)
- **Database**: `pingrid`

Passez ensuite à l'étape 2 (Configuration Backend).

---

### Option B: Installation Manuelle

#### 1. Configuration PostgreSQL

```bash
# Démarrer PostgreSQL (si pas déjà lancé)
# Windows: Services → PostgreSQL → Start
# Linux/Mac: sudo service postgresql start

# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE pingrid;

# Créer l'extension UUID
\c pingrid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Quitter psql
\q
```

**Note**: Le mot de passe PostgreSQL dépend de votre installation locale. Les mots de passe courants sont:
- `postgres` (installation par défaut sur Linux/Mac)
- `password` (certaines installations Windows)
- Le mot de passe que vous avez défini lors de l'installation

**⚠️ Important**: Notez bien le mot de passe que vous utilisez, vous en aurez besoin pour le fichier `.env`

---

### 2. Configuration Backend

```bash
# Aller dans le dossier backend
cd backend
```

**⚠️ IMPORTANT: Utilisez le bon fichier .env selon votre méthode d'installation**

**Option A - Docker Compose**:
```bash
# Copier le fichier d'exemple Docker
cp .env.docker.example .env
```

**Option B - PostgreSQL Local**:
```bash
# Copier le fichier d'exemple Local
cp .env.local.example .env
```

**Ou créez manuellement le fichier .env avec le contenu approprié:**

**Fichier `backend/.env` (si vous utilisez Docker Compose)**:
```env
NODE_ENV=development
PORT=5000

# Database - Docker Compose
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pingrid
DB_USER=postgres
DB_PASSWORD=postgres    # ← Docker utilise "postgres"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (générer des secrets sécurisés en production)
JWT_SECRET=pingrid-dev-secret-key-2024-change-in-production-very-long-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Fichier `backend/.env` (si vous utilisez PostgreSQL local)**:
```env
NODE_ENV=development
PORT=5000

# Database - Installation Locale
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pingrid
DB_USER=postgres
DB_PASSWORD=password    # ← Utilisez VOTRE mot de passe PostgreSQL local

# Redis (optionnel en local)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (générer des secrets sécurisés en production)
JWT_SECRET=pingrid-dev-secret-key-2024-change-in-production-very-long-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**📝 Résumé des mots de passe**:
- **Docker Compose**: `DB_PASSWORD=postgres`
- **PostgreSQL Local**: `DB_PASSWORD=password` (ou votre mot de passe d'installation)

```bash
# Installer les dépendances
npm install

# Exécuter les migrations (créer les tables)
npm run migrate

# Démarrer le backend
npm run dev
```

**✅ Backend devrait tourner sur http://localhost:5000**

---

### 3. Configuration Frontend

**Ouvrir un NOUVEAU terminal** (laisser le backend tourner):

```bash
# Aller dans le dossier frontend
cd frontend

# Créer le fichier .env
# Copier le contenu ci-dessous dans frontend/.env
```

**Fichier `frontend/.env`**:
```env
VITE_API_URL=http://localhost:5000
```

```bash
# Installer les dépendances
npm install

# Démarrer le frontend
npm run dev
```

**✅ Frontend devrait tourner sur http://localhost:3000**

---

## 🧪 Test Rapide

### Option 1: Via Interface Web

1. Ouvrir http://localhost:3000
2. Cliquer "Create one" pour créer un compte
3. Remplir le formulaire:
   - **Email**: test@example.com
   - **Password**: password123
   - **First Name**: Test
   - **Last Name**: User
4. Cliquer "Sign Up"
5. Vous devriez être redirigé vers `/dashboard`

### Option 2: Via API (curl)

**Tester la santé de l'API**:
```bash
curl http://localhost:5000/health
```

**Réponse attendue**:
```json
{
  "success": true,
  "message": "PinGrid API is running!",
  "timestamp": "2026-01-04T...",
  "environment": "development"
}
```

**Créer un utilisateur**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Copier le `token` de la réponse et créer une page**:
```bash
curl -X POST http://localhost:5000/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "name": "Work",
    "icon": "💼",
    "color": "#667eea"
  }'
```

---

## 📂 Structure du Projet

```
pingrid-v2/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Authentification (JWT)
│   │   │   └── pages/         # Gestion des pages (Itération 2)
│   │   ├── shared/
│   │   │   ├── config/        # DB, JWT config
│   │   │   ├── middleware/    # Auth, error handling
│   │   │   ├── migrations/    # SQL migrations
│   │   │   └── routes/        # Routes communes
│   │   ├── app.js             # Express app
│   │   └── server.js          # Entry point
│   ├── .env                   # Variables d'environnement
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/          # Login/Register
│   │   │   └── pages/         # Pages management (Itération 2)
│   │   ├── pages/             # Dashboard, etc.
│   │   └── App.jsx
│   ├── .env                   # Variables d'environnement
│   └── package.json
│
├── QUICKSTART.md              # Ce fichier
├── PROGRESS_ITERATION_2.md    # Suivi Itération 2
└── PLAN_ITERATIF.md           # Plan complet 4 niveaux
```

---

## 🔑 État Actuel du Projet

### ✅ Itération 1: Authentification (COMPLÈTE)
- [x] Inscription / Connexion
- [x] JWT tokens
- [x] Protected routes
- [x] User model

### ⏳ Itération 2: Pages Management (80% complète)
- [x] Backend complet (Model, Service, Controller, Routes)
- [x] Migration table `pages`
- [x] Store Zustand
- [x] Composants UI (PageTabs, Modals, PageView)
- [ ] **TODO**: Intégration Dashboard (prochaine étape)
- [ ] **TODO**: Tests manuels complets

### 🔜 Itération 3: Sections (À FAIRE)
### 🔜 Itération 4: Groups (À FAIRE)
### 🔜 Itération 5: Bookmarks (À FAIRE)

---

## 🗄️ Base de Données

### Tables actuelles

**users**:
```sql
- id (UUID)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- first_name, last_name (VARCHAR)
- created_at, updated_at
```

**pages**:
```sql
- id (UUID)
- user_id (UUID) → FK users
- name (VARCHAR 100)
- position (INTEGER)
- icon (VARCHAR 50)
- color (VARCHAR 7)
- created_at, updated_at
```

### Vérifier les tables

```bash
# Se connecter à la DB
psql -U postgres -d pingrid

# Lister les tables
\dt

# Voir les users
SELECT * FROM users;

# Voir les pages
SELECT * FROM pages ORDER BY position;

# Quitter
\q
```

---

## 🛠️ Commandes Utiles

### Docker Compose

```bash
# Démarrer les services (PostgreSQL + Redis)
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Redémarrer les services
docker-compose restart

# Supprimer les volumes (⚠️ efface les données)
docker-compose down -v
```

### Backend

```bash
cd backend

# Démarrer en mode dev (avec auto-reload)
npm run dev

# Exécuter une migration spécifique
node src/shared/scripts/runMigration.js

# Lancer les tests (si configurés)
npm test
```

### Frontend

```bash
cd frontend

# Démarrer en mode dev
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview
```

### PostgreSQL

**Avec Docker**:
```bash
# Se connecter au conteneur PostgreSQL
docker exec -it pingrid-postgres psql -U postgres -d pingrid
```

**Installation locale**:
```bash
# Se connecter
psql -U postgres -d pingrid
```

**Commandes SQL utiles**:
```sql
# Supprimer toutes les pages d'un user
DELETE FROM pages WHERE user_id = 'UUID_DU_USER';

# Reset auto-increment positions
UPDATE pages SET position = ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY position) - 1;

# Supprimer un user et ses pages (CASCADE)
DELETE FROM users WHERE email = 'test@example.com';
```

---

## 🐛 Dépannage

### Docker ne démarre pas

**Windows**:
```bash
# Vérifier si Docker Desktop est lancé
"C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Vérifier les conteneurs
docker ps
```

**Erreur "port is already allocated"**:
```bash
# Arrêter les conteneurs existants
docker-compose down

# Si ça persiste, libérer les ports manuellement (voir section "Port déjà utilisé")
```

**Réinitialiser complètement**:
```bash
# Arrêter et supprimer tout (⚠️ efface les données)
docker-compose down -v
docker-compose up -d
```

### Port déjà utilisé

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

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### PostgreSQL ne démarre pas

**Windows**:
- Services → PostgreSQL → Démarrer

**Linux**:
```bash
sudo service postgresql start
sudo service postgresql status
```

**Mac**:
```bash
brew services start postgresql
brew services list
```

### Erreur "relation does not exist"

Les migrations n'ont pas été exécutées:
```bash
cd backend
npm run migrate
```

### Erreur "password authentication failed for user postgres"

Le mot de passe dans votre fichier `.env` ne correspond pas à votre installation PostgreSQL.

**Solution**:
1. Vérifiez quel environnement vous utilisez:
   - **Docker Compose**: Le mot de passe doit être `postgres`
   - **PostgreSQL Local**: Le mot de passe dépend de votre installation (souvent `password` sur Windows)

2. Modifiez `backend/.env`:
```env
# Pour Docker Compose
DB_PASSWORD=postgres

# OU pour PostgreSQL Local (selon votre installation)
DB_PASSWORD=password
```

3. Redémarrez le backend:
```bash
cd backend
npm run dev
```

**Comment vérifier votre mot de passe PostgreSQL local**:
```bash
# Essayez de vous connecter
psql -U postgres -d pingrid

# Si ça demande un mot de passe, essayez: postgres, password, ou votre mot de passe d'installation
```

### Erreur CORS

Vérifier que `CORS_ORIGIN` dans `backend/.env` est correct:
```env
CORS_ORIGIN=http://localhost:3000
```

### Token expired

Le JWT expire après 7 jours. Se reconnecter:
1. Aller à http://localhost:3000
2. Logout
3. Login à nouveau

---

## 📚 API Endpoints

### Auth
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Obtenir user actuel (protected)

### Pages
- `GET /api/pages` - Lister pages (protected)
- `GET /api/pages/stats` - Statistiques (protected)
- `GET /api/pages/:id` - Obtenir une page (protected)
- `POST /api/pages` - Créer une page (protected)
- `PUT /api/pages/:id` - Modifier une page (protected)
- `DELETE /api/pages/:id` - Supprimer une page (protected)
- `POST /api/pages/reorder` - Réorganiser pages (protected)

### Health
- `GET /health` - Status de l'API

---

## 🎯 Prochaines Étapes

1. **Terminer Itération 2**:
   - Intégrer composants Pages dans Dashboard
   - Tests manuels complets

2. **Itération 3: Sections**:
   - Table `sections`
   - CRUD sections
   - UI pour gérer sections dans une page

3. **Itération 4: Groups**:
   - Table `groups`
   - CRUD groups dans une section

4. **Itération 5: Bookmarks**:
   - Table `bookmarks`
   - CRUD bookmarks dans un group
   - Favicon fetching

---

## 📞 Support

- **Fichier de suivi**: `PROGRESS_ITERATION_2.md`
- **Plan complet**: `PLAN_ITERATIF.md`
- **Architecture**: Page → Section → Group → Bookmark (4 niveaux)

---

**Dernière mise à jour**: 2026-01-05 (Configuration mise à jour - Docker Compose ajouté)
