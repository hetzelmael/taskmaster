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
      .send({ email, password, firstName: 'Test', lastName: 'Auth' });

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
// Validation register — I02, I03
// ==========================================
describe('POST /api/auth/register — validation des champs', () => {
  test('I02 — prénom absent → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nofirstname@example.com', password: 'TestMotDePasse1!', lastName: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.msg === 'Prénom requis')).toBe(true);
  });

  test('I03 — nom absent → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nolastname@example.com', password: 'TestMotDePasse1!', firstName: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.msg === 'Nom requis')).toBe(true);
  });
});

// ==========================================
// GET et PUT /api/auth/me — I07–I10
// ==========================================
describe('GET /api/auth/me et PUT /api/auth/me', () => {
  let meToken;
  let meUserId;

  beforeAll(async () => {
    await User.destroy({ where: { email: 'test-me@example.com' } });
    const hash = await bcrypt.hash('TestMotDePasse1!', 12);
    const user = await User.create({
      email: 'test-me@example.com',
      password: hash,
      firstName: 'Prénom',
      lastName: 'Nom',
    });
    meUserId = user.id;
    meToken = jwt.sign(
      { userId: user.id, role: 'user' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    const redis = await connectRedis();
    await redis.set(`jwt:${meToken}`, String(meUserId), { EX: 3600 });
  });

  afterAll(async () => {
    await User.destroy({ where: { id: meUserId } });
  });

  test('I07 — GET /api/auth/me — token valide → 200 + profil', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `auth_token=${meToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test-me@example.com');
    expect(res.body).toHaveProperty('firstName');
    expect(res.body).toHaveProperty('lastName');
  });

  test('I08 — GET /api/auth/me — sans token → 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  test('I09 — PUT /api/auth/me — prénom et nom valides → 200 + profil mis à jour', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', `auth_token=${meToken}`)
      .send({ firstName: 'NouveauPrénom', lastName: 'NouveauNom' });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('NouveauPrénom');
    expect(res.body.lastName).toBe('NouveauNom');
  });

  test('I10 — PUT /api/auth/me — prénom absent → 400', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', `auth_token=${meToken}`)
      .send({ lastName: 'Nom' });

    expect(res.status).toBe(400);
  });
});

// ==========================================
// DELETE /api/auth/me — I11, I12
// ==========================================
describe('DELETE /api/auth/me', () => {
  let deleteToken;

  beforeAll(async () => {
    await User.destroy({ where: { email: 'test-delete-me@example.com' } });
    const hash = await bcrypt.hash('TestMotDePasse1!', 12);
    const user = await User.create({
      email: 'test-delete-me@example.com',
      password: hash,
      firstName: 'Delete',
      lastName: 'Me',
    });
    deleteToken = jwt.sign(
      { userId: user.id, role: 'user' },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    const redis = await connectRedis();
    await redis.set(`jwt:${deleteToken}`, String(user.id), { EX: 3600 });
  });

  test('I12 — sans token → 401', async () => {
    const res = await request(app).delete('/api/auth/me');

    expect(res.status).toBe(401);
  });

  test('I11 — token valide → 204 + compte supprimé (RGPD)', async () => {
    const res = await request(app)
      .delete('/api/auth/me')
      .set('Cookie', `auth_token=${deleteToken}`);

    expect(res.status).toBe(204);
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
