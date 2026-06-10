# Mini-cours — Ce qu'attend le jury pour chaque CP

> Pour chaque compétence : ce que tu dois **savoir expliquer à l'oral**, les notions clés,
> et comment le projet TaskMaster en est la preuve concrète.

---

## Activité 1 — Développer une application sécurisée

---

### CP1 — Installer et configurer son environnement de travail

**Ce que le jury attend**
Tu dois montrer que tu sais préparer un environnement reproductible et professionnel,
pas juste "installer Node et coder". L'idée clé : n'importe quel développeur doit pouvoir
reprendre ton projet en 5 minutes sur n'importe quelle machine.

**Notions à maîtriser**

- **Gestionnaire de versions** : Git (commits atomiques, branches, .gitignore)
- **Variables d'environnement** : pourquoi on ne committe jamais les secrets,
  différence `.env` / `.env.example`
- **Gestionnaire de dépendances** : npm, `package.json` vs `package-lock.json`,
  différence `dependencies` / `devDependencies`, `npm ci` vs `npm install`
- **Conteneurisation** : Docker = environnement identique partout ;
  Docker Compose = orchestration multi-services ; healthcheck = attendre que la BDD soit prête
- **Qualité de code** : ESLint (détecte les erreurs), Prettier (formate uniformément),
  pourquoi les deux sont complémentaires
- **CI/CD** : pipeline qui s'exécute automatiquement à chaque push pour éviter les régressions

**Pièges à éviter à l'oral**

- Dire "j'ai installé Node" sans expliquer pourquoi une version précise (`.nvmrc`)
- Confondre `npm install` (résout les versions) et `npm ci` (installe exactement le lock file)
- Ne pas savoir pourquoi le `.env` est dans le `.gitignore`

**Preuve dans TaskMaster**
Docker Compose (4 services), `.env.example`, `.nvmrc`, `.eslintrc.json`, `.prettierrc`,
GitHub Actions CI/CD (4 jobs).

---

### CP2 — Développer des interfaces utilisateur

**Ce que le jury attend**
Tu dois montrer que tu sais construire une interface **accessible, responsive et sécurisée**,
pas juste visuellement jolie. Le jury insistera sur l'accessibilité et la prévention du XSS.

**Notions à maîtriser**

- **HTML sémantique** : `<header>`, `<main>`, `<section>`, `<nav>` ont un sens pour les
  lecteurs d'écran ; un `<div>` n'en a pas
- **Accessibilité RGAA/WCAG** :
  - `aria-label`, `aria-labelledby`, `aria-live` (annonces dynamiques pour les lecteurs d'écran)
  - `aria-required` sur les champs obligatoires
  - Lien d'évitement (`skip-link`) pour la navigation clavier
  - Contraste minimum 4.5:1 (WCAG AA)
  - `focus-visible` : l'indicateur de focus doit être visible
- **Responsive design** : `<meta name="viewport">`, media queries, flexbox/grid
- **Prévention XSS** : toujours utiliser `textContent` (jamais `innerHTML` avec des données
  utilisateur) — le XSS injecte du JS malveillant via le DOM
- **CSP (Content Security Policy)** : header ou meta tag qui liste les sources autorisées,
  empêche le chargement de scripts externes non déclarés
- **Séparation HTML/CSS/JS** : pas de style inline, pas d'événements `onclick=""` dans le HTML

**Pièges à éviter à l'oral**

- Confondre `aria-label` (texte alternatif) et `aria-labelledby` (pointe vers un élément)
- Oublier que `aria-live="assertive"` interrompt le lecteur d'écran (à réserver aux erreurs)
- Dire "je n'utilise pas innerHTML" sans expliquer pourquoi c'est une faille XSS

**Preuve dans TaskMaster**
Skip-link, `aria-live`, `aria-required`, `role="alert"`, CSP meta, `textContent` partout,
`focus-visible`, responsive via flexbox/grid, contraste WCAG AA documenté dans style.css.

---

### CP3 — Développer des composants métier

**Ce que le jury attend**
Tu dois montrer que tu séparés la **logique métier** des contrôleurs HTTP. Un composant métier
ne connaît pas Express, ne lit pas `req.body` — il reçoit des données propres et retourne un résultat.

**Notions à maîtriser**

- **Architecture en couches** : Routeur → Contrôleur → Service → Repository/Modèle
  - Le contrôleur gère le HTTP (req, res, codes de statut)
  - Le service contient les règles métier (ex : on ne peut pas assigner une tâche à un utilisateur
    d'un autre projet)
  - Le modèle gère la persistence
- **Validation des entrées** : toujours valider au niveau de la route (express-validator),
  jamais faire confiance aux données reçues
- **Gestion des erreurs** : try/catch, codes HTTP appropriés (400 données invalides,
  401 non authentifié, 403 non autorisé, 404 introuvable, 500 erreur serveur)
- **Sécurité** : hachage bcrypt (pourquoi pas MD5/SHA1 ?), JWT (header.payload.signature,
  pourquoi `Bearer` ?, durée d'expiration), autorisation ≠ authentification
- **Règles métier** : ex. transitions de statut (todo → in_progress → done),
  un utilisateur ne voit que ses propres tâches

**Pièges à éviter à l'oral**

- Confondre authentification (qui es-tu ?) et autorisation (as-tu le droit ?)
- Ne pas savoir expliquer pourquoi bcrypt est préférable à SHA256 pour les mots de passe
  (bcrypt est lent intentionnellement, a un salt intégré)
- Mettre de la logique métier dans le contrôleur

**Preuve dans TaskMaster**
`TaskService.js` (logique métier isolée), `AuthController.js` (bcrypt + JWT),
`middleware/auth.js` (vérification JWT), `express-validator` sur toutes les routes,
transitions de statut gérées côté serveur.

---

### CP4 — Contribuer à la gestion d'un projet informatique

**Ce que le jury attend**
Tu dois montrer que tu travailles avec une méthodologie structurée, pas en codant "au feeling".
Le jury cherche : user stories, découpage en tâches, suivi d'avancement.

**Notions à maîtriser**

- **Méthodes agiles** : Scrum (sprints, backlog, daily, review, rétrospective),
  Kanban (colonnes todo/doing/done, limite de WIP)
- **User story** : format "En tant que [rôle], je veux [action] afin de [bénéfice]"
  — avec critères d'acceptation
- **Gestion de versions Git** : branches feature, pull requests, messages de commit
  (conventionnel commits : `feat:`, `fix:`, `docs:`)
- **Documentation** : README (setup, endpoints, sécurité), architecture (MCD, diagrammes)
- **Suivi** : outil de ticketing (GitHub Issues, Jira, Trello)

**Pièges à éviter à l'oral**

- Ne pas connaître la différence entre Scrum et Kanban
- Confondre une user story et une tâche technique
- Ne pas avoir de README exploitable

**Preuve dans TaskMaster**
`docs/user-stories.md`, `docs/ARCHITECTURE.md`, README complet, GitHub Actions (CI),
`.github/workflows/ci.yml`, structure Git propre.

---

## Activité 2 — Concevoir et développer une application sécurisée organisée en couches

---

### CP5 — Analyser les besoins et maquetter une application

**Ce que le jury attend**
Tu dois montrer que tu pars des besoins utilisateurs (pas de la technique) et que tu sais
les formaliser avant de coder. La maquette est une preuve que tu as réfléchi avant d'agir.

**Notions à maîtriser**

- **Recueil des besoins** : entretiens, observation, questionnaires → besoins fonctionnels
  vs non-fonctionnels (performance, sécurité, accessibilité)
- **User stories** avec critères d'acceptation (Given/When/Then)
- **Maquettage** :
  - Zoning → wireframe (structure) → maquette haute-fidélité
  - Outils : Figma, Balsamiq, draw.io
  - Principes UX : cohérence, feedback, affordance, loi de Fitts
- **Diagrammes UML** : cas d'utilisation (acteurs + use cases), diagramme de séquence
  (flux d'une fonctionnalité)

**Pièges à éviter à l'oral**

- Confondre wireframe (squelette) et maquette (design finalisé)
- Oublier les besoins non-fonctionnels (sécurité, performance, accessibilité)
- Ne pas avoir de critères d'acceptation dans les user stories

**Preuve dans TaskMaster**
`docs/user-stories.md` avec critères d'acceptation, architecture 3-tiers documentée,
`docs/ARCHITECTURE.md`.

---

### CP6 — Définir l'architecture logicielle d'une application

**Ce que le jury attend**
Tu dois justifier tes choix techniques (pourquoi Node.js ? pourquoi PostgreSQL ?)
et montrer que tu comprends les patterns architecturaux que tu utilises.

**Notions à maîtriser**

- **Architectures** :
  - Monolithique vs microservices (avantages/inconvénients)
  - Architecture 3-tiers : Présentation / Métier / Données
  - MVC : Modèle (données), Vue (affichage), Contrôleur (logique HTTP)
  - REST : stateless, ressources identifiées par URL, verbes HTTP (GET/POST/PUT/DELETE),
    codes de statut HTTP
- **Diagrammes** : composants, déploiement, séquence UML
- **Justification des choix** : pourquoi une technologie plutôt qu'une autre
  (ex : PostgreSQL → relationnel, ACID, intégrité référentielle)
- **Sécurité par conception** : principe du moindre privilège, défense en profondeur,
  OWASP Top 10

**Pièges à éviter à l'oral**

- Ne pas pouvoir justifier un choix technologique
- Confondre MVC et architecture 3-tiers (MVC est un pattern, 3-tiers est une architecture)
- Méconnaître les verbes HTTP et les codes de statut

**Preuve dans TaskMaster**
Architecture 3-tiers (Nginx / Express+Services / PostgreSQL+Redis), REST API documentée,
`docs/ARCHITECTURE.md` avec justification des choix, OWASP Top 10 adressé.

---

### CP7 — Concevoir et mettre en place une base de données relationnelle

**Ce que le jury attend**
Tu dois montrer que tu sais modéliser des données (MCD → MLD → SQL) et que tu comprends
les concepts fondamentaux des bases relationnelles.

**Notions à maîtriser**

- **MCD** (Modèle Conceptuel des Données) : entités, associations, cardinalités (1,1 / 1,n / n,n)
- **MLD** (Modèle Logique) : transformation en tables, clés primaires, clés étrangères
- **Normalisation** : 1NF (atomicité), 2NF (dépendance pleine), 3NF (pas de dépendance transitive)
- **SQL** : CREATE TABLE, contraintes (NOT NULL, UNIQUE, CHECK, FOREIGN KEY),
  INDEX pour les performances
- **Triggers** : exécutés automatiquement avant/après INSERT/UPDATE/DELETE
- **Transactions** : ACID (Atomicité, Cohérence, Isolation, Durabilité), BEGIN/COMMIT/ROLLBACK
- **Sécurité** : utilisateur applicatif avec droits minimaux (pas root),
  requêtes paramétrées (anti-injection SQL)

**Pièges à éviter à l'oral**

- Ne pas savoir expliquer les formes normales
- Confondre clé primaire et clé étrangère
- Ne pas savoir ce qu'est une transaction et pourquoi c'est utile

**Preuve dans TaskMaster**
`db/init.sql` (schéma complet, contraintes CHECK, INDEX), triggers `updated_at`,
procédure stockée `archive_old_tasks`, utilisateur `taskmaster_app` à droits restreints,
Sequelize migrations (`migrations/`).

---

### CP8 — Développer des composants d'accès aux données SQL et NoSQL

**Ce que le jury attend**
Tu dois montrer que tu sais interagir avec une BDD de façon sécurisée (requêtes paramétrées)
et que tu connais la différence entre SQL et NoSQL, et quand utiliser l'un ou l'autre.

**Notions à maîtriser**

- **ORM** (Object-Relational Mapper) : Sequelize mappe les tables en objets JS ;
  avantages (abstraction, sécurité) et inconvénients (N+1, overhead)
- **Requêtes paramétrées** : `WHERE email = $1` avec valeur séparée → impossible d'injecter du SQL
- **Migrations** : versionnement du schéma BDD (comme Git pour la BDD),
  `migrate` / `migrate:undo`
- **NoSQL Redis** : stockage clé-valeur en mémoire, TTL (durée de vie),
  cas d'usage : cache, sessions, rate limiting
- **Différence SQL vs NoSQL** :
  - SQL : structure fixe, jointures, ACID, idéal pour données relationnelles
  - NoSQL : schéma flexible, scalabilité horizontale, idéal pour cache/logs/sessions
- **CRUD** : Create (INSERT/POST), Read (SELECT/GET), Update (UPDATE/PUT), Delete (DELETE)

**Pièges à éviter à l'oral**

- Ne pas savoir ce qu'est une injection SQL et comment la prévenir
- Confondre Redis (cache mémoire) et MongoDB (base documentaire)
- Ne pas pouvoir expliquer le problème N+1 avec un ORM

**Preuve dans TaskMaster**
Sequelize (modèles, associations, requêtes paramétrées), Redis pour le rate limiting
et les sessions, migrations Sequelize, `db/init.sql` (procédures stockées).

---

## Activité 3 — Management de l'équipe projet

---

### CP9 — Préparer et exécuter les plans de tests d'une application

**Ce que le jury attend**
Tu dois montrer que tu testes de façon structurée et que tu distingues les niveaux de tests.
Le jury insistera sur : qu'est-ce qu'un bon test ? comment tu choisis ce que tu testes ?

**Notions à maîtriser**

- **Pyramide des tests** (de bas en haut) :
  - Tests unitaires : une seule unité isolée (fonction, méthode), rapides, nombreux
  - Tests d'intégration : plusieurs couches ensemble (contrôleur + BDD réelle)
  - Tests E2E : simulation utilisateur réel, lents, moins nombreux
- **Plan de tests** : cas nominaux (ça marche), cas limites (valeurs extrêmes),
  cas d'erreur (mauvaise entrée, droits insuffisants)
- **Jest** : `describe`, `it`, `expect`, mocks (`jest.fn()`), `beforeEach`/`afterEach`
- **Supertest** : simule des requêtes HTTP sans démarrer le serveur
- **Couverture de code** : `--coverage`, objectif réaliste (80%+ sur la logique métier)
- **TDD** (Test Driven Development) : écrire le test avant le code → Red → Green → Refactor

**Pièges à éviter à l'oral**

- Confondre test unitaire et test d'intégration
- Ne pas avoir de cas d'erreur dans le plan de tests
- Dire "j'ai 100% de couverture" sans préciser que la couverture ne garantit pas l'absence de bugs

**Preuve dans TaskMaster**
`tests/unit/taskService.test.js`, `tests/integration/tasks.test.js`,
`docs/test-plan.md`, couverture générée par Jest, tests lancés automatiquement en CI.

---

### CP10 — Préparer et documenter le déploiement d'une application

**Ce que le jury attend**
Tu dois montrer que tu sais passer d'un environnement de développement à un environnement
de production de façon maîtrisée, documentée et réversible.

**Notions à maîtriser**

- **Environnements** : développement / test (staging) / production — pourquoi les séparer
- **Documentation de déploiement** : prérequis, étapes pas à pas, commandes exactes,
  vérification post-déploiement (healthcheck)
- **Variables d'environnement** : jamais de secrets en dur, différentes valeurs par env
- **Sauvegarde** (backup) : avant tout déploiement, script de restore testé
- **Rollback** : que faire si le déploiement échoue ? (revenir à l'image précédente)
- **Healthcheck** : comment vérifier que l'application fonctionne après déploiement
- **Logs** : centralisation, rotation, niveaux (debug/info/warn/error)

**Pièges à éviter à l'oral**

- Ne pas avoir de procédure de rollback
- Oublier de parler de la sauvegarde avant déploiement
- Confondre un healthcheck (est-ce que l'app répond ?) et un test (est-ce que l'app est correcte ?)

**Preuve dans TaskMaster**
`docs/DEPLOYMENT.md`, `scripts/deploy.sh` (pre-flight, backup, health check),
`scripts/backup.sh` (pg_dump, rotation 7 jours), healthcheck Docker Compose,
Render pour le déploiement en production.

---

### CP11 — Contribuer à la mise en production dans une démarche DevOps

**Ce que le jury attend**
Tu dois montrer que tu comprends la philosophie DevOps (Dev + Ops = collaboration continue)
et que tu sais automatiser le cycle de vie d'une application.

**Notions à maîtriser**

- **DevOps** : décloisonner développeurs et opérationnels, automatiser tout ce qui peut l'être,
  livrer en continu en petits incréments
- **CI (Intégration Continue)** : à chaque commit, le pipeline vérifie automatiquement
  que le code est correct (lint + tests + build)
- **CD (Déploiement Continu)** : si le CI passe, le déploiement en production est automatique
  (ou déclenché manuellement avec 1 clic)
- **Conteneurisation** : Docker garantit que l'image qui passe les tests est exactement
  celle qui part en production ("build once, run anywhere")
- **Infrastructure as Code** : `docker-compose.yml`, `Dockerfile` = la config infra
  est versionnée comme le code
- **Monitoring** : logs applicatifs, healthchecks, alertes

**Pièges à éviter à l'oral**

- Confondre CI et CD
- Ne pas savoir expliquer concrètement ce que fait chaque job du pipeline
- Penser que DevOps = juste Docker

**Preuve dans TaskMaster**
GitHub Actions (4 jobs : lint → tests unitaires → tests intégration → build Docker),
Dockerfile multi-stage, Docker Compose, `scripts/deploy.sh`, déploiement sur Render.

---

> **Conseil général pour l'oral** : pour chaque CP, structure ta réponse ainsi :
>
> 1. Ce que j'ai fait (la tâche concrète)
> 2. Pourquoi je l'ai fait comme ça (le choix technique justifié)
> 3. Ce que j'aurais fait différemment avec plus de temps (montre ta prise de recul)
