const { sequelize, initDatabase, getActiveDialect } = require('../config/database');
const createUserModel = require('./User');
const createOtpModel = require('./Otp');
const createLoginHistoryModel = require('./LoginHistory');
const createItemModel = require('./Item');

// Instantiate models
const User = createUserModel(sequelize);
const Otp = createOtpModel(sequelize);
const LoginHistory = createLoginHistoryModel(sequelize);
const Item = createItemModel(sequelize);

// Establish associations
User.hasMany(Otp, { foreignKey: 'userId', as: 'otps', onDelete: 'CASCADE' });
Otp.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistories', onDelete: 'CASCADE' });
LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Item, { foreignKey: 'userId', as: 'items', onDelete: 'CASCADE' });
Item.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

module.exports = {
  sequelize,
  initDatabase,
  getActiveDialect,
  User,
  Otp,
  LoginHistory,
  Item
};
