#!/bin/bash
# Crée l'utilisateur applicatif avec le mot de passe injecté via DB_APP_PASSWORD.
# Exécuté par PostgreSQL au premier démarrage (docker-entrypoint-initdb.d).
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'taskmaster_app') THEN
        CREATE ROLE taskmaster_app WITH LOGIN PASSWORD '${DB_APP_PASSWORD}';
    END IF;
END
\$\$;
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO taskmaster_app;
GRANT USAGE ON SCHEMA public TO taskmaster_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, projects, tasks, versions TO taskmaster_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taskmaster_app;
REVOKE CREATE ON SCHEMA public FROM taskmaster_app;
EOSQL
