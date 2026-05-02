-- === init.sql — Initialisation de la base TaskMaster ===
-- Couvre : Sécurité BDD (CP 7.3), Procédures stockées (CP 8.2),
--          Triggers (CP 8.2), Transactions (CP 8.3)

-- =============================================
-- 1. CRÉATION DES TABLES (CP 7.2 — SQL DDL)
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,           -- Stocke le HASH bcrypt, jamais le mot de passe en clair !
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'done', 'archived')),  -- Contrainte CHECK
    priority VARCHAR(10) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- Clé étrangère avec CASCADE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================
-- 2. SÉCURITÉ BDD : Utilisateur applicatif (CP 7.3)
-- =============================================
-- Principe ANSSI : l'application ne doit PAS se connecter
-- avec le compte administrateur (postgres).
-- On crée un utilisateur avec des droits LIMITÉS.

DO $$
BEGIN
    -- Créer l'utilisateur applicatif s'il n'existe pas
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'taskmaster_app') THEN
        CREATE ROLE taskmaster_app WITH LOGIN PASSWORD 'app_secret';
    END IF;
END
$$;

-- Droits limités : SELECT, INSERT, UPDATE, DELETE uniquement sur nos tables
-- PAS de CREATE TABLE, DROP, ALTER (principe du moindre privilège)
GRANT CONNECT ON DATABASE taskmaster TO taskmaster_app;
GRANT USAGE ON SCHEMA public TO taskmaster_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, tasks TO taskmaster_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taskmaster_app;

-- Interdire la suppression de tables
REVOKE CREATE ON SCHEMA public FROM taskmaster_app;

-- =============================================
-- 3. TRIGGER : mise à jour automatique de updated_at (CP 8.2)
-- =============================================
-- Un trigger s'exécute automatiquement lors d'un événement

-- D'abord, la fonction qui sera appelée par le trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- NEW = la ligne après modification
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur la table users
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger sur la table tasks
CREATE OR REPLACE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 4. PROCÉDURE STOCKÉE : archiver les anciennes tâches (CP 8.2)
-- =============================================
-- Une procédure stockée est un programme SQL réutilisable

CREATE OR REPLACE PROCEDURE archive_old_tasks(days_old INTEGER DEFAULT 30)
LANGUAGE plpgsql
AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Utilisation d'une TRANSACTION implicite dans la procédure
    UPDATE tasks
    SET status = 'archived'
    WHERE status = 'done'
      AND updated_at < CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL;

    GET DIAGNOSTICS archived_count = ROW_COUNT;

    -- Log du résultat (visible dans les logs PostgreSQL)
    RAISE NOTICE 'Tâches archivées : %', archived_count;
END;
$$;

-- Appel : CALL archive_old_tasks(30);

-- =============================================
-- 5. EXEMPLE DE TRANSACTION EXPLICITE (CP 8.3)
-- =============================================
-- Cette procédure transfère toutes les tâches d'un utilisateur à un autre
-- de manière atomique (tout ou rien)

CREATE OR REPLACE PROCEDURE transfer_tasks(
    from_user_id INTEGER,
    to_user_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    task_count INTEGER;
BEGIN
    -- Vérifier que l'utilisateur cible existe
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = to_user_id) THEN
        RAISE EXCEPTION 'Utilisateur cible % introuvable', to_user_id;
    END IF;

    -- Compter les tâches à transférer
    SELECT COUNT(*) INTO task_count FROM tasks WHERE user_id = from_user_id;

    IF task_count = 0 THEN
        RAISE EXCEPTION 'Aucune tâche à transférer pour l''utilisateur %', from_user_id;
    END IF;

    -- Transférer (dans la transaction de la procédure)
    UPDATE tasks SET user_id = to_user_id WHERE user_id = from_user_id;

    RAISE NOTICE 'Transféré % tâches de l''utilisateur % vers %', task_count, from_user_id, to_user_id;
    -- Si une erreur survient ici, TOUT est annulé (ROLLBACK automatique)
END;
$$;

-- =============================================
-- 6. JEU D'ESSAI (CP 7.1 — données de test)
-- =============================================
-- Mot de passe haché pour "Test1234!" avec bcrypt
-- En vrai, on ne met JAMAIS de mots de passe dans un script SQL
-- Ceci est uniquement pour l'environnement de développement

-- INSERT INTO users (email, password, first_name, last_name)
-- VALUES ('demo@taskmaster.dev',
--   '$2b$12$LJ3m4ys8Xyb3Q9K5Vf9P9.abc123fakehash', -- hash bcrypt
--   'Demo', 'User');

DO $$ BEGIN RAISE NOTICE 'Base TaskMaster initialisée avec succès'; END $$;
