// src/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

// JWT Secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'lesotho_transport_secret_key_2024';

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user.user_id, phone: user.phone_number, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Register a new user - UPDATED: removed isMobilePhone validation and added owner role
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone_number').notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    // Change this line: added 'owner' to allowed roles
    body('role').isIn(['passenger', 'driver', 'owner']).withMessage('Role must be passenger, driver, or owner')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone_number, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { phone_number } });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists',
                message: 'This phone number is already registered'
            });
        }

        // Create new user
        const user = await User.create({
            name: name.trim(),
            phone_number: phone_number.trim(),
            password,
            role
        });

        // Generate token
        const token = generateToken(user);

        // Return user data (without password)
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                phone_number: user.phone_number,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed',
            message: error.message 
        });
    }
});

// Login user
router.post('/login', [
    body('phone_number').notEmpty().withMessage('Phone number required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { phone_number, password } = req.body;

        // Find user by phone number
        const user = await User.findOne({ where: { phone_number: phone_number.trim() } });
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Phone number or password is incorrect'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Phone number or password is incorrect'
            });
        }

        // Generate token
        const token = generateToken(user);

        // Return user data
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                phone_number: user.phone_number,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed',
            message: error.message 
        });
    }
});

// Get current user profile (protected route)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({ 
            error: 'Invalid token',
            message: error.message 
        });
    }
});

module.exports = router;