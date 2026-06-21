const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const BlockedDevice = sequelize.define('BlockedDevice', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deviceHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    blockedUntil: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    tableName: 'blocked_devices',
    timestamps: true,
    updatedAt: false, // only created_at is needed
    createdAt: 'createdAt'
});

module.exports = BlockedDevice;
