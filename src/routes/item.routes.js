const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.post('/', itemController.createItem);
router.get('/', itemController.getItems);
router.get('/stats', itemController.getItemStats);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;
