'use strict';

// Migration : ajout des tables projects et versions,
// et des colonnes project_id / version_id / started_at / completed_at sur tasks.
// up   → applique les changements
// down → les annule (rollback)

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, { ifNotExists: true });

    await queryInterface.createTable('versions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    }, { ifNotExists: true });

    await queryInterface.sequelize.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE');
    await queryInterface.sequelize.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version_id INTEGER REFERENCES versions(id) ON DELETE SET NULL');
    await queryInterface.sequelize.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP');
    await queryInterface.sequelize.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_tasks_project_id" ON "tasks" ("project_id")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_tasks_version_id" ON "tasks" ("version_id")');
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'idx_tasks_project_id');
    await queryInterface.removeIndex('tasks', 'idx_tasks_version_id');
    await queryInterface.removeColumn('tasks', 'completed_at');
    await queryInterface.removeColumn('tasks', 'started_at');
    await queryInterface.removeColumn('tasks', 'version_id');
    await queryInterface.removeColumn('tasks', 'project_id');
    await queryInterface.dropTable('versions');
    await queryInterface.dropTable('projects');
  },
};
