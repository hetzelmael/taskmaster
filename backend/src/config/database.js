const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const isJestRun = Boolean(process.env.JEST_WORKER_ID);
const developmentUrl =
  process.env.DATABASE_URL || 'postgres://taskmaster_app:app_secret@127.0.0.1:5433/taskmaster';
const testUrl = 'postgres://taskmaster_app:app_secret@127.0.0.1:5433/taskmaster_test';

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
