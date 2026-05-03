require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_APP_USER || 'taskmaster_app',
    password: process.env.DB_APP_PASSWORD || 'app_secret',
    database: process.env.DB_NAME || 'taskmaster',
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    dialect:  'postgres',
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'test_password',
    database: process.env.DB_NAME || 'taskmaster_test',
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    dialect:  'postgres',
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  },
};
