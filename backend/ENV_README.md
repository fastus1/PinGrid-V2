# Configuration de l'Environnement Backend

## Fichiers .env disponibles

Ce dossier contient plusieurs fichiers d'exemple pour configurer votre environnement selon votre méthode d'installation:

### 📦 `.env.docker.example` (Recommandé)
Pour une utilisation avec **Docker Compose**

**Mot de passe**: `postgres`

```bash
cp .env.docker.example .env
```

### 💻 `.env.local.example`
Pour une installation **PostgreSQL locale**

**Mot de passe**: `password` (ou votre mot de passe d'installation)

```bash
cp .env.local.example .env
```

### 📄 `.env.example`
Fichier d'exemple générique qui référence les deux options ci-dessus

---

## ⚠️ Différence Importante

Le **mot de passe PostgreSQL diffère** selon votre installation:

| Environnement | Mot de passe | Fichier à utiliser |
|---------------|-------------|-------------------|
| Docker Compose | `postgres` | `.env.docker.example` |
| PostgreSQL Local | `password`* | `.env.local.example` |

*_Ou le mot de passe que vous avez défini lors de l'installation de PostgreSQL_

---

## 🚀 Démarrage Rapide

1. **Choisissez votre environnement** (Docker ou Local)

2. **Copiez le bon fichier**:
   ```bash
   # Pour Docker
   cp .env.docker.example .env

   # OU pour Local
   cp .env.local.example .env
   ```

3. **Modifiez si nécessaire** (surtout pour PostgreSQL local si votre mot de passe est différent)

4. **Démarrez le backend**:
   ```bash
   npm install
   npm run migrate
   npm run dev
   ```

---

## 🐛 Dépannage

### Erreur "password authentication failed"

Votre mot de passe dans `.env` ne correspond pas à votre installation PostgreSQL.

**Solution**:
1. Vérifiez quel environnement vous utilisez
2. Utilisez le bon fichier `.env.*.example`
3. Si vous utilisez PostgreSQL local, vérifiez votre mot de passe:
   ```bash
   psql -U postgres -d pingrid
   # Essayez: postgres, password, ou votre mot de passe d'installation
   ```

---

## 📚 Voir aussi

- `QUICKSTART.md` (racine du projet) - Guide complet de démarrage
- `docker-compose.yml` (racine du projet) - Configuration Docker
