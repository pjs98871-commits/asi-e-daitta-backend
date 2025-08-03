const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      users: { read: true, write: false, delete: false },
      subscriptions: { read: true, write: false, delete: false },
      contacts: { read: true, write: true, delete: false },
      admin: { read: false, write: false, delete: false },
    },
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  accessLevel: {
    type: DataTypes.ENUM('read_only', 'moderator', 'admin', 'super_admin'),
    allowNull: false,
    defaultValue: 'read_only',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  lastAccessAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'admins',
});

module.exports = Admin;