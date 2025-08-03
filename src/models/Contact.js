const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  company: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 200],
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 5000],
    },
  },
  category: {
    type: DataTypes.ENUM('general', 'support', 'sales', 'technical', 'billing', 'feedback'),
    allowNull: false,
    defaultValue: 'general',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  },
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'resolved', 'closed'),
    allowNull: false,
    defaultValue: 'new',
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  responseMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
}, {
  tableName: 'contacts',
});

module.exports = Contact;