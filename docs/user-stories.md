# User Stories — TaskMaster

## Format

Chaque user story suit le format :
**En tant que** [rôle], **je veux** [action] **afin de** [bénéfice].

## Epic 1 : Authentification

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US01 | En tant qu'utilisateur, je veux créer un compte afin d'accéder à l'application | Haute | Email unique, mot de passe 8+ car, hash bcrypt |
| US02 | En tant qu'utilisateur, je veux me connecter afin de retrouver mes tâches | Haute | JWT retourné, valide 24h |
| US03 | En tant qu'utilisateur, je veux me déconnecter afin de sécuriser mon poste | Haute | Token supprimé côté client |

## Epic 2 : Gestion des tâches (CRUD)

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US04 | En tant qu'utilisateur, je veux créer une tâche afin d'organiser mon travail | Haute | Titre obligatoire, priorité par défaut "medium" |
| US05 | En tant qu'utilisateur, je veux voir la liste de mes tâches afin de suivre mon avancement | Haute | Pagination, filtre par statut/priorité/version/projet |
| US06 | En tant qu'utilisateur, je veux modifier une tâche afin de mettre à jour son statut | Haute | Seul le propriétaire peut modifier |
| US07 | En tant qu'utilisateur, je veux supprimer une tâche afin de nettoyer ma liste | Moyenne | Confirmation avant suppression |
| US08 | En tant qu'utilisateur, je veux filtrer mes tâches par priorité afin de me concentrer sur l'urgent | Moyenne | Filtre "haute", "moyenne", "basse" |
| US09 | En tant qu'utilisateur, je veux associer une tâche à un projet et une version afin d'organiser mon travail | Haute | Sélecteur projet et version dans le formulaire de tâche |

## Epic 3 : Gestion des projets

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US10 | En tant qu'utilisateur, je veux créer un projet afin de regrouper mes tâches | Haute | Nom obligatoire, description optionnelle |
| US11 | En tant qu'utilisateur, je veux voir la liste de mes projets avec leur avancement afin d'avoir une vue d'ensemble | Haute | Affichage du nombre de tâches par statut (todo/in_progress/done) |
| US12 | En tant qu'utilisateur, je veux modifier un projet afin de mettre à jour son nom ou sa description | Moyenne | Seul le propriétaire peut modifier |
| US13 | En tant qu'utilisateur, je veux supprimer un projet afin de nettoyer mes projets terminés | Moyenne | Suppression en cascade des tâches associées |

## Epic 4 : Gestion des versions

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US14 | En tant qu'utilisateur, je veux créer une version (ex : v1.0, sprint 3) afin de regrouper des tâches par jalon | Haute | Nom obligatoire (1–100 car), description optionnelle |
| US15 | En tant qu'utilisateur, je veux filtrer mes tâches par version afin de suivre l'avancement d'un sprint | Haute | Sélecteur de version dans la barre de filtres |
| US16 | En tant qu'utilisateur, je veux supprimer une version afin de nettoyer les jalons terminés | Moyenne | Les tâches liées perdent leur version (SET NULL) sans être supprimées |

## Epic 5 : Vues et visualisation

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US17 | En tant qu'utilisateur, je veux basculer en vue kanban afin de visualiser l'avancement par colonne | Haute | 3 colonnes (À faire / En cours / Terminé), drag & drop pour changer le statut |
| US18 | En tant qu'utilisateur, je veux consulter une vue synthèse afin d'analyser la production sur une période | Moyenne | Sélection de dates, compteurs animés, temps moyen de complétion |
| US19 | En tant qu'utilisateur, je veux naviguer entre mes projets afin de filtrer les tâches affichées | Haute | Breadcrumb projet, bouton retour à la liste des projets |

## Epic 6 : Sécurité

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US20 | En tant qu'admin, je veux que les mots de passe soient hachés afin de protéger les utilisateurs | Haute | bcrypt 12 rounds, jamais en clair |
| US21 | En tant qu'utilisateur, je veux que seules MES tâches et MES projets soient visibles afin de protéger ma vie privée | Haute | Filtre userId sur chaque requête (protection IDOR) |
| US22 | En tant qu'admin, je veux un rate limiting afin de protéger contre les attaques DDoS | Haute | 100 requêtes/15min par IP |

## Epic 7 : Accessibilité

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US23 | En tant qu'utilisateur malvoyant, je veux naviguer au clavier afin d'utiliser l'application | Haute | Tab, Escape, Enter fonctionnels |
| US24 | En tant qu'utilisateur de lecteur d'écran, je veux des labels sur les champs afin de comprendre les formulaires | Haute | Tous les inputs ont un label lié |
