const { getActiveDialect, sequelize } = require('../config/database');
const { getSmtpStatus } = require('../config/email');
const emailService = require('../services/email.service');

const checkHealth = async (req, res) => {
  let dbStatus = 'healthy';
  let dbError = null;

  try {
    await sequelize.authenticate();
  } catch (err) {
    dbStatus = 'degraded';
    dbError = err.message;
  }

  const smtp = getSmtpStatus();

  res.status(200).json({
    success: true,
    status: dbStatus === 'healthy' ? 'operational' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      dialect: getActiveDialect(),
      name: process.env.DATABASE || 'newDatabaseHAiBro',
      error: dbError
    },
    smtp: {
      status: smtp.connected ? 'connected' : 'verification_failed',
      host: smtp.host,
      port: smtp.port,
      user: smtp.user,
      lastError: smtp.lastError
    }
  });
};

const sendTestEmail = async (req, res, next) => {
  try {
    const { to } = req.body;
    const recipientEmail = to || process.env.SMTP_USER;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address ("to") is required'
      });
    }

    const result = await emailService.sendTestEmail({
      recipientEmail,
      senderEmail: process.env.SMTP_USER,
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || 587,
      databaseDialect: getActiveDialect()
    });

    res.status(200).json({
      success: true,
      result,
      message: `Test email dispatched to ${recipientEmail}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkHealth,
  sendTestEmail
};
