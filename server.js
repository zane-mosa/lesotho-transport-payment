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
// Add with other imports
const ownerRoutes = require('./src/routes/owner');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/driver', driverRoutes);
// Add with other routes
app.use('/api/owner', ownerRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Lesotho Transport Payment System',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth/register, /api/auth/login, /api/auth/me',
            payments: '/api/payments/initiate, /api/payments/history, /api/payments/status/:reference',
            driver: '/api/driver/dashboard, /api/driver/register-vehicle, /api/driver/verify-payment',
            owner: '/api/owner/dashboard, /api/owner/register-vehicle, /api/owner/withdraw',
            health: '/health, /api/test, /api/db-status'
        },
        timestamp: new Date().toISOString()
    });
});

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

// Start server
const startServer = async () => {
    console.log('\n🔌 Starting Lesotho Transport Payment System...\n');
    
    const dbConnected = await testConnection();
    
    if (dbConnected) {
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synchronized');
        
        // Count existing users
        const userCount = await User.count();
        console.log(`👥 Total users: ${userCount}`);
    }
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running at http://localhost:${PORT}`);
        console.log(`\n📝 Available API Endpoints:`);
        console.log(`\n   🔐 AUTHENTICATION:`);
        console.log(`   POST   /api/auth/register     - Register new user`);
        console.log(`   POST   /api/auth/login        - Login user`);
        console.log(`   GET    /api/auth/me           - Get current user`);
        console.log(`\n   💰 PAYMENTS:`);
        console.log(`   POST   /api/payments/initiate - Initiate payment`);
        console.log(`   GET    /api/payments/history  - View payment history`);
        console.log(`   GET    /api/payments/status/:reference - Check payment status`);
        console.log(`\n   🚖 DRIVER:`);
        console.log(`   POST   /api/driver/register-vehicle - Register vehicle`);
        console.log(`   GET    /api/driver/dashboard        - Driver dashboard`);
        console.log(`   POST   /api/driver/verify-payment   - Verify payment via QR`);
        console.log(`   GET    /api/driver/daily-report     - Daily earnings report`);
        console.log(`   GET    /api/driver/generate-qr      - Generate driver QR code`);
        console.log(`\n   🏢 OWNER:`);
        console.log(`   POST   /api/owner/register-vehicle - Register vehicle under owner`);
        console.log(`   GET    /api/owner/dashboard        - Owner dashboard with all vehicles`);
        console.log(`   GET    /api/owner/drivers          - List all drivers`);
        console.log(`   POST   /api/owner/withdraw         - Withdraw earnings`);
        console.log(`\n   📊 SYSTEM:`);
        console.log(`   GET    /health                - Health check`);
        console.log(`   GET    /api/db-status         - Database status`);
        console.log(`   GET    /api/test              - Test endpoints`);
        console.log(`\n✨ Ready for requests!\n`);
    });
};

startServer();