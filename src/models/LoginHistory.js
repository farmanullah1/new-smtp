const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoginHistory = sequelize.define('LoginHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'success'
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'LoginHistories',
    timestamps: true
  });

  return LoginHistory;
};
