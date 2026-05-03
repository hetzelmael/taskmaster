# Maquettes et diagrammes — TaskMaster

## Diagramme de cas d'utilisation

```
                        ┌─────────────────────────────────────────────┐
                        │              Système TaskMaster             │
                        │                                             │
                        │  ┌─────────────────┐                        │
              ┌─────┐   │  │  S'inscrire     │                        │
              │     │───┼─▶│  Se connecter   │                        │
              │     │   │  │  Se déconnecter │                        │
              │     │   │  └─────────────────┘                        │
              │     │   │                                             │
              │     │   │  ┌─────────────────┐                        │
              │     │───┼─▶│  Créer projet   │                        │
              │     │   │  │  Lister projets │                        │
              │Util.│   │  │  Modifier projet│                        │
              │     │   │  │  Supprimer proj.│                        │
              │     │   │  └─────────────────┘                        │
              │     │   │                                             │
              │     │   │  ┌─────────────────┐                        │
              │     │───┼─▶│  Créer tâche    │                        │
              │     │   │  │  Lister tâches  │                        │
              │     │   │  │  Modifier tâche │                        │
              │     │   │  │  Filtrer tâches │                        │
              │     │   │  │  Changer statut │                        │
              └─────┘   │  └─────────────────┘                        │
                        │                                             │
                        │  ┌─────────────────┐                        │
                        │  │  Créer version  │                        │
                        │  │  Lister versions│                        │
                        │  │  Supprimer vers.│                        │
                        │  └─────────────────┘                        │
                        │                                             │
                        │  ┌─────────────────┐                        │
                        │  │  Vue Liste      │                        │
                        │  │  Vue Kanban     │                        │
                        │  │  Vue Synthèse   │                        │
                        │  └─────────────────┘                        │
                        └─────────────────────────────────────────────┘
```

---

## Diagramme de séquence — Connexion et chargement des tâches

```
Navigateur          Frontend JS         API Express       PostgreSQL
    │                    │                   │                 │
    │── Saisit email/mdp ▶│                   │                 │
    │                    │── POST /auth/login▶│                 │
    │                    │                   │── SELECT user ──▶│
    │                    │                   │◀── user row ─────│
    │                    │                   │  bcrypt.compare  │
    │                    │                   │── { token, user }│
    │                    │◀── 200 { token } ──│                 │
    │                    │  stocke token      │                 │
    │                    │  sessionStorage    │                 │
    │                    │── GET /api/projects▶│                │
    │                    │   Authorization:   │── SELECT proj. ─▶│
    │                    │   Bearer <token>   │◀── rows ─────────│
    │                    │◀── 200 [projets] ──│                 │
    │◀── Affiche grille ─│                   │                 │
    │    projets         │                   │                 │
    │                    │                   │                 │
    │── Clic projet ────▶│                   │                 │
    │                    │── GET /api/tasks  ▶│                 │
    │                    │   ?projectId=X    │── SELECT tasks ─▶│
    │                    │                   │◀── rows ─────────│
    │                    │◀── 200 [tâches] ───│                 │
    │◀── Affiche liste ──│                   │                 │
```

---

## Diagramme de séquence — Changement de statut (drag & drop kanban)

```
Navigateur          Frontend JS         API Express       PostgreSQL
    │                    │                   │                 │
    │── Drag carte ─────▶│                   │                 │
    │   vers colonne     │  vérifie règle    │                 │
    │   "En cours"       │  canMoveTo()      │                 │
    │                    │── PUT /api/tasks/:id▶               │
    │                    │   { status:       │── UPDATE tasks ─▶│
    │                    │     'in_progress' }│  SET started_at │
    │                    │                   │◀── task mis à j.─│
    │                    │◀── 200 { task } ───│                 │
    │◀── Carte déplacée ─│                   │                 │
    │    horodatage affi.│                   │                 │
```

---

## Wireframes des écrans principaux

### Écran 1 — Page de connexion

```
┌─────────────────────────────────────────────────────┐
│ [TaskMaster]                                        │  ← Header nav
├─────────────────────────────────────────────────────┤
│                                                     │
│           ┌──────────────────────────┐              │
│           │         Connexion        │              │
│           ├──────────────────────────┤              │
│           │ Email                    │              │
│           │ [________________________]              │
│           │                          │              │
│           │ Mot de passe             │              │
│           │ [________________________]              │
│           │                          │              │
│           │  ⚠ Message d'erreur      │  ← aria-live │
│           │                          │              │
│           │  [   Se connecter    ]   │              │
│           │                          │              │
│           │  Pas de compte ?         │              │
│           │  [Créer un compte]       │              │
│           └──────────────────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Écran 2 — Grille des projets

```
┌─────────────────────────────────────────────────────┐
│ [TaskMaster]              Maël ▾  [Profil] [Déco.]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Mes projets                    [+ Nouveau projet]  │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐  │
│  │ 📁 Site web  │ │ 📁 API v2    │ │ 📁 Mobile   │  │
│  │              │ │              │ │             │  │
│  │ ● 3 à faire  │ │ ● 5 à faire  │ │ ● 1 à faire │  │
│  │ ▶ 1 en cours │ │ ▶ 2 en cours │ │ ▶ 0 en cours│  │
│  │ ✓ 8 terminés │ │ ✓ 3 terminés │ │ ✓ 2 terminés│  │
│  │              │ │              │ │             │  │
│  │  [Ouvrir]   │ │  [Ouvrir]   │ │  [Ouvrir]  │  │
│  └──────────────┘ └──────────────┘ └─────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Écran 3 — Vue liste des tâches

```
┌─────────────────────────────────────────────────────┐
│ [TaskMaster]              Maël ▾  [Profil] [Déco.]  │
├─────────────────────────────────────────────────────┤
│  ← Projets  /  Site web                             │  ← Breadcrumb
├─────────────────────────────────────────────────────┤
│  Mes tâches    [☰ Liste] [▦ Kanban] [▤ Synthèse]    │
│                [🏷 Versions]        [+ Nouvelle]    │
├─────────────────────────────────────────────────────┤
│  Statut [Tous ▾]  Priorité [Toutes ▾]  Version [▾] │  ← Filtres
├─────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔴 Corriger le bug login          [En cours]   │ │
│  │    Haute priorité · v1.2 · Échéance 05/05      │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 🟡 Rédiger la doc API             [À faire]    │ │
│  │    Moyenne priorité · v1.2                     │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 🟢 Setup Docker                   [Terminé ✓] │ │
│  │    Haute priorité · v1.0 · 2j 4h              │ │
│  └────────────────────────────────────────────────┘ │
│                          Page 1/3  [◀] [▶]          │
└─────────────────────────────────────────────────────┘
```

### Écran 4 — Vue Kanban

```
┌─────────────────────────────────────────────────────┐
│  Mes tâches    [☰ Liste] [▦ Kanban] [▤ Synthèse]    │
├────────────────┬────────────────┬───────────────────┤
│  À faire  (3)  │  En cours  (1) │  Terminé  (8)     │
├────────────────┼────────────────┼───────────────────┤
│ ┌────────────┐ │ ┌────────────┐ │ ┌───────────────┐ │
│ │ Rédiger    │ │ │ Corriger   │ │ │ Setup Docker  │ │
│ │ la doc API │ │ │ bug login  │ │ │ ✓ 2j 4h       │ │
│ │ 🟡 Moyenne │ │ │ 🔴 Haute   │ │ └───────────────┘ │
│ └────────────┘ │ └────────────┘ │                   │
│ ┌────────────┐ │                │ ┌───────────────┐ │
│ │ Créer tests│ │   ← drag & ─  │ │ Init projet   │ │
│ │ unitaires  │ │     drop →    │ │ ✓ 4h          │ │
│ │ 🟡 Moyenne │ │                │ └───────────────┘ │
│ └────────────┘ │                │                   │
└────────────────┴────────────────┴───────────────────┘
```

### Écran 5 — Vue Synthèse

```
┌─────────────────────────────────────────────────────┐
│  Mes tâches    [☰ Liste] [▦ Kanban] [▤ Synthèse]    │
├─────────────────────────────────────────────────────┤
│  Période : Du [01/04/2025] au [30/04/2025]          │
│  Version  : [Toutes ▾]                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│   │    12    │  │    3     │  │    1j 6h         │ │
│   │ terminées│  │ en cours │  │ temps moyen      │ │
│   └──────────┘  └──────────┘  └──────────────────┘ │
│         ↑ compteurs animés (requestAnimationFrame)  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Tâche              Démarré      Terminé  Durée│  │
│  ├──────────────────────────────────────────────┤   │
│  │ Setup Docker       01/04 09h   03/04 13h  2j │  │
│  │ Init projet        04/04 10h   04/04 14h  4h │  │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```
