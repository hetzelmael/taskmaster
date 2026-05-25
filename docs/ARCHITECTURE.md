# Architecture logicielle — TaskMaster

## Vue d'ensemble

TaskMaster utilise une **architecture multicouche** (N-tiers) organisée selon le pattern **MVC** (Model-View-Controller).

## Les 3 couches

```
┌─────────────────────────────────────┐
│        COUCHE PRÉSENTATION          │  Frontend HTML/CSS/JS
│  (index.html, app.js, style.css)    │  → Ce que voit l'utilisateur
├─────────────────────────────────────┤
│          COUCHE MÉTIER              │  Backend Node.js/Express
│  (Controllers, Services, Routes)    │  → Logique de gestion
├─────────────────────────────────────┤
│         COUCHE DONNÉES              │  PostgreSQL + Redis
│  (Models Sequelize, init.sql)       │  → Stockage et persistance
└─────────────────────────────────────┘
```

### Couche Présentation

- `frontend/index.html` — Structure HTML5 sémantique (4 vues : projets, liste, kanban, synthèse)
- `frontend/style.css` — Mise en page responsive (WCAG AA)
- `frontend/app.js` — Logique client, appels API REST, gestion des vues et du drag & drop

### Couche Métier (Backend)

- **Routes** (`src/routes/`) — Définissent les endpoints API (auth, tasks, projects, versions)
- **Controllers** (`src/controllers/`) — Reçoivent les requêtes, valident les entrées
- **Services** (`src/services/`) — Contiennent la logique métier pure (TaskService)
- **Middleware** (`src/middleware/`) — Auth JWT, validation, rate limiting

### Couche Données

- **Models** (`src/models/`) — Mappent les tables via Sequelize (User, Task, Project, Version)
- **PostgreSQL** — Base relationnelle principale
- **Redis** — Cache NoSQL (utilisé principalement pour le cache des `versions`; peut être étendu aux sessions)
- **Note de synchronisation** : les contraintes `CHECK` (status, priority) et la fonction/trigger `update_updated_at` sont présentes dans `db/init.sql` et ont été ajoutées aux migrations Sequelize (voir `backend/migrations/20240103000000-add-checks-triggers.js`) afin d'assurer la cohérence entre initialisation Docker et migrations.

## Sécurité (DICP)

| Critère             | Mesure appliquée                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Disponibilité**   | Healthchecks Docker, restart automatique, rate limiting                                          |
| **Intégrité**       | Validation des entrées (express-validator), contraintes SQL CHECK                                |
| **Confidentialité** | JWT signé, bcryptjs (configurable rounds), TLS recommandé en production, CSP headers, CORS, IDOR |
| **Preuve**          | Logs structurés, timestamps sur chaque entité (created_at, updated_at)                           |

### Conformité OWASP Top 10

- **Injection SQL** → Requêtes préparées via Sequelize ORM
- **XSS** → textContent côté front, Helmet CSP côté back
- **CSRF** → JWT Bearer token (pas de cookies de session)
- **IDOR** → Vérification userId sur chaque requête (tasks, projects, versions)
- **Auth cassée** → bcryptjs + JWT avec expiration 24h

### Conformité ANSSI

- Utilisateur applicatif PostgreSQL avec droits restreints (pas de root)
- Conteneur Docker en utilisateur non-root
- Variables sensibles dans .env (hors Git)
- Dépendances auditées (`npm audit`)

### Remarques déploiement local

- Le serveur Nginx local (`frontend/nginx.conf`) écoute en HTTP sur le port 80 sans TLS. Pour un déploiement en production, il est recommandé de configurer TLS (Let's Encrypt, reverse proxy, ou termination TLS côté load balancer).

## Technologies utilisées

| Composant  | Technologie      | Justification                          |
| ---------- | ---------------- | -------------------------------------- |
| Runtime    | Node.js 20       | Léger, async, large écosystème         |
| Framework  | Express 4        | Standard de fait, middleware flexible  |
| ORM        | Sequelize 6      | Abstraction SQL, migrations, relations |
| BDD        | PostgreSQL 16    | Robuste, ACID, open source             |
| Cache      | Redis 7          | Rapide, sessions, invalidation cache   |
| Auth       | JWT + bcryptjs   | Stateless, standard, cross-platform    |
| Tests      | Jest + Supertest | Unitaires + intégration, couverture    |
| Conteneurs | Docker + Compose | Reproductibilité, isolation            |
| CI/CD      | GitHub Actions   | Intégré à GitHub, gratuit              |
| Lint       | ESLint           | Qualité de code automatisée            |

## Modèle Conceptuel de Données (MCD)

### Entités et attributs

```
┌──────────────────┐        ┌──────────────────────┐
│      USERS       │        │       PROJECTS       │
├──────────────────┤  1   N ├──────────────────────┤
│ PK id            │────────│ PK id                │
│    email         │ crée   │    name VARCHAR(255) │
│    password      │        │    description TEXT  │
│    first_name    │        │ FK user_id → users   │
│    last_name     │        │    created_at        │
│    created_at    │        │    updated_at        │
│    updated_at    │        └──────────────────────┘
│                  │                  │ 1
│                  │                  │ contient
│                  │                  │ N
│                  │        ┌──────────────────────┐
│                  │  1   N │        TASKS         │
│                  │────────├──────────────────────┤
│                  │ possède│ PK id                │
└──────────────────┘        │    title             │
         │                  │    description TEXT  │
         │ 1                │    status            │
         │ génère           │      ∈ {todo,        │
         │ N                │         in_progress, │
┌──────────────────┐        │         done,        │
│     VERSIONS     │  1   N │         archived}    │
├──────────────────┤────────│    priority          │
│ PK id            │ tague  │      ∈ {low,medium,  │
│    name          │(NULL)  │         high}        │
│    description   │        │    due_date DATE     │
│ FK user_id→users │        │    started_at        │
│    created_at    │        │    completed_at      │
│    updated_at    │        │ FK user_id → users   │
└──────────────────┘        │ FK project_id→proj.  │
                            │ FK version_id→vers.  │
                            │    created_at        │
                            │    updated_at        │
                            └──────────────────────┘
```

### Règles de gestion

- Un utilisateur possède **0 ou plusieurs** projets (`1,N`)
- Un projet contient **0 ou plusieurs** tâches (`1,N`) — suppression en cascade
- Un utilisateur possède **0 ou plusieurs** versions (`1,N`)
- Une version tague **0 ou plusieurs** tâches (`1,N`) — suppression met version_id à NULL
- Une tâche appartient à **exactement un** utilisateur (`1,1`)
- Le statut et la priorité sont contraints par des `CHECK` SQL
- Le champ `updated_at` est mis à jour automatiquement par un trigger PostgreSQL
- Les transitions de statut horodatent automatiquement `started_at` et `completed_at`

### Modèle Logique de Données (MLD)

```
users(id, email, password, first_name, last_name, created_at, updated_at)

projects(id, name, description, #user_id, created_at, updated_at)

versions(id, name, description, #user_id, created_at, updated_at)

tasks(id, title, description, status, priority, due_date,
      started_at, completed_at,
      #user_id, #project_id, #version_id,
      created_at, updated_at)
```

`#` = clé étrangère

### Normalisation du schéma (Formes Normales)

**1NF — Pas de groupes répétitifs, attributs atomiques**
Toutes les tables ont une clé primaire (`id` auto-incrémenté) et chaque attribut est atomique : `status`, `priority`, `due_date` sont des colonnes séparées, jamais des listes ou JSON dans un seul champ.

**2NF — Pas de dépendance partielle (pas de clé composite)**
Les clés primaires sont simples (un seul attribut `id`), donc il ne peut pas exister de dépendance partielle. Le schéma est en 2NF par construction.

**3NF — Pas de dépendance transitive**

- `tasks` : `title`, `status`, `priority`, `due_date`, `started_at`, `completed_at` dépendent directement de `id`. Les clés étrangères (`user_id`, `project_id`, `version_id`) référencent des entités distinctes, pas d'attribut qui dépendrait d'un non-clé.
- `projects` : `name`, `description` dépendent de `id`. `user_id` lie à `users` sans redondance (le nom de l'utilisateur n'est pas copié dans `projects`).
- `versions` : identique à `projects`, pas de transitivité.
- Conclusion : le schéma est en **3NF**. Aucune donnée n'est dupliquée entre les tables.

## Vues frontend

| Vue          | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| **Projets**  | Grille de cartes avec stats de tâches par statut (todo/in_progress/done) |
| **Liste**    | Tableau paginé avec filtres (statut, priorité, version)                  |
| **Kanban**   | 3 colonnes drag & drop, transitions de statut contraintes                |
| **Synthèse** | Analyse sur période : compteurs animés, temps moyen de complétion        |

## Diagramme de déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                     Machine hôte (Docker)                   │
│                                                             │
│  ┌──────────────────┐      ┌──────────────────────────────┐ │
│  │  Navigateur      │      │   Conteneur : frontend       │ │
│  │  (utilisateur)   │─────▶│   Nginx : alpine            │ │
│  │                  │ :8080│   Sert HTML/CSS/JS           │ │
│  └──────────────────┘      │   Proxy /api → backend:3000  │ │
│                            └──────────────┬───────────────┘ │
│                                           │ /api/*          │
│                            ┌──────────────▼───────────────┐ │
│                            │   Conteneur : backend        │ │
│                            │   Node.js 20 + Express       │ │
│                            │   Port 3000                  │ │
│                            │   User : appuser (non-root)  │ │
│                            └──────┬───────────────┬───────┘ │
│                                   │               │         │
│                    ┌──────────────▼──┐   ┌────────▼───────┐ │
│                    │ Conteneur : db  │   │Conteneur: cache│ │
│                    │ PostgreSQL 16   │   │ Redis 7        │ │
│                    │ Port 5433       │   │ Port 6379      │ │
│                    │ Volume : pgdata │   │ Mot de passe   │ │
│                    └─────────────────┘   └────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Flux réseau :
  Navigateur → Nginx (:8080) → Express (:3000) → PostgreSQL / Redis
  Nginx reverse-proxy les routes /api/* vers le backend
  Les conteneurs communiquent via le réseau Docker interne
```

## Écoconception

- Images Docker Alpine (taille minimale)
- Pagination des requêtes (pas de chargement de toutes les données)
- Cache Redis pour éviter les requêtes BDD répétitives
- Index SQL pour optimiser les performances
- Compression des réponses HTTP (gzip via Express `compression` middleware ou Nginx)
