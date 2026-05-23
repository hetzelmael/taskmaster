const { execSync } = require('child_process');
const { Client } = require('pg');

async function prepareDatabase() {
  const admin = new Client({
    connectionString: 'postgres://postgres:changeme@127.0.0.1:5433/postgres',
  });

  await admin.connect();
  await admin.query('DROP DATABASE IF EXISTS taskmaster_test WITH (FORCE);');
  await admin.query('CREATE DATABASE taskmaster_test;');
  await admin.end();

  const migrateEnv = {
    ...process.env,
    NODE_ENV: 'test',
    DB_HOST: '127.0.0.1',
    DB_PORT: '5433',
    DB_USER: 'postgres',
    DB_PASSWORD: 'changeme',
    DB_NAME: 'taskmaster_test',
  };

  execSync('npx sequelize-cli db:migrate', {
    stdio: 'inherit',
    env: migrateEnv,
  });

  const client = new Client({
    connectionString: 'postgres://postgres:changeme@127.0.0.1:5433/taskmaster_test',
  });

  await client.connect();
  await client.query(`
    GRANT CONNECT ON DATABASE taskmaster_test TO taskmaster_app;
    GRANT USAGE ON SCHEMA public TO taskmaster_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO taskmaster_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taskmaster_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO taskmaster_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO taskmaster_app;
  `);
  await client.end();
}

async function main() {
  await prepareDatabase();

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = '5433';
  process.env.DB_USER = 'taskmaster_app';
  process.env.DB_PASSWORD = 'app_secret';
  process.env.DB_NAME = 'taskmaster_test';
  process.env.JWT_SECRET = 'test-secret-key';
  delete process.env.DATABASE_URL;

  process.argv.push('--testPathPattern=tests/integration', '--runInBand', '--forceExit');
  require('jest/bin/jest');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
