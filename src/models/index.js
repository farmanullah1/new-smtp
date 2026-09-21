const { sequelize, initDatabase, getActiveDialect, onSequelizeChange } = require('../config/database');
const createUserModel = require('./User');
const createOtpModel = require('./Otp');
const createLoginHistoryModel = require('./LoginHistory');
const createItemModel = require('./Item');

// Instantiate models on the initial sequelize instance
let User = createUserModel(sequelize);
let Otp = createOtpModel(sequelize);
let LoginHistory = createLoginHistoryModel(sequelize);
let Item = createItemModel(sequelize);

/**
 * Establish all model associations.
 * Called on initial load and again after a sequelize instance swap (SQLite fallback).
 */
const setupAssociations = () => {
  // Clear any existing associations before re-establishing
  User.hasMany(Otp, { foreignKey: 'userId', as: 'otps', onDelete: 'CASCADE' });
  Otp.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistories', onDelete: 'CASCADE' });
  LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(Item, { foreignKey: 'userId', as: 'items', onDelete: 'CASCADE' });
  Item.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
};

// Set up associations for the initial instance
setupAssociations();

// Re-bind models if the sequelize instance changes (e.g., SQLite fallback)
onSequelizeChange((newSequelize) => {
  console.log('[Models] Re-initializing models on new Sequelize instance...');
  User = createUserModel(newSequelize);
  Otp = createOtpModel(newSequelize);
  LoginHistory = createLoginHistoryModel(newSequelize);
  Item = createItemModel(newSequelize);
  setupAssociations();
  console.log('[Models] Models re-bound and associations re-established.');
});

// Export getters so consumers always get the current model reference
module.exports = {
  get sequelize() { return require('../config/database').getSequelize(); },
  initDatabase,
  getActiveDialect,
  get User() { return User; },
  get Otp() { return Otp; },
  get LoginHistory() { return LoginHistory; },
  get Item() { return Item; }
};
