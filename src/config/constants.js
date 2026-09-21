module.exports = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
  },
  OTP_PURPOSES: {
    EMAIL_VERIFICATION: 'email_verification',
    LOGIN_2FA: 'login_2fa',
    PASSWORD_RESET: 'password_reset',
    EMAIL_CHANGE: 'email_change'
  },
  OTP_EXPIRY_MINUTES: 10,
  MAX_OTP_ATTEMPTS: 5,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ITEM_STATUSES: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ARCHIVED: 'archived'
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  }
};
