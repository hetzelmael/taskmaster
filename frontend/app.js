// === TaskMaster — Frontend JavaScript ===
// Couvre : JS/DOM (2.2), API REST (2.3), Sécurité XSS (2.4), RGPD cookies

// ==========================================
// Configuration API
// ==========================================
const API_URL = '/api';
let authToken = null;
let currentPage = 1;

// ==========================================
// SÉCURITÉ XSS (CP 2.4)
// Règle d'or : NE JAMAIS utiliser innerHTML avec des données utilisateur
// Toujours utiliser textContent ou créer les éléments un par un
// ==========================================

/**
 * Échappe les caractères HTML dangereux
 * Utilisé en dernier recours si innerHTML est inévitable
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str; // textContent encode automatiquement
  return div.innerHTML;
}

// ==========================================
// RGPD : Gestion des cookies (CP 2.4)
// ==========================================
function initCookieBanner() {
  const consent = localStorage.getItem('cookie-consent');
  const banner = document.getElementById('cookie-banner');
  if (!consent && banner) {
    banner.hidden = false;
  }
}

function acceptCookies() {
  localStorage.setItem('cookie-consent', 'accepted');
  document.getElementById('cookie-banner').hidden = true;
}

function refuseCookies() {
  localStorage.setItem('cookie-consent', 'refused');
  document.getElementById('cookie-banner').hidden = true;
}

// Exposer au HTML
window.acceptCookies = acceptCookies;
window.refuseCookies = refuseCookies;

// ==========================================
// Utilitaires API (CP 2.3 — fetch + async/await)
// ==========================================

/**
 * Wrapper fetch avec gestion du token et des erreurs
 * Utilise async/await (ES6+) au lieu de .then()
 */
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Ajouter le JWT si connecté
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}`);
    }

    return data;
  } catch (error) {
    // Gestion centralisée des erreurs réseau
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
    throw error;
  }
}

// ==========================================
// Authentification
// ==========================================

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  // Validation côté client (doublée par le serveur)
  if (!email || !password) {
    showError(errorEl, 'Veuillez remplir tous les champs.');
    return;
  }

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    authToken = data.token;
    // Stocker le token (en production, préférer httpOnly cookie)
    sessionStorage.setItem('token', authToken);

    showTasksSection();
    loadTasks();
  } catch (error) {
    showError(errorEl, error.message);
  }
}

async function handleRegister() {
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName = document.getElementById('reg-lastname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('register-error');

  if (!firstName || !lastName || !email || !password) {
    showError(errorEl, 'Tous les champs sont obligatoires.');
    return;
  }
  if (password.length < 8) {
    showError(errorEl, 'Le mot de passe doit faire au moins 8 caractères.');
    return;
  }

  try {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    showError(document.getElementById('login-error'), '');
    toggleAuthSection('login');
    // Message de succès accessible
    showError(document.getElementById('login-error'), 'Compte créé ! Connectez-vous.');
    document.getElementById('login-error').classList.add('success');
  } catch (error) {
    showError(errorEl, error.message);
  }
}

function handleLogout() {
  authToken = null;
  sessionStorage.removeItem('token');
  showLoginSection();
}

// ==========================================
// Gestion des tâches (CP 2.2 — DOM)
// ==========================================

async function loadTasks() {
  const status = document.getElementById('filter-status').value;
  const priority = document.getElementById('filter-priority').value;

  const params = new URLSearchParams({ page: currentPage });
  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);

  try {
    const data = await apiFetch(`/tasks?${params}`);
    renderTasks(data.tasks);
    renderPagination(data);
  } catch (error) {
    console.error('Erreur chargement tâches:', error);
  }
}

/**
 * Rendu sécurisé des tâches
 * ANTI-XSS : on utilise textContent, PAS innerHTML
 */
function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');
  container.innerHTML = ''; // OK car on ne met PAS de données utilisateur ici

  if (tasks.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Aucune tâche trouvée.';
    empty.style.color = 'var(--text-muted)';
    empty.style.textAlign = 'center';
    empty.style.padding = '2rem';
    container.appendChild(empty);
    return;
  }

  tasks.forEach(task => {
    // Créer chaque élément manuellement (sécurité XSS)
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('role', 'listitem');

    const info = document.createElement('div');
    info.className = 'task-info';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title; // textContent = sûr contre XSS

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const prioritySpan = document.createElement('span');
    prioritySpan.className = `priority-${task.priority}`;
    prioritySpan.textContent = task.priority.toUpperCase();

    const statusSpan = document.createElement('span');
    statusSpan.textContent = formatStatus(task.status);

    const dateSpan = document.createElement('span');
    if (task.dueDate) {
      dateSpan.textContent = new Date(task.dueDate).toLocaleDateString('fr-FR');
    }

    meta.append(prioritySpan, statusSpan, dateSpan);
    info.append(title, meta);

    // Boutons d'action
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn btn-sm';
    doneBtn.textContent = task.status === 'done' ? 'Rouvrir' : 'Terminer';
    doneBtn.setAttribute('aria-label',
      task.status === 'done' ? `Rouvrir ${task.title}` : `Marquer ${task.title} comme terminé`
    );
    doneBtn.addEventListener('click', () =>
      toggleTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')
    );

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm';
    delBtn.textContent = 'Supprimer';
    delBtn.setAttribute('aria-label', `Supprimer ${task.title}`);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(doneBtn, delBtn);
    card.append(info, actions);
    container.appendChild(card);
  });
}

function formatStatus(status) {
  const map = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé', archived: 'Archivé' };
  return map[status] || status;
}

function renderPagination(data) {
  const nav = document.getElementById('pagination');
  const info = document.getElementById('page-info');
  if (data.totalPages <= 1) { nav.hidden = true; return; }
  nav.hidden = false;
  info.textContent = `Page ${data.page} / ${data.totalPages}`;
  document.getElementById('prev-page').disabled = data.page <= 1;
  document.getElementById('next-page').disabled = data.page >= data.totalPages;
}

async function toggleTaskStatus(taskId, newStatus) {
  try {
    await apiFetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    loadTasks();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteTask(taskId) {
  if (!confirm('Supprimer cette tâche ?')) return;
  try {
    await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
    loadTasks();
  } catch (error) {
    alert(error.message);
  }
}

async function handleCreateTask() {
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  const priority = document.getElementById('task-priority').value;
  const dueDate = document.getElementById('task-due').value || null;
  const errorEl = document.getElementById('task-error');

  if (!title) { showError(errorEl, 'Le titre est obligatoire.'); return; }

  try {
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, priority, dueDate }),
    });
    closeModal();
    loadTasks();
  } catch (error) {
    showError(errorEl, error.message);
  }
}

// ==========================================
// Navigation entre sections
// ==========================================

function showLoginSection() {
  document.getElementById('login-section').hidden = false;
  document.getElementById('register-section').hidden = true;
  document.getElementById('tasks-section').hidden = true;
}

function showTasksSection() {
  document.getElementById('login-section').hidden = true;
  document.getElementById('register-section').hidden = true;
  document.getElementById('tasks-section').hidden = false;
}

function toggleAuthSection(target) {
  document.getElementById('login-section').hidden = target !== 'login';
  document.getElementById('register-section').hidden = target !== 'register';
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg; // textContent = sûr
  el.hidden = !msg;
  el.classList.remove('success');
}

function openModal() {
  document.getElementById('task-modal').hidden = false;
  document.getElementById('task-title').focus(); // RGAA : focus sur le premier champ
}

function closeModal() {
  document.getElementById('task-modal').hidden = true;
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-due').value = '';
  document.getElementById('task-error').hidden = true;
}

// ==========================================
// Initialisation (addEventListener, pas onclick)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Auth
  document.getElementById('login-submit').addEventListener('click', handleLogin);
  document.getElementById('register-submit').addEventListener('click', handleRegister);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('show-register').addEventListener('click', () => toggleAuthSection('register'));
  document.getElementById('show-login').addEventListener('click', () => toggleAuthSection('login'));

  // Tâches
  document.getElementById('add-task-btn').addEventListener('click', openModal);
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('save-task').addEventListener('click', handleCreateTask);

  // Filtres
  document.getElementById('filter-status').addEventListener('change', () => { currentPage = 1; loadTasks(); });
  document.getElementById('filter-priority').addEventListener('change', () => { currentPage = 1; loadTasks(); });

  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => { currentPage--; loadTasks(); });
  document.getElementById('next-page').addEventListener('click', () => { currentPage++; loadTasks(); });

  // RGAA : fermer la modal avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('task-modal').hidden) {
      closeModal();
    }
  });

  // Vérifier si un token existe en session
  const saved = sessionStorage.getItem('token');
  if (saved) {
    authToken = saved;
    showTasksSection();
    loadTasks();
  }

  // RGPD
  initCookieBanner();
});
