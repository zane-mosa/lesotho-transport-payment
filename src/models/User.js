// src/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    role: {
        type: DataTypes.ENUM('passenger', 'driver', 'owner'),
        defaultValue: 'passenger'
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

User.prototype.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = User;