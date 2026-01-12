# PinGrid V2.0 - Plan d'Implémentation Itératif

## Vue d'ensemble - Nouvelle Architecture

### Concept: Organisation à 4 niveaux
```
📄 PAGE (ex: "Travail", "Personnel", "Dev")
  └─ 📦 SECTION (ex: "Daily Tools", "Projects") - Drag & Drop vertical
      └─ 🗂️ GROUPE (ex: "Communication", "Top 10") - Drag & Drop, colonnes configurables
          └─ 🔖 BOOKMARK (ex: "Gmail", "Slack") - Drag & Drop, cliquable
```

### Modes d'utilisation
- **MODE VIEW** (défaut): Page statique HTML ultra-rapide, tout fixe, juste clics fonctionnent
- **MODE EDIT**: React interactif, drag & drop activé, boutons add/delete visibles

### Stack Technique Confirmée
- **Backend**: Node.js + Express + PostgreSQL + Redis
- **Frontend**: React + Vite + Zustand
- **Drag & Drop**: @dnd-kit/core
- **Static Generation**: Custom (HTML pré-généré stocké dans Redis)

---

## Architecture Modulaire

### Structure Backend
```
backend/
├── src/
│   ├── modules/              # Modules indépendants
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.model.js
│   │   ├── pages/
│   │   │   ├── pages.controller.js
│   │   │   ├── pages.service.js
│   │   │   ├── pages.routes.js
│   │   │   └── pages.model.js
│   │   ├── sections/
│   │   ├── groups/
│   │   ├── bookmarks/
│   │   └── static-generation/
│   ├── shared/               # Code partagé
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   └── jwt.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── errorHandler.middleware.js
│   │   └── utils/
│   │       ├── logger.js
│   │       └── validators.js
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── Dockerfile
```

### Structure Frontend
```
frontend/
├── src/
│   ├── features/             # Features indépendantes
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.js
│   │   │   ├── services/
│   │   │   │   └── authService.js
│   │   │   └── store/
│   │   │       └── authStore.js
│   │   ├── pages/
│   │   ├── sections/
│   │   ├── groups/
│   │   └── bookmarks/
│   ├── shared/               # Composants réutilisables
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Layout/
│   │   ├── hooks/
│   │   └── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── router.jsx
├── public/
├── .env.example
├── .gitignore
├── package.json
└── vite.config.js
```

---

## Schéma Base de Données PostgreSQL (Simplifié)

### Tables Principales

```sql
-- Users
users
  - id (UUID, PK)
  - email (VARCHAR, UNIQUE)
  - password_hash (VARCHAR)
  - first_name (VARCHAR)
  - last_name (VARCHAR)
  - is_admin (BOOLEAN)
  - created_at, updated_at (TIMESTAMP)

-- Pages (Niveau 1)
pages
  - id (UUID, PK)
  - user_id (UUID, FK → users)
  - name (VARCHAR) -- "Travail", "Personnel"
  - position (INTEGER) -- Pour ordre dans tabs
  - icon (VARCHAR) -- Icon identifier
  - color (VARCHAR) -- Hex color
  - created_at, updated_at

-- Sections (Niveau 2)
sections
  - id (UUID, PK)
  - page_id (UUID, FK → pages)
  - name (VARCHAR) -- "Daily Tools"
  - position (INTEGER) -- Ordre vertical dans page
  - collapsed (BOOLEAN) -- Section pliée/dépliée
  - created_at, updated_at

-- Groups (Niveau 3)
groups
  - id (UUID, PK)
  - section_id (UUID, FK → sections)
  - name (VARCHAR) -- "Communication"
  - position (INTEGER) -- Ordre dans section
  - column_count (INTEGER) -- 1-6 colonnes
  - group_type (VARCHAR) -- 'manual' ou 'dynamic-top-used'
  - limit (INTEGER) -- Pour groupes dynamiques: combien afficher
  - created_at, updated_at

-- Bookmarks (Niveau 4)
bookmarks
  - id (UUID, PK)
  - group_id (UUID, FK → groups)
  - user_id (UUID, FK → users) -- Pour requêtes top utilisés globales
  - title (VARCHAR)
  - url (TEXT)
  - description (TEXT, nullable)
  - position (INTEGER) -- Ordre dans groupe
  - visit_count (INTEGER, default 0) -- Pour "top utilisés"
  - favicon_url (TEXT, nullable)
  - created_at, updated_at

-- Icons Cache (pour favicons)
icons_cache
  - id (UUID, PK)
  - domain (VARCHAR, UNIQUE)
  - icon_url (TEXT)
  - fetched_at (TIMESTAMP)
  - expires_at (TIMESTAMP)

-- Static Pages Cache (pour performance)
static_pages_cache
  - id (UUID, PK)
  - user_id (UUID, FK → users)
  - page_id (UUID, FK → pages)
  - html_content (TEXT) -- HTML pré-généré
  - generated_at (TIMESTAMP)
  - is_stale (BOOLEAN) -- Marquer pour régénération
```

### Index Clés
```sql
CREATE INDEX idx_pages_user_position ON pages(user_id, position);
CREATE INDEX idx_sections_page_position ON sections(page_id, position);
CREATE INDEX idx_groups_section_position ON groups(section_id, position);
CREATE INDEX idx_bookmarks_group_position ON bookmarks(group_id, position);
CREATE INDEX idx_bookmarks_visit_count ON bookmarks(user_id, visit_count DESC); -- Pour top utilisés
CREATE INDEX idx_static_cache ON static_pages_cache(user_id, page_id, is_stale);
```

---

## 📋 Les 12 Itérations

---

## **ITÉRATION 0: Setup & Foundation** ⚙️

**Durée**: 1-2 jours
**Objectif**: Infrastructure de base fonctionnelle

### Backend Tasks
- [x] Créer structure dossiers modulaire
- [ ] Initialiser npm (`package.json`)
- [ ] Installer dépendances de base:
  - `express`, `pg`, `dotenv`, `cors`, `helmet`
- [ ] Setup Docker Compose (PostgreSQL + Redis)
- [ ] Fichier `docker-compose.yml`
- [ ] Configuration database (`shared/config/database.js`)
- [ ] Configuration Redis (`shared/config/redis.js`)
- [ ] Basic Express app (`app.js`, `server.js`)
- [ ] Middleware de base (CORS, Helmet, JSON parser)
- [ ] Route health check: `GET /health`

### Frontend Tasks
- [ ] Créer projet Vite React
- [ ] Structure dossiers features/shared
- [ ] Installer dépendances:
  - `react-router-dom`, `axios`, `zustand`
- [ ] Configuration Vite
- [ ] Setup routing de base
- [ ] Layout de base (Header placeholder)
- [ ] Page "Hello World"

### Environment Files
```env
# backend/.env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pingrid
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3000
```

```env
# frontend/.env
VITE_API_URL=http://localhost:5000
```

### Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pingrid
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Commandes à tester
```bash
# Démarrer Docker
docker-compose up -d

# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Critères de Succès
- ✅ Docker tourne (PostgreSQL + Redis connectés)
- ✅ Backend répond sur http://localhost:5000/health
- ✅ Frontend affiche "Hello World" sur http://localhost:3000
- ✅ Pas d'erreurs dans console

### Livrables
- Structure projet complète
- README.md avec instructions de setup
- Git repository initialisé

---

## **ITÉRATION 1: Authentication Simple** 🔐

**Durée**: 2-3 jours
**Objectif**: User peut créer compte et se connecter

### Backend Tasks

#### 1. Migration Database
**Fichier**: `backend/src/shared/migrations/001_create_users.sql`
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

#### 2. Module Auth
**Fichier**: `backend/src/modules/auth/auth.model.js`
```javascript
const pool = require('../../shared/config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

class User {
  static async create({ email, password, firstName, lastName }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, is_admin, created_at`,
      [email, passwordHash, firstName, lastName]
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }
}

module.exports = User;
```

**Fichier**: `backend/src/modules/auth/auth.service.js`
```javascript
const jwt = require('jsonwebtoken');
const User = require('./auth.model');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Simple pour commencer

class AuthService {
  async register({ email, password, firstName, lastName }) {
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create user
    const user = await User.create({ email, password, firstName, lastName });

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  async login({ email, password }) {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove password hash from response
    delete user.password_hash;

    return { user, token };
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

module.exports = new AuthService();
```

**Fichier**: `backend/src/modules/auth/auth.controller.js`
```javascript
const authService = require('./auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validation basique
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const result = await authService.register({ email, password, firstName, lastName });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const result = await authService.login({ email, password });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      // req.user est ajouté par auth middleware
      res.json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
```

**Fichier**: `backend/src/modules/auth/auth.routes.js`
```javascript
const express = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
```

#### 3. Auth Middleware
**Fichier**: `backend/src/shared/middleware/auth.middleware.js`
```javascript
const authService = require('../../modules/auth/auth.service');
const User = require('../../modules/auth/auth.model');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user from DB
    const user = await User.findByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request (sans password)
    delete user.password_hash;
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
```

#### 4. Intégration dans app.js
```javascript
const authRoutes = require('./modules/auth/auth.routes');

app.use('/api/auth', authRoutes);
```

### Frontend Tasks

#### 1. Auth Store (Zustand)
**Fichier**: `frontend/src/features/auth/store/authStore.js`
```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      register: async (userData) => {
        set({ loading: true, error: null });
        try {
          const { user, token } = await authService.register(userData);
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message, loading: false });
          return { success: false, error: error.message };
        }
      },

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const { user, token } = await authService.login(credentials);
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message, loading: false });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

#### 2. Auth Service (API)
**Fichier**: `frontend/src/features/auth/services/authService.js`
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const authService = {
  async register(userData) {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    return response.data;
  },

  async login(credentials) {
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    return response.data;
  },

  async getMe(token) {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default authService;
```

#### 3. Login Component
**Fichier**: `frontend/src/features/auth/components/LoginForm.jsx`
```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1>Login to PinGrid</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
```

#### 4. Register Component
**Fichier**: `frontend/src/features/auth/components/RegisterForm.jsx`
```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName
    });

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1>Register for PinGrid</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
```

#### 5. Protected Route Component
**Fichier**: `frontend/src/features/auth/components/ProtectedRoute.jsx`
```javascript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

#### 6. Dashboard Placeholder
**Fichier**: `frontend/src/pages/Dashboard.jsx`
```javascript
import { useAuthStore } from '../features/auth/store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <p>Welcome, {user?.first_name || user?.email}!</p>

      <div style={{ marginTop: '40px', padding: '20px', border: '2px dashed #ccc' }}>
        <p>Your pages will appear here (Iteration 2)</p>
      </div>
    </div>
  );
}
```

#### 7. Router Setup
**Fichier**: `frontend/src/App.jsx`
```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './features/auth/components/LoginForm';
import RegisterForm from './features/auth/components/RegisterForm';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Packages à installer

**Backend**:
```bash
npm install express pg bcrypt jsonwebtoken cors helmet dotenv
npm install -D nodemon
```

**Frontend**:
```bash
npm install react-router-dom axios zustand
```

### Test de l'Itération 1

#### Test Manuel
1. Démarrer backend + frontend
2. Aller sur http://localhost:3000 → Redirect vers /dashboard → Redirect vers /login
3. Cliquer "Register"
4. Créer compte: test@example.com / password123
5. Vérifier: Redirect vers dashboard
6. Voir message "Welcome, test@example.com"
7. Cliquer "Logout"
8. Vérifier: Redirect vers login
9. Re-login avec mêmes credentials
10. Vérifier: Dashboard s'affiche

#### Vérification DB
```sql
SELECT * FROM users;
-- Devrait voir user créé avec email, password_hash, etc.
```

### Critères de Succès
- ✅ User peut créer compte
- ✅ User peut login
- ✅ Token JWT généré et stocké
- ✅ Dashboard protégé (redirect si pas auth)
- ✅ Logout fonctionne
- ✅ Token persiste (refresh page, toujours auth)

### Livrables
- Module auth backend complet
- Feature auth frontend complète
- JWT authentication fonctionnelle
- Routes protégées
- UI basique mais fonctionnelle

---

## **ITÉRATION 2: Pages Basiques** 📄

**Durée**: 2-3 jours
**Objectif**: User peut créer, voir, supprimer des Pages

### Backend Tasks

#### 1. Migration Database
**Fichier**: `backend/src/shared/migrations/002_create_pages.sql`
```sql
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pages_user_position ON pages(user_id, position);
CREATE UNIQUE INDEX idx_pages_user_name ON pages(user_id, name);
```

#### 2. Module Pages
**Fichier**: `backend/src/modules/pages/pages.model.js`
**Fichier**: `backend/src/modules/pages/pages.service.js`
**Fichier**: `backend/src/modules/pages/pages.controller.js`
**Fichier**: `backend/src/modules/pages/pages.routes.js`

### Frontend Tasks
**Fichier**: `frontend/src/features/pages/store/pagesStore.js`
**Fichier**: `frontend/src/features/pages/components/PageList.jsx`
**Fichier**: `frontend/src/features/pages/components/CreatePageModal.jsx`

### Critères de Succès
- ✅ Créer page "Travail"
- ✅ Créer page "Personnel"
- ✅ Voir liste dans sidebar
- ✅ Cliquer pour naviguer (page vide pour l'instant)
- ✅ Supprimer page

---

## **ITÉRATION 3-11**: [Détails similaires pour chaque itération]

*Je vais créer les détails complets pour les autres itérations après validation de la structure.*

---

## Commandes Rapides

### Setup Initial
```bash
# Clone & Install
git clone <repo>
cd PinGrid-V2.0

# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
cp .env.example .env

# Docker
cd ..
docker-compose up -d
```

### Development
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database
docker-compose logs -f postgres
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests (après plusieurs itérations)
npm run test:e2e
```

---

## Prochaines Étapes

**Maintenant**:
1. Valider ce plan
2. Commencer Itération 0 + 1
3. Tester et valider avant Itération 2

**Questions?**
- Structure modulaire OK?
- Stack OK?
- Approche itérative OK?
- Prêt à démarrer?

🚀 **Ready to code!**
