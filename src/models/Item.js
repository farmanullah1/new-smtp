const { DataTypes } = require('sequelize');
const { ITEM_STATUSES } = require('../config/constants');

module.exports = (sequelize) => {
  const Item = sequelize.define('Item', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'general'
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
      get() {
        const raw = this.getDataValue('tags');
        if (!raw) return [];
        return raw.split(',').map((t) => t.trim()).filter(Boolean);
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('tags', val.join(','));
        } else if (typeof val === 'string') {
          this.setDataValue('tags', val);
        } else {
          this.setDataValue('tags', null);
        }
      }
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: ITEM_STATUSES.ACTIVE
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'medium'
    }
  }, {
    tableName: 'Items',
    timestamps: true
  });

  return Item;
};
