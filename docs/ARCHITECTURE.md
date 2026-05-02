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
- `frontend/index.html` — Structure HTML5 sémantique
- `frontend/style.css` — Mise en page responsive
- `frontend/app.js` — Logique client, appels API REST

### Couche Métier (Backend)
- **Routes** (`src/routes/`) — Définissent les endpoints API
- **Controllers** (`src/controllers/`) — Reçoivent les requêtes, valident les entrées
- **Services** (`src/services/`) — Contiennent la logique métier pure
- **Middleware** (`src/middleware/`) — Auth JWT, validation, rate limiting

### Couche Données
- **Models** (`src/models/`) — Mappent les tables via Sequelize (ORM)
- **PostgreSQL** — Base relationnelle principale
- **Redis** — Cache de sessions et données fréquentes

## Sécurité (DICP — CP 6.3)

| Critère | Mesure appliquée |
|---------|-----------------|
| **Disponibilité** | Healthchecks Docker, restart automatique, rate limiting |
| **Intégrité** | Validation des entrées (express-validator), contraintes SQL |
| **Confidentialité** | JWT signé, bcrypt 12 rounds, HTTPS, CSP headers, CORS |
| **Preuve** | Logs structurés, timestamps sur chaque entité (created_at, updated_at) |

### Conformité OWASP Top 10
- **Injection SQL** → Requêtes préparées via Sequelize ORM
- **XSS** → textContent côté front, Helmet CSP côté back
- **CSRF** → JWT Bearer token (pas de cookies de session)
- **IDOR** → Vérification userId sur chaque requête
- **Auth cassée** → bcrypt + JWT avec expiration

### Conformité ANSSI
- Utilisateur applicatif PostgreSQL avec droits restreints (pas de root)
- Conteneur Docker en utilisateur non-root
- Variables sensibles dans .env (hors Git)
- Dépendances auditées (`npm audit`)

## Technologies utilisées

| Composant | Technologie | Justification |
|-----------|------------|---------------|
| Runtime | Node.js 20 | Léger, async, large écosystème |
| Framework | Express 4 | Standard de fait, middleware flexible |
| ORM | Sequelize 6 | Abstraction SQL, migrations, relations |
| BDD | PostgreSQL 16 | Robuste, ACID, open source |
| Cache | Redis 7 | Rapide, sessions, invalidation cache |
| Auth | JWT + bcrypt | Stateless, standard, sécurisé |
| Tests | Jest + Supertest | Unitaires + intégration, couverture |
| Conteneurs | Docker + Compose | Reproductibilité, isolation |
| CI/CD | GitHub Actions | Intégré à GitHub, gratuit |
| Lint | ESLint | Qualité de code automatisée |

## Écoconception

- Images Docker Alpine (taille minimale)
- Pagination des requêtes (pas de chargement de toutes les données)
- Cache Redis pour éviter les requêtes BDD répétitives
- Index SQL pour optimiser les performances
- Compression des réponses HTTP (Helmet)
