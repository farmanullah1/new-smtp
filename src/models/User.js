const { DataTypes } = require('sequelize');
const { ROLES } = require('../config/constants');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      },
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },
    pendingEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      },
      set(value) {
        if (value) {
          this.setDataValue('pendingEmail', value.toLowerCase().trim());
        } else {
          this.setDataValue('pendingEmail', null);
        }
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: ROLES.USER
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isTwoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active'
    }
  }, {
    tableName: 'Users',
    timestamps: true
  });

  return User;
};
