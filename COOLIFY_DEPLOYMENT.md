# PinGrid V2.0 - Guide de Déploiement Coolify

## 🔧 Configuration Requise

### 1. Backend - Variables d'Environnement

Dans Coolify, configurez ces variables pour le **backend**:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/pingrid
REDIS_URL=redis://host:6379
JWT_SECRET=votre-secret-minimum-32-caracteres-aleatoires
JWT_EXPIRES_IN=7d
```

**Important**:
- `JWT_SECRET` doit être une chaîne aléatoire d'au moins 32 caractères
- `DATABASE_URL` et `REDIS_URL` doivent pointer vers vos services PostgreSQL et Redis sur Coolify

### 2. Frontend - Variables d'Environnement

Dans Coolify, configurez ces variables pour le **frontend**:

```bash
VITE_API_URL=https://votre-backend.coolify.app
```

**Important**:
- Remplacez `votre-backend.coolify.app` par l'URL réelle de votre backend Coolify
- N'ajoutez PAS `/api` à la fin de l'URL
- Utilisez `https://` et non `http://`

## 🔍 Diagnostic des Erreurs

### Erreur: "Invalid response from server. Please check your API configuration"

Cette erreur signifie que le frontend ne peut pas communiquer correctement avec le backend.

#### Étape 1: Vérifier les logs du navigateur

1. Ouvrez la console du navigateur (F12)
2. Essayez de créer un compte
3. Cherchez ces messages:
   - `🔧 API URL configured:` - Devrait afficher l'URL de votre backend
   - `📤 Registering user to:` - Devrait afficher l'URL complète de l'API
   - `❌ Registration error:` - Affiche les détails de l'erreur

#### Étape 2: Vérifier que le backend répond

Testez le health endpoint de votre backend:

```bash
curl https://votre-backend.coolify.app/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-12T..."
}
```

#### Étape 3: Vérifier les logs Coolify

Dans l'interface Coolify:
1. Allez dans votre application **backend**
2. Cliquez sur "Logs"
3. Vérifiez qu'il n'y a pas d'erreurs au démarrage
4. Cherchez les messages de connexion à PostgreSQL et Redis

#### Étape 4: Tester l'API manuellement

```bash
# Test de registration
curl -X POST https://votre-backend.coolify.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Réponse attendue:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "eyJ..."
  }
}
```

## 🚨 Problèmes Courants

### 1. CORS Error

**Symptôme**: Erreur dans la console: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution**: Vérifiez le fichier `backend/src/server.js` - CORS devrait être configuré:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

Ajoutez `FRONTEND_URL` dans les variables d'environnement du backend:
```bash
FRONTEND_URL=https://votre-frontend.coolify.app
```

### 2. Backend ne démarre pas

**Symptôme**: Logs Coolify montrent des erreurs au démarrage

**Causes possibles**:
- `JWT_SECRET` manquant
- Connexion PostgreSQL échouée
- Connexion Redis échouée

**Solution**: Vérifiez que toutes les variables d'environnement sont configurées et que PostgreSQL/Redis sont démarrés.

### 3. Frontend ne trouve pas le backend

**Symptôme**: Console affiche `🔧 API URL configured: http://localhost:5000`

**Cause**: `VITE_API_URL` n'est pas configuré dans Coolify

**Solution**:
1. Allez dans Coolify → votre app frontend → Variables d'environnement
2. Ajoutez `VITE_API_URL=https://votre-backend.coolify.app`
3. Redéployez le frontend (important: rebuild nécessaire pour Vite)

### 4. Validation du mot de passe échoue

**Symptôme**: Erreur "Password must be at least 8 characters..."

**Solution**: Utilisez un mot de passe respectant:
- Minimum 8 caractères
- Au moins 1 majuscule (A-Z)
- Au moins 1 minuscule (a-z)
- Au moins 1 chiffre (0-9)

Exemples valides: `Password123`, `MyApp2024`, `Secure1Pass`

## 📝 Checklist de Déploiement

- [ ] PostgreSQL démarré et accessible
- [ ] Redis démarré et accessible
- [ ] Backend déployé avec toutes les variables d'environnement
- [ ] Backend accessible via son URL (test `/health`)
- [ ] Frontend déployé avec `VITE_API_URL` configuré
- [ ] Frontend rebuild après modification de `VITE_API_URL`
- [ ] Test de création de compte avec mot de passe valide
- [ ] Test de connexion

## 🔗 URLs de Test

Remplacez par vos URLs réelles:

- **Backend**: https://pingrid-backend.coolify.app
- **Frontend**: https://pingrid.coolify.app
- **Health Check**: https://pingrid-backend.coolify.app/health
- **API Register**: https://pingrid-backend.coolify.app/api/auth/register

## 💡 Astuce

Pour tester en local avant de déployer:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Cela vous permettra de vérifier que tout fonctionne avant de déployer sur Coolify.
