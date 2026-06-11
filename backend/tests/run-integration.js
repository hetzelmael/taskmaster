const { execSync } = require('child_process');
const { Client } = require('pg');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || '5432';
const ADMIN_USER = process.env.DB_ADMIN_USER || process.env.DB_USER || 'postgres';
const ADMIN_PASSWORD = process.env.DB_ADMIN_PASSWORD || process.env.DB_PASSWORD || 'changeme';
const APP_USER = process.env.DB_APP_USER || 'taskmaster_app';
const APP_PASSWORD = process.env.DB_APP_PASSWORD || 'app_secret';
const DB_NAME = process.env.DB_NAME || 'taskmaster_test';

async function prepareDatabase() {
  const admin = new Client({
    connectionString: `postgres://${ADMIN_USER}:${ADMIN_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres`,
  });

  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${DB_NAME}`);
  await admin.end();

  execSync('npx sequelize-cli db:migrate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DB_HOST,
      DB_PORT,
      DB_USER: ADMIN_USER,
      DB_PASSWORD: ADMIN_PASSWORD,
      DB_NAME,
    },
  });

  const client = new Client({
    connectionString: `postgres://${ADMIN_USER}:${ADMIN_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
  });
  await client.connect();
  try {
    await client.query(`
      GRANT CONNECT ON DATABASE ${DB_NAME} TO ${APP_USER};
      GRANT USAGE ON SCHEMA public TO ${APP_USER};
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER};
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_USER};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_USER};
    `);
  } catch (_e) { /* ignore — APP_USER n'existe pas en CI */ }
  await client.end();
}

async function main() {
  await prepareDatabase();

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = DB_HOST;
  process.env.DB_PORT = DB_PORT;
  process.env.DB_USER = process.env.DB_USER || APP_USER;
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || APP_PASSWORD;
  process.env.DB_NAME = DB_NAME;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  delete process.env.DATABASE_URL;

  process.argv.push('--testPathPattern=tests/integration', '--runInBand', '--forceExit');
  require('jest/bin/jest');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
