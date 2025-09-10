const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const config = require('../config');
const { validateOrder } = require('../middleware/validation');

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Create order
router.post('/', verifyToken, validateOrder, (req, res) => {
  const { items, totalAmount } = req.body;
  const userId = req.user.userId;

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Create order
    db.run(
      'INSERT INTO orders (user_id, total_amount) VALUES (?, ?)',
      [userId, totalAmount],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Error creating order' });
        }

        const orderId = this.lastID;
        let itemsProcessed = 0;

        // Insert order items
        items.forEach(item => {
          db.run(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, item.productId, item.quantity, item.price],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error creating order items' });
              }

              // Update product stock
              db.run(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.productId],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Error updating stock' });
                  }

                  itemsProcessed++;
                  if (itemsProcessed === items.length) {
                    db.run('COMMIT');
                    res.status(201).json({
                      message: 'Order created successfully',
                      orderId
                    });
                  }
                }
              );
            }
          );
        });
      }
    );
  });
});

// Get user orders
router.get('/my-orders', verifyToken, (req, res) => {
  const userId = req.user.userId;

  db.all(`
    SELECT 
      o.id,
      o.total_amount,
      o.status,
      o.created_at,
      oi.product_id,
      oi.quantity,
      oi.price,
      p.name as product_name,
      p.image_url
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    // Group items by order
    const orders = {};
    rows.forEach(row => {
      if (!orders[row.id]) {
        orders[row.id] = {
          id: row.id,
          total_amount: row.total_amount,
          status: row.status,
          created_at: row.created_at,
          items: []
        };
      }
      orders[row.id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        price: row.price,
        image_url: row.image_url
      });
    });

    res.json(Object.values(orders));
  });
});

// Get all orders (Admin only)
router.get('/', verifyToken, (req, res) => {
  // Check if user is admin (you can add role checking here)
  
  db.all(`
    SELECT 
      o.id,
      o.total_amount,
      o.status,
      o.created_at,
      u.name as customer_name,
      u.email as customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `, (err, orders) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(orders);
  });
});

// Update order status (Admin only)
router.put('/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating order' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({ message: 'Order status updated successfully' });
    }
  );
});

// Get order details
router.get('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  db.all(`
    SELECT 
      o.id,
      o.total_amount,
      o.status,
      o.created_at,
      oi.product_id,
      oi.quantity,
      oi.price,
      p.name as product_name,
      p.image_url
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.id = ? AND o.user_id = ?
  `, [id, userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = {
      id: rows[0].id,
      total_amount: rows[0].total_amount,
      status: rows[0].status,
      created_at: rows[0].created_at,
      items: rows.map(row => ({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        price: row.price,
        image_url: row.image_url
      }))
    };

    res.json(order);
  });
});

module.exports = router;
