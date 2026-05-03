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
    });

    await queryInterface.createTable('versions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
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
    });

    await queryInterface.addColumn('tasks', 'project_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'projects', key: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addColumn('tasks', 'version_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'versions', key: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('tasks', 'started_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('tasks', 'completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('tasks', ['project_id'], { name: 'idx_tasks_project_id' });
    await queryInterface.addIndex('tasks', ['version_id'], { name: 'idx_tasks_version_id' });
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
