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
| US05 | En tant qu'utilisateur, je veux voir la liste de mes tâches afin de suivre mon avancement | Haute | Pagination, filtre par statut/priorité |
| US06 | En tant qu'utilisateur, je veux modifier une tâche afin de mettre à jour son statut | Haute | Seul le propriétaire peut modifier |
| US07 | En tant qu'utilisateur, je veux supprimer une tâche afin de nettoyer ma liste | Moyenne | Confirmation avant suppression |
| US08 | En tant qu'utilisateur, je veux filtrer mes tâches par priorité afin de me concentrer sur l'urgent | Moyenne | Filtre "haute", "moyenne", "basse" |

## Epic 3 : Sécurité

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US09 | En tant qu'admin, je veux que les mots de passe soient hachés afin de protéger les utilisateurs | Haute | bcrypt 12 rounds, jamais en clair |
| US10 | En tant qu'utilisateur, je veux que seules MES tâches soient visibles afin de protéger ma vie privée | Haute | Filtre userId sur chaque requête |
| US11 | En tant qu'admin, je veux un rate limiting afin de protéger contre les attaques DDoS | Haute | 100 requêtes/15min par IP |

## Epic 4 : Accessibilité

| ID | User Story | Priorité | Critères d'acceptation |
|----|-----------|----------|----------------------|
| US12 | En tant qu'utilisateur malvoyant, je veux naviguer au clavier afin d'utiliser l'application | Haute | Tab, Escape, Enter fonctionnels |
| US13 | En tant qu'utilisateur de lecteur d'écran, je veux des labels sur les champs afin de comprendre les formulaires | Haute | Tous les inputs ont un label lié |
