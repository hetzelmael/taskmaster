# Plan de tests — TaskMaster

## 1. Stratégie de tests

| Type de test  | Outil      | Couverture cible            | Automatisé  |
| ------------- | ---------- | --------------------------- | ----------- |
| Unitaire      | Jest       | > 80%                       | Oui (CI)    |
| Intégration   | Supertest  | Routes API critiques        | Oui (CI)    |
| E2E           | Non retenu | Parcours utilisateur        | Non         |
| Sécurité      | OWASP ZAP  | Top 10 OWASP                | Semi-auto   |
| Charge        | k6         | 100 utilisateurs simultanés | Non (local) |
| Accessibilité | Lighthouse | Score > 90                  | Manuel      |

## 2. Tests unitaires

### TaskService.createTask()

| ID  | Scénario            | Données entrée                   | Résultat attendu             |
| --- | ------------------- | -------------------------------- | ---------------------------- |
| U01 | Création valide     | title: "Tâche", priority: "high" | Tâche créée, status = "todo" |
| U02 | Titre vide          | title: ""                        | Erreur "titre obligatoire"   |
| U03 | Titre null          | title: null                      | Erreur "titre obligatoire"   |
| U04 | Titre > 255 car.    | title: "a" x 256                 | Erreur "255 caractères"      |
| U05 | Priorité invalide   | priority: "ultra"                | Erreur "priorité invalide"   |
| U06 | Priorité par défaut | (pas de priority)                | priority = "medium"          |

### TaskService.getTaskById() — Protection IDOR

| ID  | Scénario                     | Données               | Résultat attendu     |
| --- | ---------------------------- | --------------------- | -------------------- |
| U07 | Tâche existante, bon userId  | taskId=1, userId=42   | Retourne la tâche    |
| U08 | Tâche inexistante            | taskId=999, userId=42 | Erreur 404           |
| U09 | Tâche d'un autre user (IDOR) | taskId=1, userId=99   | Erreur 404 (PAS 200) |

### TaskService.reassignAllTasks() — Transaction

| ID  | Scénario                     | Données      | Résultat attendu         |
| --- | ---------------------------- | ------------ | ------------------------ |
| U10 | Réassignation valide         | from=1, to=2 | count tâches transférées |
| U11 | Utilisateur cible inexistant | to=999       | Erreur + rollback        |
| U12 | Aucune tâche à transférer    | from=999     | Erreur + rollback        |

### TaskService.getTasksByUser()

| ID  | Scénario                   | Données entrée          | Résultat attendu                          |
| --- | -------------------------- | ----------------------- | ----------------------------------------- |
| U13 | Retour paginé              | userId=42, page=1       | `{ tasks: [...], total: N }`, filtre userId appliqué |
| U14 | Limite max 100             | limit=9999              | Requête passée avec `limit: 100`          |

### TaskService.updateTask() — Transitions de statut

| ID  | Scénario                        | Transition              | Résultat attendu                    |
| --- | ------------------------------- | ----------------------- | ----------------------------------- |
| U15 | todo → in_progress              | statut: "in_progress"   | Acceptée                            |
| U16 | in_progress → done              | statut: "done"          | Acceptée                            |
| U17 | in_progress → todo              | statut: "todo"          | Acceptée                            |
| U18 | done → archived                 | statut: "archived"      | Acceptée                            |
| U19 | todo → done (invalide)          | statut: "done"          | Erreur "Transition de statut invalide" |

### TaskService.updateTask() — Horodatage automatique

| ID  | Scénario                           | Transition            | Résultat attendu                            |
| --- | ---------------------------------- | --------------------- | ------------------------------------------- |
| U20 | Passage en in_progress             | todo → in_progress    | `startedAt` défini avec la date courante    |
| U21 | Passage en done                    | in_progress → done    | `completedAt` défini avec la date courante  |
| U22 | Retour en todo                     | in_progress → todo    | `startedAt` et `completedAt` remis à null   |

### TaskService.updateTask() — Whitelist des champs

| ID  | Scénario                              | Données entrée                         | Résultat attendu                              |
| --- | ------------------------------------- | -------------------------------------- | --------------------------------------------- |
| U23 | Champ `userId` ignoré                 | `{ title: "ok", userId: 999 }`         | `userId` absent de l'appel à `task.update()` |
| U24 | Champ `createdAt` ignoré              | `{ title: "ok", createdAt: new Date }` | `createdAt` absent de l'appel à `task.update()` |
| U25 | Champs autorisés passés intégralement | `{ title, description, priority, dueDate }` | Tous présents dans `task.update()` |

## 3. Tests d'intégration

### Authentification

| ID  | Route                | Méthode | Scénario                                     | Résultat attendu                    |
| --- | -------------------- | ------- | -------------------------------------------- | ----------------------------------- |
| I01 | /api/auth/register   | POST    | Données valides (prénom, nom, email, mdp)    | 201 + `{ id, email }`               |
| I02 | /api/auth/register   | POST    | Prénom absent                                | 400 "Prénom requis"                 |
| I03 | /api/auth/register   | POST    | Nom absent                                   | 400 "Nom requis"                    |
| I04 | /api/auth/register   | POST    | Email déjà utilisé                           | 409 "Email déjà utilisé"            |
| I05 | /api/auth/login      | POST    | Identifiants valides                         | 200 + cookie `auth_token` posé      |
| I06 | /api/auth/login      | POST    | Mauvais mot de passe                         | 401 "Identifiants invalides"        |
| I07 | /api/auth/me         | GET     | Token valide                                 | 200 + profil courant                |
| I08 | /api/auth/me         | GET     | Token absent                                 | 401 Unauthorized                    |
| I09 | /api/auth/me         | PUT     | Prénom et nom valides                        | 200 + profil mis à jour             |
| I10 | /api/auth/me         | PUT     | Prénom absent                                | 400 "Prénom requis"                 |
| I11 | /api/auth/me         | DELETE  | Token valide                                 | 204 + compte supprimé (RGPD)        |
| I12 | /api/auth/me         | DELETE  | Token absent                                 | 401 Unauthorized                    |

### Tâches

| ID  | Route                    | Méthode | Scénario                            | Résultat attendu                    |
| --- | ------------------------ | ------- | ----------------------------------- | ----------------------------------- |
| I13 | /api/tasks               | POST    | Token valide, données valides       | 201 + tâche créée                   |
| I14 | /api/tasks               | POST    | Token absent                        | 401 Unauthorized                    |
| I15 | /api/tasks               | POST    | Titre vide                          | 400 Bad Request                     |
| I16 | /api/tasks               | GET     | Token valide                        | 200 + liste tâches paginée          |
| I17 | /api/tasks?priority=high | GET     | Token valide                        | 200 + filtre priorité appliqué      |
| I18 | /api/tasks/:id           | GET     | Token autre user (IDOR)             | 404                                 |

### Projets

| ID  | Route             | Méthode | Scénario                            | Résultat attendu                              |
| --- | ----------------- | ------- | ----------------------------------- | --------------------------------------------- |
| I19 | /api/projects     | POST    | Token valide, nom valide            | 201 + projet créé                             |
| I20 | /api/projects     | POST    | Token absent                        | 401 Unauthorized                              |
| I21 | /api/projects     | POST    | Nom vide                            | 400 Bad Request                               |
| I22 | /api/projects     | GET     | Token valide                        | 200 + liste projets avec `taskCounts`         |
| I23 | /api/projects/:id | DELETE  | Token valide, propriétaire          | 204 + projet supprimé                         |
| I24 | /api/projects/:id | DELETE  | Token autre user (IDOR)             | 404                                           |

> Tests couverts par `backend/tests/integration/projects.test.js`

### Versions

| ID  | Route               | Méthode | Scénario                            | Résultat attendu                              |
| --- | ------------------- | ------- | ----------------------------------- | --------------------------------------------- |
| I25 | /api/versions       | POST    | Token valide                        | 201 + version créée                           |
| I26 | /api/versions       | POST    | Token absent                        | 401 Unauthorized                              |
| I27 | /api/versions       | GET     | Token valide                        | 200 + liste versions (cache Redis ou PG)      |
| I28 | /api/versions/:id   | DELETE  | Token autre user (IDOR)             | 404                                           |

### Santé

| ID  | Route   | Méthode | Scénario | Résultat attendu          |
| --- | ------- | ------- | -------- | ------------------------- |
| I29 | /health | GET     | —        | 200 `{ status: "ok", ... }` |

## 4. Tests de sécurité (CP 9.3)

| ID  | Test                       | Entrée                             | Attendu                          |
| --- | -------------------------- | ---------------------------------- | -------------------------------- |
| S01 | Injection SQL               | title: "'; DROP TABLE tasks; --"   | 201 sans exécution SQL           |
| S02 | XSS stocké                  | title: "<script>alert(1)</script>" | Encodé via `textContent`, non exécuté |
| S03 | IDOR tâche                  | GET /api/tasks/1 avec token user 2 | 404                              |
| S04 | IDOR projet (suppression)   | DELETE /api/projects/1 autre user  | 404                              |
| S05 | Brute force login           | 6 tentatives en 15 min             | 429 Too Many Requests            |
| S06 | JWT expiré                  | Token expiré                       | 401                              |
| S07 | JWT modifié                 | Signature altérée                  | 401                              |
| S08 | Cookie absent               | Requête sans cookie                | 401 "Token manquant"             |
| S09 | Headers logs               | Vérifier les logs serveur          | Aucun header `cookie` ni body d'auth dans les logs |

## 5. Tests de charge (CP 9.3)

Note : les tests de charge k6 sont fournis dans ce dépôt sous `backend/tests/load/`.
Les tests E2E n'ont pas été retenus dans cette version, afin d'éviter les coûts et l'infrastructure supplémentaires. Pour lancer localement :

```bash
# k6 (load) - exemple heavy (100 VU, 30s)
Get-Content backend/tests/load/heavy.js | docker run --rm -i --network taskmaster_default -e BASE_URL=http://taskmaster-api:3000 grafana/k6 run -
```

Outil : k6

```javascript
// Scénario k6 : 100 utilisateurs virtuels pendant 30 secondes
export const options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95) < 500'], // 95% sous 500ms
    http_req_failed: ['rate < 0.01'], // Moins de 1% d'erreurs
  },
};
```

| Métrique             | Seuil acceptable |
| -------------------- | ---------------- |
| Temps de réponse P95 | < 500 ms         |
| Taux d'erreur        | < 1%             |
| Requêtes/seconde     | > 50             |

## 6. Compte rendu de tests

Date d'exécution : 2026-06-20
Exécuteur : Maël Hetzel
Version testée : v1.0.0

| Catégorie   | Total | Passés | Échoués | Couverture |
| ----------- | ----- | ------ | ------- | ---------- |
| Unitaires   | 25    | 25     | 0       | 85%        |
| Intégration | 43    | 43     | 0       | —          |
| Sécurité    | 6     | 6      | 0       | —          |
| Charge      | 3     | 3      | 0       | —          |
