const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_jwt_key_2026';

const authenticateWeb = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.status !== 'active') {
      res.clearCookie('token');
      return res.redirect('/login');
    }

    req.user = user;
    res.locals.currentUser = user.toJSON ? user.toJSON() : user;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
};

const optionalWebAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user && user.status === 'active') {
        req.user = user;
        res.locals.currentUser = user.toJSON ? user.toJSON() : user;
      }
    }
  } catch {
    // ignore
  }
  next();
};

module.exports = {
  authenticateWeb,
  optionalWebAuth
};
