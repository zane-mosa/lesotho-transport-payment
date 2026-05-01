// working-server.js - SIMPLE WORKING SERVER
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

// Simple routes
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Lesotho Transport API is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});