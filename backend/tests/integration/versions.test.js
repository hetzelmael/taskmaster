const request = require('supertest');
const app = require('../../src/app');
const { User, Version } = require('../../src/models');
const { client: redisClient } = require('../../src/config/redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

let authToken;
let testUserId;

beforeAll(async () => {
  const hash = await bcrypt.hash('TestMotDePasse1!', 12);
  const user = await User.create({
    email: 'test-versions@example.com',
    password: hash,
    firstName: 'Test',
    lastName: 'Versions',
  });
  testUserId = user.id;
  authToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );

  // Vider le cache Redis pour cet utilisateur avant les tests
  if (redisClient.isOpen) {
    await redisClient.del(`versions:user:${testUserId}`);
  }
});

afterAll(async () => {
  await Version.destroy({ where: { userId: testUserId } });
  await User.destroy({ where: { id: testUserId } });
});

describe('POST /api/versions', () => {
  test('doit créer une version — statut 201', async () => {
    const res = await request(app)
      .post('/api/versions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'v1.0', description: 'Première version' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('v1.0');
    expect(res.body.userId).toBe(testUserId);
  });

  test('doit refuser sans token — statut 401', async () => {
    const res = await request(app)
      .post('/api/versions')
      .send({ name: 'v2.0' });

    expect(res.status).toBe(401);
  });

  test('doit refuser un nom vide — statut 400', async () => {
    const res = await request(app)
      .post('/api/versions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/versions — cache Redis (NoSQL)', () => {
  test('doit retourner les versions — statut 200 (cache miss → PostgreSQL)', async () => {
    // Vider le cache pour forcer un hit PostgreSQL
    if (redisClient.isOpen) {
      await redisClient.del(`versions:user:${testUserId}`);
    }

    const res = await request(app)
      .get('/api/versions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('doit retourner les versions depuis le cache Redis (cache hit)', async () => {
    // Premier appel : peuple le cache
    await request(app)
      .get('/api/versions')
      .set('Authorization', `Bearer ${authToken}`);

    // Deuxième appel : doit venir du cache (même résultat)
    const res = await request(app)
      .get('/api/versions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Si Redis est connecté, vérifier que la clé de cache existe
    if (redisClient.isOpen) {
      const cached = await redisClient.get(`versions:user:${testUserId}`);
      expect(cached).not.toBeNull();
    }
  });
});

describe('DELETE /api/versions/:id', () => {
  test('doit supprimer une version et invalider le cache — statut 204', async () => {
    // Créer une version à supprimer
    const created = await request(app)
      .post('/api/versions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'v-à-supprimer' });

    const versionId = created.body.id;

    // Peupler le cache
    await request(app)
      .get('/api/versions')
      .set('Authorization', `Bearer ${authToken}`);

    // Supprimer
    const res = await request(app)
      .delete(`/api/versions/${versionId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    // Le cache doit être invalidé (clé supprimée)
    if (redisClient.isOpen) {
      const cached = await redisClient.get(`versions:user:${testUserId}`);
      expect(cached).toBeNull();
    }
  });

  test('ne doit pas supprimer la version d\'un autre utilisateur — IDOR 404', async () => {
    const other = await User.create({
      email: 'other-version@example.com',
      password: await bcrypt.hash('Other1!', 12),
      firstName: 'Other',
      lastName: 'User',
    });
    const otherVersion = await Version.create({
      name: 'v-privée',
      userId: other.id,
    });

    const res = await request(app)
      .delete(`/api/versions/${otherVersion.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);

    await otherVersion.destroy();
    await other.destroy();
  });
});
