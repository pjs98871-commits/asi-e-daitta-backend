const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true,
    },
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'moderator'),
    defaultValue: 'user',
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  profileImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

// 인스턴스 메서드
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.emailVerificationToken;
  delete values.passwordResetToken;
  return values;
};

module.exports = User;