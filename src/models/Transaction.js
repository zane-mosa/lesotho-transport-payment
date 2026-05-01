// src/models/Transaction.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    transaction_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isMultipleOf13(value) {
                // Only validate for local trips, not special
                if (this.trip_type === 'local' && value % 13 !== 0) {
                    throw new Error('Local trip amount must be a multiple of 13');
                }
            }
        }
    },
    trip_type: {
        type: DataTypes.ENUM('local', 'special'),
        defaultValue: 'local',
        allowNull: false
    },
    trip_details: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Details about the trip (e.g., "3 trips" or "special gate drop")'
    },
    payment_method: {
        type: DataTypes.ENUM('mpesa', 'ecocash', 'card'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
    },
    transaction_reference: {
        type: DataTypes.STRING(100),
        unique: true
    },
    qr_code: {
        type: DataTypes.TEXT
    },
    taxi_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Taxi number that the passenger paid to'
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of the driver receiving the payment'
    },
    vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'vehicles',
            key: 'vehicle_id'
        },
        comment: 'ID of the vehicle that received the payment'
    }
}, {
    tableName: 'transactions',
    timestamps: true
});

module.exports = Transaction;