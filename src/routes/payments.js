const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { Transaction, Vehicle } = require('../models');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lesotho_transport_secret_key_2024';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

router.post('/initiate', verifyToken, async (req, res) => {
    try {
        console.log('📝 Payment request received:', req.body);
        
        const { amount, payment_method, trip_type, trip_details, taxi_number, driver_id } = req.body;
        
        // Validate required fields
        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }
        if (!payment_method) {
            return res.status(400).json({ error: 'Payment method is required' });
        }
        if (!trip_type) {
            return res.status(400).json({ error: 'Trip type is required' });
        }
        
        const reference = `TX${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Find the vehicle to link the transaction
        let vehicle = null;
        if (taxi_number) {
            vehicle = await Vehicle.findOne({ 
                where: { taxi_number: taxi_number.toUpperCase() }
            });
            if (vehicle) {
                console.log('✅ Found vehicle for taxi:', taxi_number, 'vehicle_id:', vehicle.vehicle_id);
            } else {
                console.log('⚠️ Vehicle not found for taxi:', taxi_number);
            }
        }
        
        // Create transaction with vehicle_id
        const transaction = await Transaction.create({
            user_id: req.user.id,
            amount: amount,
            trip_type: trip_type,
            trip_details: trip_details || (trip_type === 'local' ? `${amount / 13} trip(s)` : 'special gate drop'),
            payment_method: payment_method,
            status: 'completed',
            transaction_reference: reference,
            taxi_number: taxi_number || null,
            driver_id: driver_id || null,
            vehicle_id: vehicle ? vehicle.vehicle_id : null
        });
        
        console.log('✅ Transaction created:', transaction.transaction_reference);
        if (taxi_number) console.log('   Taxi number:', taxi_number);
        if (vehicle) console.log('   Vehicle ID:', vehicle.vehicle_id);
        
        // Generate QR code
        const qrData = JSON.stringify({
            transaction_id: transaction.transaction_id,
            reference,
            amount: amount,
            trip_type: trip_type,
            taxi_number: taxi_number
        });
        
        const qrCode = await QRCode.toDataURL(qrData);
        await transaction.update({ qr_code: qrCode });
        
        res.json({
            success: true,
            message: 'Payment successful!',
            transaction: {
                id: transaction.transaction_id,
                reference: reference,
                amount: amount,
                trip_type: trip_type,
                trip_details: transaction.trip_details,
                status: 'completed',
                taxi_number: taxi_number,
                qr_code: qrCode
            }
        });
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        res.status(500).json({ 
            error: 'Payment failed', 
            message: error.message 
        });
    }
});

router.get('/history', verifyToken, async (req, res) => {
    try {
        console.log('📝 History request for user:', req.user.id);
        
        const transactions = await Transaction.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        
        console.log('✅ Found', transactions.length, 'transactions');
        
        res.json({
            success: true,
            count: transactions.length,
            transactions: transactions.map(t => ({
                id: t.transaction_id,
                reference: t.transaction_reference,
                amount: t.amount,
                trip_type: t.trip_type,
                trip_details: t.trip_details,
                method: t.payment_method,
                status: t.status,
                date: t.createdAt,
                taxi_number: t.taxi_number,
                driver_id: t.driver_id
            }))
        });
    } catch (error) {
        console.error('❌ History error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch history', 
            message: error.message 
        });
    }
});

module.exports = router;