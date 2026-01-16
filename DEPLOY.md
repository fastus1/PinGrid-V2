# Guide de Déploiement PinGrid V2.0 sur Portainer

## Vue d'ensemble

Ce guide explique comment déployer PinGrid V2.0 sur Portainer en utilisant Docker Compose.

## Prérequis

- Portainer installé et accessible
- Accès à un serveur Docker (local ou distant)
- Git (pour cloner le repository) ou accès aux fichiers du projet

## Architecture de Déploiement

PinGrid V2.0 est composé de 4 services Docker :

1. **PostgreSQL** - Base de données (port 5432)
2. **Redis** - Cache en mémoire (port 6379)
3. **Backend** - API Node.js/Express (port 5000)
4. **Frontend** - Application React (port 3000)

## Étapes de Déploiement

### 1. Préparation des fichiers

1. Assurez-vous d'avoir tous les fichiers du projet
2. Copiez `.env.production.example` vers `.env`:
   ```bash
   cp .env.production.example .env
   ```

3. Éditez le fichier `.env` et configurez les variables:
   ```bash
   # Variables critiques à modifier:
   POSTGRES_PASSWORD=votre_mot_de_passe_securise
   JWT_SECRET=une_tres_longue_chaine_aleatoire_minimum_64_caracteres
   CORS_ORIGIN=https://votre-domaine.com
   VITE_API_URL=https://api.votre-domaine.com
   ```

### 2. Déploiement via Portainer

#### Option A: Via l'interface Web de Portainer

1. **Connectez-vous à Portainer**
   - Accédez à votre instance Portainer (ex: https://portainer.votre-domaine.com)

2. **Créez une nouvelle Stack**
   - Allez dans "Stacks" > "Add stack"
   - Donnez un nom: `pingrid-v2`

3. **Choisissez la méthode de déploiement**

   **Méthode 1: Repository Git**
   - Sélectionnez "Git Repository"
   - URL du repository: [votre URL Git]
   - Référence: `main` ou `master`
   - Compose path: `docker-compose.prod.yml`

   **Méthode 2: Upload**
   - Sélectionnez "Upload"
   - Uploadez le fichier `docker-compose.prod.yml`

   **Méthode 3: Web editor**
   - Sélectionnez "Web editor"
   - Copiez-collez le contenu de `docker-compose.prod.yml`

4. **Configurez les variables d'environnement**
   - Cliquez sur "Environment variables" > "Advanced mode"
   - Copiez-collez le contenu de votre fichier `.env`
   - Ou ajoutez les variables une par une dans le mode simple

5. **Déployez la Stack**
   - Cliquez sur "Deploy the stack"
   - Attendez que tous les services démarrent (vérifiez les healthchecks)

#### Option B: Via Portainer CLI

```bash
# Avec le fichier .env
portainer stack deploy --name pingrid-v2 \
  --compose-file docker-compose.prod.yml \
  --env-file .env
```

### 3. Vérification du déploiement

1. **Vérifiez l'état des services dans Portainer**
   - Tous les conteneurs doivent être "running"
   - Les healthchecks doivent être "healthy"

2. **Testez les endpoints de santé**
   ```bash
   # Backend
   curl http://votre-serveur:5000/health
   # Devrait retourner: {"status":"ok","timestamp":"..."}

   # Frontend
   curl http://votre-serveur:3000/health
   # Devrait retourner: {"status":"ok","service":"pingrid-frontend"}
   ```

3. **Vérifiez les logs**
   - Dans Portainer: Stacks > pingrid-v2 > Logs
   - Vérifiez qu'il n'y a pas d'erreurs

### 4. Configuration Post-Déploiement

#### Initialisation de la base de données

Les migrations SQL sont automatiquement exécutées au démarrage de PostgreSQL grâce au volume monté sur `/docker-entrypoint-initdb.d`.

Si vous devez exécuter les migrations manuellement:

```bash
# Via Portainer Console ou SSH
docker exec -it pingrid-backend node run-migrations.js
```

#### Création du premier utilisateur

Utilisez l'endpoint d'inscription ou créez un utilisateur via l'API:

```bash
curl -X POST http://votre-serveur:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "VotreMotDePasseSecurise"
  }'
```

## Configuration Réseau

### Ports exposés

Par défaut, les services exposent ces ports:
- **Frontend**: 3000
- **Backend**: 5000
- **PostgreSQL**: 5432 (uniquement si nécessaire)
- **Redis**: 6379 (uniquement si nécessaire)

### Reverse Proxy (Recommandé)

Il est recommandé d'utiliser un reverse proxy (Nginx, Traefik, Caddy) devant les services:

**Exemple avec Nginx:**

```nginx
# Frontend
server {
    listen 80;
    server_name pingrid.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend API
server {
    listen 80;
    server_name api.pingrid.votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Avec SSL (Let's Encrypt recommandé):**
```bash
certbot --nginx -d pingrid.votre-domaine.com -d api.pingrid.votre-domaine.com
```

## Volumes et Persistance

Les données persistantes sont stockées dans des volumes Docker:

- `postgres_data`: Données PostgreSQL
- `redis_data`: Données Redis (persistence AOF activée)
- `./backend/uploads`: Fichiers uploadés (logos, favicons)

### Sauvegarde des données

```bash
# Backup PostgreSQL
docker exec pingrid-postgres pg_dump -U postgres pingrid > backup.sql

# Backup Redis
docker exec pingrid-redis redis-cli BGSAVE
docker cp pingrid-redis:/data/dump.rdb ./backup-redis.rdb

# Backup uploads
tar -czf uploads-backup.tar.gz backend/uploads/
```

### Restauration

```bash
# Restore PostgreSQL
docker exec -i pingrid-postgres psql -U postgres pingrid < backup.sql

# Restore Redis
docker cp backup-redis.rdb pingrid-redis:/data/dump.rdb
docker restart pingrid-redis
```

## Mise à jour de l'application

### Via Portainer

1. Allez dans Stacks > pingrid-v2
2. Cliquez sur "Editor"
3. Si vous utilisez Git, cliquez sur "Pull and redeploy"
4. Sinon, mettez à jour le docker-compose.yml et cliquez sur "Update the stack"
5. Cochez "Re-pull image and redeploy" si nécessaire

### Manuellement

```bash
# Pull les derniers changements
git pull

# Rebuild et redéployer
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring et Logs

### Voir les logs en temps réel

Dans Portainer:
- Stacks > pingrid-v2 > Logs

Ou via CLI:
```bash
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Statistiques des conteneurs

Dans Portainer:
- Containers > [nom du conteneur] > Stats

## Dépannage

### Les services ne démarrent pas

1. Vérifiez les logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. Vérifiez les healthchecks:
   ```bash
   docker ps
   ```

3. Vérifiez les variables d'environnement:
   ```bash
   docker exec pingrid-backend env
   ```

### Erreurs de connexion à la base de données

1. Vérifiez que PostgreSQL est healthy:
   ```bash
   docker exec pingrid-postgres pg_isready
   ```

2. Vérifiez les credentials dans les variables d'environnement

3. Vérifiez la connectivité réseau:
   ```bash
   docker exec pingrid-backend ping postgres
   ```

### Erreurs CORS

Si vous avez des erreurs CORS dans la console du navigateur:

1. Vérifiez que `CORS_ORIGIN` dans le backend pointe vers l'URL du frontend
2. Redémarrez le backend après modification:
   ```bash
   docker restart pingrid-backend
   ```

### Problèmes de performances

1. Vérifiez l'utilisation des ressources:
   ```bash
   docker stats
   ```

2. Ajustez les limites de ressources dans docker-compose.prod.yml si nécessaire

## Sécurité

### Checklist de sécurité

- [ ] Tous les mots de passe ont été changés (PostgreSQL, Redis, JWT_SECRET)
- [ ] JWT_SECRET est une chaîne aléatoire d'au moins 64 caractères
- [ ] CORS_ORIGIN est configuré avec votre domaine de production
- [ ] PostgreSQL et Redis ne sont PAS exposés publiquement (uniquement sur le réseau Docker)
- [ ] SSL/TLS est configuré sur le reverse proxy
- [ ] Les backups réguliers sont configurés
- [ ] Les logs sont surveillés pour détecter des activités suspectes

### Recommandations additionnelles

1. Utilisez Docker secrets pour les données sensibles en production
2. Configurez un firewall (UFW, iptables)
3. Limitez l'accès SSH au serveur
4. Configurez fail2ban pour protéger contre les attaques brute-force
5. Mettez en place une surveillance (Prometheus, Grafana, Netdata)

## Support

Pour toute question ou problème:
1. Vérifiez les logs des services
2. Consultez la documentation dans `/docs`
3. Vérifiez les issues GitHub du projet

## Ressources

- Documentation Docker Compose: https://docs.docker.com/compose/
- Documentation Portainer: https://docs.portainer.io/
- PostgreSQL Docker: https://hub.docker.com/_/postgres
- Redis Docker: https://hub.docker.com/_/redis
