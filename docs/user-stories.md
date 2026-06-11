# User Stories — TaskMaster

## Format

Chaque user story suit le format :
**En tant que** [rôle], **je veux** [action] **afin de** [bénéfice].

## Epic 1 : Authentification

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US01 | En tant qu'utilisateur, je veux créer un compte afin d'accéder à l'application | Haute | Prénom, nom, email et mot de passe requis ; email unique ; mot de passe 8+ car, 1 maj, 1 min, 1 chiffre ; hash bcrypt |
| US02 | En tant qu'utilisateur, je veux me connecter afin de retrouver mes tâches | Haute | Cookie httpOnly `auth_token` posé, valide 24h, session enregistrée dans Redis |
| US03 | En tant qu'utilisateur, je veux me déconnecter afin de sécuriser mon poste | Haute | Cookie supprimé côté client et session révoquée dans Redis |
| US04 | En tant qu'utilisateur, je veux modifier mon prénom et mon nom afin de maintenir mon profil à jour | Haute | Prénom et nom requis, validés côté serveur (express-validator), erreur 400 si manquant |

## Epic 2 : Gestion des tâches (CRUD)

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US05 | En tant qu'utilisateur, je veux créer une tâche afin d'organiser mon travail | Haute | Titre obligatoire (1–255 car), priorité par défaut "medium", transitions de statut validées côté serveur |
| US06 | En tant qu'utilisateur, je veux voir la liste de mes tâches afin de suivre mon avancement | Haute | Pagination 20/page, filtre par statut/priorité/version/projet |
| US07 | En tant qu'utilisateur, je veux modifier une tâche afin de mettre à jour son statut | Haute | Seul le propriétaire peut modifier ; `started_at`/`completed_at` horodatés automatiquement |
| US08 | En tant qu'utilisateur, je veux supprimer une tâche afin de nettoyer ma liste | Moyenne | Confirmation avant suppression |
| US09 | En tant qu'utilisateur, je veux filtrer mes tâches par priorité afin de me concentrer sur l'urgent | Moyenne | Filtre "haute", "moyenne", "basse" |
| US10 | En tant qu'utilisateur, je veux associer une tâche à un projet et une version afin d'organiser mon travail | Haute | Sélecteur projet et version dans le formulaire de tâche |

## Epic 3 : Gestion des projets

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US11 | En tant qu'utilisateur, je veux créer un projet afin de regrouper mes tâches | Haute | Nom obligatoire, description optionnelle |
| US12 | En tant qu'utilisateur, je veux voir la liste de mes projets avec leur avancement afin d'avoir une vue d'ensemble | Haute | Compteurs de tâches par statut (todo/in_progress/done/archived) chargés en une seule requête SQL |
| US13 | En tant qu'utilisateur, je veux modifier un projet afin de mettre à jour son nom ou sa description | Moyenne | Seul le propriétaire peut modifier |
| US14 | En tant qu'utilisateur, je veux supprimer un projet afin de nettoyer mes projets terminés | Moyenne | Suppression en cascade des tâches associées, 204 retourné |

## Epic 4 : Gestion des versions

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US15 | En tant qu'utilisateur, je veux créer une version (ex : v1.0, sprint 3) afin de regrouper des tâches par jalon | Haute | Nom obligatoire (1–100 car), description optionnelle |
| US16 | En tant qu'utilisateur, je veux filtrer mes tâches par version afin de suivre l'avancement d'un sprint | Haute | Sélecteur de version dans la barre de filtres |
| US17 | En tant qu'utilisateur, je veux supprimer une version afin de nettoyer les jalons terminés | Moyenne | Les tâches liées perdent leur version (SET NULL) sans être supprimées |

## Epic 5 : Vues et visualisation

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US18 | En tant qu'utilisateur, je veux basculer en vue kanban afin de visualiser l'avancement par colonne | Haute | 3 colonnes (À faire / En cours / Terminé), drag & drop pour changer le statut |
| US19 | En tant qu'utilisateur, je veux consulter une vue synthèse afin d'analyser la production sur une période | Moyenne | Sélection de dates, compteurs animés, temps moyen de complétion, répartition par priorité |
| US20 | En tant qu'utilisateur, je veux naviguer entre mes projets afin de filtrer les tâches affichées | Haute | Breadcrumb projet, bouton retour à la liste des projets |

## Epic 6 : Sécurité

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US21 | En tant qu'admin, je veux que les mots de passe soient hachés afin de protéger les utilisateurs | Haute | bcrypt 12 rounds, jamais stocké en clair |
| US22 | En tant qu'utilisateur, je veux que seules MES tâches et MES projets soient visibles afin de protéger ma vie privée | Haute | Filtre `userId` sur chaque requête (protection IDOR) ; suppression de projet vérifie la propriété |
| US23 | En tant qu'admin, je veux un rate limiting afin de protéger contre les attaques brute-force | Haute | 100 req/15min global par IP ; 5 req/15min sur `/api/auth/login` |
| US24 | En tant qu'admin, je veux que les logs n'exposent pas les tokens afin de protéger les sessions | Haute | Aucun header `cookie` ni corps de requête d'authentification dans les logs |

## Epic 7 : Accessibilité

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US25 | En tant qu'utilisateur malvoyant, je veux naviguer au clavier afin d'utiliser l'application | Haute | Tab, Escape, Enter fonctionnels sur tous les modaux et formulaires |
| US26 | En tant qu'utilisateur de lecteur d'écran, je veux des labels sur les champs afin de comprendre les formulaires | Haute | Tous les inputs ont un label lié ; zones dynamiques avec `aria-live` |
