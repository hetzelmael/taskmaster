const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] },
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
}, { tableName: 'projects', underscored: true, timestamps: true });

module.exports = Project;
