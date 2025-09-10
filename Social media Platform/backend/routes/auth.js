const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { dbGet, dbRun } = require('../database');
const config = require('../config');

const router = express.Router();

// Register
router.post('/register', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, first_name, last_name } = req.body;

        // Check if user already exists
        const existingUser = await dbGet('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await dbRun(
            'INSERT INTO users (username, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, first_name || '', last_name || '']
        );

        // Create user profile
        await dbRun(
            'INSERT INTO user_profiles (user_id, bio) VALUES (?, ?)',
            [result.id, 'Welcome to SocialApp!']
        );

        res.status(201).json({ message: 'User created successfully', userId: result.id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login - Allow any email/password combination
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // Try to find existing user
        let user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
        
        // If user doesn't exist, create one automatically
        if (!user) {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create user with username as email if it looks like an email
            const email = username.includes('@') ? username : `${username}@example.com`;
            const firstName = username.split('@')[0] || username;
            
            // Create user
            const result = await dbRun(
                'INSERT INTO users (username, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
                [username, email, hashedPassword, firstName, '']
            );

            // Create user profile
            await dbRun(
                'INSERT INTO user_profiles (user_id, bio) VALUES (?, ?)',
                [result.id, 'Welcome to SocialApp!']
            );

            // Get the newly created user
            user = await dbGet('SELECT * FROM users WHERE id = ?', [result.id]);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
