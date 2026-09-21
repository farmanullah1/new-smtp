const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginHistory } = require('../models');
const otpService = require('./otp.service');
const emailService = require('./email.service');
const { OTP_PURPOSES, JWT_ACCESS_EXPIRES_IN } = require('../config/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_jwt_key_2026';

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN
  });

  const refreshToken = jwt.sign({ id: user.id, tokenType: 'refresh' }, JWT_SECRET, {
    expiresIn: '30d'
  });

  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => {
  const plain = user.get ? user.get({ plain: true }) : user;
  const { passwordHash, ...safe } = plain;
  return safe;
};

/**
 * Register a new user and dispatch email verification OTP
 */
const signup = async ({ name, email, password, role = 'user' }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    if (!existing.isVerified) {
      // User registered earlier but never verified - generate fresh OTP and resend
      const { rawCode, expiryMinutes } = await otpService.generateOtp({
        email: normalizedEmail,
        purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
        userId: existing.id
      });
      await emailService.sendSignupVerificationEmail({ user: existing, otpCode: rawCode, expiryMinutes });
      return {
        user: sanitizeUser(existing),
        isVerified: false,
        message: 'Account already registered but not verified. A fresh OTP has been sent to your email.'
      };
    }
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role,
    isVerified: false
  });

  const { rawCode, expiryMinutes } = await otpService.generateOtp({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
    userId: user.id
  });

  await emailService.sendSignupVerificationEmail({ user, otpCode: rawCode, expiryMinutes });

  return {
    user: sanitizeUser(user),
    isVerified: false,
    message: 'Registration successful! Please verify your email with the 6-digit OTP sent.'
  };
};

/**
 * Verify email address with 6-digit OTP
 */
const verifyEmail = async ({ email, code }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    return {
      user: sanitizeUser(user),
      isVerified: true,
      message: 'Email address is already verified.'
    };
  }

  const verification = await otpService.verifyOtp({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
    code
  });

  if (!verification.isValid) {
    const error = new Error(verification.reason);
    error.statusCode = 400;
    throw error;
  }

  await user.update({ isVerified: true });
  await emailService.sendWelcomeEmail({ user });

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    tokens,
    message: 'Email successfully verified! Welcome to our platform.'
  };
};

/**
 * Resend email verification OTP
 */
const resendVerificationOtp = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error('No account found with this email');
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    return { message: 'This email is already verified.' };
  }

  const { rawCode, expiryMinutes } = await otpService.generateOtp({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
    userId: user.id
  });

  await emailService.sendSignupVerificationEmail({ user, otpCode: rawCode, expiryMinutes });

  return {
    message: 'Verification OTP has been resent to your email address.'
  };
};

/**
 * Authenticate credentials and handle login / 2FA / alerts
 */
const login = async ({ email, password, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    await LoginHistory.create({
      email: normalizedEmail,
      ipAddress,
      userAgent,
      status: 'failed',
      reason: 'User not found'
    });
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    await LoginHistory.create({
      userId: user.id,
      email: normalizedEmail,
      ipAddress,
      userAgent,
      status: 'failed',
      reason: 'Incorrect password'
    });
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error('Please verify your email address before signing in');
    error.statusCode = 403;
    error.requiresEmailVerification = true;
    throw error;
  }

  if (user.status === 'suspended') {
    const error = new Error('Your account has been suspended. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  // Check 2FA
  if (user.isTwoFactorEnabled) {
    const { rawCode, expiryMinutes } = await otpService.generateOtp({
      email: normalizedEmail,
      purpose: OTP_PURPOSES.LOGIN_2FA,
      userId: user.id
    });
    await emailService.sendOtpVerificationEmail({
      user,
      otpCode: rawCode,
      purposeLabel: 'Two-Factor Authentication Sign-In',
      expiryMinutes
    });

    return {
      requires2FA: true,
      email: user.email,
      message: 'Two-factor authentication code sent to your email address.'
    };
  }

  // Record successful login
  await LoginHistory.create({
    userId: user.id,
    email: normalizedEmail,
    ipAddress,
    userAgent,
    status: 'success'
  });

  await user.update({ lastLoginAt: new Date() });

  // Dispatch login alert email asynchronously
  emailService.sendLoginAlertEmail({ user, ipAddress, userAgent }).catch((err) => {
    console.error(`[Email Alert Error] ${err.message}`);
  });

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    tokens,
    message: 'Login successful'
  };
};

/**
 * Verify 2FA OTP for login
 */
const verifyLogin2FA = async ({ email, code, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const verification = await otpService.verifyOtp({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.LOGIN_2FA,
    code
  });

  if (!verification.isValid) {
    const error = new Error(verification.reason);
    error.statusCode = 400;
    throw error;
  }

  await LoginHistory.create({
    userId: user.id,
    email: normalizedEmail,
    ipAddress,
    userAgent,
    status: 'success'
  });

  await user.update({ lastLoginAt: new Date() });
  emailService.sendLoginAlertEmail({ user, ipAddress, userAgent }).catch((err) => {
    console.error(`[Email Alert Error] ${err.message}`);
  });

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    tokens,
    message: 'Two-Factor Authentication successful'
  };
};

/**
 * Forgot password request - generates reset OTP
 */
const forgotPassword = async ({ email, ipAddress }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    // Return friendly generic message to prevent email enumeration
    return {
      message: 'If an account with that email exists, a password reset code has been sent.'
    };
  }

  const { rawCode, expiryMinutes } = await otpService.generateOtp({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.PASSWORD_RESET,
    userId: user.id
  });

  await emailService.sendPasswordResetEmail({
    user,
    otpCode: rawCode,
    expiryMinutes,
    ipAddress
  });

  return {
    message: 'Password reset code has been sent to your email.'
  };
};

/**
 * Verify reset OTP prior to entering new password
 */
const verifyResetOtp = async ({ email, code }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const verification = await otpService.verifyOtp({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.PASSWORD_RESET,
    code
  });

  if (!verification.isValid) {
    const error = new Error(verification.reason);
    error.statusCode = 400;
    throw error;
  }

  // Issue temporary single-use reset token
  const resetToken = jwt.sign(
    { email: normalizedEmail, purpose: 'password_reset_confirmed' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  return {
    valid: true,
    resetToken,
    message: 'OTP verified successfully. You may now reset your password.'
  };
};

/**
 * Reset password using verified OTP code or reset token
 */
const resetPassword = async ({ email, code, resetToken, newPassword, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Either verified via resetToken or via direct OTP code
  if (resetToken) {
    try {
      const decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.email !== normalizedEmail || decoded.purpose !== 'password_reset_confirmed') {
        throw new Error('Invalid reset token');
      }
    } catch {
      const error = new Error('Invalid or expired password reset token');
      error.statusCode = 400;
      throw error;
    }
  } else if (code) {
    const verification = await otpService.verifyOtp({
      email: normalizedEmail,
      purpose: OTP_PURPOSES.PASSWORD_RESET,
      code
    });
    if (!verification.isValid) {
      const error = new Error(verification.reason);
      error.statusCode = 400;
      throw error;
    }
  } else {
    const error = new Error('Either OTP code or resetToken is required');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await hashPassword(newPassword);
  await user.update({ passwordHash: hashedPassword });

  await emailService.sendPasswordChangedEmail({
    user,
    ipAddress,
    userAgent
  });

  return {
    message: 'Password has been reset successfully. You can now log in with your new credentials.'
  };
};

/**
 * Request to change primary email address
 */
const requestEmailChange = async ({ user, newEmail, currentPassword, ipAddress }) => {
  const normalizedNewEmail = newEmail.toLowerCase().trim();

  if (normalizedNewEmail === user.email) {
    const error = new Error('New email address cannot be the same as your current email');
    error.statusCode = 400;
    throw error;
  }

  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Current password verification failed');
    error.statusCode = 401;
    throw error;
  }

  const emailInUse = await User.findOne({ where: { email: normalizedNewEmail } });
  if (emailInUse) {
    const error = new Error('The requested email address is already in use by another account');
    error.statusCode = 409;
    throw error;
  }

  await user.update({ pendingEmail: normalizedNewEmail });

  const { rawCode, expiryMinutes } = await otpService.generateOtp({
    email: normalizedNewEmail,
    purpose: OTP_PURPOSES.EMAIL_CHANGE,
    userId: user.id,
    metadata: { newEmail: normalizedNewEmail, currentEmail: user.email }
  });

  // Send OTP to the NEW email address
  await emailService.sendEmailChangeRequest({
    user,
    newEmail: normalizedNewEmail,
    otpCode: rawCode,
    expiryMinutes
  });

  // Send advisory alert to CURRENT email address
  await emailService.sendEmailChangedNotice({
    user,
    newEmail: normalizedNewEmail,
    ipAddress
  });

  return {
    message: `Verification code sent to ${normalizedNewEmail}. Please enter the code to confirm email change.`
  };
};

/**
 * Confirm email change with OTP
 */
const verifyEmailChange = async ({ user, code, ipAddress }) => {
  if (!user.pendingEmail) {
    const error = new Error('No pending email change request found');
    error.statusCode = 400;
    throw error;
  }

  const verification = await otpService.verifyOtp({
    email: user.pendingEmail,
    purpose: OTP_PURPOSES.EMAIL_CHANGE,
    code
  });

  if (!verification.isValid) {
    const error = new Error(verification.reason);
    error.statusCode = 400;
    throw error;
  }

  const oldEmail = user.email;
  const newEmail = user.pendingEmail;

  await user.update({
    email: newEmail,
    pendingEmail: null
  });

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    tokens,
    message: `Your primary email address has been successfully updated to ${newEmail}.`
  };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 400;
    throw error;
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || user.status !== 'active') {
      const error = new Error('Invalid session or inactive user');
      error.statusCode = 401;
      throw error;
    }

    const tokens = generateTokens(user);
    return tokens;
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }
};

module.exports = {
  signup,
  verifyEmail,
  resendVerificationOtp,
  login,
  verifyLogin2FA,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  requestEmailChange,
  verifyEmailChange,
  refreshAccessToken,
  sanitizeUser,
  generateTokens,
  comparePassword,
  hashPassword
};
