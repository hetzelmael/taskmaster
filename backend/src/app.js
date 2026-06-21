if (!process.env.JEST_WORKER_ID && process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { randomUUID } = require('crypto');

const sequelize = require('./config/database');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const versionRoutes = require('./routes/versions');
const projectRoutes = require('./routes/projects');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
  })
);

app.use(cookieParser());

// Capture raw body for debugging when needed (verify stores raw in req.rawBody)
app.use(
  express.json({
    limit: '10kb',
    verify: (req, _res, buf, encoding) => {
      try {
        req.rawBody = buf && buf.toString(encoding || 'utf8');
      } catch (_e) {
        req.rawBody = undefined;
      }
    },
  })
);

// Request ID middleware - attach per-request UUID and echo in response header
app.use((req, res, next) => {
  try {
    const incoming = req.headers['x-request-id'];
    const id = incoming || randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id);
  } catch (_e) {
    // ignore
  }
  next();
});

// Compression gzip des réponses HTTP
app.use(compression());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
if (process.env.DISABLE_GLOBAL_RATE_LIMIT !== 'true') {
  app.use(globalLimiter);
} else {
  console.log('Global rate limiter disabled via DISABLE_GLOBAL_RATE_LIMIT');
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes' },
});
if (process.env.DISABLE_LOGIN_RATE_LIMIT !== 'true') {
  app.use('/api/auth/login', loginLimiter);
}

app.get('/health', async (_req, res) => {
  const { client } = require('./config/redis');
  let redisStatus = 'disconnected';
  try {
    if (client.isOpen) {
      await client.ping();
      redisStatus = 'ok';
    }
  } catch (_e) {
    /* Redis optionnel en dev */
  }
  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    redis: redisStatus,
  });
});

// Optional debug middleware to log raw body and headers for auth endpoints
if (process.env.DEBUG_AUTH_RAW === 'true') {
  app.use('/api/auth', (req, _res, next) => {
    console.log('---- DEBUG_AUTH_RAW ----');
    console.log('RequestId:', req.id);
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('RawBody:', req.rawBody);
    console.log('------------------------');
    next();
  });

  app.use('/api/auth/login', (req, res, next) => {
    res.on('finish', () => {
      try {
        console.log('AUTH RESP:', req.method, req.originalUrl, res.statusCode, 'reqId=', req.id);
      } catch (_e) { /* ignore */ }
    });
    next();
  });
}

// Response logging middleware: captures duration and a preview of response (no headers/cookies)
app.use((req, res, next) => {
  const start = Date.now();
  const oldSend = res.send;
  res.send = function (body) {
    res.__body = body;
    return oldSend.call(this, body);
  };

  res.on('finish', () => {
    try {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const path = req.originalUrl || req.url;
      const important =
        path.startsWith('/api/auth') || path.startsWith('/api/tasks') || status >= 400;
      if (important || process.env.DEBUG_AUTH_RAW === 'true') {
        let respPreview = '';
        try {
          if (res.__body) {
            respPreview =
              typeof res.__body === 'string'
                ? res.__body.slice(0, 300)
                : JSON.stringify(res.__body).slice(0, 300);
          }
        } catch (_e) {
          respPreview = '[unable to stringify response]';
        }
        console.log(
          `[REQLOG] reqId=${req.id} ${req.method} ${path} ${status} ${duration}ms respPreview=${respPreview}`
        );
      }
    } catch (e) {
      console.error('Error in response logging middleware', e);
    }
  });

  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/projects', projectRoutes);

app.use((err, req, res, _next) => {
  console.error(err);
  // If JSON parsing failed, log raw body and headers for debugging
  if (err && (err.type === 'entity.parse.failed' || err.statusCode === 400)) {
    try {
      console.error('BODY PARSE ERROR - headers:', JSON.stringify(req.headers));
      console.error('BODY PARSE ERROR - rawBody:', req.rawBody);
    } catch (_e) {
      console.error('Failed to log raw body');
    }
    return res.status(400).json({ error: 'Corps JSON invalide' });
  }
  res.status(500).json({ error: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  sequelize
    .authenticate()
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

process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED_REJECTION', { reason, promise: !!p });
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT_EXCEPTION', err && err.stack ? err.stack : err);
  if (process.env.NODE_ENV === 'production') { process.exit(1); }
});

module.exports = app;
