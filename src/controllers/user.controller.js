const { User, Item, LoginHistory } = require('../models');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');

const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const itemCount = await Item.count({ where: { userId: user.id } });

    res.status(200).json({
      success: true,
      user: {
        ...authService.sanitizeUser(user),
        totalItemsCount: itemCount
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, phone, bio, avatarUrl } = req.body;

    await user.update({
      name: name !== undefined ? name : user.name,
      phone: phone !== undefined ? phone : user.phone,
      bio: bio !== undefined ? bio : user.bio,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl
    });

    res.status(200).json({
      success: true,
      user: authService.sanitizeUser(user),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Both currentPassword and newPassword are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const isValid = await authService.comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password does not match'
      });
    }

    const hashedPassword = await authService.hashPassword(newPassword);
    await user.update({ passwordHash: hashedPassword });

    // Send confirmation email
    const ipAddress = req.headers['x-forwarded-for'] || req.ip;
    const userAgent = req.headers['user-agent'];
    emailService.sendPasswordChangedEmail({ user, ipAddress, userAgent }).catch((err) => {
      console.error(`[Email Alert Error] ${err.message}`);
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const toggleTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;
    const { enabled } = req.body;

    const newStatus = enabled !== undefined ? Boolean(enabled) : !user.isTwoFactorEnabled;
    await user.update({ isTwoFactorEnabled: newStatus });

    res.status(200).json({
      success: true,
      isTwoFactorEnabled: newStatus,
      message: `Two-Factor Authentication is now ${newStatus ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    next(error);
  }
};

const getLoginHistory = async (req, res, next) => {
  try {
    const user = req.user;
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);

    const history = await LoginHistory.findAll({
      where: { userId: user.id },
      limit,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const user = req.user;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to confirm account deletion'
      });
    }

    const isValid = await authService.comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Account deletion aborted.'
      });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.ip;
    await emailService.sendAccountDeletedEmail({ user, ipAddress });

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'Your account has been deleted permanently.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  toggleTwoFactor,
  getLoginHistory,
  deleteAccount
};
