const authService = require('../services/auth.service');
const itemService = require('../services/item.service');
const emailService = require('../services/email.service');
const { getSmtpStatus } = require('../config/email');
const { getActiveDialect } = require('../config/database');
const { User, LoginHistory } = require('../models');

const templateDescriptions = [
  { id: 'signup-verification', name: 'Signup Verification', badge: 'Auth', desc: 'Sent immediately upon user signup containing the 6-digit verification code.' },
  { id: 'welcome', name: 'Welcome Email', badge: 'Activation', desc: 'Dispatched once user confirms their email address with active role metadata.' },
  { id: 'login-alert', name: 'Login Security Alert', badge: 'Security', desc: 'Sent upon successful sign-in with IP address, device type, and recovery link.' },
  { id: 'otp-verification', name: 'OTP Verification (2FA)', badge: 'Security', desc: 'Generic and two-factor authentication security passcode delivery.' },
  { id: 'password-reset', name: 'Password Recovery', badge: 'Recovery', desc: 'Recovery code dispatched when user initiates a forgot password request.' },
  { id: 'password-changed', name: 'Password Changed Notice', badge: 'Security', desc: 'Critical security notice confirming account password update with emergency CTA.' },
  { id: 'email-change-request', name: 'Email Change Confirmation', badge: 'Account', desc: 'Dispatched to the newly requested email address with authorization OTP.' },
  { id: 'email-changed-notice', name: 'Email Changed Advisory', badge: 'Security', desc: 'Security advisory dispatched to previous email warning of address change.' },
  { id: 'account-deleted', name: 'Account Closure', badge: 'Account', desc: 'Confirmation that all user records, sessions, and items were removed.' },
  { id: 'test-email', name: 'SMTP Diagnostic Test', badge: 'Diagnostic', desc: 'Test email confirming that nodemailer, SMTP transporter, and Handlebars work.' }
];

// Helper to set session cookie
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// ─── AUTH CONTROLLERS ───
const renderLogin = (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/login', {
    pageTitle: 'Sign In',
    email: req.query.email || '',
    errorMessage: req.query.error,
    successMessage: req.query.success
  });
};

const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web Browser';

    const result = await authService.login({ email, password, ipAddress, userAgent });

    if (result.requires2FA) {
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&purpose=2fa`);
    }

    setAuthCookie(res, result.tokens.accessToken);
    res.redirect('/dashboard');
  } catch (err) {
    if (err.requiresEmailVerification) {
      return res.redirect(`/verify-otp?email=${encodeURIComponent(req.body.email)}&purpose=signup&info=${encodeURIComponent('Please verify your email address to continue.')}`);
    }
    res.render('auth/login', {
      pageTitle: 'Sign In',
      email: req.body.email,
      errorMessage: err.message
    });
  }
};

const renderSignup = (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/signup', {
    pageTitle: 'Create Account',
    errorMessage: req.query.error
  });
};

const postSignup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    await authService.signup({ name, email, password, role: role || 'user' });
    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&purpose=signup&success=${encodeURIComponent('Verification code dispatched to your email!')}`);
  } catch (err) {
    res.render('auth/signup', {
      pageTitle: 'Create Account',
      name: req.body.name,
      email: req.body.email,
      errorMessage: err.message
    });
  }
};

const renderOtp = (req, res) => {
  const { email, purpose } = req.query;
  if (!email) return res.redirect('/login');

  const is2FA = purpose === '2fa';
  res.render('auth/otp', {
    pageTitle: is2FA ? 'Two-Factor Verification' : 'Verify Email Address',
    title: is2FA ? 'Two-Factor Verification' : 'Verify Your Email',
    subtitle: is2FA ? 'Enter the 6-digit security code sent to' : 'We sent a 6-digit verification code to',
    email,
    purpose: purpose || 'signup',
    errorMessage: req.query.error,
    successMessage: req.query.success,
    infoMessage: req.query.info
  });
};

const postVerifyOtp = async (req, res) => {
  const { email, code, purpose } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Browser';

  try {
    let result;
    if (purpose === '2fa') {
      result = await authService.verifyLogin2FA({ email, code, ipAddress, userAgent });
    } else if (purpose === 'email_change') {
      result = await authService.verifyEmailChange({ user: req.user, code, ipAddress });
      if (result.tokens?.accessToken) {
        setAuthCookie(res, result.tokens.accessToken);
      }
      return res.redirect(`/profile?success=${encodeURIComponent(result.message || 'Email updated successfully!')}`);
    } else {
      result = await authService.verifyEmail({ email, code });
    }

    if (result.tokens?.accessToken) {
      setAuthCookie(res, result.tokens.accessToken);
    }
    res.redirect('/dashboard');
  } catch (err) {
    res.render('auth/otp', {
      pageTitle: 'OTP Verification',
      title: purpose === '2fa' ? 'Two-Factor Verification' : 'Verify Your Email',
      subtitle: purpose === '2fa' ? 'Enter the 6-digit security code sent to' : 'We sent a 6-digit verification code to',
      email,
      purpose,
      errorMessage: err.message
    });
  }
};

const postResendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    await authService.resendOtp({ email });
    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&success=${encodeURIComponent('Fresh verification code dispatched!')}`);
  } catch (err) {
    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&error=${encodeURIComponent(err.message)}`);
  }
};

const renderForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    pageTitle: 'Recover Password',
    errorMessage: req.query.error,
    successMessage: req.query.success
  });
};

const postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword({ email });
    res.redirect(`/reset-password?email=${encodeURIComponent(email)}&success=${encodeURIComponent('Password reset code sent to your email.')}`);
  } catch (err) {
    res.render('auth/forgot-password', {
      pageTitle: 'Recover Password',
      email: req.body.email,
      errorMessage: err.message
    });
  }
};

const renderResetPassword = (req, res) => {
  const { email } = req.query;
  if (!email) return res.redirect('/forgot-password');
  res.render('auth/reset-password', {
    pageTitle: 'Reset Password',
    email,
    errorMessage: req.query.error,
    successMessage: req.query.success
  });
};

const postResetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Browser';

  try {
    const verifyRes = await authService.verifyResetOtp({ email, code });
    await authService.resetPassword({
      email,
      resetToken: verifyRes.resetToken,
      newPassword,
      ipAddress,
      userAgent
    });
    res.redirect(`/login?success=${encodeURIComponent('Password reset successfully! Please sign in with your new password.')}`);
  } catch (err) {
    res.render('auth/reset-password', {
      pageTitle: 'Reset Password',
      email,
      errorMessage: err.message
    });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login?success=You+have+been+logged+out+safely');
};

// ─── DASHBOARD CONTROLLER ───
const renderDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const q = req.query.q || '';
    const status = req.query.status || '';
    const category = req.query.category || '';
    const sortParam = req.query.sort || 'createdAt-DESC';
    const [sortBy, sortOrder] = sortParam.split('-');

    const [itemsResult, statsResult] = await Promise.all([
      itemService.getItems({
        userId: req.user.id,
        role: req.user.role,
        page,
        limit,
        q,
        status,
        category,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'DESC'
      }),
      itemService.getItemStats({ userId: req.user.id, role: req.user.role })
    ]);

    const hasActiveFilters = Boolean(q || status || category);
    const plainItems = (itemsResult.items || []).map(i => (i.toJSON ? i.toJSON() : i));

    res.render('dashboard', {
      pageTitle: 'CRUD Dashboard',
      activeNav: 'dashboard',
      items: plainItems,
      pagination: itemsResult.pagination,
      stats: statsResult?.stats || statsResult || { total: 0, active: 0, draft: 0, archived: 0 },
      query: { q, status, category, sort: sortParam },
      hasActiveFilters,
      successMessage: req.query.success,
      errorMessage: req.query.error
    });
  } catch (err) {
    res.render('dashboard', {
      pageTitle: 'CRUD Dashboard',
      activeNav: 'dashboard',
      items: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      stats: { total: 0, active: 0, draft: 0, archived: 0 },
      errorMessage: err.message
    });
  }
};

const postCreateItem = async (req, res) => {
  try {
    const { title, description, category, tags, status, priority } = req.body;
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await itemService.createItem({
      userId: req.user.id,
      data: {
        title,
        description,
        category,
        tags: parsedTags,
        status,
        priority
      }
    });
    res.redirect('/dashboard?success=New+resource+created+successfully');
  } catch (err) {
    res.redirect(`/dashboard?error=${encodeURIComponent(err.message)}`);
  }
};

const postUpdateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, status, priority } = req.body;
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await itemService.updateItem({
      id,
      userId: req.user.id,
      role: req.user.role,
      data: { title, description, category, tags: parsedTags, status, priority }
    });
    res.redirect('/dashboard?success=Resource+updated+successfully');
  } catch (err) {
    res.redirect(`/dashboard?error=${encodeURIComponent(err.message)}`);
  }
};

const postDeleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await itemService.deleteItem({ id, userId: req.user.id, role: req.user.role });
    res.redirect('/dashboard?success=Resource+deleted+successfully');
  } catch (err) {
    res.redirect(`/dashboard?error=${encodeURIComponent(err.message)}`);
  }
};

// ─── TEMPLATES CONTROLLER ───
const renderTemplates = (req, res) => {
  const templateId = req.query.template || 'signup-verification';
  const activeTemplate = templateDescriptions.find(t => t.id === templateId) || templateDescriptions[0];

  res.render('templates', {
    pageTitle: 'Email Templates Previewer',
    activeNav: 'templates',
    templateList: templateDescriptions,
    activeTemplate
  });
};

// ─── DIAGNOSTICS CONTROLLER ───
const renderDiagnostics = (req, res) => {
  const smtp = getSmtpStatus();
  const dialect = getActiveDialect();

  const health = {
    status: 'operational',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'healthy',
      dialect,
      name: process.env.DATABASE || 'newDatabaseHAiBro'
    },
    smtp
  };

  res.render('diagnostics', {
    pageTitle: 'SMTP & System Diagnostics',
    activeNav: 'diagnostics',
    health,
    defaultTestEmail: req.user?.email || 'farmanullahansari999@gmail.com',
    successMessage: req.query.success,
    errorMessage: req.query.error
  });
};

const postSendTestEmail = async (req, res) => {
  const { testEmail } = req.body;
  try {
    const targetEmail = testEmail || req.user?.email || process.env.SMTP_USER;
    const result = await emailService.sendTestEmail({
      recipientEmail: targetEmail,
      senderEmail: process.env.SMTP_USER,
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
      databaseDialect: getActiveDialect()
    });
    res.redirect(`/diagnostics?success=${encodeURIComponent(`Diagnostic email successfully dispatched to ${targetEmail}! Message ID: ${result.messageId || 'OK'}`)}`);
  } catch (err) {
    res.redirect(`/diagnostics?error=${encodeURIComponent(err.message || 'Failed to dispatch diagnostic email')}`);
  }
};

// ─── PROFILE CONTROLLER ───
const renderProfile = async (req, res) => {
  try {
    const history = await authService.getLoginHistory({ userId: req.user.id, limit: 6 });
    res.render('profile', {
      pageTitle: 'User Profile & Security',
      activeNav: 'profile',
      history,
      successMessage: req.query.success,
      errorMessage: req.query.error
    });
  } catch (err) {
    res.render('profile', {
      pageTitle: 'User Profile & Security',
      activeNav: 'profile',
      history: [],
      errorMessage: err.message
    });
  }
};

const postUpdateProfile = async (req, res) => {
  try {
    const { name, phone, bio, avatarUrl } = req.body;
    await authService.updateProfile({
      userId: req.user.id,
      name,
      phone,
      bio,
      avatarUrl
    });
    res.redirect('/profile?success=Profile+details+updated+successfully');
  } catch (err) {
    res.redirect(`/profile?error=${encodeURIComponent(err.message)}`);
  }
};

const postUpdatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web Browser';

    await authService.updatePassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    });
    res.redirect('/profile?success=Password+updated+successfully');
  } catch (err) {
    res.redirect(`/profile?error=${encodeURIComponent(err.message)}`);
  }
};

const postToggle2fa = async (req, res) => {
  try {
    const isEnabled = req.body.enabled === 'true';
    await authService.toggleTwoFactor({ userId: req.user.id, isEnabled });
    res.redirect(`/profile?success=Two-Factor+Authentication+is+now+${isEnabled ? 'enabled' : 'disabled'}`);
  } catch (err) {
    res.redirect(`/profile?error=${encodeURIComponent(err.message)}`);
  }
};

const postRequestEmailChange = async (req, res) => {
  try {
    const { currentPassword, newEmail } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const result = await authService.requestEmailChange({
      userId: req.user.id,
      user: req.user,
      currentPassword,
      newEmail,
      ipAddress
    });
    res.redirect(`/verify-otp?email=${encodeURIComponent(newEmail)}&purpose=email_change&success=${encodeURIComponent(result.message)}`);
  } catch (err) {
    res.redirect(`/profile?error=${encodeURIComponent(err.message)}`);
  }
};

const postDeleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    await authService.deleteAccount({ userId: req.user.id, password, ipAddress });
    res.clearCookie('token');
    res.redirect('/login?success=Your+account+has+been+permanently+deleted');
  } catch (err) {
    res.redirect(`/profile?error=${encodeURIComponent(err.message)}`);
  }
};

module.exports = {
  renderLogin,
  postLogin,
  renderSignup,
  postSignup,
  renderOtp,
  postVerifyOtp,
  postResendOtp,
  renderForgotPassword,
  postForgotPassword,
  renderResetPassword,
  postResetPassword,
  logout,
  renderDashboard,
  postCreateItem,
  postUpdateItem,
  postDeleteItem,
  renderTemplates,
  renderDiagnostics,
  postSendTestEmail,
  renderProfile,
  postUpdateProfile,
  postUpdatePassword,
  postToggle2fa,
  postRequestEmailChange,
  postDeleteAccount
};
