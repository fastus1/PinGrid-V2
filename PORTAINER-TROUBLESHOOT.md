# Dépannage Portainer - PinGrid V2.0

## Problème: Seuls PostgreSQL et Redis sont déployés

Si seuls les services PostgreSQL et Redis sont en cours d'exécution et que le backend/frontend ne démarrent pas, voici les causes possibles et solutions:

### 1. Vérifier les logs

Dans Portainer:
- Allez dans **Stacks** > **pingrid-v2** > **Logs**
- Ou allez dans **Containers** et cliquez sur les conteneurs individuels

Cherchez des erreurs de type:
- "Build failed"
- "Error response from daemon"
- "Health check failed"
- "Dependency failed"

### 2. Problèmes courants et solutions

#### A. Le build échoue dans Portainer

**Cause**: Portainer essaie de builder les images mais échoue (manque de ressources, erreurs de dépendances, etc.)

**Solution 1: Utiliser des images pré-buildées**

1. Activez GitHub Actions pour auto-builder les images:
   - Les images seront disponibles sur `ghcr.io/fastus1/pingrid-v2-backend:latest`
   - Les images seront disponibles sur `ghcr.io/fastus1/pingrid-v2-frontend:latest`

2. Dans Portainer, utilisez `docker-compose.registry.yml` au lieu de `docker-compose.prod.yml`

**Solution 2: Builder les images localement**

```bash
# Sur votre machine locale
cd /path/to/PinGrid V2.0

# Build backend
docker build -t ghcr.io/fastus1/pingrid-v2-backend:latest ./backend

# Build frontend
docker build -t ghcr.io/fastus1/pingrid-v2-frontend:latest ./frontend

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u fastus1 --password-stdin

# Push images
docker push ghcr.io/fastus1/pingrid-v2-backend:latest
docker push ghcr.io/fastus1/pingrid-v2-frontend:latest
```

Puis utilisez `docker-compose.registry.yml` dans Portainer.

#### B. Les healthchecks échouent

**Cause**: Les services démarrent mais les healthchecks échouent (timeout trop court, service lent à démarrer)

**Symptômes dans les logs**:
```
Container unhealthy
Health check failed
Backend unhealthy, restarting...
```

**Solution**: Les healthchecks ont été ajustés avec:
- `timeout: 10s` (au lieu de 3s)
- `start_period: 60s` (au lieu de 40s)

Re-déployez avec les fichiers mis à jour.

#### C. Le backend ne peut pas se connecter à PostgreSQL

**Cause**: PostgreSQL n'est pas prêt quand le backend démarre

**Solution**: Le `depends_on` avec `service_healthy` devrait gérer ça, mais vérifiez:

1. Dans les logs du backend, cherchez:
```
Error: connect ECONNREFUSED
Connection to database failed
ENOTFOUND postgres
```

2. Vérifiez les variables d'environnement:
```bash
# Dans Portainer Console du container backend
env | grep DB_
```

3. Testez la connexion manuellement:
```bash
# Dans Portainer Console du container backend
node -e "const pg = require('pg'); const client = new pg.Client({host:'postgres',port:5432,database:'pingrid',user:'postgres',password:process.env.DB_PASSWORD}); client.connect().then(() => {console.log('OK'); process.exit(0)}).catch(e => {console.error(e); process.exit(1)})"
```

#### D. Problème de permissions sur les volumes

**Cause**: Portainer/Docker n'a pas les permissions pour créer les volumes

**Solution**: Utilisez des volumes nommés au lieu de bind mounts (déjà fait dans la version corrigée):
```yaml
volumes:
  - backend_uploads:/app/uploads  # ✅ Volume nommé
  # Au lieu de:
  # - ./backend/uploads:/app/uploads  # ❌ Bind mount
```

#### E. Manque de ressources

**Cause**: Le serveur n'a pas assez de RAM/CPU pour builder les images

**Symptômes**:
- Build très lent
- "Killed" dans les logs
- Services qui redémarrent en boucle

**Solutions**:
1. Augmentez les ressources allouées à Docker
2. Utilisez des images pré-buildées (Solution 1 ci-dessus)
3. Ajoutez des limites de ressources dans docker-compose:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 3. Configuration Portainer recommandée

#### Méthode Git Repository (Recommandée)

1. Dans Portainer, allez dans **Stacks** > **Add stack**
2. Nom: `pingrid-v2`
3. Build method: **Git Repository**
4. Configuration:
   - **Repository URL**: `https://github.com/fastus1/PinGrid-V2.git`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.prod.yml`
   - **Authentication**: Si repository privé

5. **Environment variables** (mode avancé):
```env
POSTGRES_DB=pingrid
POSTGRES_USER=postgres
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
JWT_SECRET=VOTRE_LONG_SECRET_ALEATOIRE_64_CHARS
CORS_ORIGIN=https://votre-domaine.com
VITE_API_URL=https://api.votre-domaine.com
```

6. Cochez **Enable GitOps updates** pour auto-déployer sur push
7. Cliquez sur **Deploy the stack**

#### Alternative: Utiliser docker-compose.registry.yml

Si le build échoue, utilisez cette approche:

1. D'abord, activez GitHub Actions (le fichier `.github/workflows/docker-build.yml` est déjà créé)
2. Ou buildez et poussez les images manuellement (voir Solution 2 ci-dessus)
3. Dans Portainer, utilisez `docker-compose.registry.yml` comme Compose path
4. Les images seront téléchargées depuis GitHub Container Registry au lieu d'être buildées localement

### 4. Vérification post-déploiement

Une fois tous les services en "running" et "healthy":

```bash
# Test backend
curl http://votre-serveur:5000/health
# Devrait retourner: {"status":"ok","timestamp":"...","database":"connected"}

# Test frontend
curl http://votre-serveur:3000/health
# Devrait retourner: {"status":"ok","service":"pingrid-frontend"}

# Test connexion complète
curl http://votre-serveur:3000
# Devrait retourner le HTML de l'app
```

### 5. Si rien ne fonctionne

#### Déploiement manuel avec docker-compose CLI

Si Portainer ne fonctionne pas, déployez directement sur le serveur:

```bash
# SSH vers votre serveur
ssh user@votre-serveur

# Clone le repository
git clone https://github.com/fastus1/PinGrid-V2.git
cd PinGrid V2.0

# Créez le fichier .env
cp .env.production.example .env
nano .env  # Éditez les variables

# Déployez
docker-compose -f docker-compose.prod.yml up -d

# Vérifiez les logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Commandes de debug utiles

```bash
# Voir tous les conteneurs (même arrêtés)
docker ps -a

# Logs d'un service spécifique
docker logs pingrid-backend
docker logs pingrid-frontend

# Inspecter un conteneur
docker inspect pingrid-backend

# Entrer dans un conteneur
docker exec -it pingrid-backend sh

# Vérifier les réseaux
docker network ls
docker network inspect pingrid-v2_pingrid-network

# Vérifier les volumes
docker volume ls
docker volume inspect pingrid-v2_postgres_data

# Rebuild forcé
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### 7. Support

Si le problème persiste:
1. Récupérez les logs complets: `docker-compose logs > logs.txt`
2. Vérifiez la configuration: `docker-compose config`
3. Vérifiez les ressources: `docker stats`
4. Créez une issue sur GitHub avec les logs
