# Procédure de déploiement — TaskMaster

## Prérequis

- Docker Engine 24+ et Docker Compose v2
- Git
- Accès au dépôt GitHub
- Certbot (Let's Encrypt) ou certificat TLS existant

## Environnements

| Environnement | Compose file              | URL                | Usage                       |
| ------------- | ------------------------- | ------------------ | --------------------------- |
| DEV           | `docker-compose.yml`      | localhost:8080     | Développement local         |
| PROD          | `docker-compose.prod.yml` | https://domaine    | Production                  |

---

## Déploiement local (DEV)

```bash
git clone https://github.com/user/taskmaster.git
cp .env.example .env          # adapter les variables
docker compose up -d
curl http://localhost:8080/api/health
```

Ports hôte exposés en dev : PostgreSQL sur `5432`, Redis sur `6379`, backend sur `3000`, frontend sur `8080`.

---

## Déploiement production

### 1. Certificats TLS

Les certificats doivent être placés dans `./certs/` **avant** de démarrer le stack.
Ce dossier est dans `.gitignore` — ne jamais commiter les certificats.

```bash
# Option A — Let's Encrypt (serveur avec domaine public)
sudo apt install certbot
sudo certbot certonly --standalone -d ton-domaine.com
mkdir -p ./certs
sudo cp /etc/letsencrypt/live/ton-domaine.com/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/ton-domaine.com/privkey.pem   ./certs/
sudo chown $USER:$USER ./certs/*.pem

# Option B — Certificat auto-signé (test interne uniquement)
mkdir -p ./certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certs/privkey.pem \
  -out    ./certs/fullchain.pem \
  -subj "/CN=localhost"
```

### 2. Variables d'environnement

```bash
cp .env.example .env
# Éditer .env — remplacer TOUS les CHANGE_ME par des valeurs fortes
# Générer JWT_SECRET :
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Variables obligatoires : `DB_ADMIN_PASSWORD`, `DB_APP_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`.

### 3. Construire et démarrer

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

En production aucun port hôte n'est ouvert pour db, Redis ou le backend.
Seul Nginx est accessible sur `80` (redirect HTTPS) et `443`.

### 4. Appliquer les migrations

```bash
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

### 5. Vérifier

```bash
# Health via Nginx (seul point d'entrée public)
curl https://ton-domaine.com/api/health

# Vérifier les healthchecks Docker
docker compose -f docker-compose.prod.yml ps
```

---

## Déploiement Railway (environnement de démonstration)

Railway est la plateforme PaaS utilisée pour héberger TaskMaster en production. Elle gère le réseau, le TLS et le routage sans nécessiter de serveur dédié ni de nom de domaine propre.

### Architecture des services Railway

| Service | Type | Rôle |
|---------|------|------|
| `backend` | Service Dockerfile | Node.js 20 / Express — détecté via `backend/Dockerfile` |
| `db` | Plugin PostgreSQL 16 | Base de données managée (backups automatiques) |
| `cache` | Plugin Redis 7 | Cache sessions JWT et versions |

### Variables d'environnement

Les secrets sont injectés via le dashboard Railway (chiffrés au repos) — jamais commitées. Les clés correspondent exactement au `.env.example` :

```
DB_HOST         → fourni automatiquement par Railway (lien interne)
DB_APP_PASSWORD → généré lors de la création du plugin PostgreSQL
REDIS_HOST      → fourni automatiquement par Railway (lien interne)
REDIS_PASSWORD  → généré lors de la création du plugin Redis
JWT_SECRET      → généré manuellement (crypto.randomBytes)
FRONTEND_URL    → URL Railway du frontend (*.up.railway.app)
NODE_ENV        → production
```

### Déploiement depuis GitHub

Railway est connecté au dépôt GitHub. Chaque push sur `main` déclenche automatiquement un redéploiement du service backend après validation du pipeline CI.

```
push main → GitHub Actions (lint + tests + build) → Railway redéploie
```

### TLS et domaine

Railway fournit automatiquement un certificat Let's Encrypt sur le domaine `*.up.railway.app`. Le TLS est terminé au niveau de la plateforme — aucune configuration Nginx requise côté application.

### Migrations après déploiement

```bash
# Depuis la CLI Railway
railway run --service backend npm run db:migrate

# Ou via le shell Railway
railway shell --service backend
npm run db:migrate
```

### Vérification

```bash
curl https://<nom-du-projet>.up.railway.app/api/health
```

---

## Pipeline CI/CD

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) se déclenche sur push `main`/`develop`
et pull request vers `main`. Il exécute dans l'ordre :

1. **Lint** — ESLint + `npm audit --audit-level=high` (bloque sur vulnérabilité high/critical)
2. **Tests unitaires** — Jest avec couverture
3. **Tests d'intégration** — Supertest contre PostgreSQL + Redis réels
4. **Build Docker** — `docker build --target production`

Le pipeline **ne déploie pas** automatiquement ; le déploiement reste une action manuelle.

---

## Authentification — cookie HttpOnly

Le token JWT est transmis via un cookie `auth_token` (HttpOnly, Secure, SameSite=Strict).
Il n'est **jamais** exposé dans le corps des réponses ni accessible depuis JavaScript.

- Login → `POST /api/auth/login` : pose le cookie
- Logout → `POST /api/auth/logout` : supprime le cookie côté serveur et côté client
- Toutes les requêtes authentifiées incluent le cookie automatiquement (`credentials: 'include'`)

---

## Migrations de base de données

```bash
# Via npm (depuis le conteneur backend en prod)
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate

# En local (hors Docker)
cd backend && npx sequelize-cli db:migrate

# Rollback de la dernière migration
cd backend && npx sequelize-cli db:migrate:undo
```

---

## Procédure de rollback

1. Consulter les logs : `docker compose -f docker-compose.prod.yml logs --tail 50 backend`
2. Revenir à l'image précédente : `docker compose -f docker-compose.prod.yml up -d --force-recreate backend`
3. Si la BDD a été modifiée : `docker compose -f docker-compose.prod.yml exec backend npx sequelize-cli db:migrate:undo`
4. Restaurer une sauvegarde si nécessaire : voir `scripts/backup.sh`

---

## Sauvegardes

- Script : `scripts/backup.sh` — exporte la base via `pg_dump` dans `backups/`
- Rétention : 7 dernières sauvegardes conservées par défaut
- Restauration :
  ```bash
  gunzip -c backups/taskmaster_YYYYMMDD_HHMMSS.sql.gz | \
    docker exec -i taskmaster-db psql -U postgres -d taskmaster
  ```
- Automatisation : à configurer par l'opérateur (cron, systemd timer, ou job CI)
