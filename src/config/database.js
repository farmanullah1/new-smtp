require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const server = process.env.SERVER || 'localhost';
const database = process.env.DATABASE || 'newDatabaseHAiBro';
const dbPort = parseInt(process.env.DB_PORT, 10) || 1433;

let sequelize;
let activeDialect = 'mssql';

// Build MSSQL instance with Windows Auth or credentials
const createMssqlSequelize = () => {
  return new Sequelize(database, process.env.DB_USER || null, process.env.DB_PASS || null, {
    host: server,
    port: dbPort,
    dialect: 'mssql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : false,
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 8000,
        requestTimeout: 15000,
        // If no user is passed, use Windows Integrated Authentication if supported
        trustedConnection: !process.env.DB_USER
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
};

const createSqliteSequelize = () => {
  const storagePath = path.resolve(__dirname, '../../database.sqlite');
  console.log(`[Database] Initializing SQLite embedded database at: ${storagePath}`);
  return new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : false
  });
};

// Initialize with MSSQL by default or fallback
sequelize = createMssqlSequelize();

const initDatabase = async () => {
  try {
    console.log(`[Database] Attempting connection to Microsoft SQL Server (${server}/${database})...`);
    await sequelize.authenticate();
    console.log('[Database] Connected successfully to Microsoft SQL Server.');
    activeDialect = 'mssql';
  } catch (mssqlError) {
    console.warn(`[Database] MSSQL connection failed: ${mssqlError.message}`);
    console.warn('[Database] Falling back to high-performance local SQLite storage for seamless operation...');
    sequelize = createSqliteSequelize();
    await sequelize.authenticate();
    console.log('[Database] Connected successfully to SQLite database.');
    activeDialect = 'sqlite';
  }

  // Synchronize models
  await sequelize.sync();
  console.log('[Database] All models synchronized successfully.');
  return sequelize;
};

const getSequelize = () => sequelize;
const getActiveDialect = () => activeDialect;

module.exports = {
  sequelize,
  getSequelize,
  getActiveDialect,
  initDatabase
};
