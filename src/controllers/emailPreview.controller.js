const emailService = require('../services/email.service');

const sampleDatasets = {
  'signup-verification': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    subject: 'Verify Your Email Address - OTP: 849201',
    otpCode: '849201',
    expiryMinutes: 10
  },
  'welcome': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    subject: 'Welcome to Farmanullah Ansari Company - Account Activated!',
    role: 'user',
    formattedDate: new Date().toUTCString()
  },
  'login-alert': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    subject: 'Security Alert: New Sign-in to Your Account',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/133.0.0.0 Safari/537.36',
    formattedDate: new Date().toUTCString()
  },
  'otp-verification': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    subject: 'Your Security Code: 519382',
    otpCode: '519382',
    purposeLabel: 'Two-Factor Authentication Sign-In',
    expiryMinutes: 10
  },
  'password-reset': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    subject: 'Password Reset Request - Code: 940173',
    otpCode: '940173',
    expiryMinutes: 10,
    ipAddress: '192.168.1.105',
    formattedDate: new Date().toUTCString()
  },
  'password-changed': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    subject: 'Your Account Password Was Changed',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    formattedDate: new Date().toUTCString()
  },
  'email-change-request': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'newemail.preview@example.com',
    currentEmail: 'farmanullahansari999@gmail.com',
    newEmail: 'newemail.preview@example.com',
    subject: 'Confirm Your New Email Address - Code: 620481',
    otpCode: '620481',
    expiryMinutes: 10
  },
  'email-changed-notice': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    newEmail: 'newemail.preview@example.com',
    subject: 'Notice: Primary Email Address Changed',
    ipAddress: '192.168.1.105',
    formattedDate: new Date().toUTCString()
  },
  'account-deleted': {
    name: 'Farmanullah Ansari',
    recipientEmail: 'farmanullahansari999@gmail.com',
    subject: 'Account Permanently Closed',
    ipAddress: '192.168.1.105',
    formattedDate: new Date().toUTCString()
  },
  'test-email': {
    recipientEmail: 'test.recipient@example.com',
    senderEmail: 'farmanullahansari999@gmail.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    databaseDialect: 'Microsoft SQL Server (Sequelize)',
    subject: 'SMTP Diagnostics Test - Farmanullah Ansari Company'
  }
};

const listTemplates = (req, res) => {
  const templates = Object.keys(sampleDatasets).map((name) => ({
    name,
    previewUrl: `/api/v1/previews/${name}`
  }));

  let htmlList = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Template Previews</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #60a5fa; margin-bottom: 8px; }
        p { color: #94a3b8; margin-top: 0; }
        ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-top: 24px; }
        li { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 18px; transition: transform 0.2s, border-color 0.2s; }
        li:hover { transform: translateY(-2px); border-color: #3b82f6; }
        a { color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 16px; display: block; margin-bottom: 6px; }
        a:hover { text-decoration: underline; }
        .desc { color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Dynamic Email Template Previews</h1>
        <p>Rendered with Handlebars (layout: <code>views/layouts/main.handlebars</code>)</p>
        <ul>
          ${templates.map(t => `
            <li>
              <a href="${t.previewUrl}" target="_blank">&rarr; ${t.name}</a>
              <span class="desc">Live preview with sample payload</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(htmlList);
};

const renderPreview = (req, res, next) => {
  try {
    const { templateName } = req.params;
    const sampleData = sampleDatasets[templateName] || {
      name: 'Preview User',
      recipientEmail: 'preview@example.com',
      subject: `Preview of ${templateName}`,
      otpCode: '123456',
      expiryMinutes: 10
    };

    const { html } = emailService.renderEmailHtml(templateName, sampleData, 'main');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTemplates,
  renderPreview
};
