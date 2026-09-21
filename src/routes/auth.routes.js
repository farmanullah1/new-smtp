const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { authLimiter, otpLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  validateSignup,
  validateLogin,
  validateOtpCode,
  validateEmailOnly
} = require('../middlewares/validate.middleware');

// Public auth endpoints
router.post('/signup', authLimiter, validateSignup, authController.signup);
router.post('/verify-email', authLimiter, validateOtpCode, authController.verifyEmail);
router.post('/resend-otp', otpLimiter, validateEmailOnly, authController.resendVerificationOtp);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/verify-login-2fa', authLimiter, validateOtpCode, authController.verifyLogin2FA);
router.post('/forgot-password', otpLimiter, validateEmailOnly, authController.forgotPassword);
router.post('/verify-reset-otp', authLimiter, validateOtpCode, authController.verifyResetOtp);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected auth endpoints
router.post('/change-email/request', requireAuth, otpLimiter, authController.requestEmailChange);
router.post('/change-email/verify', requireAuth, validateOtpCode, authController.verifyEmailChange);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
