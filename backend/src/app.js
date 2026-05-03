require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const sequelize = require('./config/database');
const { connectRedis } = require('./config/redis');
const authRoutes    = require('./routes/auth');
const taskRoutes    = require('./routes/tasks');
const versionRoutes = require('./routes/versions');
const projectRoutes = require('./routes/projects');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
});
app.use('/api/auth/login', loginLimiter);

app.get('/health', async (_req, res) => {
  const { client } = require('./config/redis');
  let redisStatus = 'disconnected';
  try {
    if (client.isOpen) { await client.ping(); redisStatus = 'ok'; }
  } catch (_e) { /* Redis optionnel en dev */ }
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    redis: redisStatus,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/projects', projectRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  sequelize.authenticate()
    .then(async () => {
      console.log('Database connected');
      try {
        await connectRedis();
        console.log('Redis connected');
      } catch (err) {
        console.warn('Redis unavailable (non-fatal):', err.message);
      }
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
      process.exit(1);
    });
}

module.exports = app;
