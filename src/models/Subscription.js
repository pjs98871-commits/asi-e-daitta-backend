const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  planType: {
    type: DataTypes.ENUM('basic', 'premium', 'enterprise', 'newsletter'),
    allowNull: false,
    defaultValue: 'basic',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'expired', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  renewalDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD',
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  paymentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isAutoRenewal: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'subscriptions',
});

module.exports = Subscription;