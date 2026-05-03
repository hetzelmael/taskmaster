const { Sequelize } = require('sequelize');

const env = process.env.NODE_ENV || 'development';

const configs = {
  development: {
    url: process.env.DATABASE_URL || 'postgres://taskmaster:secret@localhost:5432/taskmaster',
    logging: console.log,
  },
  test: {
    url: process.env.DATABASE_URL || 'postgres://taskmaster:secret@localhost:5432/taskmaster_test',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  },
};

const config = configs[env];
const sequelize = new Sequelize(config.url, {
  logging: config.logging,
  dialectOptions: config.dialectOptions || {},
});

module.exports = sequelize;
