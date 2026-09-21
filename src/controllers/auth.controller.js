const authService = require('../services/auth.service');

const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};

const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown Client';
};

const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.signup({ name, email, password, role });
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyEmail({ email, code });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerificationOtp({ email });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await authService.login({ email, password, ipAddress, userAgent });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const verifyLogin2FA = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await authService.verifyLogin2FA({ email, code, ipAddress, userAgent });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ipAddress = getClientIp(req);

    const result = await authService.forgotPassword({ email, ipAddress });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyResetOtp({ email, code });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, resetToken, newPassword } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await authService.resetPassword({
      email,
      code,
      resetToken,
      newPassword,
      ipAddress,
      userAgent
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const ipAddress = getClientIp(req);

    const result = await authService.requestEmailChange({
      user: req.user,
      newEmail,
      currentPassword,
      ipAddress
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailChange = async (req, res, next) => {
  try {
    const { code } = req.body;
    const ipAddress = getClientIp(req);

    const result = await authService.verifyEmailChange({
      user: req.user,
      code,
      ipAddress
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const tokens = await authService.refreshAccessToken(token);
    res.status(200).json({
      success: true,
      tokens
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your client tokens.'
  });
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
  refreshToken,
  logout
};
