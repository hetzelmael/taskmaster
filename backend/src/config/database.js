const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const isJestRun = Boolean(process.env.JEST_WORKER_ID);

function buildDbUrl({ user, password, host, port, database }) {
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

const developmentUrl =
  process.env.DATABASE_URL ||
  buildDbUrl({
    user: process.env.DB_APP_USER || process.env.DB_USER || 'taskmaster_app',
    password: process.env.DB_APP_PASSWORD || process.env.DB_PASSWORD || 'app_secret',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'taskmaster',
  });

const testUrl =
  process.env.TEST_DATABASE_URL ||
  buildDbUrl({
    user: process.env.DB_APP_USER || process.env.DB_USER || 'taskmaster_app',
    password: process.env.DB_APP_PASSWORD || process.env.DB_PASSWORD || 'app_secret',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'taskmaster_test',
  });

const configs = {
  development: {
    url: developmentUrl,
    logging: console.log,
  },
  test: {
    url: isJestRun ? testUrl : process.env.DATABASE_URL || testUrl,
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    logging: false,
    dialectOptions:
      process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  },
};

const config = configs[env];
const sequelize = new Sequelize(config.url, {
  logging: config.logging,
  dialectOptions: config.dialectOptions || {},
});

module.exports = sequelize;
