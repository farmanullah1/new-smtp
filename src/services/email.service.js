const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { getTransporter, getSmtpStatus } = require('../config/email');

const viewsDir = path.resolve(__dirname, '../views');
const layoutsDir = path.join(viewsDir, 'layouts');
const emailsDir = path.join(viewsDir, 'emails');

// ─── Register Handlebars helpers ───
handlebars.registerHelper('eq', (a, b) => a === b);
handlebars.registerHelper('year', () => new Date().getFullYear());
handlebars.registerHelper('uppercase', (str) => (typeof str === 'string' ? str.toUpperCase() : ''));
handlebars.registerHelper('lowercase', (str) => (typeof str === 'string' ? str.toLowerCase() : ''));
handlebars.registerHelper('truncate', (str, len) => {
  if (typeof str !== 'string') return '';
  const limit = typeof len === 'number' ? len : 50;
  return str.length > limit ? str.substring(0, limit) + '...' : str;
});
handlebars.registerHelper('dateFormat', (date) => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
  } catch {
    return String(date);
  }
});

// ─── Template cache ───
const templateCache = new Map();

const loadTemplate = (templateName) => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(emailsDir, `${templateName}.handlebars`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}`);
  }

  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const compiled = handlebars.compile(templateContent);
  templateCache.set(templateName, compiled);
  return compiled;
};

const loadLayout = (layoutName = 'main') => {
  const layoutCacheKey = `layout_${layoutName}`;
  if (templateCache.has(layoutCacheKey)) {
    return templateCache.get(layoutCacheKey);
  }

  const layoutPath = path.join(layoutsDir, `${layoutName}.handlebars`);
  if (!fs.existsSync(layoutPath)) {
    throw new Error(`Email layout not found: ${layoutName}`);
  }

  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  const compiled = handlebars.compile(layoutContent);
  templateCache.set(layoutCacheKey, compiled);
  return compiled;
};

/**
 * Split an OTP code string into an array of individual digit strings
 * for rendering individual digit cells in email templates.
 */
const splitOtpDigits = (otpCode) => {
  if (!otpCode) return [];
  return String(otpCode).split('');
};

/**
 * Render email HTML using Handlebars template inside layout
 */
const renderEmailHtml = (templateName, data = {}, layoutName = 'main') => {
  const template = loadTemplate(templateName);
  const layout = loadLayout(layoutName);

  const enrichedData = {
    appName: process.env.APP_NAME || 'Farmanullah Ansari Company',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    currentYear: new Date().getFullYear(),
    formattedDate: new Date().toUTCString(),
    ...data
  };

  // Auto-generate otpDigits array if otpCode is present
  if (enrichedData.otpCode && !enrichedData.otpDigits) {
    enrichedData.otpDigits = splitOtpDigits(enrichedData.otpCode);
  }

  const bodyHtml = template(enrichedData);
  const finalHtml = layout({
    ...enrichedData,
    body: bodyHtml
  });

  return { html: finalHtml, data: enrichedData };
};

/**
 * Send an email with automatic retry on transient failures
 */
const sendEmailWithRetry = async (mailOptions, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const transporter = getTransporter();
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms
        console.warn(`[Email] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

/**
 * Send an email using Nodemailer and compiled Handlebars template
 */
const sendEmail = async ({ to, subject, templateName, context = {}, layoutName = 'main' }) => {
  const { html, data } = renderEmailHtml(templateName, { recipientEmail: to, subject, ...context }, layoutName);

  const defaultFrom = process.env.MAIL_FROM || `"Farmanullah Ansari Company" <${process.env.SMTP_USER || 'no-reply@localhost'}>`;
  const mailOptions = {
    from: defaultFrom,
    to: process.env.MAILTRAP_TEST_RECIPIENT || to,
    subject: subject || 'Notification',
    html
  };

  try {
    const info = await sendEmailWithRetry(mailOptions);
    console.log(`[Email] Dispatched '${templateName}' to ${mailOptions.to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) || null };
  } catch (error) {
    console.error(`[Email Delivery Error] Failed to send '${templateName}' to ${to}: ${error.message}`);
    // Safe graceful handling: log the dispatched email details so the auth process does not crash
    return {
      success: false,
      error: error.message,
      simulated: true
    };
  }
};

module.exports = {
  renderEmailHtml,
  sendEmail,

  // 1. Signup verification email
  sendSignupVerificationEmail: async ({ user, otpCode, expiryMinutes }) => {
    return sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address — Action Required',
      templateName: 'signup-verification',
      context: {
        name: user.name,
        otpCode,
        expiryMinutes,
        preheaderText: 'Complete your account registration with the verification code inside.'
      }
    });
  },

  // 2. Welcome email
  sendWelcomeEmail: async ({ user }) => {
    return sendEmail({
      to: user.email,
      subject: 'Welcome to Farmanullah Ansari Company — Account Activated!',
      templateName: 'welcome',
      context: {
        name: user.name,
        role: user.role,
        preheaderText: 'Your account is now active. Explore your dashboard and features.'
      }
    });
  },

  // 3. Login alert email
  sendLoginAlertEmail: async ({ user, ipAddress, userAgent }) => {
    return sendEmail({
      to: user.email,
      subject: 'Security Alert: New Sign-in to Your Account',
      templateName: 'login-alert',
      context: {
        name: user.name,
        ipAddress: ipAddress || 'Unknown IP',
        userAgent: userAgent || 'Unknown Device / Browser',
        preheaderText: 'A new login was detected on your account. Review the details.'
      }
    });
  },

  // 4. Generic/2FA OTP email
  sendOtpVerificationEmail: async ({ user, otpCode, purposeLabel, expiryMinutes }) => {
    return sendEmail({
      to: user.email,
      subject: 'Your Security Verification Code',
      templateName: 'otp-verification',
      context: {
        name: user.name,
        otpCode,
        purposeLabel: purposeLabel || 'Account Verification',
        expiryMinutes,
        preheaderText: 'Your one-time verification code is ready. Do not share it.'
      }
    });
  },

  // 5. Password reset email
  sendPasswordResetEmail: async ({ user, otpCode, expiryMinutes, ipAddress }) => {
    return sendEmail({
      to: user.email,
      subject: 'Password Reset Requested — Action Required',
      templateName: 'password-reset',
      context: {
        name: user.name,
        otpCode,
        expiryMinutes,
        ipAddress: ipAddress || 'Unknown IP',
        preheaderText: 'Use the verification code inside to reset your password.'
      }
    });
  },

  // 6. Password changed email
  sendPasswordChangedEmail: async ({ user, ipAddress, userAgent }) => {
    return sendEmail({
      to: user.email,
      subject: 'Your Account Password Was Changed',
      templateName: 'password-changed',
      context: {
        name: user.name,
        ipAddress: ipAddress || 'Unknown IP',
        userAgent: userAgent || 'Unknown Device',
        preheaderText: 'Your password was successfully updated. If this was not you, take action now.'
      }
    });
  },

  // 7. Email change request email (to new email)
  sendEmailChangeRequest: async ({ user, newEmail, otpCode, expiryMinutes }) => {
    return sendEmail({
      to: newEmail,
      subject: 'Confirm Your New Email Address — Action Required',
      templateName: 'email-change-request',
      context: {
        name: user.name,
        currentEmail: user.email,
        newEmail,
        otpCode,
        expiryMinutes,
        preheaderText: 'Verify this email address to complete your account update.'
      }
    });
  },

  // 8. Notice sent to old email
  sendEmailChangedNotice: async ({ user, newEmail, ipAddress }) => {
    return sendEmail({
      to: user.email,
      subject: 'Notice: Primary Email Address Changed',
      templateName: 'email-changed-notice',
      context: {
        name: user.name,
        newEmail,
        ipAddress: ipAddress || 'Unknown IP',
        preheaderText: 'Your primary email address has been changed. Review the details.'
      }
    });
  },

  // 9. Account deleted confirmation
  sendAccountDeletedEmail: async ({ user, ipAddress }) => {
    return sendEmail({
      to: user.email,
      subject: 'Account Permanently Closed',
      templateName: 'account-deleted',
      context: {
        name: user.name,
        ipAddress: ipAddress || 'Unknown IP',
        preheaderText: 'Your account has been permanently deleted as requested.'
      }
    });
  },

  // 10. SMTP test email
  sendTestEmail: async ({ recipientEmail, senderEmail, smtpHost, smtpPort, databaseDialect }) => {
    return sendEmail({
      to: recipientEmail,
      subject: 'SMTP Diagnostics Test — Farmanullah Ansari Company',
      templateName: 'test-email',
      context: {
        recipientEmail,
        senderEmail,
        smtpHost,
        smtpPort,
        databaseDialect,
        preheaderText: 'SMTP delivery test completed successfully.'
      }
    });
  }
};
