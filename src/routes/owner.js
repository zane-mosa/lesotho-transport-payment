// src/routes/owner.js - Complete file with withdrawal tracking and delete functionality
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Transaction, Vehicle, User, Withdrawal } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'lesotho_transport_secret_key_2024';

// Middleware to verify token and owner role
const verifyOwner = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'owner') {
            return res.status(403).json({ error: 'Access denied. Owner only.' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Register vehicle under owner
router.post('/register-vehicle', verifyOwner, async (req, res) => {
    try {
        const { taxi_number, registration_number, route, capacity, driver_id } = req.body;
        
        const existingVehicle = await Vehicle.findOne({ where: { taxi_number } });
        if (existingVehicle) {
            return res.status(400).json({ error: 'Taxi number already registered' });
        }
        
        const vehicle = await Vehicle.create({
            owner_id: req.user.id,
            driver_id: driver_id || null,
            taxi_number,
            registration_number,
            route,
            capacity: capacity || 15
        });
        
        res.json({ success: true, message: 'Vehicle registered successfully', vehicle });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Assign driver to vehicle
router.put('/assign-driver', verifyOwner, async (req, res) => {
    try {
        const { vehicle_id, driver_id } = req.body;
        
        const vehicle = await Vehicle.findOne({
            where: { vehicle_id: vehicle_id, owner_id: req.user.id }
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        const driver = await User.findOne({
            where: { user_id: driver_id, role: 'driver' }
        });
        
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        
        await vehicle.update({ driver_id: driver_id });
        
        res.json({
            success: true,
            message: `Driver ${driver.name} assigned to ${vehicle.taxi_number}`,
            vehicle: {
                id: vehicle.vehicle_id,
                taxi_number: vehicle.taxi_number,
                driver_name: driver.name
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get owner dashboard - updated to subtract withdrawals
router.get('/dashboard', verifyOwner, async (req, res) => {
    try {
        const ownerId = req.user.id;
        
        // Get all vehicles owned by this owner
        const vehicles = await Vehicle.findAll({
            where: { owner_id: ownerId },
            include: [{
                model: User,
                as: 'driverInfo',
                attributes: ['user_id', 'name', 'phone_number']
            }]
        });
        
        let totalEarnings = 0;
        let totalTrips = 0;
        let allTransactions = [];
        
        // Get transactions for all vehicles
        for (const vehicle of vehicles) {
            const transactions = await Transaction.findAll({
                where: {
                    vehicle_id: vehicle.vehicle_id,
                    status: 'completed'
                },
                include: [{
                    model: User,
                    attributes: ['name', 'phone_number']
                }],
                order: [['createdAt', 'DESC']]
            });
            
            const vehicleEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            totalEarnings += vehicleEarnings;
            totalTrips += transactions.length;
            allTransactions.push(...transactions.map(t => ({
                ...t.toJSON(),
                taxi_number: vehicle.taxi_number,
                driver_name: vehicle.driverInfo?.name || 'No driver assigned'
            })));
        }
        
        // Get total withdrawals
        const withdrawals = await Withdrawal.findAll({
            where: { owner_id: ownerId, status: 'completed' }
        });
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);
        
        // Calculate available balance
        const availableBalance = totalEarnings - totalWithdrawn;
        
        // Sort transactions by date
        allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            success: true,
            dashboard: {
                vehicles: vehicles.map(v => ({
                    id: v.vehicle_id,
                    taxi_number: v.taxi_number,
                    route: v.route,
                    capacity: v.capacity,
                    driver_name: v.driverInfo?.name || 'Unassigned',
                    driver_id: v.driver_id,
                    status: 'Active'
                })),
                stats: {
                    total_vehicles: vehicles.length,
                    total_earnings: totalEarnings,
                    total_withdrawn: totalWithdrawn,
                    available_balance: availableBalance,
                    total_trips: totalTrips,
                    average_per_vehicle: vehicles.length > 0 ? totalEarnings / vehicles.length : 0
                },
                recent_transactions: allTransactions.slice(0, 20).map(t => ({
                    id: t.transaction_id,
                    reference: t.transaction_reference,
                    amount: t.amount,
                    passenger_name: t.User?.name,
                    taxi_number: t.taxi_number,
                    driver_name: t.driver_name,
                    time: t.createdAt,
                    status: t.status,
                    trip_type: t.trip_type
                }))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get drivers list
router.get('/drivers', verifyOwner, async (req, res) => {
    try {
        const drivers = await User.findAll({
            where: { role: 'driver' },
            attributes: ['user_id', 'name', 'phone_number']
        });
        
        res.json({ success: true, drivers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transactions for a specific vehicle
router.get('/vehicle-transactions/:vehicleId', verifyOwner, async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        const vehicle = await Vehicle.findOne({
            where: { vehicle_id: vehicleId, owner_id: req.user.id }
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        
        const transactions = await Transaction.findAll({
            where: { vehicle_id: vehicleId },
            include: [{
                model: User,
                attributes: ['name', 'phone_number']
            }],
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            transactions: transactions.map(t => ({
                id: t.transaction_id,
                reference: t.transaction_reference,
                amount: t.amount,
                trip_type: t.trip_type,
                status: t.status,
                time: t.createdAt,
                passenger_name: t.User?.name,
                passenger_phone: t.User?.phone_number
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a single transaction
router.delete('/transaction/:transactionId', verifyOwner, async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        const transaction = await Transaction.findOne({
            where: { transaction_id: transactionId },
            include: [{
                model: Vehicle,
                where: { owner_id: req.user.id }
            }]
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found or not owned by you' });
        }
        
        await transaction.destroy();
        res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete all transactions for a vehicle
router.delete('/vehicle/:vehicleId/transactions', verifyOwner, async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        const vehicle = await Vehicle.findOne({
            where: { vehicle_id: vehicleId, owner_id: req.user.id }
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found or not owned by you' });
        }
        
        const deleted = await Transaction.destroy({
            where: { vehicle_id: vehicleId }
        });
        
        res.json({ success: true, message: `Deleted ${deleted} transactions` });
    } catch (error) {
        console.error('Delete vehicle transactions error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Withdraw earnings - updated to save withdrawal record
router.post('/withdraw', verifyOwner, async (req, res) => {
    try {
        const { amount, payment_method, phone_number } = req.body;
        
        // Get total earnings
        const vehicles = await Vehicle.findAll({ where: { owner_id: req.user.id } });
        let totalEarnings = 0;
        
        for (const vehicle of vehicles) {
            const transactions = await Transaction.findAll({
                where: {
                    vehicle_id: vehicle.vehicle_id,
                    status: 'completed'
                }
            });
            totalEarnings += transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        }
        
        // Get total withdrawals
        const withdrawals = await Withdrawal.findAll({
            where: { owner_id: req.user.id, status: 'completed' }
        });
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);
        
        const availableBalance = totalEarnings - totalWithdrawn;
        
        if (amount > availableBalance) {
            return res.status(400).json({ 
                error: 'Insufficient balance',
                available_balance: availableBalance,
                requested: amount,
                message: `You only have M${availableBalance} available to withdraw`
            });
        }
        
        // Create withdrawal record
        const reference = `WD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const withdrawal = await Withdrawal.create({
            owner_id: req.user.id,
            amount: amount,
            payment_method: payment_method,
            phone_number: phone_number,
            status: 'completed',
            reference: reference
        });
        
        res.json({
            success: true,
            message: `Withdrawal of M${amount} sent to ${payment_method} number ${phone_number}`,
            withdrawal: {
                id: withdrawal.withdrawal_id,
                reference: reference,
                amount: amount,
                payment_method: payment_method,
                phone_number: phone_number,
                timestamp: withdrawal.createdAt,
                remaining_balance: availableBalance - amount
            }
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;