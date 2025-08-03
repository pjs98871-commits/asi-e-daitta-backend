const { sequelize } = require('../config/database');
const User = require('./User');
const Subscription = require('./Subscription');
const Contact = require('./Contact');
const Admin = require('./Admin');

// 모델 관계 정의
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Admin, { foreignKey: 'userId', as: 'adminProfile' });
Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Contact.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
User.hasMany(Contact, { foreignKey: 'assignedTo', as: 'assignedContacts' });

Admin.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Subscription,
  Contact,
  Admin,
};