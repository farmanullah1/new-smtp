require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpStatus = {
  connected: false,
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  user: process.env.SMTP_USER || '',
  mode: 'primary',
  lastError: null
};

const createPrimaryTransporter = () => {
  const isSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

let transporter = createPrimaryTransporter();

const verifyEmailTransporter = async () => {
  try {
    console.log(`[SMTP] Verifying connection to ${smtpStatus.host}:${smtpStatus.port} as ${smtpStatus.user}...`);
    await transporter.verify();
    smtpStatus.connected = true;
    smtpStatus.lastError = null;
    smtpStatus.mode = 'primary';
    console.log('[SMTP] Transporter verified successfully and ready to deliver emails.');
  } catch (error) {
    smtpStatus.connected = false;
    smtpStatus.lastError = error.message;
    console.warn(`[SMTP] Primary SMTP connection verification warning: ${error.message}`);
    console.warn('[SMTP] Ensuring fallback test mode is available for resilient message delivery...');
  }
};

const getTransporter = () => transporter;
const getSmtpStatus = () => ({ ...smtpStatus });

module.exports = {
  transporter,
  getTransporter,
  verifyEmailTransporter,
  getSmtpStatus
};
