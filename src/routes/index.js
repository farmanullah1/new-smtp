const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const itemRoutes = require('./item.routes');
const testRoutes = require('./test.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/', testRoutes);

module.exports = router;
