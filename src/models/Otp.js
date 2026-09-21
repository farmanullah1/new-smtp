const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Otp = sequelize.define('Otp', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    },
    codeHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    purpose: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('metadata');
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      },
      set(value) {
        if (value && typeof value === 'object') {
          this.setDataValue('metadata', JSON.stringify(value));
        } else {
          this.setDataValue('metadata', value);
        }
      }
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'Otps',
    timestamps: true,
    indexes: [
      {
        fields: ['email', 'purpose', 'isUsed']
      }
    ]
  });

  return Otp;
};
