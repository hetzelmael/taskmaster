// === TaskMaster — Frontend JavaScript ===

const API_URL = '/api';
let currentUser    = null;
let currentProject = null;
let editingProjectId = null;
let currentPage    = 1;
let currentView    = 'list';
let editingTaskId  = null;
let dragState      = null;
let synthFrom          = null;
let synthTo            = null;
let synthAllTasks      = [];
let synthVersionFilter = '';
let versionsCache  = [];

// ==========================================
// Utilitaires d'animation
// ==========================================
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Anime une valeur de `from` à `to` sur `duration` ms (ease-out-cubic)
// et appelle `callback(currentValue)` à chaque frame
function animateNumber(from, to, duration, callback) {
  if (prefersReducedMotion()) { callback(to); return; }
  const start = performance.now();
  function frame(now) {
    const t    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    callback(from + (to - from) * ease);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const ADJACENT = {
  todo:        ['todo', 'in_progress'],
  in_progress: ['todo', 'in_progress', 'done'],
  done:        ['in_progress', 'done'],
};
function canMoveTo(from, to) {
  return ADJACENT[from]?.includes(to) ?? false;
}

// ==========================================
// Utilitaires
// ==========================================
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR') + ' à ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}j ${h % 24}h ${m % 60}min`;
  if (h > 0) return `${h}h ${m % 60}min`;
  if (m > 0) return `${m}min ${s % 60}s`;
  return `${s}s`;
}

function iconEl(name) {
  const i = document.createElement('i');
  i.setAttribute('data-lucide', name);
  i.className = 'icon';
  return i;
}

function isOverdue(task) {
  if (!task.dueDate) return false;
  if (task.status === 'done' || task.status === 'archived') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

// ==========================================
// RGPD — Cookies
// ==========================================
function initCookieBanner() {
  if (!localStorage.getItem('cookie-consent'))
    document.getElementById('cookie-banner').hidden = false;
}
function acceptCookies() {
  localStorage.setItem('cookie-consent', 'accepted');
  document.getElementById('cookie-banner').hidden = true;
}
function refuseCookies() {
  localStorage.setItem('cookie-consent', 'refused');
  document.getElementById('cookie-banner').hidden = true;
}

// ==========================================
// Wrapper fetch (gère 204 No Content)
// ==========================================
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, credentials: 'include' });
  if (response.status === 204) return null;
  if (response.status === 401) {
    currentUser = null; currentProject = null;
    sessionStorage.removeItem('user');
    showLoginSection();
    throw new Error('Session expirée');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || `Erreur ${response.status}`);
  return data;
}

// ==========================================
// Authentification
// ==========================================
async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  if (!email || !password) { showError(errorEl, 'Veuillez remplir tous les champs.'); return; }
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    currentUser = data.user;
    currentProject = null;
    sessionStorage.setItem('user', JSON.stringify(currentUser));
    showProjectsSection();
    loadProjects();
    loadVersions();
  } catch (err) { showError(errorEl, err.message); }
}

async function handleRegister() {
  const firstName = document.getElementById('reg-firstname').value.trim();
  const lastName  = document.getElementById('reg-lastname').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  const errorEl   = document.getElementById('register-error');
  if (!firstName || !lastName || !email || !password) { showError(errorEl, 'Tous les champs sont obligatoires.'); return; }
  if (password.length < 8) { showError(errorEl, 'Mot de passe : 8 caractères minimum.'); return; }
  try {
    await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, password }) });
    toggleAuthSection('login');
    const el = document.getElementById('login-error');
    showError(el, 'Compte créé ! Connectez-vous.');
    el.classList.add('success');
  } catch (err) { showError(errorEl, err.message); }
}

async function handleLogout() {
  currentUser = null; currentProject = null;
  sessionStorage.removeItem('user');
  showLoginSection();
  try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (_e) { /* cookie déjà expiré */ }
}

// ==========================================
// Navigation
// ==========================================
function showLoginSection() {
  document.getElementById('login-section').hidden    = false;
  document.getElementById('register-section').hidden = true;
  document.getElementById('projects-section').hidden = true;
  document.getElementById('tasks-section').hidden    = true;
  document.getElementById('nav-user').hidden         = true;
}
function showProjectsSection() {
  document.getElementById('login-section').hidden    = true;
  document.getElementById('register-section').hidden = true;
  document.getElementById('projects-section').hidden = false;
  document.getElementById('tasks-section').hidden    = true;
  document.getElementById('nav-user').hidden         = false;
  document.getElementById('nav-username').textContent = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.email || '';
}
function showTasksSection() {
  document.getElementById('login-section').hidden    = true;
  document.getElementById('register-section').hidden = true;
  document.getElementById('projects-section').hidden = true;
  document.getElementById('tasks-section').hidden    = false;
  document.getElementById('nav-user').hidden         = false;
  document.getElementById('nav-username').textContent = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.email || '';
  const breadcrumb  = document.getElementById('project-breadcrumb');
  const projectName = document.getElementById('breadcrumb-project-name');
  breadcrumb.hidden = !currentProject;
  if (currentProject) projectName.textContent = currentProject.name;
}
function toggleAuthSection(target) {
  document.getElementById('login-section').hidden    = target !== 'login';
  document.getElementById('register-section').hidden = target !== 'register';
}

// ==========================================
// Profil
// ==========================================
async function openProfile() {
  try {
    const fresh = await apiFetch('/auth/me');
    currentUser = { ...currentUser, ...fresh };
    sessionStorage.setItem('user', JSON.stringify(currentUser));
  } catch (_e) { /* utilise les données en cache si la requête échoue */ }
  document.getElementById('profile-firstname').value   = currentUser?.firstName || '';
  document.getElementById('profile-lastname').value    = currentUser?.lastName  || '';
  document.getElementById('profile-email').textContent = currentUser?.email     || '—';
  document.getElementById('profile-save-error').hidden = true;
  document.getElementById('profile-modal').hidden = false;
}
function closeProfile() { document.getElementById('profile-modal').hidden = true; }

async function handleSaveProfile() {
  const firstName = document.getElementById('profile-firstname').value.trim();
  const lastName  = document.getElementById('profile-lastname').value.trim();
  const errorEl   = document.getElementById('profile-save-error');
  if (!firstName || !lastName) { showError(errorEl, 'Prénom et nom sont requis.'); return; }
  try {
    const updated = await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify({ firstName, lastName }) });
    currentUser = { ...currentUser, ...updated };
    sessionStorage.setItem('user', JSON.stringify(currentUser));
    const name = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email || '';
    document.getElementById('nav-username').textContent = name;
    showError(errorEl, '');
    errorEl.textContent = 'Profil mis à jour.';
    errorEl.className = 'error-msg success';
    errorEl.hidden = false;
    setTimeout(() => { errorEl.hidden = true; errorEl.className = 'error-msg'; }, 2000);
  } catch (err) { showError(errorEl, err.message); }
}

async function handleDeleteAccount() {
  if (!confirm('Supprimer définitivement votre compte ? Toutes vos données seront effacées. Cette action est irréversible.')) return;
  try {
    await apiFetch('/auth/me', { method: 'DELETE' });
    currentUser = null;
    currentProject = null;
    sessionStorage.removeItem('user');
    closeProfile();
    showLoginSection();
  } catch (err) { alert(err.message); }
}

// ==========================================
// Bascule Liste / Kanban / Synthèse
// ==========================================
function switchView(view) {
  currentView = view;
  const isList  = view === 'list';
  const isKanban = view === 'kanban';
  const isSynth  = view === 'synthesis';

  document.getElementById('tasks-list').hidden      = !isList;
  document.getElementById('filters-bar').hidden     = !isList;
  document.getElementById('kanban-view').hidden     = !isKanban;
  document.getElementById('synthesis-view').hidden  = !isSynth;
  document.getElementById('pagination').hidden      = true;

  // Animation d'entrée sur la vue qui apparaît
  const targetId = isList ? 'tasks-list' : isKanban ? 'kanban-view' : 'synthesis-view';
  const targetEl = document.getElementById(targetId);
  targetEl.classList.remove('view-entering');
  void targetEl.offsetWidth; // force reflow pour relancer l'animation
  targetEl.classList.add('view-entering');
  targetEl.addEventListener('animationend', () => targetEl.classList.remove('view-entering'), { once: true });

  document.getElementById('btn-list-view').classList.toggle('active', isList);
  document.getElementById('btn-kanban-view').classList.toggle('active', isKanban);
  document.getElementById('btn-synthesis-view').classList.toggle('active', isSynth);
  document.getElementById('btn-list-view').setAttribute('aria-pressed', String(isList));
  document.getElementById('btn-kanban-view').setAttribute('aria-pressed', String(isKanban));
  document.getElementById('btn-synthesis-view').setAttribute('aria-pressed', String(isSynth));

  currentPage = 1;
  loadTasks();
}

// ==========================================
// Chargement des tâches
// ==========================================
async function loadTasks() {
  if (currentView === 'synthesis') { loadSynthesis(); return; }
  const status    = document.getElementById('filter-status').value;
  const priority  = document.getElementById('filter-priority').value;
  const versionId = document.getElementById('filter-version').value;
  const limit     = currentView === 'kanban' ? 200 : 20;
  const params    = new URLSearchParams({ page: currentPage, limit });
  if (status)               params.set('status', status);
  if (priority)             params.set('priority', priority);
  if (versionId)            params.set('versionId', versionId);
  if (currentProject?.id)   params.set('projectId', currentProject.id);
  try {
    const data = await apiFetch(`/tasks?${params}`);
    if (currentView === 'kanban') renderKanban(data.tasks);
    else { renderTasks(data.tasks); renderPagination(data); }
  } catch (err) { console.error('Erreur chargement tâches:', err); }
}

// ==========================================
// Vue LISTE
// ==========================================
const STATUS_LABELS   = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé', archived: 'Archivé' };
const PRIORITY_LABELS = { low: 'Basse', medium: 'Moyenne', high: 'HAUTE' };

function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';
  if (tasks.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Aucune tâche.';
    p.className = 'empty-state';
    container.appendChild(p);
    return;
  }
  tasks.forEach((task, idx) => {
    const card = document.createElement('div');
    card.className = `task-card${task.status === 'done' ? ' task-done' : ''} card-entering`;
    card.style.animationDelay = (idx * 35) + 'ms';
    card.setAttribute('role', 'listitem');

    // Checkbox — disponible uniquement quand la tâche est en cours
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'task-checkbox';
    if (task.status === 'in_progress') {
      cb.setAttribute('aria-label', `Marquer "${task.title}" comme terminé`);
      cb.addEventListener('change', () => toggleTaskStatus(task.id, 'done'));
    } else {
      cb.hidden = true;
    }

    // Info cliquable
    const info = document.createElement('div');
    info.className = 'task-info';
    info.setAttribute('role', 'button');
    info.setAttribute('tabindex', '0');
    info.setAttribute('aria-label', `Modifier : ${task.title}`);
    info.addEventListener('click', () => openTaskModal(task));
    info.addEventListener('keydown', e => { if (e.key === 'Enter') openTaskModal(task); });

    const titleEl = document.createElement('div');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;

    if (task.description) {
      const desc = document.createElement('p');
      desc.className = 'task-desc-preview';
      desc.textContent = task.description.length > 80 ? task.description.slice(0, 80) + '…' : task.description;
      info.append(titleEl, desc);
    } else {
      info.appendChild(titleEl);
    }

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const prioEl = document.createElement('span');
    prioEl.className = `priority-${task.priority}`;
    prioEl.textContent = PRIORITY_LABELS[task.priority] || task.priority;

    const statusEl = document.createElement('span');
    statusEl.textContent = STATUS_LABELS[task.status] || task.status;

    meta.append(prioEl, statusEl);

    // Date d'échéance — rouge si dépassée
    if (task.dueDate) {
      const dateEl = document.createElement('span');
      dateEl.append(iconEl('calendar'), ' ', new Date(task.dueDate).toLocaleDateString('fr-FR'));
      if (isOverdue(task)) dateEl.classList.add('date-overdue');
      meta.appendChild(dateEl);
    }

    // Badge version
    if (task.Version) {
      const badge = document.createElement('span');
      badge.className = 'version-badge';
      badge.textContent = task.Version.name;
      meta.appendChild(badge);
    }

    // Horodatage
    if (task.startedAt && task.status === 'in_progress') {
      const t = document.createElement('span');
      t.className = 'timing-badge';
      t.append(iconEl('play'), ' ', formatDateTime(task.startedAt));
      meta.appendChild(t);
    }
    if (task.startedAt && task.completedAt && task.status === 'done') {
      const t = document.createElement('span');
      t.className = 'timing-badge';
      t.append(iconEl('timer'), ' ', formatMs(new Date(task.completedAt) - new Date(task.startedAt)));
      meta.appendChild(t);
    }

    info.appendChild(meta);

    // Bouton supprimer
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger-outline';
    delBtn.appendChild(iconEl('trash-2'));
    delBtn.setAttribute('aria-label', `Supprimer ${task.title}`);
    delBtn.addEventListener('click', e => { e.stopPropagation(); deleteTask(task.id); });

    card.append(cb, info, delBtn);
    container.appendChild(card);
  });
  lucide.createIcons();
}

// ==========================================
// Vue KANBAN + Drag & Drop
// ==========================================
function renderKanban(tasks) {
  const cols = {
    todo:        { cards: document.getElementById('cards-todo'),        count: document.getElementById('count-todo') },
    in_progress: { cards: document.getElementById('cards-inprogress'),  count: document.getElementById('count-inprogress') },
    done:        { cards: document.getElementById('cards-done'),        count: document.getElementById('count-done') },
  };
  Object.values(cols).forEach(c => { c.cards.innerHTML = ''; });

  const grouped = { todo: [], in_progress: [], done: [] };
  tasks.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); });

  Object.entries(grouped).forEach(([status, list]) => {
    cols[status].count.textContent = list.length;
    list.forEach((task, idx) => cols[status].cards.appendChild(createKanbanCard(task, idx)));
  });
  lucide.createIcons();
}

function createKanbanCard(task, idx = 0) {
  const card = document.createElement('div');
  card.className = 'kanban-card card-entering';
  card.style.animationDelay = (idx * 40) + 'ms';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('draggable', 'true');
  card.dataset.taskId = task.id;
  card.setAttribute('aria-label', `Modifier : ${task.title}`);

  card.addEventListener('click',   () => openTaskModal(task));
  card.addEventListener('keydown', e => { if (e.key === 'Enter') openTaskModal(task); });

  // Drag & Drop
  card.addEventListener('dragstart', e => {
    dragState = { taskId: task.id, fromStatus: task.status };
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  card.addEventListener('dragend', () => {
    dragState = null;
    card.classList.remove('dragging');
    // Nettoyer tous les états visuels en cas de drop hors zone
    document.querySelectorAll('.kanban-column').forEach(c => {
      c.classList.remove('drag-over', 'drag-forbidden');
    });
  });

  const titleEl = document.createElement('div');
  titleEl.className = 'kanban-card-title';
  titleEl.textContent = task.title;
  card.appendChild(titleEl);

  if (task.description) {
    const desc = document.createElement('p');
    desc.className = 'kanban-card-desc';
    desc.textContent = task.description.length > 60 ? task.description.slice(0, 60) + '…' : task.description;
    card.appendChild(desc);
  }

  const meta = document.createElement('div');
  meta.className = 'kanban-card-meta';

  const prioEl = document.createElement('span');
  prioEl.className = `priority-${task.priority}`;
  prioEl.textContent = PRIORITY_LABELS[task.priority] || task.priority;
  meta.appendChild(prioEl);

  if (task.Version) {
    const badge = document.createElement('span');
    badge.className = 'version-badge';
    badge.textContent = task.Version.name;
    meta.appendChild(badge);
  }

  // Date — rouge si dépassée
  if (task.dueDate) {
    const dateEl = document.createElement('span');
    dateEl.textContent = new Date(task.dueDate).toLocaleDateString('fr-FR');
    if (isOverdue(task)) dateEl.classList.add('date-overdue');
    meta.appendChild(dateEl);
  }

  card.appendChild(meta);

  // Horodatage
  if (task.startedAt && task.status === 'in_progress') {
    const t = document.createElement('div');
    t.className = 'timing-badge';
    t.append(iconEl('play'), ' ', formatDateTime(task.startedAt));
    card.appendChild(t);
  }
  if (task.startedAt && task.completedAt && task.status === 'done') {
    const t = document.createElement('div');
    t.className = 'timing-badge';
    t.append(iconEl('timer'), ' ', formatMs(new Date(task.completedAt) - new Date(task.startedAt)));
    card.appendChild(t);
  }

  return card;
}

function initKanbanDnD() {
  const dropZones = [
    { id: 'cards-todo',        status: 'todo' },
    { id: 'cards-inprogress',  status: 'in_progress' },
    { id: 'cards-done',        status: 'done' },
  ];
  dropZones.forEach(({ id, status }) => {
    const cardsEl = document.getElementById(id);
    const colEl   = cardsEl.closest('.kanban-column');

    colEl.addEventListener('dragover', e => {
      if (!dragState) return;
      const allowed = canMoveTo(dragState.fromStatus, status);
      if (allowed) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        colEl.classList.add('drag-over');
        colEl.classList.remove('drag-forbidden');
      } else {
        colEl.classList.add('drag-forbidden');
        colEl.classList.remove('drag-over');
      }
    });

    colEl.addEventListener('dragleave', e => {
      if (!colEl.contains(e.relatedTarget)) {
        colEl.classList.remove('drag-over', 'drag-forbidden');
      }
    });

    colEl.addEventListener('drop', async e => {
      e.preventDefault();
      colEl.classList.remove('drag-over', 'drag-forbidden');
      if (!dragState) return;
      const { taskId, fromStatus } = dragState;
      dragState = null;
      if (fromStatus !== status && canMoveTo(fromStatus, status)) {
        await toggleTaskStatus(taskId, status);
      }
    });
  });
}

function renderPagination(data) {
  const nav  = document.getElementById('pagination');
  const info = document.getElementById('page-info');
  if (data.totalPages <= 1) { nav.hidden = true; return; }
  nav.hidden = false;
  info.textContent = `Page ${data.page} / ${data.totalPages}`;
  document.getElementById('prev-page').disabled = data.page <= 1;
  document.getElementById('next-page').disabled = data.page >= data.totalPages;
}

// ==========================================
// Actions tâches
// ==========================================
async function toggleTaskStatus(taskId, newStatus) {
  try {
    await apiFetch(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    loadTasks();
  } catch (err) { alert(err.message); }
}

async function deleteTask(taskId) {
  if (!confirm('Supprimer cette tâche ?')) return;
  try {
    await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
    loadTasks();
  } catch (err) { alert(err.message); }
}

// ==========================================
// Modal tâche (création + édition)
// ==========================================
function openTaskModal(task = null) {
  editingTaskId = task ? task.id : null;
  document.getElementById('modal-heading').textContent = task ? 'Modifier la tâche' : 'Nouvelle tâche';

  document.getElementById('task-title').value    = task?.title       || '';
  document.getElementById('task-desc').value     = task?.description || '';
  document.getElementById('task-priority').value = task?.priority    || 'medium';
  document.getElementById('task-status').value   = task?.status      || 'todo';
  document.getElementById('task-due').value      = task?.dueDate ? task.dueDate.split('T')[0] : '';
  document.getElementById('task-version').value  = task?.versionId   || '';

  document.getElementById('task-status').closest('.form-group').hidden = !task;

  // Horodatage
  const timingSection = document.getElementById('task-timing-info');
  const startedRow    = document.getElementById('timing-started');
  const elapsedRow    = document.getElementById('timing-elapsed');
  timingSection.hidden = true;
  startedRow.hidden    = true;
  elapsedRow.hidden    = true;

  if (task?.startedAt) {
    timingSection.hidden = false;
    startedRow.hidden    = false;
    document.getElementById('timing-started-value').textContent = formatDateTime(task.startedAt);
  }
  if (task?.startedAt && task?.completedAt) {
    elapsedRow.hidden = false;
    document.getElementById('timing-elapsed-value').textContent = formatMs(new Date(task.completedAt) - new Date(task.startedAt));
  }

  document.getElementById('task-error').hidden = true;
  document.getElementById('task-modal').hidden = false;
  document.getElementById('task-title').focus();
}

function closeModal() {
  document.getElementById('task-modal').hidden = true;
  editingTaskId = null;
}

async function handleSaveTask() {
  const title       = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  const priority    = document.getElementById('task-priority').value;
  const status      = document.getElementById('task-status').value;
  const dueDate     = document.getElementById('task-due').value || null;
  const versionId   = document.getElementById('task-version').value ? parseInt(document.getElementById('task-version').value) : null;
  const errorEl     = document.getElementById('task-error');
  if (!title) { showError(errorEl, 'Le titre est obligatoire.'); return; }
  try {
    if (editingTaskId) {
      await apiFetch(`/tasks/${editingTaskId}`, {
        method: 'PUT', body: JSON.stringify({ title, description, priority, status, dueDate, versionId }),
      });
    } else {
      await apiFetch('/tasks', {
        method: 'POST', body: JSON.stringify({ title, description, priority, dueDate, versionId, projectId: currentProject?.id || null }),
      });
    }
    closeModal();
    loadTasks();
  } catch (err) { showError(errorEl, err.message); }
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
  el.classList.remove('success');
}

// ==========================================
// Projets
// ==========================================
async function loadProjects() {
  try {
    const projects = await apiFetch('/projects');
    renderProjects(projects);
  } catch (err) { console.error('Erreur projets:', err); }
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  if (projects.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = 'Aucun projet. Créez votre premier projet.';
    grid.appendChild(p);
    return;
  }
  projects.forEach((project, idx) => {
    const card = document.createElement('div');
    card.className = 'project-card card-entering';
    card.style.animationDelay = (idx * 50) + 'ms';

    const top = document.createElement('div');
    top.className = 'project-card-top';

    const nameEl = document.createElement('h3');
    nameEl.className = 'project-card-name';
    nameEl.textContent = project.name;

    const actions = document.createElement('div');
    actions.className = 'project-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-secondary';
    editBtn.appendChild(iconEl('pencil'));
    editBtn.setAttribute('aria-label', `Modifier ${project.name}`);
    editBtn.addEventListener('click', e => { e.stopPropagation(); openProjectModal(project); });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger-outline';
    delBtn.appendChild(iconEl('trash-2'));
    delBtn.setAttribute('aria-label', `Supprimer ${project.name}`);
    delBtn.addEventListener('click', e => { e.stopPropagation(); deleteProject(project.id); });

    actions.append(editBtn, delBtn);
    top.append(nameEl, actions);
    card.appendChild(top);

    if (project.description) {
      const desc = document.createElement('p');
      desc.className = 'project-card-desc';
      desc.textContent = project.description;
      card.appendChild(desc);
    }

    const counts = project.taskCounts || {};
    const total  = (counts.todo || 0) + (counts.in_progress || 0) + (counts.done || 0);

    const statsEl = document.createElement('div');
    statsEl.className = 'project-card-stats';
    [
      { label: 'À faire',  val: counts.todo        || 0, cls: 'stat-todo' },
      { label: 'En cours', val: counts.in_progress || 0, cls: 'stat-inprog' },
      { label: 'Terminé',  val: counts.done        || 0, cls: 'stat-done' },
    ].forEach(({ label, val, cls }) => {
      const stat = document.createElement('div');
      stat.className = `project-stat ${cls}`;
      const num = document.createElement('span'); num.className = 'project-stat-num'; num.textContent = val;
      const lbl = document.createElement('span'); lbl.className = 'project-stat-label'; lbl.textContent = label;
      stat.append(num, lbl);
      statsEl.appendChild(stat);
    });

    const totalEl = document.createElement('div');
    totalEl.className = 'project-card-total';
    totalEl.textContent = `${total} tâche${total !== 1 ? 's' : ''}`;

    card.append(statsEl, totalEl);
    card.addEventListener('click', () => enterProject(project));
    grid.appendChild(card);
  });
  lucide.createIcons();
}

function enterProject(project) {
  currentProject = project;
  synthVersionFilter = '';
  const sel = document.getElementById('synth-version-filter');
  if (sel) sel.value = '';
  showTasksSection();
  loadVersions();
  loadTasks();
}

function backToProjects() {
  currentProject = null;
  showProjectsSection();
  loadProjects();
}

function openProjectModal(project = null) {
  editingProjectId = project ? project.id : null;
  document.getElementById('project-modal-heading').textContent = project ? 'Modifier le projet' : 'Nouveau projet';
  document.getElementById('project-name').value = project?.name || '';
  document.getElementById('project-desc').value = project?.description || '';
  document.getElementById('project-error').hidden = true;
  document.getElementById('project-modal').hidden = false;
  document.getElementById('project-name').focus();
}

function closeProjectModal() {
  document.getElementById('project-modal').hidden = true;
  editingProjectId = null;
}

async function handleSaveProject() {
  const name        = document.getElementById('project-name').value.trim();
  const description = document.getElementById('project-desc').value.trim();
  const errorEl     = document.getElementById('project-error');
  if (!name) { showError(errorEl, 'Le nom est obligatoire.'); return; }
  try {
    if (editingProjectId) {
      await apiFetch(`/projects/${editingProjectId}`, {
        method: 'PUT', body: JSON.stringify({ name, description: description || null }),
      });
    } else {
      await apiFetch('/projects', {
        method: 'POST', body: JSON.stringify({ name, description: description || null }),
      });
    }
    closeProjectModal();
    loadProjects();
  } catch (err) { showError(errorEl, err.message); }
}

async function deleteProject(id) {
  if (!confirm('Supprimer ce projet ? Toutes ses tâches seront supprimées.')) return;
  try {
    await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    loadProjects();
  } catch (err) { alert(err.message); }
}

// ==========================================
// Versions
// ==========================================
async function loadVersions() {
  try {
    versionsCache = await apiFetch('/versions');
    populateVersionSelects();
  } catch (err) { console.error('Erreur versions:', err); }
}

function populateVersionSelects() {
  ['task-version', 'filter-version', 'synth-version-filter'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    versionsCache.forEach(v => sel.add(new Option(v.name, v.id)));
    sel.value = current;
  });
}

function openVersionsModal() {
  renderVersionsList();
  document.getElementById('versions-modal').hidden = false;
}

function closeVersionsModal() {
  document.getElementById('versions-modal').hidden = true;
  document.getElementById('new-version-name').value = '';
  document.getElementById('new-version-desc').value = '';
  document.getElementById('version-error').hidden = true;
}

function renderVersionsList() {
  const container = document.getElementById('versions-list');
  container.innerHTML = '';
  if (versionsCache.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = 'Aucune version créée.';
    container.appendChild(p);
    return;
  }
  versionsCache.forEach(v => {
    const item = document.createElement('div');
    item.className = 'version-item';

    const info = document.createElement('div');
    info.className = 'version-item-info';

    const name = document.createElement('span');
    name.className = 'version-item-name';
    name.textContent = v.name;
    info.appendChild(name);

    if (v.description) {
      const desc = document.createElement('span');
      desc.className = 'version-item-desc';
      desc.textContent = v.description;
      info.appendChild(desc);
    }

    const del = document.createElement('button');
    del.className = 'btn btn-sm btn-danger-outline';
    del.appendChild(iconEl('trash-2'));
    del.setAttribute('aria-label', `Supprimer ${v.name}`);
    del.addEventListener('click', () => deleteVersion(v.id));

    item.append(info, del);
    container.appendChild(item);
  });
  lucide.createIcons();
}

async function handleCreateVersion() {
  const name    = document.getElementById('new-version-name').value.trim();
  const desc    = document.getElementById('new-version-desc').value.trim();
  const errorEl = document.getElementById('version-error');
  if (!name) { showError(errorEl, 'Le nom est obligatoire.'); return; }
  try {
    await apiFetch('/versions', { method: 'POST', body: JSON.stringify({ name, description: desc || null }) });
    await loadVersions();
    renderVersionsList();
    document.getElementById('new-version-name').value = '';
    document.getElementById('new-version-desc').value = '';
    errorEl.hidden = true;
  } catch (err) { showError(errorEl, err.message); }
}

async function deleteVersion(id) {
  if (!confirm('Supprimer cette version ? Les tâches associées seront détachées.')) return;
  try {
    await apiFetch(`/versions/${id}`, { method: 'DELETE' });
    await loadVersions();
    renderVersionsList();
    loadTasks();
  } catch (err) { alert(err.message); }
}

// ==========================================
// Vue SYNTHÈSE — Dashboard
// ==========================================

// Renvoie la date locale au format YYYY-MM-DD (évite le décalage UTC/local de toISOString)
function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function initSynthesisPeriod() {
  if (synthFrom) return; // déjà initialisé
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  synthTo   = toLocalDateStr(to);
  synthFrom = toLocalDateStr(from);
  document.getElementById('synth-from').value = synthFrom;
  document.getElementById('synth-to').value   = synthTo;
}

async function loadSynthesis() {
  initSynthesisPeriod();
  try {
    const projectParam = currentProject?.id ? `&projectId=${currentProject.id}` : '';
    const [mainData, archivedData] = await Promise.all([
      apiFetch(`/tasks?limit=500${projectParam}`),
      apiFetch(`/tasks?limit=500&status=archived${projectParam}`),
    ]);
    synthAllTasks = [...(mainData.tasks || []), ...(archivedData.tasks || [])];
    renderSynthesis();
  } catch (err) { console.error('Erreur dashboard:', err); }
}

function filterSynthByPeriod(tasks) {
  return tasks.filter(t => {
    const d = new Date(t.createdAt);
    if (synthFrom && d < new Date(synthFrom)) return false;
    if (synthTo   && d > new Date(synthTo + 'T23:59:59')) return false;
    return true;
  });
}

function filterSynthTasks() {
  return filterSynthByPeriod(synthAllTasks).filter(t => {
    if (!synthVersionFilter) return true;
    return t.Version ? String(t.Version.id) === synthVersionFilter : false;
  });
}

function renderSynthesis() {
  const tasks = filterSynthTasks();

  if (tasks.length === 0) {
    ['synth-kpi-row', 'synth-status-chart', 'synth-priority-chart',
     'synth-completion', 'synth-version-chart', 'synth-timing-card'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    const kpiRow = document.getElementById('synth-kpi-row');
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = synthAllTasks.length === 0
      ? 'Aucune tâche dans ce projet. Créez des tâches pour voir vos statistiques.'
      : 'Aucune tâche ne correspond aux filtres sélectionnés.';
    kpiRow.appendChild(p);
    return;
  }

  renderSynthKPIs(tasks);
  renderSynthStatusChart(tasks);
  renderSynthPriorityChart(tasks);
  renderSynthCompletion(tasks);
  renderSynthVersionChart();
  renderSynthTiming(tasks);
}

function renderSynthVersionChart() {
  const periodTasks = filterSynthByPeriod(synthAllTasks);

  const groups = {};
  periodTasks.forEach(t => {
    const key  = t.Version ? String(t.Version.id) : '__none__';
    const name = t.Version ? t.Version.name : 'Sans version';
    if (!groups[key]) groups[key] = { name, total: 0, done: 0, inProg: 0, todo: 0, isMuted: !t.Version };
    groups[key].total++;
    if      (t.status === 'done')        groups[key].done++;
    else if (t.status === 'in_progress') groups[key].inProg++;
    else if (t.status === 'todo')        groups[key].todo++;
  });

  const container = document.getElementById('synth-version-chart');
  container.innerHTML = '';

  const entries = Object.values(groups).sort((a, b) => b.total - a.total);
  if (entries.length === 0) {
    const p = document.createElement('p'); p.className = 'empty-state';
    p.textContent = 'Aucune tâche dans cette période.';
    container.appendChild(p); return;
  }

  const grid = document.createElement('div');
  grid.className = 'version-cards-grid';

  entries.forEach(({ name, total, done, inProg, todo, isMuted }, cardIdx) => {
    const donePct  = total ? Math.round(done  / total * 100) : 0;
    const progPct  = total ? Math.round(inProg / total * 100) : 0;
    const todoPct  = 100 - donePct - progPct;
    const doneDeg  = done  / (total || 1) * 360;
    const progDeg  = inProg / (total || 1) * 360;
    const isActive = synthVersionFilter &&
      versionsCache.find(v => String(v.id) === synthVersionFilter)?.name === name;

    const card = document.createElement('div');
    card.className = 'version-card' +
      (isActive  ? ' version-card--active' : '') +
      (isMuted   ? ' version-card--muted'  : '');
    card.style.animationDelay = (cardIdx * 60) + 'ms';

    // Nom
    const nameEl = document.createElement('div');
    nameEl.className = 'version-card-name';
    nameEl.textContent = name;

    // Nombre total
    const totalEl = document.createElement('div');
    totalEl.className = 'version-card-total';
    totalEl.textContent = `${total} tâche${total > 1 ? 's' : ''}`;

    // Disque (conic-gradient animé)
    const donut = document.createElement('div');
    donut.className = 'version-card-donut';
    donut.style.background = 'var(--border)';
    if (total > 0) {
      const delay = prefersReducedMotion() ? 0 : cardIdx * 60;
      setTimeout(() => {
        animateNumber(0, 1, 750, p => {
          const d = doneDeg * p, q = d + progDeg * p;
          donut.style.background =
            `conic-gradient(var(--success) 0deg ${d}deg, var(--primary) ${d}deg ${q}deg, var(--border) ${q}deg 360deg)`;
        });
      }, delay);
    }

    const inner = document.createElement('div');
    inner.className = 'version-card-donut-inner';
    const pctEl = document.createElement('div');
    pctEl.className = 'version-card-donut-pct';
    pctEl.textContent = donePct + '%';
    const subEl = document.createElement('div');
    subEl.className = 'version-card-donut-sub';
    subEl.textContent = 'terminé';
    inner.append(pctEl, subEl);
    donut.appendChild(inner);

    // Légende
    const legend = document.createElement('div');
    legend.className = 'version-card-legend';
    [
      { label: `${donePct}% Terminé`,  cls: 'dot-done'   },
      { label: `${progPct}% En cours`, cls: 'dot-inprog'  },
      { label: `${todoPct}% À faire`,  cls: 'dot-todo'    },
    ].forEach(({ label, cls }) => {
      const item = document.createElement('div');
      item.className = 'version-card-legend-item';
      const dot = document.createElement('span'); dot.className = `version-card-dot ${cls}`;
      const txt = document.createElement('span'); txt.textContent = label;
      item.append(dot, txt);
      legend.appendChild(item);
    });

    card.append(nameEl, totalEl, donut, legend);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderSynthKPIs(tasks) {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === 'done').length;
  const inProg  = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => isOverdue(t)).length;
  const pct     = total ? Math.round(done / total * 100) : 0;

  const container = document.getElementById('synth-kpi-row');
  container.innerHTML = '';

  [
    { num: total,  label: 'Tâches créées', suffix: '',          cls: '' },
    { num: done,   label: 'Terminées',     suffix: ` (${pct}%)`, cls: 'kpi-success' },
    { num: inProg, label: 'En cours',      suffix: '',          cls: 'kpi-info' },
    { num: overdue,label: 'En retard',     suffix: '',          cls: overdue > 0 ? 'kpi-danger' : '' },
  ].forEach(({ num, suffix, label, cls }, i) => {
    const card = document.createElement('div');
    card.className = `synth-kpi-card${cls ? ' ' + cls : ''} kpi-entering`;
    card.style.animationDelay = (i * 80) + 'ms';
    const v = document.createElement('div'); v.className = 'kpi-value';
    v.textContent = '0' + suffix;
    animateNumber(0, num, 650, val => { v.textContent = Math.round(val) + suffix; });
    const l = document.createElement('div'); l.className = 'kpi-label'; l.textContent = label;
    card.append(v, l);
    container.appendChild(card);
  });
}

function renderBarChart(containerId, entries) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  entries.forEach(({ label, cls, count, pct }) => {
    const row = document.createElement('div');
    row.className = 'bar-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'bar-label';
    labelEl.textContent = label;

    const track = document.createElement('div');
    track.className = 'bar-track';

    const fill = document.createElement('div');
    fill.className = `bar-fill ${cls}`;
    fill.style.width = '0%';
    const targetPct = pct;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.width = targetPct + '%';
    }));

    const countEl = document.createElement('span');
    countEl.className = 'bar-count';
    countEl.textContent = count;

    track.appendChild(fill);
    row.append(labelEl, track, countEl);
    container.appendChild(row);
  });
}

function renderSynthStatusChart(tasks) {
  const counts = { todo: 0, in_progress: 0, done: 0, archived: 0 };
  tasks.forEach(t => { if (t.status in counts) counts[t.status]++; });
  const total = tasks.length || 1;
  renderBarChart('synth-status-chart', [
    { key: 'todo',        label: 'À faire',  cls: 'bar-todo' },
    { key: 'in_progress', label: 'En cours', cls: 'bar-inprogress' },
    { key: 'done',        label: 'Terminé',  cls: 'bar-done' },
    { key: 'archived',    label: 'Archivé',  cls: 'bar-archived' },
  ].map(e => ({ ...e, count: counts[e.key], pct: Math.round(counts[e.key] / total * 100) })));
}

function renderSynthPriorityChart(tasks) {
  const counts = { high: 0, medium: 0, low: 0 };
  tasks.forEach(t => { if (t.priority in counts) counts[t.priority]++; });
  const total = tasks.length || 1;
  renderBarChart('synth-priority-chart', [
    { key: 'high',   label: 'Haute',   cls: 'bar-high' },
    { key: 'medium', label: 'Moyenne', cls: 'bar-medium' },
    { key: 'low',    label: 'Basse',   cls: 'bar-low' },
  ].map(e => ({ ...e, count: counts[e.key], pct: Math.round(counts[e.key] / total * 100) })));
}

function renderSynthCompletion(tasks) {
  const total = tasks.filter(t => t.status !== 'archived').length;
  const done  = tasks.filter(t => t.status === 'done').length;
  const pct   = total ? Math.round(done / total * 100) : 0;

  const container = document.getElementById('synth-completion');
  container.innerHTML = '';

  const ring = document.createElement('div');
  ring.className = 'completion-ring';
  ring.style.background = `conic-gradient(var(--success) 0deg, var(--border) 0deg)`;
  animateNumber(0, pct * 3.6, 900, deg => {
    ring.style.background = `conic-gradient(var(--success) ${deg}deg, var(--border) 0deg)`;
  });

  const inner = document.createElement('div');
  inner.className = 'completion-inner';

  const pctEl = document.createElement('div');
  pctEl.className = 'completion-pct';
  pctEl.textContent = pct + '%';

  const subEl = document.createElement('div');
  subEl.className = 'completion-sub';
  subEl.textContent = `${done} / ${total}`;

  inner.append(pctEl, subEl);
  ring.appendChild(inner);

  const labelEl = document.createElement('p');
  labelEl.className = 'completion-label';
  labelEl.textContent = 'tâches terminées';

  container.append(ring, labelEl);
}

function renderSynthTiming(tasks) {
  const completed = tasks.filter(t => t.startedAt && t.completedAt && t.status === 'done');
  const container = document.getElementById('synth-timing-card');
  container.innerHTML = '';

  const title = document.createElement('h4');
  title.className = 'synth-chart-title';
  title.textContent = 'Temps de traitement';
  container.appendChild(title);

  if (completed.length === 0) {
    const p = document.createElement('p');
    p.className = 'timing-empty';
    p.textContent = 'Aucune tâche terminée avec horodatage.';
    container.appendChild(p);
    return;
  }

  const durations = completed.map(t => new Date(t.completedAt) - new Date(t.startedAt));
  const avgMs     = durations.reduce((a, b) => a + b, 0) / durations.length;
  const sorted    = [...completed].sort((a, b) => durations[completed.indexOf(a)] - durations[completed.indexOf(b)]);
  const fastest   = sorted[0];
  const slowest   = sorted[sorted.length - 1];

  const strip = document.createElement('div');
  strip.className = 'timing-strip';

  [
    { heading: 'Durée moyenne',  value: formatMs(avgMs),                                                                        taskTitle: null,          cls: '' },
    { heading: 'Plus rapide',    value: formatMs(new Date(fastest.completedAt) - new Date(fastest.startedAt)), taskTitle: fastest.title, cls: 'timing-good' },
    { heading: 'Plus lente',     value: formatMs(new Date(slowest.completedAt) - new Date(slowest.startedAt)), taskTitle: slowest.title, cls: 'timing-warn' },
  ].forEach(({ heading, value, taskTitle, cls }) => {
    const cell = document.createElement('div');
    cell.className = 'timing-cell';

    const headEl = document.createElement('div');
    headEl.className = 'timing-cell-heading';
    headEl.textContent = heading;

    const valEl = document.createElement('div');
    valEl.className = `timing-cell-value${cls ? ' ' + cls : ''}`;
    valEl.textContent = value;

    cell.append(headEl, valEl);

    if (taskTitle) {
      const taskEl = document.createElement('div');
      taskEl.className = 'timing-cell-task';
      taskEl.textContent = taskTitle;
      cell.appendChild(taskEl);
    }

    strip.appendChild(cell);
  });

  container.appendChild(strip);
}

// ==========================================
// Initialisation
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Projets
  document.getElementById('add-project-btn').addEventListener('click', () => openProjectModal());
  document.getElementById('close-project-modal').addEventListener('click', closeProjectModal);
  document.getElementById('save-project').addEventListener('click', handleSaveProject);
  document.getElementById('back-to-projects').addEventListener('click', backToProjects);

  // Auth
  document.getElementById('login-submit').addEventListener('click', handleLogin);
  document.getElementById('register-submit').addEventListener('click', handleRegister);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('show-register').addEventListener('click', () => toggleAuthSection('register'));
  document.getElementById('show-login').addEventListener('click', () => toggleAuthSection('login'));

  // Profil
  document.getElementById('profile-btn').addEventListener('click', openProfile);
  document.getElementById('close-profile').addEventListener('click', closeProfile);
  document.getElementById('profile-save-btn').addEventListener('click', handleSaveProfile);
  document.getElementById('profile-logout').addEventListener('click', () => { closeProfile(); handleLogout(); });
  document.getElementById('delete-account-btn').addEventListener('click', handleDeleteAccount);

  // Versions
  document.getElementById('versions-btn').addEventListener('click', openVersionsModal);
  document.getElementById('close-versions').addEventListener('click', closeVersionsModal);
  document.getElementById('create-version-btn').addEventListener('click', handleCreateVersion);

  // Tâches
  document.getElementById('add-task-btn').addEventListener('click', () => openTaskModal());
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('save-task').addEventListener('click', handleSaveTask);

  // Vue
  document.getElementById('btn-list-view').addEventListener('click', () => switchView('list'));
  document.getElementById('btn-kanban-view').addEventListener('click', () => switchView('kanban'));
  document.getElementById('btn-synthesis-view').addEventListener('click', () => switchView('synthesis'));

  // Synthèse — presets période
  document.querySelectorAll('.period-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.dataset.days);
      const to   = new Date();
      const from = new Date();
      synthTo = toLocalDateStr(to);
      if (days > 0) {
        from.setDate(from.getDate() - days);
        synthFrom = toLocalDateStr(from);
      } else {
        synthFrom = null;
      }
      document.getElementById('synth-from').value = synthFrom || '';
      document.getElementById('synth-to').value   = synthTo;
      document.querySelectorAll('.period-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSynthesis();
    });
  });

  // Synthèse — filtre version
  document.getElementById('synth-version-filter').addEventListener('change', e => {
    synthVersionFilter = e.target.value;
    renderSynthesis();
  });

  // Synthèse — plage personnalisée
  document.getElementById('synth-apply').addEventListener('click', () => {
    synthFrom = document.getElementById('synth-from').value || null;
    synthTo   = document.getElementById('synth-to').value   || null;
    document.querySelectorAll('.period-preset').forEach(b => b.classList.remove('active'));
    renderSynthesis();
  });

  // Filtres
  document.getElementById('filter-status').addEventListener('change', () => { currentPage = 1; loadTasks(); });
  document.getElementById('filter-priority').addEventListener('change', () => { currentPage = 1; loadTasks(); });
  document.getElementById('filter-version').addEventListener('change', () => { currentPage = 1; loadTasks(); });

  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => { currentPage--; loadTasks(); });
  document.getElementById('next-page').addEventListener('click', () => { currentPage++; loadTasks(); });

  // RGPD
  document.getElementById('cookie-accept').addEventListener('click', acceptCookies);
  document.getElementById('cookie-refuse').addEventListener('click', refuseCookies);
  initCookieBanner();

  // DnD Kanban
  initKanbanDnD();

  // Lucide — icônes statiques du HTML
  lucide.createIcons();

  // Escape pour fermer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!document.getElementById('task-modal').hidden)     closeModal();
      if (!document.getElementById('profile-modal').hidden)  closeProfile();
      if (!document.getElementById('versions-modal').hidden) closeVersionsModal();
      if (!document.getElementById('project-modal').hidden)  closeProjectModal();
    }
  });

  // Restaurer session — le token JWT est dans un cookie HttpOnly, seul l'user est en sessionStorage
  const savedUser = sessionStorage.getItem('user');
  if (savedUser) {
    currentUser    = JSON.parse(savedUser);
    currentProject = null;
    showProjectsSection();
    loadProjects();
    loadVersions();
    // Rafraîchir les données profil (firstName/lastName) en arrière-plan
    apiFetch('/auth/me').then(fresh => {
      currentUser = { ...currentUser, ...fresh };
      sessionStorage.setItem('user', JSON.stringify(currentUser));
      document.getElementById('nav-username').textContent =
        [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email || '';
    }).catch(() => {});
  }
});
