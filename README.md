# TaskMaster

> Application fil rouge pour le DP CDA — gestionnaire de tâches collaboratif sécurisé.
> Couvre les 11 compétences du référentiel CDA (TP-01281).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | HTML5 + CSS3 + JavaScript vanilla |
| Backend | Node.js 20 + Express 4 |
| ORM | Sequelize 6 |
| Base relationnelle | PostgreSQL 16 |
| Base NoSQL (cache) | Redis 7 |
| Authentification | JWT + bcrypt |
| Tests | Jest + Supertest (unit/integration) + Cypress (E2E) |
| Linting | ESLint + Prettier |
| CI/CD | GitHub Actions |
| Conteneurisation | Docker + Docker Compose |
| Déploiement | Render (gratuit) |

## Démarrage rapide

### Prérequis
- Docker Desktop installé
- Node.js 20+ (pour développement local hors Docker)

### Lancement avec Docker (recommandé)

```bash
# 1. Cloner le projet
git clone https://github.com/<votre-user>/taskmaster.git
cd taskmaster

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env si besoin (notamment JWT_SECRET en production)

# 3. Lancer tous les services
docker compose up -d

# 4. Vérifier que tout tourne
curl http://localhost:3000/health
```

L'API est sur http://localhost:3000, le frontend sur http://localhost:8080.

### Lancement en développement local

```bash
cd backend
npm install
npm run dev
```

Dans un autre terminal :
```bash
cd frontend
npx http-server -p 8080
```

## Structure du projet

```
taskmaster/
├── backend/
│   ├── src/
│   │   ├── config/        Configuration (BDD, Redis)
│   │   ├── controllers/   Handlers des routes HTTP
│   │   ├── middleware/    Auth, rate limit, validation
│   │   ├── models/        Modèles Sequelize
│   │   ├── routes/        Définition des routes Express
│   │   ├── services/      Logique métier
│   │   └── app.js         Point d'entrée
│   ├── tests/
│   │   ├── unit/          Tests unitaires (Jest)
│   │   └── integration/   Tests d'intégration (Supertest)
│   ├── package.json
│   ├── Dockerfile
│   └── .eslintrc.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── db/
│   └── init.sql           Schéma + utilisateur applicatif
├── scripts/
│   ├── deploy.sh
│   └── backup.sh
├── .github/workflows/
│   └── ci.yml             Pipeline CI/CD
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── test-plan.md
│   └── user-stories.md
├── docker-compose.yml
├── .env.example
└── README.md
```

## Commandes utiles

```bash
# Tests
cd backend && npm test                # tous les tests
cd backend && npm test -- --coverage  # avec couverture
cd backend && npm run lint            # vérification style

# Migrations BDD
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo

# Docker
docker compose up -d        # lancer
docker compose logs -f      # logs temps réel
docker compose down         # arrêter
docker compose down -v      # arrêter + supprimer volumes
```

## Endpoints API

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| POST | `/auth/register` | non | Créer un compte |
| POST | `/auth/login` | non | Se connecter, reçoit un JWT |
| GET | `/api/tasks` | oui | Lister mes tâches (filtres : statut, priorité, version, projet, page) |
| POST | `/api/tasks` | oui | Créer une tâche |
| PUT | `/api/tasks/:id` | oui | Modifier une tâche |
| DELETE | `/api/tasks/:id` | oui | Supprimer une tâche |
| GET | `/api/projects` | oui | Lister mes projets (avec stats de tâches par statut) |
| POST | `/api/projects` | oui | Créer un projet |
| PUT | `/api/projects/:id` | oui | Modifier un projet |
| DELETE | `/api/projects/:id` | oui | Supprimer un projet |
| GET | `/api/versions` | oui | Lister mes versions |
| POST | `/api/versions` | oui | Créer une version |
| DELETE | `/api/versions/:id` | oui | Supprimer une version |
| DELETE | `/api/auth/me` | oui | Supprimer son compte (RGPD) |
| GET | `/health` | non | Healthcheck |

## Sécurité — mesures implémentées

- Hachage des mots de passe avec bcrypt (12 rounds)
- Authentification stateless par JWT signé
- Validation systématique des entrées avec express-validator
- Requêtes paramétrées via Sequelize (anti-injection SQL)
- Headers de sécurité avec Helmet (CSP, HSTS, X-Frame-Options)
- Rate limiting global et strict sur `/auth/login`
- Compte BDD applicatif à privilèges restreints (pas root)
- CORS strict (origine unique en production)
- Échappement systématique des sorties côté frontend (textContent)
- Conformité RGPD : consentement cookies, droit à l'effacement
- Audit des dépendances en CI (`npm audit`)

## Licence

MIT
