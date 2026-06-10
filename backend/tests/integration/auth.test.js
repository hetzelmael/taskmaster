// === tests/integration/auth.test.js ===
// Tests d'intégration — Authentification, Rate limiting, Gestion d'erreurs

const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const { connectRedis } = require('../../src/config/redis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ==========================================
// Authentification
// ==========================================
describe('Authentification', () => {
  const email = 'test-auth-suite@example.com';
  const password = 'TestMotDePasse1!';

  afterAll(async () => {
    await User.destroy({ where: { email } });
  });

  test('POST /api/auth/register — doit créer un compte — statut 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, firstName: 'Test', lastName: 'Auth' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
  });

  test('POST /api/auth/register — doit refuser un email déjà utilisé — statut 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password });

    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login — doit poser le cookie auth_token — statut 200', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/auth_token=/);
    expect(res.body.user.email).toBe(email);
  });

  test('POST /api/auth/login — doit refuser un mauvais mot de passe — statut 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'MauvaisMotDePasse1!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Identifiants invalides');
  });
});

// ==========================================
// Rate limiting — limiter de connexion
// ==========================================
describe('Rate limiting — POST /api/auth/login', () => {
  // Note : le module app est isolé par Jest → le compteur loginLimiter repart de 0.
  // Les 2 appels du describe Authentification (valid + bad) + 2 appels beforeAll = 4 tentatives.
  // Test 1 → 5e tentative → 401 (mauvais mdp, sous le seuil de 5 refus)
  // Test 2 → 6e tentative → 429 (rate limit dépassé)

  const email = 'ratelimit-target@example.com';
  const password = 'TestMotDePasse1!';

  beforeAll(async () => {
    const hash = await bcrypt.hash(password, 12);
    await User.create({ email, password: hash, firstName: 'Rate', lastName: 'Limit' });

    // Consommer 2 tentatives supplémentaires pour atteindre 4 au total avant les tests
    await request(app).post('/api/auth/login').send({ email, password: 'Wrong1!' });
    await request(app).post('/api/auth/login').send({ email, password: 'Wrong2!' });
  });

  afterAll(async () => {
    await User.destroy({ where: { email } });
  });

  test('5e tentative — doit retourner 401 (mauvais mot de passe, pas encore limité)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'Wrong3!' });

    expect(res.status).toBe(401);
  });

  test('6e tentative — doit retourner 429 (rate limit dépassé)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'Wrong4!' });

    expect(res.status).toBe(429);
  });
});

// ==========================================
// Gestion d'erreurs
// ==========================================
describe("Gestion d'erreurs", () => {
  let authToken;

  beforeAll(async () => {
    // Générer un token directement sans faire de requête login
    authToken = jwt.sign(
      { userId: 0, role: 'user' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );

    // Stocker le token dans Redis pour que le middleware l'accepte
    const redis = await connectRedis();
    await redis.set(`jwt:${authToken}`, '0', { EX: 3600 });
  });

  test('GET /api/route-inexistante — doit retourner 404', async () => {
    const res = await request(app).get('/api/route-inexistante');

    expect(res.status).toBe(404);
  });

  test('DELETE /api/tasks/99999 — tâche inexistante doit retourner 404', async () => {
    const res = await request(app)
      .delete('/api/tasks/99999')
      .set('Cookie', `auth_token=${authToken}`);

    expect(res.status).toBe(404);
  });
});
