const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSignup = (req, res, next) => {
  let { name, email, password } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Name is required (at least 2 characters)' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ success: false, error: 'Name cannot exceed 100 characters' });
  }
  req.body.name = name.trim();

  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }
  req.body.email = email.trim().toLowerCase();

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  let { email, password } = req.body;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }
  req.body.email = email.trim().toLowerCase();

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
  req.body.code = String(code).trim();
  next();
};

const validateEmailOnly = (req, res, next) => {
  let { email } = req.body;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }
  req.body.email = email.trim().toLowerCase();
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateOtpCode,
  validateEmailOnly
};
