const express = require('express');
const router = express.Router();
const webController = require('../controllers/web.controller');
const { authenticateWeb, optionalWebAuth } = require('../middlewares/webAuth.middleware');

// Root redirect
router.get('/', optionalWebAuth, (req, res) => {
  if (req.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Auth Routes (Guest)
router.get('/login', optionalWebAuth, webController.renderLogin);
router.post('/login', webController.postLogin);

router.get('/signup', optionalWebAuth, webController.renderSignup);
router.post('/signup', webController.postSignup);

router.get('/verify-otp', webController.renderOtp);
router.post('/verify-otp', webController.postVerifyOtp);
router.post('/resend-otp', webController.postResendOtp);

router.get('/forgot-password', webController.renderForgotPassword);
router.post('/forgot-password', webController.postForgotPassword);

router.get('/reset-password', webController.renderResetPassword);
router.post('/reset-password', webController.postResetPassword);

router.get('/logout', webController.logout);

// Protected App Routes (Require authenticated session)
router.get('/dashboard', authenticateWeb, webController.renderDashboard);
router.post('/items/create', authenticateWeb, webController.postCreateItem);
router.post('/items/:id/update', authenticateWeb, webController.postUpdateItem);
router.post('/items/:id/delete', authenticateWeb, webController.postDeleteItem);

router.get('/templates', authenticateWeb, webController.renderTemplates);

router.get('/diagnostics', authenticateWeb, webController.renderDiagnostics);
router.post('/diagnostics/send-test', authenticateWeb, webController.postSendTestEmail);

router.get('/profile', authenticateWeb, webController.renderProfile);
router.post('/profile/update', authenticateWeb, webController.postUpdateProfile);
router.post('/profile/password', authenticateWeb, webController.postUpdatePassword);
router.post('/profile/2fa', authenticateWeb, webController.postToggle2fa);
router.post('/profile/email', authenticateWeb, webController.postRequestEmailChange);
router.post('/profile/delete-account', authenticateWeb, webController.postDeleteAccount);

module.exports = router;
