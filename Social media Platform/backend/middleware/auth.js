const jwt = require('jsonwebtoken');
const config = require('../config');
const { dbGet } = require('../database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Allow guest access
    if (!token || token === 'guest-token') {
        req.user = {
            id: 1,
            username: 'Guest User',
            email: 'guest@example.com',
            first_name: 'Guest',
            last_name: 'User'
        };
        return next();
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await dbGet('SELECT id, username, email, first_name, last_name FROM users WHERE id = ?', [decoded.userId]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { authenticateToken };
