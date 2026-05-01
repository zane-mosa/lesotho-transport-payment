// src/routes/driver.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Transaction, Vehicle, User } = require('../models');
const QRCode = require('qrcode');

const JWT_SECRET = process.env.JWT_SECRET || 'lesotho_transport_secret_key_2024';

// Middleware to verify token and driver role
const verifyDriver = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if user is a driver
        if (decoded.role !== 'driver') {
            return res.status(403).json({ error: 'Access denied. Driver only.' });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Check if taxi number exists (no authentication required - passengers can check)
router.get('/check-taxi/:taxiNumber', async (req, res) => {
    try {
        const { taxiNumber } = req.params;
        const searchNumber = taxiNumber.toUpperCase();
        console.log('🔍 Checking taxi number:', searchNumber);
        
        const vehicle = await Vehicle.findOne({
            where: { taxi_number: searchNumber }
        });
        
        console.log('Vehicle found:', vehicle ? 'YES' : 'NO');
        
        if (vehicle) {
            // Get driver info if assigned
            let driverName = 'No driver assigned';
            if (vehicle.driver_id) {
                const driver = await User.findOne({
                    where: { user_id: vehicle.driver_id }
                });
                driverName = driver?.name || 'Unknown driver';
            }
            
            // Get owner info
            let ownerName = 'Unknown owner';
            if (vehicle.owner_id) {
                const owner = await User.findOne({
                    where: { user_id: vehicle.owner_id }
                });
                ownerName = owner?.name || 'Unknown owner';
            }
            
            res.json({
                valid: true,
                driver: {
                    driver_id: vehicle.driver_id,
                    name: driverName,
                    taxi_number: vehicle.taxi_number,
                    route: vehicle.route,
                    owner_name: ownerName
                }
            });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        console.error('Check taxi error:', error);
        res.status(500).json({ valid: false, error: error.message });
    }
});

// Register vehicle for driver
router.post('/register-vehicle', verifyDriver, async (req, res) => {
    try {
        const { taxi_number, registration_number, route, capacity } = req.body;
        
        // Check if vehicle already exists
        const existingVehicle = await Vehicle.findOne({ 
            where: { taxi_number } 
        });
        
        if (existingVehicle) {
            return res.status(400).json({ error: 'Taxi number already registered' });
        }
        
        // Create vehicle
        const vehicle = await Vehicle.create({
            driver_id: req.user.id,
            taxi_number,
            registration_number,
            route,
            capacity: capacity || 15
        });
        
        res.json({
            success: true,
            message: 'Vehicle registered successfully',
            vehicle
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get driver dashboard data
router.get('/dashboard', verifyDriver, async (req, res) => {
    try {
        const driverId = req.user.id;
        
        // Get driver's vehicle
        const vehicle = await Vehicle.findOne({ 
            where: { driver_id: driverId } 
        });
        
        if (!vehicle) {
            return res.status(404).json({ 
                error: 'No vehicle registered',
                message: 'Please register your vehicle first'
            });
        }
        
        // Get today's transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTransactions = await Transaction.findAll({
            where: {
                vehicle_id: vehicle.vehicle_id,
                status: 'completed',
                createdAt: {
                    [Op.gte]: today
                }
            }
        });
        
        // Get weekly earnings
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklyTransactions = await Transaction.findAll({
            where: {
                vehicle_id: vehicle.vehicle_id,
                status: 'completed',
                createdAt: {
                    [Op.gte]: weekAgo
                }
            }
        });
        
        // Calculate totals
        const todayEarnings = todayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const weeklyEarnings = weeklyTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const todayTrips = todayTransactions.length;
        
        // Get recent transactions
        const recentTransactions = await Transaction.findAll({
            where: {
                vehicle_id: vehicle.vehicle_id
            },
            include: [{
                model: User,
                attributes: ['name', 'phone_number']
            }],
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        res.json({
            success: true,
            dashboard: {
                vehicle: {
                    taxi_number: vehicle.taxi_number,
                    route: vehicle.route,
                    capacity: vehicle.capacity
                },
                stats: {
                    today_earnings: todayEarnings,
                    today_trips: todayTrips,
                    weekly_earnings: weeklyEarnings,
                    weekly_trips: weeklyTransactions.length
                },
                recent_transactions: recentTransactions.map(t => ({
                    id: t.transaction_id,
                    reference: t.transaction_reference,
                    amount: t.amount,
                    passenger_name: t.User?.name,
                    passenger_phone: t.User?.phone_number,
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

// Scan QR code and verify payment
router.post('/verify-payment', verifyDriver, async (req, res) => {
    try {
        const { qr_data } = req.body;
        
        // Parse QR data
        let paymentData;
        try {
            paymentData = JSON.parse(qr_data);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid QR code data' });
        }
        
        const { transaction_id, reference } = paymentData;
        
        // Find transaction
        const transaction = await Transaction.findOne({
            where: {
                [Op.or]: [
                    { transaction_id: transaction_id },
                    { transaction_reference: reference }
                ]
            },
            include: [{
                model: User,
                attributes: ['name', 'phone_number']
            }]
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Get driver's vehicle
        const vehicle = await Vehicle.findOne({ 
            where: { driver_id: req.user.id } 
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not registered' });
        }
        
        // Check if payment is already used
        if (transaction.vehicle_id) {
            return res.status(400).json({ 
                error: 'Payment already used',
                message: 'This payment has already been verified for another trip'
            });
        }
        
        // Check if payment is completed
        if (transaction.status !== 'completed') {
            return res.status(400).json({ 
                error: 'Payment not completed',
                status: transaction.status,
                message: 'This payment has not been completed yet'
            });
        }
        
        // Update transaction with vehicle info
        await transaction.update({
            vehicle_id: vehicle.vehicle_id,
            status: 'completed'
        });
        
        res.json({
            success: true,
            message: 'Payment verified successfully',
            transaction: {
                reference: transaction.transaction_reference,
                amount: transaction.amount,
                passenger: transaction.User?.name,
                time: transaction.createdAt
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get daily earnings report
router.get('/daily-report', verifyDriver, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Get driver's vehicle
        const vehicle = await Vehicle.findOne({ 
            where: { driver_id: req.user.id } 
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not registered' });
        }
        
        // Get transactions for the day
        const transactions = await Transaction.findAll({
            where: {
                vehicle_id: vehicle.vehicle_id,
                status: 'completed',
                createdAt: {
                    [Op.gte]: targetDate,
                    [Op.lt]: nextDay
                }
            },
            include: [{
                model: User,
                attributes: ['name', 'phone_number']
            }],
            order: [['createdAt', 'ASC']]
        });
        
        const totalEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalTrips = transactions.length;
        
        // Group by hour for chart data
        const hourlyData = {};
        transactions.forEach(t => {
            const hour = new Date(t.createdAt).getHours();
            if (!hourlyData[hour]) {
                hourlyData[hour] = { trips: 0, earnings: 0 };
            }
            hourlyData[hour].trips++;
            hourlyData[hour].earnings += parseFloat(t.amount);
        });
        
        res.json({
            success: true,
            report: {
                date: targetDate.toISOString().split('T')[0],
                total_earnings: totalEarnings,
                total_trips: totalTrips,
                average_fare: totalTrips > 0 ? totalEarnings / totalTrips : 0,
                transactions: transactions.map(t => ({
                    time: t.createdAt,
                    reference: t.transaction_reference,
                    amount: t.amount,
                    passenger: t.User?.name,
                    phone: t.User?.phone_number
                })),
                hourly_breakdown: hourlyData
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Generate QR for driver to display
router.get('/generate-qr', verifyDriver, async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({ 
            where: { driver_id: req.user.id } 
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not registered' });
        }
        
        const driverData = {
            driver_id: req.user.id,
            taxi_number: vehicle.taxi_number,
            route: vehicle.route,
            timestamp: new Date().toISOString()
        };
        
        const qrCode = await QRCode.toDataURL(JSON.stringify(driverData));
        
        res.json({
            success: true,
            qr_code: qrCode,
            taxi_number: vehicle.taxi_number
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Confirm payment
router.post('/confirm-payment/:transactionId', verifyDriver, async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        // Get driver's vehicle
        const vehicle = await Vehicle.findOne({ 
            where: { driver_id: req.user.id } 
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not registered' });
        }
        
        // Find transaction belonging to this driver's vehicle
        const transaction = await Transaction.findOne({
            where: {
                transaction_id: transactionId,
                vehicle_id: vehicle.vehicle_id
            }
        });
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Update transaction status to completed
        await transaction.update({ status: 'completed' });
        
        res.json({ 
            success: true, 
            message: 'Payment confirmed successfully',
            transaction: {
                id: transaction.transaction_id,
                reference: transaction.transaction_reference,
                amount: transaction.amount,
                status: transaction.status
            }
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get driver's assigned vehicle
router.get('/assigned-vehicle', verifyDriver, async (req, res) => {
    try {
        console.log('🔍 Looking for vehicle with driver_id:', req.user.id);
        
        const vehicle = await Vehicle.findOne({
            where: { driver_id: req.user.id }
        });
        
        if (!vehicle) {
            console.log('❌ No vehicle found for driver:', req.user.id);
            return res.status(404).json({ error: 'No vehicle assigned yet' });
        }
        
        // Get owner info
        let ownerName = null;
        if (vehicle.owner_id) {
            const owner = await User.findByPk(vehicle.owner_id);
            ownerName = owner?.name;
        }
        
        console.log('✅ Found vehicle:', vehicle.taxi_number);
        
        res.json({
            success: true,
            vehicle: {
                id: vehicle.vehicle_id,
                taxi_number: vehicle.taxi_number,
                route: vehicle.route,
                capacity: vehicle.capacity,
                owner_name: ownerName
            }
        });
    } catch (error) {
        console.error('Assigned vehicle error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;