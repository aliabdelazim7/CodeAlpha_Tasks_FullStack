const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await dbAll(`
            SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at,
                   up.bio, up.profile_picture
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
router.get('/:id', async (req, res) => {
    try {
        const user = await dbGet(`
            SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at,
                   up.bio, up.profile_picture
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
        `, [req.params.id]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/:id', authenticateToken, upload.single('profile_picture'), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Check if user is updating their own profile
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }

        const { bio } = req.body;
        const profilePicture = req.file ? `/uploads/profile_pics/${req.file.filename}` : null;

        // Update user profile
        if (profilePicture) {
            await dbRun(
                'UPDATE user_profiles SET bio = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                [bio, profilePicture, userId]
            );
        } else {
            await dbRun(
                'UPDATE user_profiles SET bio = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                [bio, userId]
            );
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's posts
router.get('/:id/posts', async (req, res) => {
    try {
        const posts = await dbAll(`
            SELECT p.*, u.username, u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, [req.params.id]);

        res.json(posts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Follow/Unfollow user
router.post('/:id/follow', authenticateToken, async (req, res) => {
    try {
        const followingId = parseInt(req.params.id);
        const followerId = req.user.id;

        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if already following
        const existingFollow = await dbGet(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existingFollow) {
            // Unfollow
            await dbRun(
                'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
                [followerId, followingId]
            );
            res.json({ message: 'User unfollowed', following: false });
        } else {
            // Follow
            await dbRun(
                'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
                [followerId, followingId]
            );
            res.json({ message: 'User followed', following: true });
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's followers
router.get('/:id/followers', async (req, res) => {
    try {
        const followers = await dbAll(`
            SELECT u.id, u.username, u.first_name, u.last_name, up.profile_picture, f.created_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
        `, [req.params.id]);

        res.json(followers);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's following
router.get('/:id/following', async (req, res) => {
    try {
        const following = await dbAll(`
            SELECT u.id, u.username, u.first_name, u.last_name, up.profile_picture, f.created_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `, [req.params.id]);

        res.json(following);
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
