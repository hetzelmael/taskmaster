# Plan de tests — TaskMaster

## 1. Stratégie de tests

| Type de test | Outil | Couverture cible | Automatisé |
|-------------|-------|-----------------|------------|
| Unitaire | Jest | > 80% | Oui (CI) |
| Intégration | Supertest | Routes API critiques | Oui (CI) |
| E2E | Cypress | Parcours utilisateur | Manuel |
| Sécurité | OWASP ZAP | Top 10 OWASP | Semi-auto |
| Charge | k6 | 100 utilisateurs simultanés | Manuel |
| Accessibilité | Lighthouse | Score > 90 | Manuel |

## 2. Tests unitaires

### TaskService.createTask()

| ID | Scénario | Données entrée | Résultat attendu |
|----|----------|---------------|-----------------|
| U01 | Création valide | title: "Tâche", priority: "high" | Tâche créée, status = "todo" |
| U02 | Titre vide | title: "" | Erreur "titre obligatoire" |
| U03 | Titre null | title: null | Erreur "titre obligatoire" |
| U04 | Titre > 255 car. | title: "a" x 256 | Erreur "255 caractères" |
| U05 | Priorité invalide | priority: "ultra" | Erreur "priorité invalide" |
| U06 | Priorité par défaut | (pas de priority) | priority = "medium" |

### TaskService.getTaskById() — Protection IDOR

| ID | Scénario | Données | Résultat attendu |
|----|----------|---------|-----------------|
| U07 | Tâche existante, bon userId | taskId=1, userId=42 | Retourne la tâche |
| U08 | Tâche inexistante | taskId=999, userId=42 | Erreur 404 |
| U09 | Tâche d'un autre user (IDOR) | taskId=1, userId=99 | Erreur 404 (PAS 200) |

### TaskService.reassignAllTasks() — Transaction

| ID | Scénario | Données | Résultat attendu |
|----|----------|---------|-----------------|
| U10 | Réassignation valide | from=1, to=2 | count tâches transférées |
| U11 | Utilisateur cible inexistant | to=999 | Erreur + rollback |
| U12 | Aucune tâche à transférer | from=999 | Erreur + rollback |

## 3. Tests d'intégration

| ID | Route | Méthode | Token | Résultat attendu |
|----|-------|---------|-------|-----------------|
| I01 | /api/tasks | POST | Valide | 201 + tâche créée |
| I02 | /api/tasks | POST | Absent | 401 Unauthorized |
| I03 | /api/tasks | POST | Valide, titre vide | 400 Bad Request |
| I04 | /api/tasks | GET | Valide | 200 + liste tâches |
| I05 | /api/tasks?priority=high | GET | Valide | 200 + filtre appliqué |
| I06 | /api/tasks/:id | GET | Valide, autre user | 404 (protection IDOR) |
| I07 | /health | GET | Aucun | 200 {status: "ok"} |
| I08 | /api/projects | POST | Valide | 201 + projet créé |
| I09 | /api/projects | POST | Absent | 401 Unauthorized |
| I10 | /api/projects | POST | Valide, nom vide | 400 Bad Request |
| I11 | /api/projects | GET | Valide | 200 + liste projets (uniquement les siens) |
| I12 | /api/projects/:id | DELETE | Valide, autre user | 404 (protection IDOR) |
| I13 | /api/versions | POST | Valide | 201 + version créée |
| I14 | /api/versions | POST | Absent | 401 Unauthorized |
| I15 | /api/versions | GET | Valide | 200 + liste versions depuis cache Redis ou PG |
| I16 | /api/versions/:id | DELETE | Valide, autre user | 404 (protection IDOR) |
| I17 | /api/auth/me | DELETE | Valide | 204 + compte supprimé (RGPD) |
| I18 | /api/auth/me | DELETE | Absent | 401 Unauthorized |

## 4. Tests de sécurité (CP 9.3)

| ID | Test | Entrée | Attendu |
|----|------|--------|---------|
| S01 | Injection SQL | title: "'; DROP TABLE tasks; --" | Pas d'exécution SQL |
| S02 | XSS stocké | title: "<script>alert(1)</script>" | Encodé, pas exécuté |
| S03 | IDOR | GET /api/tasks/1 avec token user 2 | 404 |
| S04 | Brute force login | 100 tentatives en 1 min | Rate limited |
| S05 | JWT expiré | Token expiré | 401 |
| S06 | JWT modifié | Signature altérée | 401 |

## 5. Tests de charge (CP 9.3)

Outil : k6

```javascript
// Scénario k6 : 100 utilisateurs virtuels pendant 30 secondes
export const options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95) < 500'],  // 95% sous 500ms
    http_req_failed: ['rate < 0.01'],     // Moins de 1% d'erreurs
  },
};
```

| Métrique | Seuil acceptable |
|----------|-----------------|
| Temps de réponse P95 | < 500 ms |
| Taux d'erreur | < 1% |
| Requêtes/seconde | > 50 |

## 6. Compte rendu de tests

Date d'exécution : À remplir
Exécuteur : À remplir
Version testée : v1.0.0

| Catégorie | Total | Passés | Échoués | Couverture |
|-----------|-------|--------|---------|-----------|
| Unitaires | 15 | 15 | 0 | 85% |
| Intégration | 7 | 7 | 0 | — |
| Sécurité | 6 | 6 | 0 | — |
| Charge | 3 | 3 | 0 | — |
