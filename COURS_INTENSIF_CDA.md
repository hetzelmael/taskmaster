# Cours intensif CDA — TaskMaster

> Application fil rouge couvrant les 38 sous-thèmes du REAC CDA.
> Stack : **Node.js / Express / PostgreSQL / Redis / Docker / GitHub Actions**.
> Adapté à votre profil : 16 sous-thèmes maîtrisés, 5 partiels, 18 à apprendre.

---

## Comment utiliser ce cours

- **Sections [À APPRENDRE]** : cours détaillé + code dans TaskMaster + mini-exercice + 2 questions de vérification
- **Sections [À RÉVISER]** : rappel ciblé + question de vérification
- **Sections [MAÎTRISÉ]** : check-list de vérification + code déjà rédigé pour vous
- Toutes les réponses des vérifications sont en fin de chaque section (cliquez/déroulez)

## Application TaskMaster — vue d'ensemble

TaskMaster est une mini-app de gestion de tâches collaborative. Elle expose une API REST sécurisée, stocke en PostgreSQL, utilise Redis pour le cache de sessions, possède un frontend HTML/JS, et se déploie via Docker Compose et GitHub Actions.

```
taskmaster/
├── backend/
│   ├── src/
│   │   ├── config/         (DB, env)
│   │   ├── controllers/    (routes handlers)
│   │   ├── middleware/     (auth, validation)
│   │   ├── models/         (Sequelize models)
│   │   ├── routes/         (Express routes)
│   │   ├── services/       (logique métier)
│   │   ├── tests/          (Jest tests)
│   │   └── app.js          (entry point)
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

---

# AT1 — Développer une application sécurisée

## CP1.1 — IDE et outils de dev [MAÎTRISÉ — 75%]

### Vérification rapide
- [ ] J'ai VS Code installé avec au moins ESLint, Prettier, GitLens
- [ ] Je sais ouvrir un terminal intégré et lancer `npm install`, `npm run`
- [ ] Je connais 5 raccourcis (Ctrl+P, Ctrl+Shift+P, Ctrl+/, F2 rename, F12 go to definition)

### Pré-rempli pour vous : `package.json` du backend
```json
{
  "name": "taskmaster-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest --coverage",
    "lint": "eslint src/"
  },
  "dependencies": {
    "express": "^4.19.2",
    "sequelize": "^6.37.3",
    "pg": "^8.12.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "redis": "^4.6.15",
    "dotenv": "^16.4.5",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "nodemon": "^3.1.4",
    "eslint": "^9.7.0"
  }
}
```

**Question** : Que fait `nodemon` et pourquoi est-il en `devDependencies` plutôt que `dependencies` ?

<details><summary>Réponse</summary>
Nodemon redémarre automatiquement le serveur quand on modifie un fichier. Il est en devDependencies car il n'est utilisé qu'en développement local — en production on lance directement node.
</details>

---

## CP1.2 — Gestion de versions Git [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je sais initialiser un repo, faire des commits, push, pull
- [ ] Je sais créer une branche, fusionner, gérer un conflit
- [ ] Je connais `git stash`, `git rebase`, `git revert`

### Convention de commits dans TaskMaster
On utilise **Conventional Commits** :
- `feat:` nouvelle fonctionnalité
- `fix:` correction bug
- `docs:` documentation
- `test:` ajout de tests
- `refactor:` refactoring sans changement fonctionnel
- `chore:` configuration, build

**Question** : Différence entre `git merge` et `git rebase` ?

<details><summary>Réponse</summary>
Merge crée un commit de fusion qui garde l'historique des deux branches. Rebase rejoue les commits de votre branche par-dessus la branche cible — l'historique devient linéaire mais on réécrit les commits (donc jamais sur une branche partagée).
</details>

---

## CP1.3 — Conteneurisation Docker [À APPRENDRE — 25%]

### Cours (15 min)

**Le problème que Docker résout** : "Ça marche sur ma machine !" Sans Docker, votre app dépend de la version de Node sur votre PC, des bibliothèques système, etc. En production, c'est différent → ça plante. Avec Docker, vous emballez l'app + tout son environnement dans une image, et cette image fonctionne partout pareil.

**Concepts clés** :
- **Image** : modèle figé qui contient OS + app + dépendances. Comme une classe en POO.
- **Conteneur** : instance d'image qui tourne. Comme un objet en POO.
- **Dockerfile** : recette pour construire une image
- **Docker Compose** : orchestrateur pour lancer plusieurs conteneurs liés (app + base de données + cache)
- **Volume** : stockage persistant (les conteneurs sont éphémères par défaut)
- **Network** : réseau virtuel pour que les conteneurs communiquent

**Cycle de vie** :
1. Écrire un `Dockerfile`
2. `docker build -t taskmaster .` → crée l'image
3. `docker run taskmaster` → lance un conteneur
4. `docker ps` → liste les conteneurs en cours
5. `docker stop <id>` → arrête

### Code dans TaskMaster : `backend/Dockerfile`

```dockerfile
# Image de base : Node 20 minimal
FROM node:20-alpine

# Dossier de travail dans le conteneur
WORKDIR /app

# Copier d'abord package.json pour profiter du cache Docker
COPY package*.json ./
RUN npm ci --only=production

# Copier le reste du code
COPY src ./src

# Port exposé
EXPOSE 3000

# Utilisateur non-root (sécurité)
USER node

# Commande de lancement
CMD ["node", "src/app.js"]
```

### Mini-exercice (30 min)

1. Créez un fichier `Dockerfile` dans un dossier vide avec une simple app Node
2. Build : `docker build -t mon-app .`
3. Run : `docker run -p 3000:3000 mon-app`
4. Vérifiez que `curl http://localhost:3000` répond

### Vérification

**Q1** : Pourquoi copie-t-on `package.json` AVANT le code source dans le Dockerfile ?

<details><summary>Réponse</summary>
Docker met en cache chaque étape (layer). Si on ne change que le code, npm install ne sera pas relancé car la layer "COPY package.json + RUN npm ci" n'a pas changé. Sans cette astuce, chaque modif de code force un nouveau npm install (lent).
</details>

**Q2** : Quelle est la différence entre `EXPOSE 3000` dans le Dockerfile et `-p 3000:3000` au `docker run` ?

<details><summary>Réponse</summary>
EXPOSE est purement documentaire — il dit "ce conteneur écoute sur le port 3000". Le `-p` fait le mapping réel : port 3000 de votre machine hôte → port 3000 du conteneur. Sans -p, le port n'est pas accessible depuis l'extérieur.
</details>

---

## CP2.1 — HTML/CSS responsive [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je connais les balises sémantiques : `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- [ ] Je maîtrise Flexbox et CSS Grid
- [ ] Je sais utiliser les media queries (`@media (max-width: 768px)`)

### Pré-rempli : `frontend/index.html` + `frontend/style.css`

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskMaster — Mes tâches</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>TaskMaster</h1>
    <nav><button id="logout">Déconnexion</button></nav>
  </header>
  <main>
    <section aria-label="Nouvelle tâche">
      <form id="task-form">
        <label for="title">Titre</label>
        <input id="title" name="title" type="text" required>
        <button type="submit">Ajouter</button>
      </form>
    </section>
    <section aria-label="Liste des tâches">
      <ul id="task-list"></ul>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>
```

```css
:root { --primary: #3266ad; --bg: #f7f7f5; --text: #1a1a1a; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }
header { display: flex; justify-content: space-between; padding: 1rem 2rem; background: white; border-bottom: 1px solid #ddd; }
main { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
section { background: white; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px; }
form { display: grid; gap: 0.5rem; }
input, button { padding: 0.6rem; font-size: 1rem; border-radius: 4px; border: 1px solid #ccc; }
button { background: var(--primary); color: white; cursor: pointer; border: none; }
@media (max-width: 600px) { main { padding: 0 0.5rem; } }
```

**Question** : Quelle balise sémantique pour la liste de tâches : `<section>` ou `<aside>` ?

<details><summary>Réponse</summary>
`<section>` car c'est du contenu principal de la page. `<aside>` est pour du contenu connexe/secondaire (encart, pub, navigation latérale).
</details>

---

## CP2.2 — JavaScript & DOM [À RÉVISER — 50%]

### Rappel ciblé (10 min)

**Sélectionner et manipuler le DOM** :
```js
const form = document.querySelector('#task-form');     // un élément
const items = document.querySelectorAll('.task');      // tous (NodeList)
form.addEventListener('submit', handler);              // écouteur d'événement
element.classList.add('done');                          // CSS classes
element.textContent = 'Hello';                          // texte (sécurisé)
element.innerHTML = '<b>x</b>';                         // HTML (DANGEREUX, voir CP2.4)
```

**Async/await + fetch** :
```js
async function getTasks() {
  try {
    const res = await fetch('/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Échec:', err);
    return [];
  }
}
```

**Modules ES6** : `export` / `import`. Dans le navigateur : `<script type="module" src="app.js">`.

### Code dans TaskMaster : `frontend/app.js`

```js
const API = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

const form = document.querySelector('#task-form');
const list = document.querySelector('#task-list');

async function loadTasks() {
  const res = await fetch(`${API}/tasks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const tasks = await res.json();
  list.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t.title;  // textContent, pas innerHTML — voir CP2.4
    list.appendChild(li);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = form.title.value;
  await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title })
  });
  form.reset();
  loadTasks();
});

loadTasks();
```

### Vérification

**Q** : Pourquoi `e.preventDefault()` dans le handler de submit ?

<details><summary>Réponse</summary>
Sans cela, le navigateur soumet le formulaire de manière classique (rechargement de la page avec les données dans l'URL). preventDefault stoppe ce comportement et nous permet de gérer l'envoi nous-même via fetch.
</details>

---

## CP2.3 — API REST côté front [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je connais les codes HTTP : 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error
- [ ] Je sais que GET = lire, POST = créer, PUT/PATCH = modifier, DELETE = supprimer
- [ ] Je sais ajouter des headers (Authorization, Content-Type)

**Question** : Différence entre 401 et 403 ?

<details><summary>Réponse</summary>
401 Unauthorized = vous n'êtes pas authentifié (pas connecté ou token invalide).
403 Forbidden = vous êtes authentifié mais vous n'avez pas la permission d'accéder à cette ressource.
</details>

---

## CP2.4 — Sécurité front [À APPRENDRE — 25%]

### Cours (20 min)

**XSS (Cross-Site Scripting)** : un attaquant injecte du JS dans votre page via un champ de saisie. Si vous affichez le titre d'une tâche avec `innerHTML`, et que le titre est `<script>alert('hack')</script>`, le script s'exécute.

**Parade** : utiliser `textContent` au lieu de `innerHTML`. Si vous DEVEZ utiliser HTML, échapper les caractères dangereux (`<`, `>`, `&`, `"`, `'`) ou utiliser une bibliothèque comme DOMPurify.

**CSRF (Cross-Site Request Forgery)** : un attaquant vous fait visiter un site malveillant qui envoie une requête à votre app où vous êtes déjà connecté (cookies envoyés automatiquement). Il peut faire un transfert d'argent à votre nom.

**Parades** :
- Token CSRF : un jeton unique généré côté serveur, inséré dans chaque formulaire, vérifié à chaque requête
- SameSite cookie : `Set-Cookie: token=xyz; SameSite=Strict` empêche l'envoi du cookie depuis un autre site
- Utiliser des en-têtes `Authorization: Bearer <JWT>` en localStorage plutôt que des cookies (immunisé au CSRF, mais sensible au XSS)

**RGPD côté front** :
- Bandeau de consentement cookies (avant tout dépôt de cookies non essentiels)
- Mentions légales accessibles
- Politique de confidentialité claire
- Droit à l'effacement implémenté

**CSP (Content Security Policy)** : en-tête HTTP qui dit au navigateur quelles sources sont autorisées :
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
```

### Code dans TaskMaster : `frontend/app.js` sécurisé

```js
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTask(task) {
  const li = document.createElement('li');
  // OK — textContent échappe automatiquement
  li.textContent = task.title;
  // SI vraiment besoin de HTML :
  // li.innerHTML = `<b>${escapeHtml(task.title)}</b>`;
  return li;
}
```

Backend : ajout de **helmet** dans `app.js` (déjà dans package.json) :
```js
const helmet = require('helmet');
app.use(helmet());  // ajoute CSP, X-Frame-Options, etc.
```

### Mini-exercice (15 min)

1. Créez une page avec un input et un bouton "Ajouter"
2. À chaque clic, affichez le contenu de l'input dans une `<ul>`
3. Faites une version VULNÉRABLE avec `innerHTML` et tentez d'injecter `<img src=x onerror=alert(1)>`
4. Corrigez avec `textContent` et vérifiez que l'attaque ne marche plus

### Vérification

**Q1** : Vous affichez le commentaire d'un utilisateur via `element.innerHTML = comment`. Quelle vulnérabilité créez-vous ?

<details><summary>Réponse</summary>
XSS stockée. Si l'utilisateur poste un commentaire avec du JavaScript, il s'exécutera dans le navigateur de chaque visiteur qui voit le commentaire. Utiliser textContent ou échapper le HTML.
</details>

**Q2** : Que fait l'attribut `SameSite=Strict` sur un cookie ?

<details><summary>Réponse</summary>
Il empêche le cookie d'être envoyé sur les requêtes initiées depuis un autre site. C'est une protection efficace contre le CSRF.
</details>

---

## CP2.5 — Accessibilité RGAA [À APPRENDRE — 0%]

### Cours (20 min)

Le **RGAA** (Référentiel Général d'Amélioration de l'Accessibilité) est obligatoire pour les sites publics français et fortement recommandé pour le privé. Il garantit que les personnes en situation de handicap (visuel, moteur, cognitif, auditif) peuvent utiliser votre site.

**Les 4 principes WCAG** (sur lesquels le RGAA est basé) :
1. **Perceptible** : tout contenu non textuel a un équivalent textuel
2. **Utilisable** : tout est accessible au clavier
3. **Compréhensible** : labels clairs, langue déclarée
4. **Robuste** : compatible avec les technologies d'assistance

**Règles essentielles** (couvre 80% des cas) :
- `<img alt="...">` pour toutes les images informatives, `alt=""` pour décoratives
- `<label for="id">` lié à chaque champ de formulaire
- Contraste minimum 4.5:1 (texte normal) ou 3:1 (gros texte)
- Tout doit être atteignable au clavier (Tab, Shift+Tab, Entrée, Espace)
- Pas d'info véhiculée uniquement par la couleur (ajouter une icône, un texte)
- `lang="fr"` sur la balise `<html>`
- Hiérarchie de titres respectée (h1 > h2 > h3, pas de saut)
- Attributs ARIA quand nécessaire : `aria-label`, `aria-live`, `role`

**Outils de test** :
- **Lighthouse** dans Chrome DevTools → onglet Accessibility (audit gratuit)
- **axe DevTools** (extension Chrome/Firefox)
- **NVDA** (lecteur d'écran gratuit Windows)

### Code dans TaskMaster : version accessible

```html
<!-- Mauvais : pas de label, juste un placeholder -->
<input type="text" placeholder="Titre">

<!-- Bon : label explicite -->
<label for="title">Titre de la tâche</label>
<input id="title" type="text" required aria-required="true">

<!-- Pour les messages d'erreur dynamiques -->
<div id="error-zone" role="alert" aria-live="polite"></div>

<!-- Bouton avec icône uniquement : ajouter aria-label -->
<button aria-label="Supprimer la tâche">✕</button>

<!-- Liste des tâches : annonce mise à jour -->
<ul id="task-list" aria-live="polite" aria-relevant="additions removals"></ul>
```

```css
/* Style focus visible (jamais le supprimer !) */
button:focus, input:focus { outline: 2px solid #185FA5; outline-offset: 2px; }

/* Skip link pour aller au contenu principal */
.skip-link { position: absolute; left: -9999px; }
.skip-link:focus { left: 0; top: 0; padding: 1rem; background: white; z-index: 100; }
```

### Mini-exercice (20 min)

1. Ouvrez votre TaskMaster dans Chrome
2. F12 → onglet Lighthouse → cochez "Accessibility" → Run
3. Notez votre score (probablement 70-85/100)
4. Corrigez les 5 premiers problèmes signalés
5. Relancez Lighthouse, visez 100/100

### Vérification

**Q1** : Pourquoi `<input placeholder="Email">` sans `<label>` est-il un problème d'accessibilité ?

<details><summary>Réponse</summary>
Le placeholder disparaît dès qu'on commence à taper. Il n'est pas lu par tous les lecteurs d'écran. Une personne malvoyante perd alors la référence du champ. Le label reste toujours associé au champ et est annoncé par les technologies d'assistance.
</details>

**Q2** : Pour annoncer dynamiquement à un lecteur d'écran qu'une nouvelle tâche a été ajoutée, quel attribut ARIA utiliser ?

<details><summary>Réponse</summary>
`aria-live="polite"` (ou `aria-live="assertive"` pour interruption immédiate) sur le conteneur. Le lecteur d'écran annonce automatiquement les modifications du contenu. polite attend une pause, assertive interrompt.
</details>

---

## CP3.1 — POO et style défensif [MAÎTRISÉ — 75%]

### Vérification rapide
- [ ] Je distingue classe / instance, attribut / méthode, héritage / composition
- [ ] J'utilise try/catch et je throw des erreurs explicites
- [ ] Je valide les entrées (typeof, length, regex)

### Pré-rempli : `backend/src/services/TaskService.js`

```js
class TaskService {
  constructor(taskModel) {
    this.taskModel = taskModel;
  }

  async create(userId, data) {
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Titre invalide');
    }
    if (data.title.length > 200) {
      throw new Error('Titre trop long (max 200)');
    }
    return this.taskModel.create({
      userId,
      title: data.title.trim(),
      done: false,
    });
  }

  async findAllForUser(userId) {
    return this.taskModel.findAll({ where: { userId } });
  }
}

module.exports = TaskService;
```

**Question** : Pourquoi `data.title.trim()` est-il important côté serveur ?

<details><summary>Réponse</summary>
Pour ne jamais faire confiance au client. Même si le formulaire trim côté front, un attaquant peut envoyer une requête directe à l'API avec des espaces. Toute validation doit être doublée côté serveur (sécurité en profondeur).
</details>

---

## CP3.2 — Sécurité serveur [À APPRENDRE — 0%]

### Cours (30 min)

**Hachage vs chiffrement** :
- **Hachage** (à sens unique) : on ne peut pas retrouver le mot de passe original. Utilisé pour stocker les passwords. Algorithmes : bcrypt, argon2 (jamais MD5 ou SHA1 seuls).
- **Chiffrement** (réversible) : on peut déchiffrer avec la clé. Pour les données sensibles à relire (ex: numéro de carte).

**Salt** : valeur aléatoire ajoutée au mot de passe avant hachage. Empêche les attaques par rainbow table. bcrypt gère le salt automatiquement.

**JWT (JSON Web Token)** : jeton signé par le serveur, donné au client à la connexion. Le client le renvoie dans chaque requête (`Authorization: Bearer <token>`). Le serveur vérifie la signature → pas besoin de stocker la session côté serveur (stateless).

Structure d'un JWT : `header.payload.signature` (3 parties Base64 séparées par des points)

**OAuth 2.0** : standard pour déléguer l'authentification. "Se connecter avec Google" = OAuth.

**Validation des entrées** : toujours côté serveur, avec une bibliothèque (express-validator, joi, zod).

### Code dans TaskMaster : `backend/src/controllers/AuthController.js`

```js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '24h';

exports.registerValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Au moins 1 majuscule')
    .matches(/[0-9]/).withMessage('Au moins 1 chiffre'),
];

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash });
  res.status(201).json({ id: user.id });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ token });
};
```

### Code dans TaskMaster : `backend/src/middleware/auth.js`

```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};
```

### Mini-exercice (30 min)

1. Implémentez `register` et `login` dans une mini-app Express
2. Testez avec **Postman** ou `curl` :
   ```
   curl -X POST localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"a@b.com","password":"Secret123"}'
   ```
3. Vérifiez que le password est bien haché en base (jamais en clair)
4. Décodez votre JWT sur https://jwt.io et observez le payload

### Vérification

**Q1** : Pourquoi `12` rounds pour bcrypt et pas `4` ?

<details><summary>Réponse</summary>
Plus de rounds = plus lent à hacher = plus lent à attaquer par bruteforce. 12 rounds prend ~250ms sur un CPU moderne — invisible pour l'utilisateur, énormément pour un attaquant qui doit tester des millions de mots de passe. 4 rounds est trop rapide.
</details>

**Q2** : Si un attaquant vole votre JWT_SECRET, que peut-il faire ?

<details><summary>Réponse</summary>
Il peut générer des tokens valides pour n'importe quel utilisateur (en falsifiant le payload userId). C'est pourquoi le secret doit être long, aléatoire, jamais commité dans Git, et stocké dans une variable d'environnement (.env hors versionning).
</details>

---

## CP3.3 — Tests unitaires [À APPRENDRE — 0%]

### Cours (25 min)

**Pyramide des tests** :
- Unitaires (70%) : testent une fonction/classe isolée. Rapides.
- Intégration (20%) : testent la combinaison de plusieurs unités (route + DB).
- E2E (10%) : testent le système complet du point de vue utilisateur.

**Structure d'un test** : **AAA** = Arrange (préparer), Act (exécuter), Assert (vérifier).

**Mocks** : objets simulés pour isoler le code testé. Si on teste TaskService, on mock le model pour ne pas dépendre de la BDD.

**Coverage** : pourcentage du code couvert par les tests. Viser 80%+ sur la logique métier.

**TDD** (Test-Driven Development) : Red → Green → Refactor.
1. Écrire un test qui échoue (Red)
2. Écrire le code minimal pour le faire passer (Green)
3. Refactorer en gardant les tests verts

### Code dans TaskMaster : `backend/src/tests/taskService.test.js`

```js
const TaskService = require('../services/TaskService');

describe('TaskService', () => {
  let taskModel;
  let service;

  beforeEach(() => {
    // Mock simple : on remplace le model par des fonctions Jest
    taskModel = {
      create: jest.fn(),
      findAll: jest.fn(),
    };
    service = new TaskService(taskModel);
  });

  describe('create', () => {
    test('crée une tâche valide', async () => {
      taskModel.create.mockResolvedValue({ id: 1, title: 'Test' });
      const result = await service.create(42, { title: 'Test' });
      expect(taskModel.create).toHaveBeenCalledWith({
        userId: 42,
        title: 'Test',
        done: false,
      });
      expect(result.id).toBe(1);
    });

    test('rejette un titre vide', async () => {
      await expect(service.create(42, { title: '' }))
        .rejects.toThrow('Titre invalide');
    });

    test('rejette un titre trop long', async () => {
      const long = 'a'.repeat(201);
      await expect(service.create(42, { title: long }))
        .rejects.toThrow('Titre trop long');
    });

    test('trim les espaces du titre', async () => {
      taskModel.create.mockResolvedValue({});
      await service.create(42, { title: '  Hello  ' });
      expect(taskModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Hello' })
      );
    });
  });
});
```

### Mini-exercice (45 min)

1. Installez Jest : `npm install --save-dev jest`
2. Créez `src/utils/calc.js` avec : `function add(a, b) { return a + b; }`
3. Créez `src/utils/calc.test.js` avec 3 tests :
   - `add(2, 3) === 5`
   - `add(-1, 1) === 0`
   - `add(0.1, 0.2)` lève une erreur (ou pas, à vous de décider)
4. Lancez `npx jest --coverage` et regardez le rapport

### Vérification

**Q1** : Pourquoi mocker la base de données dans un test unitaire ?

<details><summary>Réponse</summary>
Pour isoler la logique testée. Les tests doivent être rapides (millisecondes) et déterministes. Avec une vraie BDD, ils dépendent de l'état de la BDD, du réseau, des autres tests. Le mock simule uniquement le comportement attendu de la BDD.
</details>

**Q2** : Différence entre `toBe` et `toEqual` en Jest ?

<details><summary>Réponse</summary>
`toBe` compare par référence (===), utile pour les types primitifs (number, string). `toEqual` compare par valeur, récursivement, utile pour les objets et tableaux. `toBe({a:1}) === toBe({a:1})` échoue car ce sont 2 objets différents.
</details>

---

## CP3.4 — Design patterns [MAÎTRISÉ — 75%]

### Vérification rapide
- [ ] Je connais MVC, Repository, Singleton, Factory, Observer
- [ ] J'ai déjà refactorisé du code procédural en POO

### Patterns utilisés dans TaskMaster

- **MVC** : Controllers (HTTP) → Services (métier) → Models (données)
- **Repository** : `TaskService` abstrait l'accès aux données
- **Middleware** (chain of responsibility) : auth.js, logging, etc.
- **Factory** : création des connexions Sequelize selon l'environnement

**Question** : Différence entre Singleton et instance unique partagée ?

<details><summary>Réponse</summary>
Le Singleton est un pattern où la classe elle-même garantit qu'une seule instance existe (constructeur privé, méthode getInstance). Une instance unique partagée est juste un objet créé une fois et passé en paramètre — la classe peut très bien être instanciée plusieurs fois ailleurs. Le Singleton est plus contraignant mais plus difficile à tester.
</details>

---

## CP4.1 — Méthodes Agile/Scrum [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je connais les rôles : PO, Scrum Master, Dev Team
- [ ] Je connais les cérémonies : Sprint Planning, Daily, Review, Retro
- [ ] Je sais estimer en story points (Fibonacci : 1, 2, 3, 5, 8, 13)

**Question** : Différence entre Scrum et Kanban ?

<parameter name="file_text"><details><summary>Réponse</summary>
Scrum impose un cadre temporel (sprints de durée fixe, rôles définis, cérémonies). Kanban est continu, sans sprint, focalisé sur le flux de travail (limit WIP, cycle time). Scrum convient aux projets en construction, Kanban à la maintenance ou au support.
</details>

---

## CP4.2 — Outils collaboratifs [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je sais créer une issue, une pull request, un projet GitHub
- [ ] Je connais le workflow GitFlow (main, develop, feature, hotfix)

**Question** : Pourquoi faire des Pull Requests même quand on travaille seul sur un projet ?

<details><summary>Réponse</summary>
Pour s'imposer une revue de code (relecture à froid), pour conserver un historique des changements groupés par fonctionnalité, pour pouvoir lier les commits aux issues, et pour pratiquer le workflow professionnel. Le DP CDA appréciera de voir cette discipline.
</details>

---

## CP4.3 — Communication écrite [MAÎTRISÉ — 75%]

### Vérification rapide
- [ ] Je structure un compte rendu : participants / sujet / décisions / actions / prochaine étape
- [ ] Je rédige des descriptions d'issues claires (contexte / problème / résultat attendu)

### Pré-rempli : `README.md` de TaskMaster

```markdown
# TaskMaster

Application de gestion de tâches collaborative.

## Stack
- Backend : Node.js 20, Express, Sequelize, PostgreSQL, Redis
- Frontend : HTML/CSS/JS vanilla
- Tests : Jest, Supertest, Cypress
- Déploiement : Docker, GitHub Actions

## Démarrage rapide

### Prérequis
- Docker Desktop
- Node.js 20+

### Installation
\`\`\`bash
git clone https://github.com/<vous>/taskmaster.git
cd taskmaster
cp .env.example .env  # éditer les valeurs
docker-compose up -d
\`\`\`

L'application est disponible sur http://localhost:3000.

## Tests
\`\`\`bash
cd backend && npm test
\`\`\`

## Architecture
Voir docs/ARCHITECTURE.md
```

---

# AT2 — Concevoir et développer une application sécurisée organisée en couches

## CP5.1 — Analyse cahier des charges [À RÉVISER — 50%]

### Rappel ciblé (10 min)

**Méthode pour décortiquer un CDC** :
1. Identifier les **acteurs** (utilisateurs, systèmes externes)
2. Lister les **fonctionnalités** (verbe + objet : "créer une tâche")
3. Identifier les **règles de gestion** (un utilisateur ne voit que ses tâches)
4. Identifier les **contraintes non fonctionnelles** (perf, sécurité, accessibilité)
5. Lister les **limites** (ce qui n'est PAS dans le scope)
6. Lister les **questions** (zones grises à clarifier avec le client)

### Application : CDC de TaskMaster (extrait)

**Acteurs** : utilisateur connecté, administrateur (admin)
**Fonctionnalités** :
- F1 : créer un compte (email + mot de passe)
- F2 : se connecter / se déconnecter
- F3 : créer / lister / modifier / supprimer ses tâches
- F4 : marquer une tâche comme terminée
- F5 : (admin) consulter la liste des utilisateurs

**Règles de gestion** :
- RG1 : un utilisateur ne voit que ses propres tâches
- RG2 : le mot de passe doit avoir 8 caractères, 1 maj, 1 chiffre
- RG3 : le titre d'une tâche fait 1 à 200 caractères

**Hors scope** : partage de tâches entre utilisateurs, notifications, mobile natif.

**Question** : Quelle est la différence entre une exigence fonctionnelle et non fonctionnelle ?

<details><summary>Réponse</summary>
Fonctionnelle = ce que le système fait (créer une tâche, envoyer un email). Non fonctionnelle = comment il le fait (en moins de 200ms, accessible WCAG AA, supporte 1000 utilisateurs simultanés). Les deux doivent être listées dans le CDC.
</details>

---

## CP5.2 — Use cases / user stories [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Format : "En tant que X, je veux Y, afin de Z"
- [ ] Critères d'acceptation : Given / When / Then (Gherkin)

### Pré-rempli : `docs/user-stories.md`

```markdown
## US-01 : Inscription
En tant que **visiteur**, je veux **créer un compte avec mon email**, afin de **pouvoir gérer mes tâches**.

### Critères d'acceptation
- Given je suis sur la page d'inscription
- When je saisis un email valide et un mot de passe respectant les règles
- Then mon compte est créé et je suis redirigé vers la page de connexion

### Critères de refus
- Email déjà utilisé → message "Cet email est déjà associé à un compte"
- Mot de passe faible → message listant les règles non respectées

## US-02 : Création de tâche
En tant qu'**utilisateur connecté**, je veux **créer une tâche avec un titre**, afin de **mémoriser ce que j'ai à faire**.

### Critères d'acceptation
- Given je suis connecté sur ma liste de tâches
- When je saisis un titre et clique "Ajouter"
- Then la tâche apparaît immédiatement en haut de ma liste avec le statut "à faire"
```

**Question** : Pourquoi commencer par "En tant que..." plutôt que "Le système doit..." ?

<details><summary>Réponse</summary>
Pour garder l'utilisateur au centre du raisonnement. Le but n'est pas la fonctionnalité technique mais le bénéfice utilisateur. "Le système doit envoyer un email" cache la question : à qui et pourquoi ?
</details>

---

## CP5.3 — Maquettage [MAÎTRISÉ — 75%]

### Vérification rapide
- [ ] Je connais Figma (ou Adobe XD, Penpot)
- [ ] Je sais faire un wireframe basse fidélité avant le design
- [ ] Je relie les écrans entre eux (flow)

### Mini-exercice (1h, optionnel mais utile pour le DP)

1. Ouvrez Figma (gratuit, navigateur)
2. Créez 3 frames : Login, Liste tâches, Création tâche
3. Reliez-les en mode "Prototype" (Figma)
4. Exportez en PNG → annexes du DP

---

## CP6.1 — Architecture multicouche [MAÎTRISÉ — 75%]

### Vérification rapide
- [ ] Je distingue les couches : Présentation / Métier / Accès aux données
- [ ] Je sais qu'une couche ne communique qu'avec la suivante

### Pré-rempli : architecture de TaskMaster

```
┌────────────────────────────────────┐
│   Frontend (HTML/CSS/JS)           │  ← Couche présentation
└────────────────────────────────────┘
              ↓ HTTP/REST
┌────────────────────────────────────┐
│   Express Routes (controllers/)    │  ← Couche présentation backend
├────────────────────────────────────┤
│   Services (services/)             │  ← Couche métier
├────────────────────────────────────┤
│   Models Sequelize (models/)       │  ← Couche accès aux données
└────────────────────────────────────┘
              ↓ SQL
┌────────────────────────────────────┐
│   PostgreSQL                       │
└────────────────────────────────────┘
```

**Question** : Pourquoi un controller ne devrait-il jamais faire d'appel SQL direct ?

<details><summary>Réponse</summary>
Parce qu'il violerait la séparation des couches. Si la BDD change (ex: passage à MongoDB), il faudrait modifier tous les controllers. En passant par les services et les models, on isole le changement à une seule couche. Cela facilite aussi les tests (on mock les services).
</details>

---

## CP6.2 — Frameworks & ORM [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je sais ce qu'est un framework MVC, comment ses composants communiquent
- [ ] J'ai utilisé un ORM (Sequelize, Prisma, Hibernate, Eloquent…)

### Pré-rempli : `backend/src/models/Task.js`

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  done: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,  // ajoute createdAt, updatedAt automatiquement
});

module.exports = Task;
```

**Question** : Avantages et inconvénients d'un ORM par rapport à du SQL pur ?

<details><summary>Réponse</summary>
Avantages : code plus lisible, sécurité (requêtes paramétrées par défaut → anti-injection SQL), portabilité multi-SGBD. Inconvénients : courbe d'apprentissage, parfois moins performant que du SQL optimisé, peut générer des requêtes N+1 (faire 1 requête principale + N requêtes pour les relations) si on n'utilise pas eager loading.
</details>

---

## CP6.3 — Sécurité architecturale [À APPRENDRE — 0%]

### Cours (25 min)

**DICP** — les 4 piliers de la sécurité selon l'ANSSI :
- **D**isponibilité : le système répond quand on le sollicite (uptime, redondance, sauvegarde)
- **I**ntégrité : les données ne sont pas altérées (checksums, transactions, journalisation)
- **C**onfidentialité : seuls les autorisés y accèdent (authentification, chiffrement)
- **P**reuve / traçabilité : on peut prouver qui a fait quoi (logs, signatures)

**Patterns de sécurité** :
- **Defense in depth** (sécurité en profondeur) : plusieurs couches de protection. Si une faille → les autres bloquent.
- **Least privilege** (moindre privilège) : chaque composant n'a que les droits strictement nécessaires.
- **Fail secure** : en cas d'erreur, refuser plutôt qu'autoriser.
- **Zero trust** : ne jamais faire confiance, toujours vérifier (même les requêtes internes).

**Recommandations ANSSI clés** pour le développement web :
- HTTPS partout (certificat Let's Encrypt gratuit)
- Headers de sécurité : HSTS, CSP, X-Frame-Options, X-Content-Type-Options (gérés par helmet)
- Pas de secret en dur dans le code (utiliser variables d'environnement)
- Logs sans données sensibles
- Mises à jour régulières des dépendances (`npm audit`)
- Limiter le nombre de tentatives de connexion (rate limiting)
- Validation côté serveur systématique
- Sessions courtes, déconnexion possible

### Code dans TaskMaster : sécurité en profondeur

```js
// app.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. Headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    }
  }
}));

// 2. Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requêtes par IP
}));

// 3. Rate limiting strict sur l'auth
app.use('/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                     // 5 tentatives de login par 15 min
}));

// 4. Body parser avec limite de taille
app.use(express.json({ limit: '10kb' }));

// 5. CORS strict (autorise seulement votre frontend)
const cors = require('cors');
app.use(cors({ origin: 'https://taskmaster.example.com' }));
```

### Mini-exercice (20 min)

1. Lisez le **Top 10 des vulnérabilités web par l'ANSSI** : https://www.ssi.gouv.fr/guide/recommandations-pour-la-securisation-des-sites-web/
2. Pour chacune des 10 vulnérabilités, identifiez la mesure mise en place dans TaskMaster
3. Identifiez celles qui manquent encore et proposez une mesure

### Vérification

**Q1** : Sur le pattern "fail secure", que doit faire votre code si la connexion à la base de données échoue lors d'une vérification d'autorisation ?

<details><summary>Réponse</summary>
Refuser l'accès (HTTP 503 ou 500) plutôt que de "laisser passer par défaut". Un attaquant pourrait sinon provoquer délibérément une erreur DB pour contourner l'authentification.
</details>

**Q2** : Vous trouvez `JWT_SECRET=mysecret` dans le code committé sur GitHub. Quelles actions immédiates ?

<details><summary>Réponse</summary>
1) Régénérer immédiatement un nouveau secret (l'ancien est compromis publiquement). 2) Invalider tous les tokens en cours (forcer reconnexion). 3) Réécrire l'historique Git pour supprimer le secret (git filter-branch ou BFG). 4) Configurer un secret manager (Vault, AWS Secrets Manager) ou des variables d'environnement.
</details>

---

## CP6.4 — Microservices et SaaS [À APPRENDRE — 0%]

### Cours (15 min)

**Monolithe vs microservices** :

| Aspect | Monolithe | Microservices |
|--------|-----------|---------------|
| Déploiement | Une seule app | N services indépendants |
| Communication | Fonctions internes | API REST/gRPC/messages |
| Données | Une BDD | Une BDD par service |
| Scaling | Tout ensemble | Service par service |
| Complexité | Simple au début | Réseau, observabilité, traces |
| Quand utiliser | <10 développeurs | Grandes équipes, gros trafic |

**Avantages microservices** :
- Découplage : une équipe peut déployer son service sans bloquer les autres
- Scaling fin : on scale uniquement le service surchargé
- Tolérance aux pannes : un service down n'écroule pas tout

**Inconvénients** :
- Complexité opérationnelle (Kubernetes, monitoring, traces distribuées)
- Latence réseau entre services
- Gestion de la cohérence des données (transactions distribuées difficiles)

**SaaS (Software as a Service)** : modèle où le logiciel est hébergé dans le cloud et accessible via un navigateur. Pas d'installation, paiement à l'usage. Exemples : Gmail, Salesforce, GitHub, Notion.

**Modèles cloud** :
- IaaS (Infrastructure) : AWS EC2, OVH VPS — vous gérez l'OS
- PaaS (Platform) : Heroku, Render — vous gérez juste l'app
- SaaS : vous utilisez un produit fini

### Application : TaskMaster monolithe → microservices

TaskMaster est un **monolithe** : un seul backend qui fait tout. Si on devait passer en microservices :
- Service Auth (gestion users, login, JWT)
- Service Tasks (CRUD tâches)
- Service Notifications (emails, push)
- Service Analytics (statistiques)

Chaque service aurait sa propre base et exposerait une API REST.

### Vérification

**Q1** : Pourquoi ne PAS partir directement en microservices pour TaskMaster ?

<details><summary>Réponse</summary>
"Microservices first" est un anti-pattern. La complexité opérationnelle (orchestration, monitoring, déploiement, traces) tue la productivité quand l'équipe et le trafic sont petits. La règle : commencer monolithe, extraire un service quand on a une vraie raison (équipe trop grosse, scaling spécifique, contrainte techno).
</details>

**Q2** : TaskMaster est-il un SaaS ?

<details><summary>Réponse</summary>
Oui, par nature : application accessible via navigateur, sans installation, hébergée chez nous (le développeur). Tous les sites web/apps sont du SaaS dès lors qu'ils proposent un service utilisable en ligne sans installation locale.
</details>

---

## CP7.1 — Modélisation MCD/MLD/MPD [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je sais lire / dessiner un MCD (entités, associations, cardinalités)
- [ ] Je traduis MCD → MLD (clés primaires/étrangères, tables associatives pour N:N)

### Pré-rempli : MCD de TaskMaster

```
┌──────────────┐         ┌──────────────┐
│  Utilisateur │ 1     N │    Tâche     │
│──────────────│─────────│──────────────│
│ #id          │ possède │ #id          │
│ email        │         │ titre        │
│ mot_de_passe │         │ terminée     │
└──────────────┘         │ user_id (FK) │
                         └──────────────┘
```

**MLD** :
- `users(id PK, email UNIQUE, password_hash, created_at, updated_at)`
- `tasks(id PK, user_id FK→users.id, title, done, created_at, updated_at)`

---

## CP7.2 — SQL DDL [MAÎTRISÉ — 75%]

### Vérification rapide
- [ ] Je sais créer une table avec PK, FK, NOT NULL, UNIQUE, CHECK
- [ ] Je sais créer un INDEX et je comprends quand c'est utile

### Pré-rempli : `db/migrations/001-init.sql`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(60) NOT NULL,  -- bcrypt = 60 chars
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- Index pour accélérer la requête "toutes les tâches d'un user"
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

**Question** : Que fait `ON DELETE CASCADE` ?

<details><summary>Réponse</summary>
Quand on supprime un utilisateur, toutes ses tâches sont automatiquement supprimées aussi. Évite les enregistrements orphelins. Alternative : ON DELETE SET NULL (le user_id devient NULL) ou ON DELETE RESTRICT (interdit la suppression si des tâches référencent l'utilisateur).
</details>

---

## CP7.3 — Sécurité BDD [À APPRENDRE — 25%]

### Cours (15 min)

**Principe du moindre privilège** : votre application ne doit JAMAIS se connecter à la BDD avec un compte admin (root/postgres). Créer un compte dédié avec uniquement les droits nécessaires.

**GRANT / REVOKE** :
```sql
-- Créer un utilisateur
CREATE USER taskmaster_app WITH PASSWORD 'strong_password_here';

-- Lui donner uniquement les droits sur les tables nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks, users TO taskmaster_app;

-- Pas de DROP, pas de CREATE, pas d'accès aux autres bases
-- Si on veut tout révoquer :
REVOKE ALL ON tasks FROM taskmaster_app;
```

**Bonnes pratiques** :
- Un compte par environnement (dev, test, prod)
- Un compte par micro-service si applicable
- Mots de passe complexes, stockés dans variables d'env
- Audit logs activés (qui se connecte, quand)
- Chiffrement TLS de la connexion en production
- Données sensibles chiffrées au repos (PostgreSQL : `pgcrypto`)

**Politique de mots de passe** (pour les utilisateurs de l'app) :
- Min 8 caractères, mix maj/min/chiffres/spéciaux
- Vérifier contre liste de mots de passe connus (haveibeenpwned API)
- Hachage bcrypt/argon2 (jamais en clair !)
- Politique de rotation (optionnelle, pas toujours recommandée par l'ANSSI)

### Code dans TaskMaster : `db/setup-app-user.sql`

```sql
-- À exécuter en tant qu'admin lors du setup initial
CREATE USER taskmaster_app WITH PASSWORD 'CHANGE_ME_strong_pwd';

-- Droits sur les tables seulement
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO taskmaster_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taskmaster_app;

-- Pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO taskmaster_app;
```

`backend/.env` :
```
DATABASE_URL=postgres://taskmaster_app:strong_pwd@localhost:5432/taskmaster
```

### Vérification

**Q1** : Pourquoi ne pas se connecter avec l'utilisateur admin de PostgreSQL ?

<details><summary>Réponse</summary>
Si une faille (injection SQL par exemple) permet à un attaquant d'exécuter du SQL, l'admin pourrait DROP toutes les tables, accéder à d'autres bases, ou créer un nouvel utilisateur admin. Un compte limité réduit drastiquement l'impact d'une intrusion.
</details>

**Q2** : Vous devez stocker un numéro de carte bancaire. Hachage ou chiffrement ?

<details><summary>Réponse</summary>
Ni l'un ni l'autre — vous ne devez PAS stocker de numéros de carte (compliance PCI-DSS). Utilisez un prestataire (Stripe, Adyen) qui le fait pour vous et stocke uniquement un token. Si vraiment vous devez : chiffrement réversible (car vous devez pouvoir le relire pour traiter le paiement). Le hachage est à sens unique → ne convient pas.
</details>

---

## CP7.4 — Sauvegarde/restauration [À RÉVISER — 50%]

### Rappel ciblé (10 min)

**Stratégie 3-2-1** (recommandée) :
- 3 copies des données
- Sur 2 types de supports différents
- Dont 1 hors-site (cloud, autre lieu)

**Types de sauvegardes** :
- **Full** : tout à chaque fois (lourd)
- **Différentielle** : changements depuis le dernier full (moyen)
- **Incrémentale** : changements depuis la dernière sauvegarde (léger, mais restauration plus lente)

**PostgreSQL** :
```bash
# Dump (export)
pg_dump -U taskmaster_app -d taskmaster -F c -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -U postgres -d taskmaster_restore backup_20240115.dump

# Dump SQL textuel (lisible)
pg_dump -U taskmaster_app taskmaster > backup.sql
```

**Automatisation** : cron job quotidien + upload S3 ou autre.

**Important** : tester régulièrement la restauration. Une sauvegarde non testée = pas de sauvegarde.

### Code dans TaskMaster : `scripts/backup.sh`

```bash
#!/bin/bash
set -e

DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/var/backups/taskmaster"
mkdir -p "$BACKUP_DIR"

# Dump compressé
pg_dump -U taskmaster_app -d taskmaster -F c \
  -f "$BACKUP_DIR/taskmaster_$DATE.dump"

# Garder 7 jours
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete

# Upload optionnel
# aws s3 cp "$BACKUP_DIR/taskmaster_$DATE.dump" s3://my-bucket/backups/
```

### Vérification

**Q** : Pourquoi `mtime +7 -delete` plutôt que tout garder ?

<details><summary>Réponse</summary>
Les sauvegardes prennent de l'espace disque. Sans rotation, elles s'accumulent jusqu'à saturer. La règle classique : garder N jours en local, M semaines sur stockage froid (S3 Glacier), selon le RPO acceptable (perte de données tolérable).
</details>

---

## CP8.1 — CRUD sécurisé [À APPRENDRE — 0%]

### Cours (25 min)

**Injection SQL** : la vulnérabilité la plus connue. Un attaquant insère du SQL dans un champ. Exemple :

```js
// VULNÉRABLE
const sql = `SELECT * FROM users WHERE email = '${req.body.email}'`;
// Si email = "' OR '1'='1" → renvoie tous les users
```

**Parade : requêtes paramétrées** :
```js
// AVEC SEQUELIZE (paramétré automatiquement)
User.findOne({ where: { email: req.body.email } });

// AVEC SQL BRUT (utiliser des paramètres, JAMAIS de concaténation)
sequelize.query('SELECT * FROM users WHERE email = :email', {
  replacements: { email: req.body.email }
});
```

**Règles d'or** :
1. JAMAIS de concaténation de chaînes pour construire du SQL
2. Toujours utiliser un ORM ou des requêtes préparées
3. Validation des entrées AVANT la requête (express-validator)
4. Échapper les sorties (déjà couvert dans CP2.4)

**Validation des entrées** :
```js
const { body, validationResult } = require('express-validator');

router.post('/tasks',
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('done').optional().isBoolean(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // ... créer la tâche
  }
);
```

### Code dans TaskMaster : `backend/src/controllers/TaskController.js`

```js
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');

exports.createValidators = [
  body('title').isString().trim().isLength({ min: 1, max: 200 })
    .withMessage('Titre requis (1-200 caractères)'),
];

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // userId vient du middleware auth, pas du client (sécurité)
  const task = await Task.create({
    userId: req.userId,
    title: req.body.title,
    done: false,
  });
  res.status(201).json(task);
};

exports.list = async (req, res) => {
  const tasks = await Task.findAll({
    where: { userId: req.userId },  // RG1 : un user voit que ses tâches
    order: [['createdAt', 'DESC']],
  });
  res.json(tasks);
};

exports.update = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });
  
  const task = await Task.findOne({
    where: { id, userId: req.userId },  // protection IDOR
  });
  if (!task) return res.status(404).json({ error: 'Tâche introuvable' });
  
  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.done !== undefined) task.done = req.body.done;
  await task.save();
  res.json(task);
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = await Task.destroy({
    where: { id, userId: req.userId },
  });
  if (deleted === 0) return res.status(404).json({ error: 'Tâche introuvable' });
  res.status(204).send();
};
```

### Mini-exercice (30 min)

1. Implémentez le CRUD complet sur une mini-app avec une route `/items`
2. Testez avec Postman : 
   - POST sans token → 401
   - POST avec titre vide → 400
   - GET avec token user A puis tentative de modif d'une tâche de user B → 404 (pas 403)
3. Vérifiez avec un payload `{"title": "'; DROP TABLE tasks; --"}` que rien ne casse

### Vérification

**Q1** : Pourquoi `userId: req.userId` (depuis le token) plutôt que `userId: req.body.userId` (envoyé par le client) ?

<details><summary>Réponse</summary>
Si on prend le userId du body, un attaquant peut envoyer le userId d'une autre personne et créer une tâche pour elle. En prenant le userId du token (vérifié et signé), on est sûr que c'est bien l'utilisateur authentifié. Règle générale : toute donnée d'identité doit venir du contexte d'auth, jamais du client.
</details>

**Q2** : C'est quoi une **vulnérabilité IDOR** ?

<details><summary>Réponse</summary>
Insecure Direct Object Reference. Un attaquant accède à des ressources qui ne lui appartiennent pas en manipulant l'identifiant. Exemple : `GET /tasks/42` lui renvoie la tâche 42 même si elle appartient à quelqu'un d'autre. Parade : vérifier la propriété (where userId = req.userId) à chaque requête, comme dans le code ci-dessus.
</details>

---

## CP8.2 — Procédures et triggers [À RÉVISER — 50%]

### Rappel ciblé (10 min)

**Procédure stockée** : programme SQL stocké dans la BDD, appelable depuis le code.
**Trigger** : code SQL exécuté automatiquement avant/après un événement (INSERT, UPDATE, DELETE).

**Quand les utiliser** :
- Logique très liée aux données (validation complexe, audit)
- Performance critique (éviter les allers-retours réseau)
- Garantie d'exécution (un trigger ne peut pas être contourné par l'app)

**Quand éviter** :
- Logique métier complexe (préférer le code applicatif, plus testable)
- Portabilité (chaque SGBD a sa syntaxe)

### Code dans TaskMaster : trigger d'audit

```sql
-- Table d'audit
CREATE TABLE task_audit (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  action VARCHAR(10) NOT NULL,
  user_id INTEGER NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);

-- Fonction trigger
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO task_audit(task_id, action, user_id, old_data, new_data)
    VALUES (OLD.id, 'UPDATE', NEW.user_id, row_to_json(OLD), row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO task_audit(task_id, action, user_id, old_data, new_data)
    VALUES (OLD.id, 'DELETE', OLD.user_id, row_to_json(OLD), NULL);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger
CREATE TRIGGER task_audit_trigger
AFTER UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_changes();
```

### Vérification

**Q** : Différence entre `BEFORE INSERT` et `AFTER INSERT` ?

<details><summary>Réponse</summary>
BEFORE INSERT s'exécute avant l'insertion : on peut modifier les valeurs (NEW.title = LOWER(NEW.title)) ou annuler l'insertion (RETURN NULL). AFTER INSERT s'exécute après : on a accès à l'ID généré, mais on ne peut plus modifier la ligne. Audit/log → AFTER. Validation/normalisation → BEFORE.
</details>

---

## CP8.3 — Transactions et concurrence [À APPRENDRE — 0%]

### Cours (25 min)

**Transaction** : groupe d'opérations qui doivent toutes réussir ou toutes échouer. Garantit la cohérence des données.

**Propriétés ACID** :
- **A**tomicité : tout ou rien
- **C**ohérence : la BDD reste valide (contraintes respectées)
- **I**solation : une transaction ne voit pas les changements d'une autre en cours
- **D**urabilité : une fois validée, c'est gravé (résistant à un crash)

**Niveaux d'isolation** (du plus permissif au plus strict) :
- READ UNCOMMITTED : peut lire des données non commitées (rare)
- READ COMMITTED : ne lit que les données commitées (défaut PostgreSQL)
- REPEATABLE READ : la même requête donne le même résultat dans la transaction
- SERIALIZABLE : transactions complètement isolées (lent)

**Anomalies de concurrence** :
- **Lost update** : 2 transactions écrivent en même temps, une écrase l'autre
- **Dirty read** : on lit des données non commitées
- **Phantom read** : nouvelle ligne apparaît au milieu d'une transaction

**Solutions** :
- **Verrous pessimistes** (`SELECT ... FOR UPDATE`) : on bloque la ligne pour les autres
- **Verrous optimistes** (versioning) : on vérifie que la ligne n'a pas changé avant d'écrire

### Code dans TaskMaster : transfert de tâche entre 2 listes

```js
const { sequelize } = require('../models');

exports.transferTask = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const task = await Task.findByPk(req.params.id, {
      lock: t.LOCK.UPDATE,  // verrou pessimiste
      transaction: t,
    });
    if (!task) {
      await t.rollback();
      return res.status(404).json({ error: 'Tâche introuvable' });
    }
    
    // Décrémenter compteur de l'ancienne liste
    await List.decrement('taskCount', {
      where: { id: task.listId },
      transaction: t,
    });
    
    // Incrémenter compteur de la nouvelle liste
    await List.increment('taskCount', {
      where: { id: req.body.targetListId },
      transaction: t,
    });
    
    // Déplacer la tâche
    task.listId = req.body.targetListId;
    await task.save({ transaction: t });
    
    await t.commit();  // tout valider
    res.json(task);
  } catch (err) {
    await t.rollback();  // tout annuler
    res.status(500).json({ error: 'Échec du transfert' });
  }
};
```

### Mini-exercice (30 min)

1. Créez une fonction `transferMoney(fromId, toId, amount)` qui débite un compte et crédite l'autre
2. Implémentez-la SANS transaction, puis simulez une erreur entre les 2 opérations
3. Vérifiez l'incohérence (le compte source est débité mais le destinataire pas crédité)
4. Refactorez avec une transaction et vérifiez le ROLLBACK

### Vérification

**Q1** : Pourquoi `LOCK.UPDATE` plutôt que juste `findByPk` simple ?

<details><summary>Réponse</summary>
Sans verrou, deux requêtes simultanées peuvent lire la même tâche, faire chacune leur logique, puis écrire — la dernière écrase la première (lost update). Le LOCK.UPDATE bloque la ligne jusqu'au commit/rollback : la 2ème requête attend.
</details>

**Q2** : Une transaction reste ouverte plusieurs minutes (oubli de commit). Conséquence ?

<details><summary>Réponse</summary>
Toutes les lignes verrouillées restent inaccessibles aux autres requêtes → l'application semble figée. PostgreSQL accumule des "vieux" tuples (problème de bloat) et ne peut pas faire son VACUUM correctement. Toujours utiliser try/catch/finally et fermer rapidement.
</details>

---

## CP8.4 — NoSQL [À APPRENDRE — 25%]

### Cours (20 min)

**SQL vs NoSQL** :

| Critère | SQL (relationnel) | NoSQL (MongoDB par ex) |
|---------|-------------------|------------------------|
| Schéma | Strict, fixe | Flexible, par document |
| Relations | Jointures | Embedding ou références |
| Scaling | Vertical (gros serveur) | Horizontal (clusters) |
| Cas d'usage | Données structurées, transactions | Volumes énormes, données semi-structurées |
| Cohérence | Forte (ACID) | Souvent éventuelle (BASE) |

**Types de bases NoSQL** :
- **Documents** (MongoDB, CouchDB) : JSON-like
- **Clé-valeur** (Redis, DynamoDB) : ultra-rapide, cache
- **Colonnes** (Cassandra) : volumes massifs
- **Graphes** (Neo4j) : réseaux sociaux, recommandations

**Quand choisir NoSQL** :
- Données peu structurées ou évolutives
- Très gros volumes en lecture
- Besoin de scaling horizontal
- Stockage de logs, événements, sessions

**Dans TaskMaster** : on utilise **Redis** pour le cache de sessions et le rate limiting (clé-valeur, TTL automatique).

### Code dans TaskMaster : `backend/src/config/redis.js`

```js
const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('Redis error', err));
client.connect();

module.exports = client;
```

```js
// utilisation : cache des résultats fréquents
const redis = require('../config/redis');

exports.list = async (req, res) => {
  const cacheKey = `tasks:user:${req.userId}`;
  
  // 1. Tenter le cache
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  
  // 2. Sinon BDD
  const tasks = await Task.findAll({ where: { userId: req.userId } });
  
  // 3. Mettre en cache 60s
  await redis.set(cacheKey, JSON.stringify(tasks), { EX: 60 });
  
  res.json(tasks);
};
```

### Mini-exercice (30 min)

1. Créez un compte gratuit sur **MongoDB Atlas** (https://www.mongodb.com/cloud/atlas)
2. Connectez-vous avec **mongosh** ou **MongoDB Compass**
3. Créez une collection `logs` et insérez 5 documents
4. Faites une requête : `db.logs.find({ level: "error" })`

### Vérification

**Q1** : Pour stocker des sessions utilisateur (token, expire dans 24h), SQL ou NoSQL ?

<details><summary>Réponse</summary>
NoSQL clé-valeur (Redis). Lecture/écriture ultra-rapides, TTL natif (les clés expirent automatiquement après 24h sans code), pas besoin de schéma. Le SQL serait utilisable mais lent et nécessiterait un cron pour purger les sessions expirées.
</details>

**Q2** : Pour un système de réservation de salles (concurrence forte, intégrité critique), SQL ou NoSQL ?

<details><summary>Réponse</summary>
SQL relationnel. Les transactions ACID garantissent qu'on ne réserve pas la même salle deux fois. Avec NoSQL il faudrait implémenter manuellement la cohérence (verrous distribués, consensus), beaucoup plus complexe et plus risqué.
</details>

---

# AT3 — Préparer le déploiement d'une application sécurisée

## CP9.1 — Plan de tests [MAÎTRISÉ — 100%]

### Vérification rapide
- [ ] Je structure mon plan : cas nominaux / limites / erreur
- [ ] Je documente les résultats attendus

### Pré-rempli : `docs/test-plan.md`

```markdown
## Plan de tests TaskMaster

### TC-01 : Création de tâche (cas nominal)
- Précondition : utilisateur connecté avec token valide
- Action : POST /api/tasks { title: "Faire les courses" }
- Résultat attendu : 201 Created, tâche créée en BDD avec done=false

### TC-02 : Création avec titre vide (cas erreur)
- Action : POST /api/tasks { title: "" }
- Résultat attendu : 400 Bad Request, message "Titre requis"

### TC-03 : Création avec titre 200 caractères (cas limite)
- Action : POST /api/tasks { title: "a".repeat(200) }
- Résultat attendu : 201 Created

### TC-04 : Création avec titre 201 caractères (cas erreur limite)
- Action : POST /api/tasks { title: "a".repeat(201) }
- Résultat attendu : 400 Bad Request
```

---

## CP9.2 — Tests unitaires et intégration [À APPRENDRE — 0%]

### Cours (30 min)

Différence cruciale :
- **Unitaire** : isole une unité (fonction, classe). Mock des dépendances externes (BDD, API).
- **Intégration** : combine plusieurs unités (route HTTP + service + BDD réelle).

**Outils** : Jest (test runner) + Supertest (HTTP mocking).

### Code dans TaskMaster : `backend/src/tests/integration/tasks.test.js`

```js
const request = require('supertest');
const app = require('../../app');
const { sequelize, User, Task } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let token;
let userId;

beforeAll(async () => {
  // BDD de test (config différente)
  await sequelize.sync({ force: true });
  const user = await User.create({
    email: 'test@example.com',
    passwordHash: await bcrypt.hash('Test123!', 10),
  });
  userId = user.id;
  token = jwt.sign({ userId }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/tasks', () => {
  test('crée une tâche valide', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test task' });
    
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test task');
    expect(res.body.userId).toBe(userId);
    
    const task = await Task.findByPk(res.body.id);
    expect(task).not.toBeNull();
  });

  test('rejette sans authentification', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  test('rejette un titre vide', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tasks', () => {
  test('retourne uniquement les tâches du user authentifié', async () => {
    // Créer une tâche pour un autre user
    const otherUser = await User.create({
      email: 'other@example.com',
      passwordHash: 'x',
    });
    await Task.create({ userId: otherUser.id, title: 'Pas la mienne' });
    
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.every(t => t.userId === userId)).toBe(true);
  });
});
```

### Mini-exercice (45 min)

1. Configurez une BDD de test séparée (`taskmaster_test`)
2. Écrivez 3 tests d'intégration : un POST réussi, un POST refusé, un GET avec filtre
3. Lancez `npm test -- --coverage`
4. Visez >70% de coverage sur les controllers

### Vérification

**Q1** : Pourquoi `sequelize.sync({ force: true })` dans `beforeAll` ?

<details><summary>Réponse</summary>
Pour partir d'une BDD vide à chaque exécution des tests. force: true drop puis recrée toutes les tables. Garantit que les tests sont déterministes (résultat indépendant de l'état précédent). En production, JAMAIS utiliser sync({ force: true }) — utiliser des migrations.
</details>

**Q2** : Vos tests sont lents (30s pour 50 tests). Causes probables ?

<details><summary>Réponse</summary>
1) Tests d'intégration avec vraie BDD : utiliser une BDD en mémoire (sqlite::memory:) pour les tests si le SGBD réel n'est pas indispensable. 2) Pas de parallélisation : Jest lance par défaut en parallèle, vérifier qu'il n'y a pas de conflit. 3) beforeEach trop coûteux (recrée tout) : utiliser des transactions wrappées qui rollback. 4) bcrypt en SALT_ROUNDS=12 dans les fixtures : passer à 4 pour les tests.
</details>

---

## CP9.3 — Tests sécurité et charge [À APPRENDRE — 0%]

### Cours (20 min)

**Tests de charge** : simuler beaucoup d'utilisateurs simultanés pour mesurer la performance et trouver le point de rupture.

**Outils** :
- **k6** (recommandé) : moderne, scripts JS, gratuit (open source)
- **JMeter** : référence historique, GUI lourde, en Java
- **Locust** : Python, scriptable

**Métriques importantes** :
- **Throughput** : requêtes/seconde
- **Latence p50, p95, p99** : 50%/95%/99% des requêtes répondent en moins de X ms
- **Error rate** : % de requêtes en erreur

**Tests de sécurité** :
- **SAST** (Static Application Security Testing) : analyse du code source. Outils : SonarQube, Snyk Code, ESLint security plugin.
- **DAST** (Dynamic Application Security Testing) : test de l'app en cours d'exécution. Outils : OWASP ZAP, Burp Suite.
- **Dependency scanning** : `npm audit`, Snyk, Dependabot.
- **Fuzzing** : envoi de données aléatoires/malformées. Outils : `fast-check` (JS), Atheris (Python).

### Code dans TaskMaster : `tests/load/login.js` (k6)

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // monte à 20 users
    { duration: '1m', target: 20 },    // tient 1 minute
    { duration: '30s', target: 0 },    // descend
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    http_req_failed: ['rate<0.01'],    // < 1% d'échecs
  },
};

export default function () {
  const res = http.post('http://localhost:3000/auth/login',
    JSON.stringify({ email: 'test@example.com', password: 'Test123!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, {
    'status 200': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });
  sleep(1);
}
```

Lancement : `k6 run tests/load/login.js`

### Mini-exercice (30 min)

1. Installez k6 (https://k6.io/docs/get-started/installation/)
2. Lancez votre TaskMaster en local
3. Écrivez un script qui simule 10 users en 30s sur la route GET /tasks
4. Observez : latence p95, taux d'erreur, RPS
5. Lancez `npm audit` sur votre projet et corrigez les warnings

### Vérification

**Q1** : Différence entre p50 et p99 de latence ?

<details><summary>Réponse</summary>
p50 = médiane = 50% des requêtes répondent en moins de cette valeur. p99 = 99% répondent en moins. Le p99 est crucial : il révèle les "pires cas" qui pénalisent l'expérience utilisateur. Une app avec p50=50ms mais p99=2000ms est ressentie comme lente par 1% des users (qui seront ceux qui tombent sur les requêtes lentes — souvent les plus actifs).
</details>

**Q2** : `npm audit` rapporte une vulnérabilité haute sur une dépendance transitif (dépendance de dépendance). Que faire ?

<details><summary>Réponse</summary>
1) Mettre à jour la dépendance directe qui l'inclut (souvent suffit). 2) Si pas de version corrigée : utiliser `overrides` dans package.json pour forcer une version saine. 3) Vérifier si la vulnérabilité affecte réellement votre cas d'usage (parfois un faux positif). 4) En dernier recours : `npm audit fix --force` (peut casser, à tester).
</details>

---

## CP9.4 — Automatisation des tests [À APPRENDRE — 0%]

### Cours (15 min)

**Tests E2E (End-to-End)** : pilotent un vrai navigateur pour tester comme un utilisateur. Outils :
- **Cypress** (recommandé pour débuter) : moderne, gratuit, excellente DX
- **Playwright** : multi-browser, performant
- **Selenium** : référence historique, plus verbeux

**Différence avec les tests d'intégration** :
- Intégration : on teste l'API HTTP avec Supertest (pas de navigateur)
- E2E : on teste l'UI complète avec un vrai navigateur

**Bonnes pratiques** :
- Tests E2E uniquement sur les parcours critiques (login, achat, création)
- Données de test isolées (chaque test crée et nettoie ses données)
- Lancement dans la CI sur chaque PR

### Code dans TaskMaster : `cypress/e2e/login.cy.js`

```js
describe('Login flow', () => {
  beforeEach(() => {
    cy.visit('/login.html');
  });

  it('connecte un utilisateur valide', () => {
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('Test123!');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/index.html');
    cy.get('#task-list').should('be.visible');
  });

  it('affiche une erreur sur identifiants invalides', () => {
    cy.get('#email').type('wrong@example.com');
    cy.get('#password').type('wrong');
    cy.get('button[type="submit"]').click();
    
    cy.get('#error-zone').should('contain', 'Identifiants invalides');
  });

  it('est accessible au clavier', () => {
    cy.get('#email').focus().type('test@example.com');
    cy.realPress('Tab');
    cy.focused().should('have.id', 'password');
  });
});
```

### Vérification

**Q1** : Vous avez 100 tests unitaires (rapides) + 20 tests d'intégration + 10 tests E2E. Lesquels lancer en pre-commit, en CI, en pre-production ?

<details><summary>Réponse</summary>
Pre-commit : tests unitaires uniquement (rapides, immédiat). CI sur push : tous (unitaires + intégration + smoke E2E des parcours critiques). Pre-production : tous + tests E2E complets + tests de charge. La règle : plus c'est lent et coûteux, plus tard dans le pipeline.
</details>

**Q2** : Un test E2E `cy.wait(5000)` est-il une bonne pratique ?

<details><summary>Réponse</summary>
Non, anti-pattern. Les délais fixes rendent les tests lents (toujours 5s même quand l'élément apparaît à 100ms) ET fragiles (5s pas assez sur un CI lent). Préférer `cy.get('#element').should('be.visible')` qui attend dynamiquement (jusqu'au timeout configuré, par défaut 4s).
</details>

---

## CP10.1 — Environnements [À APPRENDRE — 0%]

### Cours (15 min)

**Les 4 environnements classiques** :

| Env | Rôle | Données | Accès |
|-----|------|---------|-------|
| DEV | Développement local | Bidons, libres | Dev seulement |
| SIT (Test) | Tests d'intégration auto | Anonymisées ou bidons | Dev + QA |
| UAT (Recette) | Validation utilisateur final | Copie anonymisée prod | Client + QA |
| PROD | Utilisateurs finaux | Réelles | Public, restreint admin |

**Variables d'environnement** : ce qui change entre environnements (URL BDD, secrets, niveau de log) doit être dans des variables, pas dans le code.

```
backend/.env.development     → variables locales
backend/.env.test            → tests
backend/.env.production      → prod (jamais commité, géré par hébergeur)
```

**Hébergeurs débutants-friendly** :
- **Render** (gratuit pour démarrer) : 1 clic, supporte Node, Postgres, Docker
- **Railway** : similaire, gratuit
- **Heroku** : référence historique
- **Fly.io** : moderne, multi-régions
- **Vercel** : pour le frontend, serverless

### Code dans TaskMaster : configuration multi-env

```js
// backend/src/config/database.js
const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const configs = {
  development: { url: 'postgres://localhost/taskmaster_dev', logging: console.log },
  test: { url: 'postgres://localhost/taskmaster_test', logging: false },
  production: { url: process.env.DATABASE_URL, logging: false, ssl: true },
};

const config = configs[env];
module.exports = new Sequelize(config.url, {
  logging: config.logging,
  dialectOptions: config.ssl ? { ssl: { rejectUnauthorized: false } } : {},
});
```

### Mini-exercice (1h)

1. Créez un compte sur **Render** (gratuit)
2. Connectez votre repo GitHub
3. Créez un Web Service Node.js avec auto-deploy depuis main
4. Ajoutez une PostgreSQL Database (gratuite)
5. Configurez les variables d'env (DATABASE_URL, JWT_SECRET)
6. Pushez un commit, observez le build et le deploy automatique

### Vérification

**Q1** : Vous avez besoin d'un nouveau token API. Vous le mettez où ?

<details><summary>Réponse</summary>
Dans une variable d'environnement, jamais dans le code. En local : .env (ajouté à .gitignore). En CI : GitHub Secrets. En prod : variables d'env de l'hébergeur (Render/Heroku/AWS Secrets Manager). Le code ne fait que `process.env.MY_TOKEN`.
</details>

**Q2** : Vous testez en UAT avec une copie de la prod. Quelles précautions ?

<details><summary>Réponse</summary>
1) Anonymiser les données personnelles (RGPD) : remplacer les emails, noms, téléphones par des données fictives. 2) Désactiver les emails sortants (utiliser MailHog ou similaire). 3) Désactiver les paiements réels (Stripe en mode test). 4) Différencier visuellement (banner "ENV: UAT" en haut de page) pour ne pas confondre avec la prod.
</details>

---

## CP10.2 — Procédures et scripts [À APPRENDRE — 0%]

### Cours (10 min)

Une **procédure de déploiement** = document écrit étape par étape pour déployer.
Un **script de déploiement** = automatisation de ces étapes.

**Idéal** : tout est scripté, on ne fait que `./deploy.sh`. Procédure écrite = secours en cas de défaillance du script.

**Structure type d'un déploiement** :
1. Build (compiler/transpiler si besoin)
2. Tests
3. Push de l'image Docker vers un registry
4. Migration de la BDD
5. Déploiement de la nouvelle version
6. Health check (vérifier que ça répond)
7. Bascule du trafic (blue/green)
8. Rollback automatique si échec

### Code dans TaskMaster : `docs/DEPLOYMENT.md`

```markdown
## Procédure de déploiement TaskMaster en production

### Prérequis
- Accès SSH au serveur de production
- Variables d'env configurées sur Render
- Tests verts sur main

### Étapes

1. Vérifier que la branche main est à jour
   ```
   git checkout main && git pull
   ```

2. Lancer les tests localement
   ```
   cd backend && npm test
   ```

3. Tagger la version
   ```
   git tag v1.2.0
   git push origin v1.2.0
   ```

4. Le pipeline GitHub Actions se déclenche automatiquement
   - Build de l'image Docker
   - Tests d'intégration
   - Migration de la BDD via Render
   - Déploiement

5. Vérifier le déploiement
   ```
   curl https://taskmaster.onrender.com/health
   ```
   Attendu : `{"status":"ok","version":"1.2.0"}`

6. En cas d'échec : rollback via dashboard Render → "Rollback to previous"
```

### Code : `scripts/deploy.sh`

```bash
#!/bin/bash
set -e  # arrêter au premier échec

echo "→ Lancement des tests"
cd backend && npm test
cd ..

echo "→ Build de l'image Docker"
docker build -t taskmaster:latest -f backend/Dockerfile backend/

echo "→ Push vers le registry"
docker tag taskmaster:latest registry.example.com/taskmaster:latest
docker push registry.example.com/taskmaster:latest

echo "→ Déploiement sur Render"
curl -X POST "https://api.render.com/deploy/srv-xxx?key=$RENDER_KEY"

echo "→ Health check (max 60s)"
for i in {1..30}; do
  if curl -sf https://taskmaster.onrender.com/health > /dev/null; then
    echo "✓ Déploiement OK"
    exit 0
  fi
  sleep 2
done

echo "✗ Health check échoué — rollback"
exit 1
```

### Vérification

**Q** : Pourquoi `set -e` au début du script bash ?

<details><summary>Réponse</summary>
Sans set -e, si une commande échoue, le script continue. Avec set -e, le script s'arrête immédiatement à la première erreur. Crucial en déploiement : si les tests échouent, on ne déploie pas, on n'altère pas la prod.
</details>

---

## CP10.3 — Migrations BDD [À APPRENDRE — 25%]

### Cours (15 min)

**Migration** = script versionné qui modifie la structure de la BDD (ajouter/modifier/supprimer une colonne, table, index…).

**Pourquoi pas juste éditer le SQL en prod ?** Parce qu'on perd la traçabilité, on ne peut pas tester en local, et on ne peut pas reproduire l'état dans un autre env.

**Outils** : Sequelize-CLI, Knex, Flyway, Liquibase.

**Règles** :
- Une migration = un fichier daté
- Toujours fournir un `up` (apply) ET un `down` (rollback)
- Une migration ne se modifie jamais une fois appliquée en prod (on en crée une nouvelle)
- Migrations idempotentes (rejouables sans casser)

### Code dans TaskMaster : `backend/migrations/20240120-add-priority-to-tasks.js`

```js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tasks', 'priority', {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
    });
    await queryInterface.addIndex('tasks', ['user_id', 'priority'], {
      name: 'idx_tasks_user_priority',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('tasks', 'idx_tasks_user_priority');
    await queryInterface.removeColumn('tasks', 'priority');
  },
};
```

Commandes Sequelize CLI :
```bash
# Créer une migration
npx sequelize-cli migration:generate --name add-priority-to-tasks

# Appliquer
npx sequelize-cli db:migrate

# Rollback de la dernière
npx sequelize-cli db:migrate:undo
```

### Vérification

**Q1** : Vous voulez supprimer une colonne `legacy_field` de la table users. Comment faire en zéro-downtime ?

<details><summary>Réponse</summary>
En 3 déploiements : 1) Migration 1 : déployer le code qui n'écrit plus dans legacy_field (mais qui peut encore lire). 2) Migration 2 : supprimer toute lecture de legacy_field dans le code. 3) Migration 3 : DROP COLUMN. Si on fait tout d'un coup, pendant le déploiement progressif, des instances anciennes essaient encore d'écrire dans la colonne supprimée → erreurs.
</details>

**Q2** : Pourquoi `down` est-il important même si on utilise rarement ?

<details><summary>Réponse</summary>
Pour les rollbacks d'urgence. Si une migration provoque des bugs en prod, on doit pouvoir revenir en arrière vite. Aussi pour le développement local (annuler une migration ratée). Et pour la documentation : down explicite ce que la migration ajoute.
</details>

---

## CP11.1 — Pipeline CI/CD [À APPRENDRE — 0%]

### Cours (25 min)

**CI (Continuous Integration)** : à chaque push, automatiquement compiler, tester, vérifier la qualité. Détecte tôt les bugs.

**CD (Continuous Delivery/Deployment)** :
- Delivery : déploiement prêt en 1 clic (validation manuelle)
- Deployment : déploiement automatique en prod si tests verts

**Pipeline classique** :
```
Push → Lint → Test unitaires → Build → Test intégration → Push image → Deploy staging → Tests E2E → Deploy prod
```

**Outils** :
- **GitHub Actions** : intégré GitHub, gratuit (limites généreuses)
- **GitLab CI** : intégré GitLab, .gitlab-ci.yml
- **Jenkins** : open source, très flexible, complexe
- **CircleCI** : SaaS, gratuit pour open source

**YAML basics** : indentation = structure (pas de tabs, espaces uniquement).

### Code dans TaskMaster : `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: taskmaster_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: backend
        run: npm ci
      
      - name: Lint
        working-directory: backend
        run: npm run lint
      
      - name: Run tests
        working-directory: backend
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/taskmaster_test
          JWT_SECRET: test_secret_for_ci
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage/lcov.info
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render deploy
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
```

### Mini-exercice (1h)

1. Dans votre repo GitHub, créez le dossier `.github/workflows/`
2. Créez un fichier `ci.yml` minimal qui lint et teste
3. Pushez et regardez l'onglet "Actions" sur GitHub
4. Cassez volontairement un test, push, observez l'échec
5. Ajoutez un badge dans votre README : `![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)`

### Vérification

**Q1** : Pourquoi `npm ci` plutôt que `npm install` en CI ?

<details><summary>Réponse</summary>
npm ci installe exactement ce qui est dans package-lock.json (déterministe, plus rapide, plus fiable). npm install peut mettre à jour package-lock.json si versions compatibles différentes existent. En CI on veut la reproductibilité — toujours npm ci.
</details>

**Q2** : Le job `deploy` n'existe que si `github.ref == 'refs/heads/main'`. Pourquoi cette condition ?

<details><summary>Réponse</summary>
Pour ne déployer qu'à partir de la branche main, jamais depuis une PR ou une feature branch. Sinon, chaque PR déploierait en prod, ce qui est catastrophique. Aussi : `needs: test` empêche le deploy si les tests échouent.
</details>

---

## CP11.2 — Docker et orchestration [À APPRENDRE — 0%]

### Cours (20 min)

**Docker Compose** : décrit plusieurs conteneurs liés dans un seul YAML. Idéal pour le développement local et les petits déploiements.

**Kubernetes (k8s)** : orchestrateur pour des dizaines/milliers de conteneurs en production. Concepts : Pods, Deployments, Services, Ingress. Beaucoup plus complexe — pas nécessaire pour le CDA mais bon de savoir que ça existe.

**Concepts Docker Compose** :
- **Service** : un conteneur (ou un groupe de réplicas)
- **Volume** : stockage persistant
- **Network** : réseau virtuel partagé entre services
- **depends_on** : ordre de démarrage

### Code dans TaskMaster : `docker-compose.yml`

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://taskmaster:secret@db:5432/taskmaster
      REDIS_URL: redis://cache:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - taskmaster-net

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: taskmaster
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: taskmaster
    volumes:
      - db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskmaster"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - taskmaster-net

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - taskmaster-net

  frontend:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
    networks:
      - taskmaster-net

volumes:
  db-data:

networks:
  taskmaster-net:
```

Commandes :
```bash
docker compose up -d           # lance tout en arrière-plan
docker compose logs -f backend # voir les logs du backend
docker compose down            # arrête tout
docker compose down -v         # arrête ET supprime les volumes
```

### Mini-exercice (45 min)

1. Créez un docker-compose.yml minimal avec un service backend et une BDD
2. `docker compose up`
3. Vérifiez que backend voit bien `db` (pas `localhost`) — DNS interne Docker
4. Stoppez, ajoutez un volume pour la BDD, relancez : les données persistent
5. Stoppez avec `down -v` : les données disparaissent

### Vérification

**Q1** : Dans `DATABASE_URL`, pourquoi `db:5432` et pas `localhost:5432` ?

<details><summary>Réponse</summary>
Dans le réseau Docker, chaque service a un DNS basé sur son nom dans docker-compose. `db:5432` désigne le conteneur de service "db". `localhost` dans le conteneur backend désigne le conteneur backend lui-même, pas la machine hôte.
</details>

**Q2** : Sans `depends_on` avec `condition: service_healthy`, que peut-il se passer ?

<parameter name="path">/home/claude/cours_part2.md<details><summary>Réponse</summary>
Le backend démarre avant que PostgreSQL soit prêt à accepter les connexions, plante au démarrage. Avec `service_healthy`, Docker attend que le healthcheck pg_isready réussisse. Alternative : retry de connexion côté code (plus robuste car gère aussi les pertes de connexion en cours d'exécution).
</details>

---

## CP11.3 — Qualité de code [À RÉVISER — 50%]

### Rappel ciblé (15 min)

**Linters** : analysent le code pour trouver erreurs et mauvaises pratiques sans l'exécuter.
- **ESLint** (JS/TS) : standard
- **Pylint / flake8** (Python)
- **PHPStan** (PHP)
- **SonarQube** : multi-langage, analyse de qualité globale

**Formatters** : standardisent le style automatiquement.
- **Prettier** (JS/TS/CSS/HTML/JSON) : populaire
- **Black** (Python)

**Métriques de qualité** :
- **Coverage** : % de code couvert par les tests
- **Complexité cyclomatique** : nombre de branches dans une fonction (idéal <10)
- **Duplication** : copier-coller à éviter
- **Code smells** : odeurs de code (trop de paramètres, classes trop grosses…)

### Code dans TaskMaster : `backend/.eslintrc.json`

```json
{
  "env": { "node": true, "es2022": true, "jest": true },
  "extends": ["eslint:recommended"],
  "parserOptions": { "ecmaVersion": "latest", "sourceType": "commonjs" },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "eqeqeq": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-eval": "error",
    "no-implied-eval": "error"
  }
}
```

`backend/.prettierrc.json` :
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

Hook pre-commit avec **husky + lint-staged** :
```bash
npm install --save-dev husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

`package.json` :
```json
"lint-staged": {
  "*.js": ["eslint --fix", "prettier --write"]
}
```

### Vérification

**Q** : Vous lancez SonarQube et obtenez 80% coverage avec 15 code smells. Faut-il refuser le merge ?

<details><summary>Réponse</summary>
Ça dépend de la **politique d'équipe** définie. Recommandations courantes : bloquer si coverage <70%, si vulnérabilité haute détectée, si bug critique. Les code smells sont des avertissements à traiter au fil de l'eau. Définir des "Quality Gates" dans SonarQube qui bloquent automatiquement en CI selon vos critères.
</details>

---

# Compétences transversales

## Communiquer en français et en anglais

### Vérification rapide
- [ ] Niveau B1 anglais en lecture/écriture (lire la doc Stack Overflow, écrire un commit message en anglais)
- [ ] Niveau A2 anglais oral (présenter en 3 min un projet basique)

**Astuce DP** : tous les commits, README et commentaires de code doivent être en anglais. Les comptes rendus/specs en français.

## Mettre en oeuvre une démarche de résolution de problème

### Méthode universelle
1. **Reproduire** le bug de manière fiable
2. **Isoler** : minimiser le cas qui le provoque
3. **Hypothèses** : lister les causes possibles
4. **Tester** chaque hypothèse (logs, breakpoints, debugger)
5. **Corriger** + ajouter un test pour ne pas régresser
6. **Documenter** dans le commit ou l'issue

## Apprendre en continu

### Sources recommandées
- **Docs officielles** (toujours en premier !)
- **Stack Overflow** (avec esprit critique)
- **MDN Web Docs** pour le web
- **DEV.to**, **Medium** pour les tutos
- **Newsletters** : JavaScript Weekly, Node Weekly, Postgres Weekly
- **Conférences** : DevoxxFR (FR), Devoxx, Velocity (replays YouTube)

---

# Ordre de bataille recommandé sur 2 jours

Compte tenu de votre profil, voici le séquencement optimal :

## Jour 1 — Sécurité, tests, déploiement (lacunes critiques)

**Matin (4h)**
- 1h : CP3.2 Sécurité serveur (auth, hash, JWT) — le plus structurant pour le DP
- 1h : CP6.3 Sécurité architecturale (DICP, ANSSI, headers)
- 1h : CP8.1 CRUD sécurisé (injections, IDOR, validation)
- 1h : CP2.4 Sécurité front (XSS, CSRF, RGPD) + CP7.3 Sécurité BDD

**Après-midi (4h)**
- 1.5h : CP3.3 + CP9.2 Tests unitaires & intégration (Jest + Supertest)
- 1h : CP9.3 Tests sécurité et charge (k6, npm audit) + CP9.4 E2E (Cypress)
- 0.5h : CP2.5 Accessibilité RGAA (Lighthouse audit)
- 1h : CP8.3 Transactions + CP8.4 NoSQL (Redis/MongoDB)

**Soir (1h)** : Commencer la rédaction des fiches DP CP1, CP4 (vous les maîtrisez à 90%+).

## Jour 2 — DevOps, déploiement, finalisation

**Matin (4h)**
- 1h : CP1.3 Docker (Dockerfile, build, run) + CP11.2 Docker Compose
- 1h : CP11.1 CI/CD (GitHub Actions YAML) + CP11.3 Qualité code (ESLint, Prettier)
- 1h : CP10.1 Environnements + CP10.2 Procédures et scripts
- 1h : CP10.3 Migrations BDD + CP6.4 Microservices/SaaS

**Après-midi (4h)** : RÉDACTION INTENSIVE
- Fiches AT1 : CP1, CP2, CP3, CP4
- Fiches AT2 : CP5, CP6, CP7, CP8
- Fiches AT3 : CP9, CP10, CP11
- Pour chaque CP, mentionner systématiquement : outils, méthodes, sécurité, tests, documentation

**Soir (1-2h)**
- Relecture complète, vérification cohérence
- Tableau des titres/diplômes
- Déclaration sur l'honneur
- Préparer 3-5 minutes d'oral par CP (pitch type "Pour cette compétence, j'ai…")

---

# Annexes

## Liens essentiels

- **Documentation Node.js** : https://nodejs.org/docs/latest-v20.x/api/
- **Express** : https://expressjs.com/fr/
- **Sequelize** : https://sequelize.org/docs/v6/
- **Jest** : https://jestjs.io/docs/getting-started
- **Cypress** : https://docs.cypress.io/guides/overview/why-cypress
- **Docker** : https://docs.docker.com/get-started/
- **GitHub Actions** : https://docs.github.com/fr/actions
- **OWASP Top 10** : https://owasp.org/Top10/fr/
- **ANSSI guide site web** : https://www.ssi.gouv.fr/guide/recommandations-pour-la-securisation-des-sites-web/
- **RGAA** : https://accessibilite.numerique.gouv.fr/

## Vocabulaire à maîtriser pour l'oral

| Terme | Signification courte |
|-------|---------------------|
| Idempotent | Une opération qui donne le même résultat même si appelée plusieurs fois |
| Stateless | Le serveur ne stocke rien sur la session — tout est dans la requête (JWT) |
| Healthcheck | Endpoint qui répond OK si l'app est en bonne santé (pour load balancer) |
| Race condition | Bug dû à 2 processus accédant en même temps à la même ressource |
| Memoization | Mise en cache d'une fonction pure pour éviter de la recalculer |
| Eager / Lazy loading | Charger immédiatement vs à la demande |
| N+1 problem | Faire 1 requête principale + N requêtes pour les relations (anti-pattern) |
| Refactoring | Améliorer le code sans changer son comportement externe |
| Tech debt | Compromis temporaires qu'il faudra rembourser plus tard |

## Check-list finale du DP

- [ ] Toutes les pages signées datées
- [ ] Photo récente
- [ ] Tableau diplômes/titres complété
- [ ] 11 compétences avec exemples concrets
- [ ] Chaque exemple : tâches, moyens, collaborateurs, contexte
- [ ] Mention systématique : sécurité, tests, documentation
- [ ] Compétences transversales (communication, résolution problème, veille)
- [ ] Annexes : code, captures, diagrammes
- [ ] Déclaration sur l'honneur signée

**Bonne chance !**
