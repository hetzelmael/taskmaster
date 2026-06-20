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
│  (Controllers, Services, Routes,    │  → Logique de gestion
│   Middleware)                       │
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

- **Routes** (`src/routes/`) — Définissent les endpoints API (auth, tasks, projects, versions) et branchent les validateurs `express-validator`
- **Controllers** (`src/controllers/`) — Reçoivent les requêtes HTTP, délèguent la logique aux services, gèrent les réponses et les erreurs avec `try/catch`
- **Services** (`src/services/`) — Contiennent la logique métier pure (TaskService : CRUD, transitions de statut, transactions ; VersionService : cache Redis)
- **Middleware** (`src/middleware/`) — Auth JWT + vérification session Redis, rate limiting

### Couche Données

- **Models** (`src/models/`) — Mappent les tables via Sequelize (User, Task, Project, Version)
- **PostgreSQL** — Base relationnelle principale (ACID, contraintes CHECK, triggers `updated_at`, index sur `user_id`, `project_id`, `version_id`, `status`, `priority`)
- **Redis** — Cache NoSQL optionnel : cache des `versions` (TTL 60s), stockage des sessions JWT (invalidation à la déconnexion). Le serveur fonctionne sans Redis en dégradé gracieux.
- **Note de synchronisation** : les contraintes `CHECK` (status, priority) et la fonction/trigger `update_updated_at` sont présentes dans `db/init.sql` et ont été ajoutées aux migrations Sequelize (voir `backend/migrations/20240103000000-add-checks-triggers.js`) afin d'assurer la cohérence entre initialisation Docker et migrations.

## Sécurité (DICP)

| Critère             | Mesure appliquée                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Disponibilité**   | Healthchecks Docker, restart automatique, rate limiting, `process.exit(1)` sur `uncaughtException` en production       |
| **Intégrité**       | Validation des entrées (express-validator sur toutes les routes), contraintes SQL CHECK, transitions de statut contraintes côté service |
| **Confidentialité** | JWT signé en cookie `httpOnly, Secure, SameSite=Strict`, bcryptjs (rounds configurables), TLS en production, CSP headers, CORS strict, IDOR, logs sans cookies ni corps de requête |
| **Preuve**          | Logs structurés avec `X-Request-Id` sur chaque requête, timestamps automatiques sur chaque entité (`created_at`, `updated_at`, `started_at`, `completed_at`) |

### Conformité OWASP Top 10

- **Injection SQL** → Requêtes préparées via Sequelize ORM + SQL paramétré nommé (`:param`) pour les requêtes raw
- **XSS** → `textContent` côté front (jamais `innerHTML`), Helmet CSP côté back
- **CSRF** → Cookie `SameSite=Strict` — les requêtes cross-site ne transmettent pas le cookie
- **IDOR** → Vérification `userId` sur chaque requête (tasks, projects) ; les versions sont protégées via l'appartenance de leur projet à l'utilisateur (project.user_id = req.userId)
- **Auth cassée** → bcryptjs + JWT avec expiration 24h, révocation via Redis, `try/catch` sur toutes les opérations d'auth

### Conformité ANSSI

- Utilisateur applicatif PostgreSQL avec droits restreints (pas de root)
- Conteneur Docker en utilisateur non-root
- Variables sensibles dans `.env` (hors Git — utiliser `.env.example` comme modèle)
- Dépendances auditées (`npm audit`)
- Les logs HTTP n'exposent ni les headers (cookies JWT) ni le corps des requêtes d'authentification

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
| Auth       | JWT + bcryptjs + Redis | JWT signé côté serveur, session stockée dans Redis pour révocation à la déconnexion |
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
│                  │              │ 1         │ 1
│                  │              │ contient  │ génère
│                  │              │ N         │ N
│                  │  1   N  ┌────┴────────┐ ┌──────────────────┐
│                  │─────────│    TASKS    │ │    VERSIONS      │
│                  │ possède ├─────────────┤ ├──────────────────┤
└──────────────────┘         │ PK id       │ │ PK id            │
                             │ title       │ │ name             │
                             │ description │ │ description TEXT │
                             │ status      │ │ FK project_id    │
                             │   ∈ {todo,  │ │    → projects    │
                             │   in_prog., │ │ created_at       │
                             │   done,     │ │ updated_at       │
                             │   archived} │ └──────────────────┘
                             │ priority    │         │ 1
                             │   ∈ {low,   │         │ tague
                             │   medium,   │         │ (NULL)
                             │   high}     │◄── N ───┘
                             │ due_date    │
                             │ started_at  │
                             │ completed_at│
                             │ FK user_id  │
                             │ FK project_id│
                             │ FK version_id│
                             │ created_at  │
                             │ updated_at  │
                             └─────────────┘
```

### Règles de gestion

- Un utilisateur possède **0 ou plusieurs** projets (`0,N`)
- Un projet contient **0 ou plusieurs** tâches (`0,N`) — suppression en cascade
- Un projet génère **0 ou plusieurs** versions (`0,N`) — suppression en cascade
- Une version tague **0 ou plusieurs** tâches (`0,N`) — suppression met version_id à NULL
- Une tâche appartient à **exactement un** utilisateur (`1,1`)
- Le statut et la priorité sont contraints par des `CHECK` SQL
- Le champ `updated_at` est mis à jour automatiquement par un trigger PostgreSQL
- Les transitions de statut horodatent automatiquement `started_at` et `completed_at`

### Modèle Logique de Données (MLD)

```
users(id, email, password, first_name, last_name, created_at, updated_at)

projects(id, name, description, #user_id, created_at, updated_at)

versions(id, name, description, #project_id, created_at, updated_at)

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

| Vue          | Description                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------- |
| **Projets**  | Grille de cartes avec compteurs de tâches par statut, chargés en une seule requête SQL (`LEFT JOIN`) |
| **Liste**    | Tableau paginé (20 items/page) avec filtres statut, priorité, version                             |
| **Kanban**   | 3 colonnes drag & drop (todo / in_progress / done), transitions de statut validées côté serveur   |
| **Synthèse** | Dashboard analytique : KPIs animés, répartition statut/priorité, temps moyen de complétion, filtre par période |

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
│                    │ Port 5432       │   │ Port 6379      │ │
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
- Pagination des requêtes (20 items/page par défaut, max 100 — pas de chargement total)
- Cache Redis pour éviter les requêtes BDD répétitives (versions, TTL 60s)
- Requête SQL unique avec `LEFT JOIN` pour la liste des projets (remplace N+1 requêtes)
- Index SQL sur les colonnes fréquemment filtrées (`user_id`, `project_id`, `version_id`, `status`, `priority`)
- Compression des réponses HTTP (gzip via Express `compression` middleware ou Nginx)
