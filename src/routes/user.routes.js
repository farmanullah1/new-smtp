const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.put('/me/password', userController.updatePassword);
router.post('/me/2fa', userController.toggleTwoFactor);
router.get('/me/logins', userController.getLoginHistory);
router.delete('/me', userController.deleteAccount);

module.exports = router;
