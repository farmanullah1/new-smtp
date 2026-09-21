require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');

const { initDatabase, getActiveDialect, closeDatabase } = require('./src/config/database');
const { verifyEmailTransporter, getSmtpStatus } = require('./src/config/email');
const apiRoutes = require('./src/routes');
const webRoutes = require('./src/routes/web.routes');
const { notFoundHandler, errorHandler } = require('./src/middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Handlebars Web View Engine Setup ───
app.engine('handlebars', engine({
  extname: '.handlebars',
  defaultLayout: 'web',
  layoutsDir: path.join(__dirname, 'src/views/layouts'),
  partialsDir: path.join(__dirname, 'src/views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    add: (a, b) => Number(a) + Number(b),
    subtract: (a, b) => Number(a) - Number(b),
    json: (obj) => JSON.stringify(obj),
    formatDate: (d) => (d ? new Date(d).toLocaleDateString() : ''),
    userInitial: (name) => (name ? name[0].toUpperCase() : 'U'),
    currentYear: () => new Date().getFullYear()
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src/views/web'));

// ─── Request ID middleware ───
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ─── Response time middleware ───
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
      res.setHeader('X-Response-Time', `${elapsed.toFixed(2)}ms`);
    }
    return originalWriteHead.apply(this, args);
  };
  next();
});

// Security & utility middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allows email preview rendering in browser iframe
}));
app.use(cors());
app.use(morgan(':method :url :status :response-time ms - :res[x-request-id]'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static assets (CSS, JS, media)
app.use(express.static(path.join(__dirname, 'public')));

// Web Application Handlebars Routes
app.use('/', webRoutes);

// API v1 Routes
app.use('/api/v1', apiRoutes);

// 404 and Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Server startup ───
let server;
const startServer = async () => {
  try {
    console.log('[Server] Initializing database...');
    await initDatabase();

    console.log('[Server] Initializing email transporter...');
    await verifyEmailTransporter();

    server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 Handlebars Web App & API running on http://localhost:${PORT}`);
      console.log(`📊 Web Dashboard:       http://localhost:${PORT}/dashboard`);
      console.log(`🔐 Sign In:              http://localhost:${PORT}/login`);
      console.log(`📧 Live Email Previews: http://localhost:${PORT}/templates`);
      console.log(`🩺 Health Diagnostics:  http://localhost:${PORT}/diagnostics`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('[Server] Startup sequence failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

// ─── Graceful shutdown ───
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await closeDatabase();
        console.log('[Server] Database connections closed cleanly.');
      } catch (err) {
        console.error('[Server] Error closing database connections:', err.message);
      }
      process.exit(0);
    });

    // Force shutdown after 10s timeout
    setTimeout(() => {
      console.error('[Server] Forced shutdown timeout exceeded. Exiting.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

module.exports = app;
