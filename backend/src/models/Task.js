const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'todo',
    validate: { isIn: [['todo', 'in_progress', 'done', 'archived']] },
  },
  priority: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'medium',
    validate: { isIn: [['low', 'medium', 'high']] },
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'due_date',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'started_at',
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at',
  },
  versionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'version_id',
    references: { model: 'versions', key: 'id' },
    onDelete: 'SET NULL',
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'project_id',
    references: { model: 'projects', key: 'id' },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'tasks',
  underscored: true,
  timestamps: true,
});

User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId' });

module.exports = Task;
