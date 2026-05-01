// src/models/index.js
const { sequelize } = require('../config/database');
const User = require('./User');
const Transaction = require('./Transaction');
const Vehicle = require('./Vehicle');
const Withdrawal = require('./Withdrawal');

// User associations
User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

// Vehicle associations - Driver (the person driving the vehicle)
User.hasOne(Vehicle, { foreignKey: 'driver_id', as: 'drivenVehicle' });
Vehicle.belongsTo(User, { foreignKey: 'driver_id', as: 'driverInfo' });

// Vehicle associations - Owner (the person who owns the vehicle)
User.hasMany(Vehicle, { foreignKey: 'owner_id', as: 'ownedVehicles' });
Vehicle.belongsTo(User, { foreignKey: 'owner_id', as: 'ownerInfo' });

// Transaction associations
Vehicle.hasMany(Transaction, { foreignKey: 'vehicle_id' });
Transaction.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// Withdrawal associations
User.hasMany(Withdrawal, { foreignKey: 'owner_id' });
Withdrawal.belongsTo(User, { foreignKey: 'owner_id' });

module.exports = {
    sequelize,
    User,
    Transaction,
    Vehicle,
    Withdrawal
};