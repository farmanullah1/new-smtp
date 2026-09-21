const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Name is required (at least 2 characters)' });
  }
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }
  next();
};

const validateOtpCode = (req, res, next) => {
  const { code } = req.body;
  if (!code || !/^\d{6}$/.test(String(code).trim())) {
    return res.status(400).json({ success: false, error: 'A valid 6-digit numeric OTP code is required' });
  }
  next();
};

const validateEmailOnly = (req, res, next) => {
  const { email } = req.body;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateOtpCode,
  validateEmailOnly
};
