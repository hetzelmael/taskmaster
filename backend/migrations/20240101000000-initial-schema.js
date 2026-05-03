'use strict';

// Migration initiale : création des tables users et tasks
// Commandes :
//   npx sequelize-cli db:migrate          → applique cette migration
//   npx sequelize-cli db:migrate:undo     → annule (supprime les tables)

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
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

    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'todo',
      },
      priority: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'medium',
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
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

    // Index pour optimiser les requêtes fréquentes
    await queryInterface.addIndex('tasks', ['user_id'],  { name: 'idx_tasks_user_id' });
    await queryInterface.addIndex('tasks', ['status'],   { name: 'idx_tasks_status' });
    await queryInterface.addIndex('tasks', ['priority'], { name: 'idx_tasks_priority' });
    await queryInterface.addIndex('users', ['email'],    { name: 'idx_users_email' });
  },

  async down(queryInterface) {
    // Supprimer dans l'ordre inverse (contrainte FK)
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('users');
  },
};
