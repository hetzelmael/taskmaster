# Procédure de déploiement — TaskMaster

## Prérequis

- Docker Engine 24+ et Docker Compose v2
- Git
- Accès au dépôt GitHub

## Environnements

| Environnement | URL                | Base de données                            | Usage                       |
| ------------- | ------------------ | ------------------------------------------ | --------------------------- |
| DEV           | localhost:3000     | taskmaster (par défaut via `.env.example`) | Développement local         |
| SIT           | sit.taskmaster.dev | taskmaster_sit                             | Tests d'intégration système |
| UAT           | uat.taskmaster.dev | taskmaster_uat                             | Validation par le client    |
| PROD          | taskmaster.dev     | taskmaster_prod                            | Production                  |

## Déploiement local (DEV)

1. Cloner le dépôt : `git clone https://github.com/user/taskmaster.git`
2. Copier la configuration : `cp .env.example .env`
3. Adapter les variables dans `.env`
4. Lancer : `docker compose up -d`

Remarque : le fichier `docker-compose.yml` expose PostgreSQL sur le port hôte **5433** (mappage `5433:5432`). Adapter vos outils/connexions locales en conséquence. 5. Vérifier : `curl http://localhost:3000/health`

## Déploiement automatisé (SIT/UAT/PROD)

Remarque : le pipeline GitHub Actions (`.github/workflows/ci.yml`) exécute les vérifications (lint, tests, audit npm, build) et **ne déploie pas automatiquement** vers des environnements SIT/UAT/PROD dans ce dépôt — il s'agit d'une action manuelle ou externe (hébergeur) à configurer selon la cible. Les étapes ci-dessous décrivent un workflow souhaité, non appliqué automatiquement par défaut.

## Migrations de base de données (CP 10.3)

Les migrations sont gérées par Sequelize CLI :

```bash
# Créer une migration
npx sequelize-cli migration:generate --name add-column-priority

# Appliquer les migrations
npx sequelize-cli db:migrate

# Annuler la dernière migration (rollback)
npx sequelize-cli db:migrate:undo
```

Chaque migration contient un `up` (appliquer) et un `down` (annuler).

## Procédure de rollback

En cas de problème après un déploiement :

1. Identifier le problème dans les logs : `docker compose logs --tail 50 backend`
2. Revenir à l'image précédente : `docker compose up -d --force-recreate backend`
3. Si la BDD a été modifiée : `npx sequelize-cli db:migrate:undo`
4. Restaurer la sauvegarde si nécessaire : voir `scripts/backup.sh`

## Sauvegardes

- Script : une tâche de sauvegarde existe (`scripts/backup.sh`) qui exporte la base via `pg_dump` dans `backups/`.
- Automatisation : aucune tâche cron/systemd ou pipeline CI n'est fournie dans le dépôt ; l'exécution périodique reste à configurer par l'opérateur (cron, systemd timer, ou job CI).
- Rétention : le script conserve par défaut les 7 dernières sauvegardes.
- Restauration : `gunzip -c backups/taskmaster_YYYYMMDD_HHMMSS.sql.gz | docker exec -i taskmaster-db psql -U postgres -d taskmaster`
