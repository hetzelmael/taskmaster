'use strict';

// Migration : ajouter CHECK sur tasks (status, priority) et triggers update_updated_at
// Ceci rapproche les migrations de ce qui est présent dans db/init.sql

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter contraintes CHECK
    await queryInterface.sequelize.query(
      "ALTER TABLE tasks ADD CONSTRAINT chk_tasks_status CHECK (status IN ('todo','in_progress','done','archived'))"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE tasks ADD CONSTRAINT chk_tasks_priority CHECK (priority IN ('low','medium','high'))"
    );

    // Fonction et trigger pour mettre à jour updated_at automatiquement
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(
      'CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();'
    );
    await queryInterface.sequelize.query(
      'CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();'
    );
  },

  async down(queryInterface, Sequelize) {
    // Supprimer triggers et fonction
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;');
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
