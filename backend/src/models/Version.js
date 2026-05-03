const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Version = sequelize.define('Version', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 100] },
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
}, { tableName: 'versions', underscored: true, timestamps: true });

module.exports = Version;
