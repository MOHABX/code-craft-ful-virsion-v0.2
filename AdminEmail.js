const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const AdminEmail = sequelize.define('AdminEmail', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    }
}, {
    tableName: 'admin_emails',
    timestamps: true
});

module.exports = AdminEmail;
