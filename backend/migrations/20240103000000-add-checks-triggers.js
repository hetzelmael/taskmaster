'use strict';

// Migration : ajouter CHECK sur tasks (status, priority) et triggers update_updated_at
// Ceci rapproche les migrations de ce qui est présent dans db/init.sql

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter contraintes CHECK si elles n'existent pas
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_status'
        ) THEN
          ALTER TABLE tasks ADD CONSTRAINT chk_tasks_status CHECK (status IN ('todo','in_progress','done','archived'));
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_tasks_priority'
        ) THEN
          ALTER TABLE tasks ADD CONSTRAINT chk_tasks_priority CHECK (priority IN ('low','medium','high'));
        END IF;
      EXCEPTION WHEN undefined_table THEN
        -- Si la table n'existe pas encore (ex: premier run), on ignore
        NULL;
      END$$;
    `);

    // Fonction update_updated_at : CREATE OR REPLACE est idempotent
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Créer les triggers seulement si non présents
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at'
        ) THEN
          EXECUTE 'CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tasks_updated_at'
        ) THEN
          EXECUTE 'CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_updated_at'
        ) THEN
          EXECUTE 'CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_versions_updated_at'
        ) THEN
          EXECUTE 'CREATE TRIGGER trg_versions_updated_at BEFORE UPDATE ON versions FOR EACH ROW EXECUTE FUNCTION update_updated_at();';
        END IF;
      EXCEPTION WHEN undefined_table THEN
        NULL;
      END$$;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Supprimer triggers et fonction
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;');
    await queryInterface.sequelize.query(
      'DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;'
    );
    await queryInterface.sequelize.query(
      'DROP TRIGGER IF EXISTS trg_versions_updated_at ON versions;'
    );
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_users_updated_at ON users;');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_updated_at();');

    // Supprimer contraintes CHECK
    await queryInterface.sequelize.query(
      'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_tasks_status'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS chk_tasks_priority'
    );
  },
};
