# Procédure de déploiement — TaskMaster

## Prérequis

- Docker Engine 24+ et Docker Compose v2
- Git
- Accès au dépôt GitHub

## Environnements

| Environnement | URL | Base de données | Usage |
|--------------|-----|-----------------|-------|
| DEV | localhost:3000 | taskmaster_dev | Développement local |
| SIT | sit.taskmaster.dev | taskmaster_sit | Tests d'intégration système |
| UAT | uat.taskmaster.dev | taskmaster_uat | Validation par le client |
| PROD | taskmaster.dev | taskmaster_prod | Production |

## Déploiement local (DEV)

1. Cloner le dépôt : `git clone https://github.com/user/taskmaster.git`
2. Copier la configuration : `cp .env.example .env`
3. Adapter les variables dans `.env`
4. Lancer : `docker compose up -d`
5. Vérifier : `curl http://localhost:3000/health`

## Déploiement automatisé (SIT/UAT/PROD)

Le pipeline GitHub Actions exécute automatiquement :

1. **Push sur `develop`** → Déploiement SIT automatique
2. **Pull Request vers `main`** → Tests complets (lint + unit + intégration)
3. **Merge dans `main`** → Déploiement UAT, puis PROD après validation manuelle

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

- Automatique : cron toutes les 6 heures via `scripts/backup.sh`
- Rétention : 7 dernières sauvegardes conservées
- Restauration : `gunzip -c backup.sql.gz | docker exec -i taskmaster-db psql -U postgres -d taskmaster`
