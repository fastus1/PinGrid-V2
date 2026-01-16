# Debug Portainer - PinGrid V2.0

## Problème: Backend et Frontend ne démarrent pas

Si seuls PostgreSQL et Redis fonctionnent, suivez ces étapes:

### ÉTAPE 1: Identifier le problème exact

#### A. Dans Portainer > Containers

Vérifiez si les conteneurs backend/frontend apparaissent:

**Cas 1: Ils n'apparaissent PAS**
→ Les images ne se buildent pas
→ Allez à l'ÉTAPE 2

**Cas 2: Ils apparaissent mais STATUS = "Exited" ou "Restarting"**
→ Les conteneurs crashent au démarrage
→ Cliquez sur chaque conteneur et regardez les LOGS
→ Allez à l'ÉTAPE 3

**Cas 3: Ils apparaissent avec STATUS = "Starting" en boucle**
→ Problème de healthcheck ou depends_on
→ Allez à l'ÉTAPE 4

### ÉTAPE 2: Les images ne se buildent pas

**Erreurs possibles:**
- "Build context not found"
- "No such file or directory"
- "Cannot find Dockerfile"

**SOLUTION 1: Vérifier la configuration Git dans Portainer**

Dans Portainer, quand vous déployez la stack:
- Repository URL: `https://github.com/fastus1/PinGrid-V2.git`
- Repository reference: `refs/heads/main`
- Compose path: `docker-compose.prod.yml`

**IMPORTANT**: Assurez-vous que le "Build method" est bien sur "Repository root"

**SOLUTION 2: Utiliser docker-compose.simple.yml**

1. Dans Portainer, éditez votre stack
2. Changez "Compose path" vers: `docker-compose.simple.yml`
3. Re-déployez

Cette version enlève tous les healthchecks et depends_on qui peuvent causer des problèmes.

**SOLUTION 3: Utiliser des images pré-buildées**

1. Sur votre machine locale, exécutez:
   ```bash
   cd /path/to/PinGrid V2.0
   ./BUILD_AND_PUSH.sh
   ```

2. Les images seront buildées et poussées sur GitHub Container Registry

3. Dans Portainer, changez "Compose path" vers: `docker-compose.registry.yml`

4. Re-déployez

### ÉTAPE 3: Les conteneurs crashent au démarrage

Regardez les logs pour identifier l'erreur:

#### Erreur: "Cannot connect to database"
```
Error: connect ECONNREFUSED
ENOTFOUND postgres
```

**Cause**: Le backend démarre avant que postgres soit prêt

**Solution**:
- Utilisez `docker-compose.prod.yml` (a des depends_on avec healthcheck)
- Ou attendez 30 secondes et les conteneurs redémarreront automatiquement (restart: unless-stopped)

#### Erreur: "Module not found" ou "Cannot find package"
```
Error: Cannot find module 'express'
npm ERR! missing: express@4.18.2
```

**Cause**: npm install a échoué pendant le build

**Solution**: Les images sont trop grosses pour être buildées dans Portainer
→ Utilisez SOLUTION 3 (images pré-buildées)

#### Erreur: "EADDRINUSE" ou "Port already in use"
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause**: Un autre conteneur utilise déjà le port

**Solution**: Changez les ports dans les variables d'environnement:
```env
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

### ÉTAPE 4: Problème de healthcheck/depends_on

Si les conteneurs restent en "Starting" indéfiniment:

**SOLUTION**: Utilisez `docker-compose.simple.yml`

Cette version n'a pas de healthchecks ni de depends_on.

### SOLUTION ULTIME: Builder et pousser les images manuellement

Si rien ne fonctionne, voici la solution qui MARCHE À COUP SÛR:

#### 1. Sur votre machine locale

```bash
# Aller dans le répertoire du projet
cd /path/to/PinGrid V2.0

# Builder les images
docker build -t ghcr.io/fastus1/pingrid-v2-backend:latest ./backend
docker build -t ghcr.io/fastus1/pingrid-v2-frontend:latest ./frontend

# Tester localement (optionnel)
docker-compose -f docker-compose.registry.yml up -d

# Si ça marche, pousser vers GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u fastus1 --password-stdin
docker push ghcr.io/fastus1/pingrid-v2-backend:latest
docker push ghcr.io/fastus1/pingrid-v2-frontend:latest
```

**Note**: Pour créer un GITHUB_TOKEN:
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token
3. Cochez: `write:packages`, `read:packages`, `delete:packages`
4. Copiez le token

#### 2. Dans Portainer

1. Créez/Éditez votre stack
2. Utilisez `docker-compose.registry.yml` comme Compose path
3. Déployez

Les images seront téléchargées depuis GitHub Container Registry au lieu d'être buildées localement.

### Commandes de debug utiles

Si vous avez accès SSH au serveur:

```bash
# Voir tous les conteneurs
docker ps -a

# Logs d'un conteneur spécifique
docker logs pingrid-backend
docker logs pingrid-frontend

# Entrer dans un conteneur qui tourne
docker exec -it pingrid-backend sh

# Forcer la reconstruction
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Nettoyer tout et recommencer
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a
docker-compose -f docker-compose.prod.yml up -d
```

### Checklist finale

- [ ] PostgreSQL est running et healthy
- [ ] Redis est running et healthy
- [ ] Backend est running (pas de restart loop)
- [ ] Frontend est running (pas de restart loop)
- [ ] Backend accessible: `curl http://votre-serveur:5000/health`
- [ ] Frontend accessible: `curl http://votre-serveur:3000/health`
- [ ] L'app fonctionne dans le navigateur

## Besoin d'aide?

Si aucune de ces solutions ne fonctionne:

1. Exportez les logs complets: `docker-compose logs > logs.txt`
2. Créez une issue sur GitHub avec les logs
3. Incluez la configuration exacte de votre Portainer Stack
