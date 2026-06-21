'use strict';

module.exports = {
  async up(queryInterface) {
    const [cols] = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'versions' AND column_name = 'user_id'
    `);

    if (cols.length === 0) return; // Schéma déjà correct

    // Nullifier les références de tasks vers versions avant suppression
    await queryInterface.sequelize.query(
      'UPDATE tasks SET version_id = NULL WHERE version_id IS NOT NULL'
    );
    // Vider versions (données invalides : liées à des users, pas des projets)
    await queryInterface.sequelize.query('DELETE FROM versions');

    await queryInterface.sequelize.query(
      'ALTER TABLE versions DROP COLUMN user_id'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE versions ADD COLUMN project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE'
    );
  },

  async down() {},
};
