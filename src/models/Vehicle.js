// src/models/Vehicle.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
    vehicle_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'user_id'
        }
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'user_id'
        }
    },
    taxi_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    registration_number: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    route: {
        type: DataTypes.STRING(100)
    },
    capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 15
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'vehicles',
    timestamps: true
});

module.exports = Vehicle;