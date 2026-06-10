# Dossier Professionnel — CDA

---

## Activité 1 : Développer une application sécurisée

### A1.1 — Installer et configurer son environnement de travail en fonction du projet

**Exemple n°1 ► Mise en place de l'environnement Docker du projet TaskMaster**

1. J'ai configuré un environnement conteneurisé via Docker Compose orchestrant 4 services (Node.js, PostgreSQL, Redis, Nginx) avec healthchecks et variables d'environnement gérées via un `.env.example` versionné.

2. Docker Desktop, Docker Compose, fichier `.env.example` pour les secrets, et un `Dockerfile` multi-stage avec utilisateur non-root pour respecter les bonnes pratiques de sécurité.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Configuration des outils qualité et du pipeline CI/CD**

1. J'ai configuré ESLint et Prettier pour garantir la qualité du code, puis mis en place un pipeline GitHub Actions exécutant automatiquement lint, tests et build Docker à chaque push.

2. ESLint 8 avec règles de sécurité (`.eslintrc.json`), Prettier 3 (`.prettierrc`), `.nvmrc` pour épingler Node.js 20, et GitHub Actions pour l'intégration continue.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A1.2 — Développer des interfaces utilisateur

**Exemple n°1 ► Formulaires d'authentification et gestion des projets**

1. J'ai développé les formulaires de connexion, d'inscription et de gestion des projets en HTML/CSS/JS vanilla, avec validation côté client, messages d'erreur injectés via `role="alert"` et `aria-live="assertive"`, et une vue grille des projets affichant les statistiques de tâches par statut. L'ensemble respecte le RGAA : langue déclarée, hiérarchie de titres cohérente (`<h1>` → `<h2>`), `<label for>` explicitement associé à chaque champ, et `skip-link` permettant de sauter la navigation au clavier.

2. HTML5 sémantique (`<html lang="fr">`, `<header role="banner">`, `<main id="main-content">`, `<nav aria-label="Navigation principale">`, `<section aria-labelledby>`), CSS Flexbox/Grid, JavaScript vanilla avec appels API REST et JWT ; conformité RGAA : `aria-required="true"` sur les champs obligatoires, `aria-describedby="password-hint"` pour exposer les contraintes du mot de passe aux lecteurs d'écran, `role="alert"` + `aria-live="assertive"` pour les messages d'erreur, `<label for>` systématique sur chaque input, `skip-link` rendu visible au `:focus` en CSS.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Vues Liste, Kanban et Synthèse avec filtrage par version et projet**

1. J'ai développé trois vues interchangeables pour les tâches : une vue liste avec barre de filtres (`role="search"`), une vue kanban avec drag & drop et navigation clavier (touche `Enter` pour ouvrir une tâche, `Escape` pour fermer les modals), et une vue synthèse avec compteurs animés et calcul du temps moyen de complétion sur une période, les animations étant désactivées si l'utilisateur a activé `prefers-reduced-motion`.

2. JavaScript vanilla (DOM, événements drag, `requestAnimationFrame`) ; conformité RGAA : `aria-pressed` mis à jour dynamiquement sur les boutons de bascule de vue (Liste / Kanban / Synthèse), `aria-label` descriptifs sur tous les boutons icônes, `role="list"` sur la liste des tâches, `aria-label` sur les contrôles de pagination avec `aria-live="polite"` pour annoncer la page courante, `focus-visible` CSS (outline 3px solid) pour le contour de focus visible, `@media (prefers-reduced-motion: reduce)` pour désactiver les transitions, `@media (prefers-contrast: more)` pour renforcer les contrastes, badges de priorité dont les couleurs respectent le ratio WCAG AA, `textContent` systématique contre le XSS.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A1.3 — Développer des composants métier

**Exemple n°1 ► Système d'authentification (bcrypt + JWT)**

1. J'ai développé les composants d'authentification : hachage des mots de passe avec bcrypt (12 rounds) à l'inscription, vérification à la connexion, puis génération d'un token JWT signé transmis au client pour sécuriser les appels API suivants.

2. bcrypt (salt intégré, résistant aux attaques par dictionnaire), jsonwebtoken, express-validator pour la validation des entrées, et un middleware `auth.js` vérifiant le token à chaque route protégée.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Composants métier : tâches, projets et versions**

1. J'ai développé les contrôleurs de projets (CRUD avec agrégation des stats de tâches par statut), de versions (CRUD avec dissociation en SET NULL à la suppression) et le service de tâches (protection IDOR, horodatage des transitions de statut, réassignation atomique par transaction Sequelize).

2. Sequelize ORM (associations hasMany/belongsTo, transactions managées), pattern Service Layer, liste blanche des champs modifiables pour prévenir la mass assignment, express-validator sur chaque route.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A1.4 — Contribuer à la gestion d'un projet informatique

**Exemple n°1 ► Rédaction des user stories et structuration du backlog**

1. J'ai formalisé les besoins en 24 user stories organisées en 7 epics (Authentification, Tâches, Projets, Versions, Vues, Sécurité, Accessibilité), chacune avec des critères d'acceptation mesurables au format Given/When/Then.

2. Fichier `docs/user-stories.md` versionné avec Git, structuré en tableau avec ID, priorité et critères d'acceptation par story.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Documentation de l'architecture et pipeline CI/CD**

1. J'ai rédigé la documentation technique (architecture 3-tiers, MCD/MLD incluant les entités User/Task/Project/Version, choix technologiques justifiés, conformité OWASP) et mis en place un pipeline GitHub Actions automatisant lint, tests et build à chaque push.

2. Markdown versionné (`docs/ARCHITECTURE.md`, `README.md`), GitHub Actions (`.github/workflows/ci.yml`), diagrammes ASCII pour le MCD complet et l'architecture en couches.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

## Activité 2 : Concevoir et développer une application sécurisée organisée en couches

### A2.1 — Analyser les besoins et maquetter une application

**Exemple n°1 ► Recueil et formalisation des besoins en user stories**

1. J'ai analysé les besoins fonctionnels et non-fonctionnels du projet TaskMaster, puis les ai formalisés en 24 user stories réparties en 7 epics (Authentification, Tâches, Projets, Versions, Vues, Sécurité, Accessibilité), chacune avec des critères d'acceptation mesurables.

2. Format "En tant que / Je veux / Afin de" avec critères d'acceptation, fichier `docs/user-stories.md` versionné, priorisation MoSCoW (Haute/Moyenne).

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Maquettage des interfaces et diagrammes UML**

1. J'ai réalisé les wireframes des 5 écrans principaux (connexion, grille projets, vue liste, vue kanban, vue synthèse) ainsi que les diagrammes de cas d'utilisation et de séquence des flux principaux (connexion, chargement des tâches, changement de statut par drag & drop).

2. Maquettes textuelles dans `docs/MAQUETTES.md`, diagramme de cas d'utilisation UML, diagrammes de séquence acteur/système modélisant les interactions entre navigateur, API Express et PostgreSQL.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A2.2 — Définir l'architecture logicielle d'une application

**Exemple n°1 ► Conception de l'architecture 3-tiers et choix technologiques**

1. J'ai défini une architecture multicouche (Présentation / Métier / Données) avec un pattern MVC côté backend, et justifié chaque choix technologique : Node.js pour son modèle asynchrone, PostgreSQL pour ses garanties ACID, Redis pour le cache, Nginx comme reverse proxy.

2. `docs/ARCHITECTURE.md` avec diagramme de déploiement (4 conteneurs Docker), tableau de justification des technologies, conformité OWASP Top 10 et ANSSI documentée, principes DICP appliqués.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Conception de l'API REST et organisation du code en couches**

1. J'ai conçu une API REST stateless avec des routes organisées par ressource (auth, tasks, projects, versions), chaque couche ayant un rôle strict : les routes définissent les endpoints, les contrôleurs gèrent le HTTP, les services contiennent la logique métier, les modèles abstraient la base de données.

2. Express 4 (routeur), pattern Service Layer (`TaskService.js`), Sequelize ORM (modèles et associations), séparation stricte des responsabilités vérifiable dans l'arborescence `src/routes/`, `src/controllers/`, `src/services/`, `src/models/`.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A2.3 — Concevoir et mettre en place une base de données relationnelle

**Exemple n°1 ► Modélisation et création du schéma relationnel**

1. J'ai conçu le schéma relationnel complet de TaskMaster (4 tables : users, projects, versions, tasks) avec contraintes d'intégrité (NOT NULL, UNIQUE, CHECK sur statut et priorité, clés étrangères avec ON DELETE CASCADE / SET NULL), puis créé les index nécessaires sur les colonnes les plus filtrées.

2. SQL DDL dans `db/init.sql`, contraintes CHECK pour garantir les valeurs métier (statut, priorité), index sur `user_id`, `project_id`, `version_id`, `status`, `email`, migrations Sequelize CLI versionnant l'évolution du schéma.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Sécurité BDD, triggers et procédures stockées**

1. J'ai appliqué le principe du moindre privilège en créant un utilisateur applicatif `taskmaster_app` avec des droits limités (SELECT/INSERT/UPDATE/DELETE uniquement, pas de CREATE/DROP), mis en place des triggers de mise à jour automatique de `updated_at`, et rédigé des procédures stockées pour l'archivage et le transfert atomique de tâches.

2. PostgreSQL `GRANT/REVOKE`, `CREATE TRIGGER`, `CREATE OR REPLACE PROCEDURE` en PL/pgSQL, transactions implicites dans les procédures, jeu de données d'essai avec mots de passe hashés en bcrypt.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A2.4 — Développer des composants d'accès aux données SQL et NoSQL

**Exemple n°1 ► Accès aux données SQL via Sequelize ORM**

1. J'ai développé les composants d'accès aux données relationnelles via Sequelize : modèles typés avec validations (User, Task, Project, Version), associations (hasMany/belongsTo), requêtes filtrées et paginées, et transactions managées pour garantir l'atomicité des opérations sensibles.

2. Sequelize 6 (modèles, associations, `findAndCountAll`, `Op.ne`, `Op.lt`), requêtes paramétrées automatiques (protection injection SQL), `sequelize.transaction()` pour les opérations multi-tables, migrations versionnant l'évolution du schéma.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Cache applicatif NoSQL avec Redis (pattern cache-aside)**

1. J'ai implémenté un cache-aside Redis dans `VersionController.js` : à chaque `GET /api/versions`, le contrôleur tente un `client.get(key)` Redis — si le cache est chaud la réponse est retournée immédiatement, sinon PostgreSQL est interrogé et le résultat est écrit avec `client.set(key, data, { EX: 60 })` ; les opérations `POST` et `DELETE` invalident le cache via `client.del(key)`.

2. Client Redis 4 (`createClient`, `client.get`, `client.set` avec TTL, `client.del`), clé de cache isolée par utilisateur (`versions:user:{userId}`), dégradation gracieuse (`client.isOpen`) pour que l'application reste fonctionnelle si Redis est indisponible.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

## Activité 3 : Management de l'équipe projet

### A3.1 — Préparer et exécuter les plans de tests d'une application

**Exemple n°1 ► Rédaction du plan de tests et exécution des tests unitaires**

1. J'ai rédigé un plan de tests couvrant 5 types de tests (unitaires, intégration, sécurité, charge, accessibilité), sans E2E dans cette version en raison du coût et de l'infrastructure qu'ils impliqueraient, puis implémenté 15 tests unitaires Jest avec mocks pour isoler le `TaskService` de la base de données.

2. Jest 29 (`describe`, `it`, `jest.mock`, `jest.fn`, `beforeEach`), mocks des modèles Sequelize et de la transaction, couverture de code générée avec `--coverage` (> 85% sur le service).

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Tests d'intégration et tests de sécurité**

1. J'ai développé des tests d'intégration avec Supertest vérifiant les routes API sur une vraie base de données (création, authentification, filtrage), dont un test de protection IDOR vérifiant qu'un utilisateur ne peut pas accéder aux tâches d'un autre, et documenté les cas de tests de sécurité (injection SQL, XSS, JWT expiré, brute force).

2. Supertest 7 (simulation de requêtes HTTP sans démarrer le serveur), bcrypt et JWT pour créer les fixtures de test, `beforeAll`/`afterAll` pour la création et le nettoyage des données, GitHub Actions exécutant les tests à chaque push avec PostgreSQL et Redis en services.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A3.2 — Préparer et documenter le déploiement d'une application

**Exemple n°1 ► Documentation de la procédure de déploiement multi-environnements**

1. J'ai rédigé la procédure de déploiement complète couvrant 4 environnements (DEV, SIT, UAT, PROD), incluant les prérequis, les étapes de déploiement pas à pas, la gestion des migrations de base de données via Sequelize CLI et la procédure de rollback en cas d'échec.

2. `docs/DEPLOYMENT.md` versionné avec Git, tableau des environnements (URL, base de données, usage), commandes Sequelize CLI (`db:migrate` / `db:migrate:undo`), procédure de restauration depuis une sauvegarde compressée.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Scripts de déploiement et de sauvegarde automatisés**

1. J'ai développé un script de déploiement en 6 étapes (`deploy.sh`) avec vérifications préalables (Docker, .env), sauvegarde automatique avant tout déploiement, build, démarrage des services et vérification de santé post-déploiement, ainsi qu'un script de sauvegarde avec rotation automatique des 7 dernières sauvegardes.

2. Bash (`set -euo pipefail` pour arrêter sur erreur), `docker exec pg_dump` avec compression gzip, `curl` pour le healthcheck post-déploiement, rotation des fichiers avec `ls -t | tail | xargs rm`.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

### A3.3 — Contribuer à la mise en production dans une démarche DevOps

**Exemple n°1 ► Mise en place du pipeline CI/CD avec GitHub Actions**

1. J'ai mis en place un pipeline CI/CD en 4 jobs séquentiels (lint → tests unitaires → tests d'intégration → build Docker), chaque job ne s'exécutant que si le précédent réussit, avec PostgreSQL et Redis instanciés automatiquement comme services pour les tests d'intégration.

2. GitHub Actions (`on: push/pull_request`, `needs`, `services`), cache npm pour accélérer les builds, upload d'artefacts de couverture, image Docker taggée avec le SHA du commit pour la traçabilité.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---

**Exemple n°2 ► Conteneurisation et déploiement sur Render avec Nginx**

1. J'ai conteneurisé l'application avec un `Dockerfile` multi-stage (Alpine, utilisateur non-root, healthcheck) et orchestré les 4 services via Docker Compose, avec Nginx configuré en reverse proxy pour servir les fichiers statiques et relayer les appels `/api/` vers le backend, puis déployé sur Render.

2. Docker multi-stage build (image Alpine ~50 Mo), `nginx.conf` (proxy_pass, X-Forwarded-For), Docker Compose (`depends_on` avec `condition: service_healthy`), variables d'environnement injectées à l'exécution, déploiement continu sur Render depuis la branche `main`.

3. Seul, dans le cadre de ma formation, avec le suivi de mes formateurs.

4. Nom : _(organisme de formation)_
   Service : Formation CDA — Projet fil rouge TaskMaster
   Période : Du _(date)_ au _(date)_

---
