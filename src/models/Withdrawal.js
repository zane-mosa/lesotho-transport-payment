// src/models/Withdrawal.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Withdrawal = sequelize.define('Withdrawal', {
    withdrawal_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_method: {
        type: DataTypes.ENUM('mpesa', 'ecocash'),
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    reference: {
        type: DataTypes.STRING(50),
        unique: true
    }
}, {
    tableName: 'withdrawals',
    timestamps: true
});

module.exports = Withdrawal;