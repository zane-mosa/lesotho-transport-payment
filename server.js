// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize, testConnection } = require('./src/config/database');
const { User, Transaction } = require('./src/models');

// Import routes
const authRoutes = require('./src/routes/auth');
const paymentRoutes = require('./src/routes/payments');
const driverRoutes = require('./src/routes/driver');
const ownerRoutes = require('./src/routes/owner');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SIMPLE TEST ROUTES - Add at the VERY TOP
// ============================================

// Root route - simplest test
app.get('/', (req, res) => {
    res.json({ 
        status: 'alive', 
        message: 'Server is running!',
        time: new Date().toISOString()
    });
});

// Simple ping test
app.get('/ping', (req, res) => {
    res.send('pong');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Lesotho Transport Payment System',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/owner', ownerRoutes);

// Database status
app.get('/api/db-status', async (req, res) => {
    try {
        await sequelize.authenticate();
        const userCount = await User.count();
        const transactionCount = await Transaction.count();
        
        res.json({
            database: 'connected',
            status: 'OK',
            stats: {
                users: userCount,
                transactions: transactionCount
            },
            message: 'Database is connected'
        });
    } catch (error) {
        res.status(500).json({
            database: 'disconnected',
            status: 'ERROR',
            message: error.message
        });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!',
        endpoints: [
            '🔐 AUTHENTICATION:',
            '   POST /api/auth/register - Register new user',
            '   POST /api/auth/login - Login user',
            '   GET /api/auth/me - Get current user',
            '',
            '💰 PAYMENTS:',
            '   POST /api/payments/initiate - Initiate payment',
            '   GET /api/payments/history - View payment history',
            '   GET /api/payments/status/:reference - Check payment status',
            '',
            '🚖 DRIVER:',
            '   POST /api/driver/register-vehicle - Register vehicle',
            '   GET /api/driver/dashboard - Driver dashboard',
            '   POST /api/driver/verify-payment - Verify payment via QR',
            '   GET /api/driver/daily-report - Daily earnings report',
            '   GET /api/driver/generate-qr - Generate driver QR code',
            '',
            '🏢 OWNER:',
            '   POST /api/owner/register-vehicle - Register vehicle under owner',
            '   GET /api/owner/dashboard - Owner dashboard with all vehicles',
            '   GET /api/owner/drivers - List all drivers',
            '   POST /api/owner/withdraw - Withdraw earnings',
            '',
            '📊 SYSTEM:',
            '   GET /health - Health check',
            '   GET /api/db-status - Database status',
            '   GET /api/test - This endpoint'
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Server Error',
        message: err.message 
    });
});

// ============================================
// BETTER ERROR HANDLING FOR STARTUP
// ============================================

const startServer = async () => {
    console.log('\n========================================');
    console.log('🔌 Starting Lesotho Transport Payment System...');
    console.log('========================================\n');
    
    // Log environment status
    console.log('📋 Environment Check:');
    console.log(`   PORT: ${PORT}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST || 'Not set'}`);
    console.log(`   DB_USER: ${process.env.DB_USER || 'Not set'}`);
    console.log('');
    
    let dbConnected = false;
    
    // Attempt database connection with retry
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.log(`📡 Database connection attempt ${attempt}...`);
            dbConnected = await testConnection();
            if (dbConnected) {
                console.log('✅ Database connected successfully!');
                break;
            }
        } catch (error) {
            console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
            if (attempt === 3) {
                console.log('⚠️ Could not connect to database after 3 attempts');
            }
            // Wait 2 seconds before retry
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Sync database if connected
    if (dbConnected) {
        try {
            await sequelize.sync({ alter: true });
            console.log('✅ Database tables synchronized');
            
            const userCount = await User.count();
            console.log(`👥 Total users in database: ${userCount}`);
        } catch (error) {
            console.error('❌ Database sync error:', error.message);
        }
    } else {
        console.log('⚠️ Continuing without database connection - some features will not work');
    }
    
    // Start HTTP server - UPDATED to listen on 0.0.0.0 for Render
    try {
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log('\n========================================');
            console.log(`🚀 SERVER IS RUNNING!`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log('========================================\n');
            console.log('📝 Available Test Endpoints:');
            console.log(`   GET /                    - Root test`);
            console.log(`   GET /ping                - Simple ping test`);
            console.log(`   GET /health              - Health check`);
            console.log(`   GET /api/test            - API test`);
            console.log(`   GET /api/db-status       - Database status`);
            console.log('\n✨ Ready for requests!\n');
        });
        
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
            } else {
                console.error('❌ Server error:', error);
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.log('⚠️ Keeping server alive despite error...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    console.log('⚠️ Keeping server alive despite rejection...');
});

// Start the server
startServer();