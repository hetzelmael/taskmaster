// === tests/integration/projects.test.js ===
// Tests d'intégration — Gestion des projets (I19–I24)

const request = require('supertest');
const app = require('../../src/app');
const { User, Project, Task } = require('../../src/models');
const { connectRedis } = require('../../src/config/redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let authToken;
let testUserId;

beforeAll(async () => {
  const hash = await bcrypt.hash('TestMotDePasse1!', 12);
  const user = await User.create({
    email: 'test-projects@example.com',
    password: hash,
    firstName: 'Test',
    lastName: 'Projects',
  });
  testUserId = user.id;

  authToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );

  const redis = await connectRedis();
  await redis.set(`jwt:${authToken}`, String(testUserId), { EX: 3600 });
});

afterAll(async () => {
  await Task.destroy({ where: { userId: testUserId } });
  await Project.destroy({ where: { userId: testUserId } });
  await User.destroy({ where: { id: testUserId } });
});

// ==========================================
// I19–I21 : POST /api/projects
// ==========================================
describe('POST /api/projects', () => {
  test('I19 — doit créer un projet — statut 201', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', `auth_token=${authToken}`)
      .send({ name: 'Mon projet', description: 'Description test' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Mon projet');
    expect(res.body.userId).toBe(testUserId);
  });

  test('I20 — doit refuser sans token — statut 401', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Projet sans token' });

    expect(res.status).toBe(401);
  });

  test('I21 — doit refuser un nom vide — statut 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', `auth_token=${authToken}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});

// ==========================================
// I22 : GET /api/projects
// ==========================================
describe('GET /api/projects', () => {
  test('I22 — doit retourner la liste avec taskCounts — statut 200', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const project = res.body.find((p) => p.name === 'Mon projet');
    expect(project).toBeDefined();
    expect(project).toHaveProperty('taskCounts');
    expect(project.taskCounts).toHaveProperty('total');
    expect(project.taskCounts).toHaveProperty('todo');
    expect(project.taskCounts).toHaveProperty('in_progress');
    expect(project.taskCounts).toHaveProperty('done');
  });
});

// ==========================================
// I23–I24 : DELETE /api/projects/:id
// ==========================================
describe('DELETE /api/projects/:id', () => {
  test('I23 — doit supprimer le projet du propriétaire — statut 204', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Cookie', `auth_token=${authToken}`)
      .send({ name: 'Projet à supprimer' });

    const projectId = created.body.id;

    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(204);
  });

  test('I24 — ne doit pas supprimer le projet d\'un autre utilisateur — statut 404', async () => {
    await User.destroy({ where: { email: 'other-projects@example.com' } });
    const other = await User.create({
      email: 'other-projects@example.com',
      password: await bcrypt.hash('Other1!', 12),
      firstName: 'Other',
      lastName: 'User',
    });
    const otherProject = await Project.create({
      name: 'Projet privé',
      userId: other.id,
    });

    const res = await request(app)
      .delete(`/api/projects/${otherProject.id}`)
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(404);

    await otherProject.destroy();
    await other.destroy();
  });
});
