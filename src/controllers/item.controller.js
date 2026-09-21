const itemService = require('../services/item.service');

const createItem = async (req, res, next) => {
  try {
    const { title, description, category, tags, status, priority } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const item = await itemService.createItem({
      userId: req.user.id,
      data: { title, description, category, tags, status, priority }
    });

    res.status(201).json({
      success: true,
      item,
      message: 'Item created successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getItems = async (req, res, next) => {
  try {
    const { page, limit, q, category, status, priority, sortBy, sortOrder } = req.query;

    const result = await itemService.getItems({
      userId: req.user.id,
      role: req.user.role,
      page,
      limit,
      q,
      category,
      status,
      priority,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await itemService.getItemById({
      id,
      userId: req.user.id,
      role: req.user.role
    });

    res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await itemService.updateItem({
      id,
      userId: req.user.id,
      role: req.user.role,
      data: req.body
    });

    res.status(200).json({
      success: true,
      item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await itemService.deleteItem({
      id,
      userId: req.user.id,
      role: req.user.role
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getItemStats = async (req, res, next) => {
  try {
    const stats = await itemService.getItemStats({
      userId: req.user.id,
      role: req.user.role
    });

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemStats
};
