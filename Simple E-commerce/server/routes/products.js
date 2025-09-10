const express = require('express');
const { db } = require('../database');
const { validateProduct } = require('../middleware/validation');

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  if (search) {
    const searchCondition = category ? ' AND' : ' WHERE';
    query += `${searchCondition} (name LIKE ? OR description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(products);
  });
});

// Get single product
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  });
});

// Get categories
router.get('/categories/list', (req, res) => {
  db.all('SELECT DISTINCT category FROM products WHERE category IS NOT NULL', (err, categories) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(categories.map(cat => cat.category));
  });
});

// Create product (Admin only)
router.post('/', validateProduct, (req, res) => {
  const { name, description, price, image_url, category, stock } = req.body;

  db.run(
    'INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, price, image_url, category, stock || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating product' });
      }

      res.status(201).json({
        message: 'Product created successfully',
        productId: this.lastID
      });
    }
  );
});

// Update product (Admin only)
router.put('/:id', validateProduct, (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url, category, stock } = req.body;

  db.run(
    'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category = ?, stock = ? WHERE id = ?',
    [name, description, price, image_url, category, stock, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating product' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete product (Admin only)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting product' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  });
});

module.exports = router;
