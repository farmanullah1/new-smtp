require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');

const { initDatabase, getActiveDialect } = require('./src/config/database');
const { closeDatabase } = require('./src/config/database');
const { verifyEmailTransporter, getSmtpStatus } = require('./src/config/email');
const apiRoutes = require('./src/routes');
const { notFoundHandler, errorHandler } = require('./src/middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

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
  contentSecurityPolicy: false // Allows email preview rendering in browser
}));
app.use(cors());
app.use(morgan(':method :url :status :response-time ms - :req[x-request-id]'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Friendly API root / welcome dashboard
app.get('/', (req, res) => {
  const smtp = getSmtpStatus();
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>SMTP Backend Suite & API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
        .wrapper { max-width: 860px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        h1 { color: #60a5fa; margin-top: 0; font-size: 28px; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .badge-success { background: #065f46; color: #34d399; }
        .badge-warning { background: #78350f; color: #fbbf24; }
        .badge-info { background: #1e3a8a; color: #93c5fd; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin: 24px 0; }
        .card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 18px; }
        .card h3 { margin: 0 0 8px 0; font-size: 16px; color: #f1f5f9; }
        .card p { margin: 0; font-size: 13px; color: #94a3b8; }
        .btn-group { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 12px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
        .btn:hover { background: #1d4ed8; }
        .btn-alt { background: #334155; color: #f8fafc; }
        .btn-alt:hover { background: #475569; }
        code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <h1>🔐 SMTP Backend Suite & Authentication API</h1>
        <p>
          Production-grade Node.js backend equipped with dynamic Handlebars email templating,
          cryptographic OTP verification, comprehensive authentication workflows, and full resource CRUD operations.
        </p>

        <div class="grid">
          <div class="card">
            <h3>Database Status</h3>
            <p>Dialect: <code>${getActiveDialect()}</code></p>
            <p style="margin-top: 6px;"><span class="badge badge-success">Connected</span></p>
          </div>
          <div class="card">
            <h3>SMTP Service</h3>
            <p>Host: <code>${smtp.host}:${smtp.port}</code></p>
            <p style="margin-top: 6px;">
              <span class="badge ${smtp.connected ? 'badge-success' : 'badge-warning'}">
                ${smtp.connected ? 'Verified Ready' : 'Standby / Fallback'}
              </span>
            </p>
          </div>
          <div class="card">
            <h3>Templating Engine</h3>
            <p>Handlebars with responsive <code>main.handlebars</code> master layout & dark mode support.</p>
          </div>
        </div>

        <div class="btn-group">
          <a href="/api/v1/previews" class="btn">Live Email Previews &rarr;</a>
          <a href="/api/v1/health" class="btn btn-alt">System Health JSON</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API Routes
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
      console.log(`🚀 Server successfully listening on http://localhost:${PORT}`);
      console.log(`📧 Live Email Previews: http://localhost:${PORT}/api/v1/previews`);
      console.log(`🩺 Health Diagnostics:  http://localhost:${PORT}/api/v1/health`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error(`[Server Startup Failure] ${error.message}`);
    process.exit(1);
  }
};

// ─── Graceful shutdown ───
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed. No longer accepting connections.');
    });
  }

  try {
    await closeDatabase();
  } catch (err) {
    console.error(`[Server] Error during database shutdown: ${err.message}`);
  }

  console.log('[Server] Shutdown complete. Goodbye.');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = app;
