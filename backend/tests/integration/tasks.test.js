// === tests/integration/tasks.test.js ===
// Tests d'intégration avec Supertest — CP 9.2
// Un test d'intégration vérifie que plusieurs composants
// fonctionnent ENSEMBLE (routes + contrôleur + middleware + BDD)

const request = require('supertest');
const app = require('../../src/app');
const { User, Task } = require('../../src/models');
const { connectRedis } = require('../../src/config/redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Variables partagées entre les tests
let authToken;
let testUserId;

// --- SETUP : avant tous les tests ---
beforeAll(async () => {
  // Créer un utilisateur de test
  const hash = await bcrypt.hash('TestMotDePasse1!', 12);
  const user = await User.create({
    email: 'test-integration@example.com',
    password: hash,
    firstName: 'Test',
    lastName: 'User',
  });
  testUserId = user.id;

  // Générer un JWT valide pour les requêtes authentifiées
  authToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );

  // Stocker le token dans Redis pour que le middleware l'accepte
  const redis = await connectRedis();
  await redis.set(`jwt:${authToken}`, String(testUserId), { EX: 3600 });
});

// --- CLEANUP : après tous les tests ---
afterAll(async () => {
  await Task.destroy({ where: { userId: testUserId } });
  await User.destroy({ where: { id: testUserId } });
});

// ==========================================
// Tests de la route POST /api/tasks
// ==========================================
describe('POST /api/tasks', () => {
  test('doit créer une tâche avec un JWT valide — statut 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`) // Header JWT
      .send({
        title: 'Tâche de test intégration',
        description: 'Ceci est un test',
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Tâche de test intégration');
    expect(res.body.userId).toBe(testUserId);
  });

  test('doit refuser sans token — statut 401', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Sans token' });

    expect(res.status).toBe(401);
  });

  test('doit refuser un titre vide — statut 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
  });
});

// ==========================================
// Tests de la route GET /api/tasks
// ==========================================
describe('GET /api/tasks', () => {
  test("doit retourner les tâches de l'utilisateur — statut 200", async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test('doit filtrer par priorité', async () => {
    const res = await request(app)
      .get('/api/tasks?priority=high')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    // Toutes les tâches retournées doivent être "high"
    res.body.tasks.forEach((task) => {
      expect(task.priority).toBe('high');
    });
  });
});

// ==========================================
// Tests de sécurité IDOR — GET /api/tasks/:id
// ==========================================
describe('GET /api/tasks/:id — protection IDOR', () => {
  test("doit retourner une tâche appartenant à l'utilisateur — statut 200", async () => {
    const ownedTask = await Task.create({
      title: 'Tâche propriétaire',
      userId: testUserId,
      status: 'todo',
      priority: 'medium',
    });

    const res = await request(app)
      .get(`/api/tasks/${ownedTask.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ownedTask.id);
    expect(res.body.userId).toBe(testUserId);

    await ownedTask.destroy();
  });

  test("ne doit PAS exposer la tâche d'un autre utilisateur", async () => {
    // Créer une tâche appartenant à un AUTRE utilisateur
    await User.destroy({ where: { email: 'other@example.com' } });
    const otherUser = await User.create({
      email: 'other@example.com',
      password: await bcrypt.hash('Other1!', 12),
      firstName: 'Other',
      lastName: 'User',
    });
    const otherTask = await Task.create({
      title: 'Tâche privée',
      userId: otherUser.id,
      status: 'todo',
      priority: 'low',
    });

    // Essayer d'y accéder avec le token du premier utilisateur
    const res = await request(app)
      .get(`/api/tasks/${otherTask.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Doit recevoir 404, PAS 200
    expect(res.status).toBe(404);

    // Cleanup
    await otherTask.destroy();
    await otherUser.destroy();
  });
});

// ==========================================
// Tests de la route PUT /api/tasks/:id
// ==========================================
describe('PUT /api/tasks/:id', () => {
  let taskId;
  let otherUserPut;
  let otherTaskPut;

  beforeAll(async () => {
    const task = await Task.create({
      title: 'Tâche à modifier',
      userId: testUserId,
      status: 'todo',
      priority: 'medium',
    });
    taskId = task.id;

    // Cleanup stale records from any previous failed run
    await User.destroy({ where: { email: 'other-put@example.com' } });
    otherUserPut = await User.create({
      email: 'other-put@example.com',
      password: await bcrypt.hash('Other1!', 12),
      firstName: 'Other',
      lastName: 'User',
    });
    otherTaskPut = await Task.create({
      title: 'Tâche privée PUT',
      userId: otherUserPut.id,
      status: 'todo',
      priority: 'low',
    });
  });

  afterAll(async () => {
    await Task.destroy({ where: { id: taskId } });
    if (otherTaskPut) { await otherTaskPut.destroy(); }
    if (otherUserPut) { await otherUserPut.destroy(); }
  });

  test('doit mettre à jour le titre — statut 200', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Titre modifié' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Titre modifié');
  });

  test('doit accepter une transition de statut valide (todo → in_progress)', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  test('doit rejeter une transition de statut invalide (todo → done) — statut 400', async () => {
    const newTask = await Task.create({
      title: 'Tâche transition invalide',
      userId: testUserId,
      status: 'todo',
      priority: 'low',
    });

    const res = await request(app)
      .put(`/api/tasks/${newTask.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'done' });

    expect(res.status).toBe(400);

    await newTask.destroy();
  });

  test('ne doit pas modifier la tâche d\'un autre utilisateur — statut 404', async () => {
    const res = await request(app)
      .put(`/api/tasks/${otherTaskPut.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Tentative de modification' });

    expect(res.status).toBe(404);
  });
});

// ==========================================
// Tests de la route DELETE /api/tasks/:id
// ==========================================
describe('DELETE /api/tasks/:id', () => {
  let otherUserDelete;
  let otherTaskDelete;

  beforeAll(async () => {
    await User.destroy({ where: { email: 'other-delete@example.com' } });
    otherUserDelete = await User.create({
      email: 'other-delete@example.com',
      password: await bcrypt.hash('Other1!', 12),
      firstName: 'Other',
      lastName: 'User',
    });
    otherTaskDelete = await Task.create({
      title: 'Tâche privée DELETE',
      userId: otherUserDelete.id,
      status: 'todo',
      priority: 'low',
    });
  });

  afterAll(async () => {
    if (otherTaskDelete) { await otherTaskDelete.destroy().catch(() => {}); }
    if (otherUserDelete) { await otherUserDelete.destroy(); }
  });

  test('doit supprimer une tâche appartenant à l\'utilisateur — statut 204', async () => {
    const task = await Task.create({
      title: 'Tâche à supprimer',
      userId: testUserId,
      status: 'todo',
      priority: 'low',
    });

    const res = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);
  });

  test('ne doit pas supprimer la tâche d\'un autre utilisateur — statut 404', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${otherTaskDelete.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});

// ==========================================
// Test du healthcheck
// ==========================================
describe('GET /health', () => {
  test('doit retourner OK — statut 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
