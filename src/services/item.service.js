const { Op } = require('sequelize');
const { Item, User } = require('../models');
const { PAGINATION, ROLES } = require('../config/constants');

/**
 * Create a new resource item
 */
const createItem = async ({ userId, data }) => {
  const item = await Item.create({
    userId,
    title: data.title,
    description: data.description || null,
    category: data.category || 'general',
    tags: data.tags || [],
    status: data.status || 'active',
    priority: data.priority || 'medium'
  });

  return item;
};

/**
 * Retrieve items with pagination, filtering, search, and sorting
 */
const getItems = async ({
  userId,
  role = ROLES.USER,
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
  q,
  category,
  status,
  priority,
  sortBy = 'createdAt',
  sortOrder = 'DESC'
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClause = {};

  // Regular users only see their own items; admins/moderators can view all
  if (role !== ROLES.ADMIN && role !== ROLES.MODERATOR) {
    whereClause.userId = userId;
  }

  if (category) {
    whereClause.category = category;
  }

  if (status) {
    whereClause.status = status;
  }

  if (priority) {
    whereClause.priority = priority;
  }

  if (q) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } }
    ];
  }

  const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'status', 'category'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await Item.findAndCountAll({
    where: whereClause,
    limit: parsedLimit,
    offset,
    order: [[sortField, sortDirection]],
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'avatarUrl']
      }
    ]
  });

  const totalPages = Math.ceil(count / parsedLimit) || 1;

  return {
    items: rows,
    pagination: {
      totalItems: count,
      currentPage: parsedPage,
      totalPages,
      limit: parsedLimit,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1
    }
  };
};

/**
 * Retrieve a single item by ID with ownership check
 */
const getItemById = async ({ id, userId, role }) => {
  const item = await Item.findByPk(id, {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email']
      }
    ]
  });

  if (!item) {
    const error = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }

  if (role !== ROLES.ADMIN && role !== ROLES.MODERATOR && item.userId !== userId) {
    const error = new Error('You do not have permission to view this item');
    error.statusCode = 403;
    throw error;
  }

  return item;
};

/**
 * Update an existing item
 */
const updateItem = async ({ id, userId, role, data }) => {
  const item = await getItemById({ id, userId, role });

  // Only owner or admin can update
  if (role !== ROLES.ADMIN && item.userId !== userId) {
    const error = new Error('You do not have permission to update this item');
    error.statusCode = 403;
    throw error;
  }

  await item.update({
    title: data.title !== undefined ? data.title : item.title,
    description: data.description !== undefined ? data.description : item.description,
    category: data.category !== undefined ? data.category : item.category,
    tags: data.tags !== undefined ? data.tags : item.tags,
    status: data.status !== undefined ? data.status : item.status,
    priority: data.priority !== undefined ? data.priority : item.priority
  });

  return item;
};

/**
 * Delete an item
 */
const deleteItem = async ({ id, userId, role }) => {
  const item = await getItemById({ id, userId, role });

  if (role !== ROLES.ADMIN && item.userId !== userId) {
    const error = new Error('You do not have permission to delete this item');
    error.statusCode = 403;
    throw error;
  }

  await item.destroy();
  return { id, message: 'Item deleted successfully' };
};

/**
 * Get aggregate statistics
 */
const getItemStats = async ({ userId, role }) => {
  const whereClause = {};
  if (role !== ROLES.ADMIN) {
    whereClause.userId = userId;
  }

  const [total, active, draft, archived] = await Promise.all([
    Item.count({ where: whereClause }),
    Item.count({ where: { ...whereClause, status: 'active' } }),
    Item.count({ where: { ...whereClause, status: 'draft' } }),
    Item.count({ where: { ...whereClause, status: 'archived' } })
  ]);

  return { total, active, draft, archived };
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemStats
};
