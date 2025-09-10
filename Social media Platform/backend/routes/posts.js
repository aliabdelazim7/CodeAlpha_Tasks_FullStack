const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await dbAll(`
            SELECT p.*, u.username, u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `);

        // Add comments to each post
        for (let post of posts) {
            const comments = await dbAll(`
                SELECT c.*, u.username, u.first_name, u.last_name
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC
            `, [post.id]);
            post.comments = comments;
        }

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single post
router.get('/:id', async (req, res) => {
    try {
        const post = await dbGet(`
            SELECT p.*, u.username, u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Get comments
        const comments = await dbAll(`
            SELECT c.*, u.username, u.first_name, u.last_name
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [post.id]);

        post.comments = comments;
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create post
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const image = req.file ? `/uploads/post_images/${req.file.filename}` : null;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Post content is required' });
        }

        const result = await dbRun(
            'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
            [req.user.id, content, image]
        );

        // Get the created post with user info
        const newPost = await dbGet(`
            SELECT p.*, u.username, u.first_name, u.last_name,
                   0 as likes_count, 0 as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [result.id]);

        newPost.comments = [];
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update post
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { content } = req.body;

        // Check if post exists and belongs to user
        const post = await dbGet('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, req.user.id]);
        if (!post) {
            return res.status(404).json({ error: 'Post not found or you do not have permission to edit it' });
        }

        await dbRun(
            'UPDATE posts SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, postId]
        );

        res.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        // Check if post exists and belongs to user
        const post = await dbGet('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, req.user.id]);
        if (!post) {
            return res.status(404).json({ error: 'Post not found or you do not have permission to delete it' });
        }

        await dbRun('DELETE FROM posts WHERE id = ?', [postId]);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Like/Unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;

        // Check if already liked
        const existingLike = await dbGet(
            'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existingLike) {
            // Unlike
            await dbRun(
                'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            
            // Update likes count
            await dbRun(
                'UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?',
                [postId, postId]
            );

            res.json({ message: 'Post unliked', liked: false });
        } else {
            // Like
            await dbRun(
                'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
                [postId, userId]
            );

            // Update likes count
            await dbRun(
                'UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?',
                [postId, postId]
            );

            res.json({ message: 'Post liked', liked: true });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        const result = await dbRun(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, req.user.id, content]
        );

        // Get the created comment with user info
        const newComment = await dbGet(`
            SELECT c.*, u.username, u.first_name, u.last_name
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.id]);

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user feed (posts from followed users)
router.get('/feed/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        // Verify user is requesting their own feed
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'You can only access your own feed' });
        }

        const posts = await dbAll(`
            SELECT p.*, u.username, u.first_name, u.last_name,
                   (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id IN (
                SELECT following_id FROM follows WHERE follower_id = ?
            ) OR p.user_id = ?
            ORDER BY p.created_at DESC
        `, [userId, userId]);

        // Add comments to each post
        for (let post of posts) {
            const comments = await dbAll(`
                SELECT c.*, u.username, u.first_name, u.last_name
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC
            `, [post.id]);
            post.comments = comments;
        }

        res.json(posts);
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
