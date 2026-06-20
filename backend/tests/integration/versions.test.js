const request = require('supertest');
const app = require('../../src/app');
const { User, Version, Project } = require('../../src/models');
const { client: redisClient, connectRedis } = require('../../src/config/redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let authToken;
let testUserId;
let testProjectId;

beforeAll(async () => {
  const hash = await bcrypt.hash('TestMotDePasse1!', 12);
  const user = await User.create({
    email: 'test-versions@example.com',
    password: hash,
    firstName: 'Test',
    lastName: 'Versions',
  });
  testUserId = user.id;
  authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '1h',
  });

  const project = await Project.create({
    name: 'Test Project',
    description: 'Project for version tests',
    userId: testUserId,
  });
  testProjectId = project.id;

  const redis = await connectRedis();
  await redis.set(`jwt:${authToken}`, String(testUserId), { EX: 3600 });
  await redis.del(`versions:project:${testProjectId}`);
});

afterAll(async () => {
  await Version.destroy({ where: { projectId: testProjectId } });
  await Project.destroy({ where: { id: testProjectId } });
  await User.destroy({ where: { id: testUserId } });
});

describe('POST /api/versions', () => {
  test('doit créer une version — statut 201', async () => {
    const res = await request(app)
      .post('/api/versions')
      .set('Cookie', `auth_token=${authToken}`)
      .send({ name: 'v1.0', description: 'Première version', projectId: testProjectId });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('v1.0');
    expect(res.body.projectId).toBe(testProjectId);
  });

  test('doit refuser sans token — statut 401', async () => {
    const res = await request(app).post('/api/versions').send({ name: 'v2.0', projectId: testProjectId });

    expect(res.status).toBe(401);
  });

  test('doit refuser un nom vide — statut 400', async () => {
    const res = await request(app)
      .post('/api/versions')
      .set('Cookie', `auth_token=${authToken}`)
      .send({ name: '', projectId: testProjectId });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/versions — cache Redis (NoSQL)', () => {
  test('doit retourner les versions — statut 200 (cache miss → PostgreSQL)', async () => {
    if (redisClient.isOpen) {
      await redisClient.del(`versions:project:${testProjectId}`);
    }

    const res = await request(app)
      .get(`/api/versions?projectId=${testProjectId}`)
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('doit retourner les versions depuis le cache Redis (cache hit)', async () => {
    await request(app)
      .get(`/api/versions?projectId=${testProjectId}`)
      .set('Cookie', `auth_token=${authToken}`);

    const res = await request(app)
      .get(`/api/versions?projectId=${testProjectId}`)
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    if (redisClient.isOpen) {
      const cached = await redisClient.get(`versions:project:${testProjectId}`);
      expect(cached).not.toBeNull();
    }
  });
});

describe('DELETE /api/versions/:id', () => {
  test('doit supprimer une version et invalider le cache — statut 204', async () => {
    const created = await request(app)
      .post('/api/versions')
      .set('Cookie', `auth_token=${authToken}`)
      .send({ name: 'v-à-supprimer', projectId: testProjectId });

    const versionId = created.body.id;

    await request(app)
      .get(`/api/versions?projectId=${testProjectId}`)
      .set('Cookie', `auth_token=${authToken}`);

    const res = await request(app)
      .delete(`/api/versions/${versionId}`)
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(204);

    if (redisClient.isOpen) {
      const cached = await redisClient.get(`versions:project:${testProjectId}`);
      expect(cached).toBeNull();
    }
  });

  test("ne doit pas supprimer la version d'un autre utilisateur — IDOR 404", async () => {
    await User.destroy({ where: { email: 'other-version@example.com' } });
    const other = await User.create({
      email: 'other-version@example.com',
      password: await bcrypt.hash('Other1!', 12),
      firstName: 'Other',
      lastName: 'User',
    });
    const otherProject = await Project.create({
      name: 'Other Project',
      userId: other.id,
    });
    const otherVersion = await Version.create({
      name: 'v-privée',
      projectId: otherProject.id,
    });

    const res = await request(app)
      .delete(`/api/versions/${otherVersion.id}`)
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(404);

    await otherVersion.destroy();
    await otherProject.destroy();
    await other.destroy();
  });
});
