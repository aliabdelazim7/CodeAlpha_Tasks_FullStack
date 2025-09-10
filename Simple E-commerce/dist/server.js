// E-Commerce Production Server
// This server serves the React frontend and provides API endpoints

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for React app
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database setup
const dbPath = path.join(__dirname, 'server', 'ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');

// Initialize database tables if they don't exist
const initDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      category TEXT,
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
    db.run('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');

    // Insert sample data if products table is empty
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (err) {
        console.error('Error checking products count:', err);
        return;
      }
      
      if (row.count === 0) {
        console.log('📦 Inserting sample products...');
        insertSampleProducts();
      } else {
        console.log(`📦 Found ${row.count} products in database`);
      }
    });
  });
};

// Insert sample products
const insertSampleProducts = () => {
  const sampleProducts = [
    // Electronics
    { name: 'Wireless Headphones', description: 'High-quality wireless headphones with noise cancellation', price: 99.99, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', category: 'Electronics', stock: 50 },
    { name: 'Smartphone Pro', description: 'Latest smartphone with advanced camera system', price: 699.99, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', category: 'Electronics', stock: 30 },
    { name: 'Gaming Laptop', description: 'High-performance gaming laptop with RTX graphics', price: 1299.99, image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', category: 'Electronics', stock: 15 },
    { name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart rate monitor', price: 249.99, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', category: 'Electronics', stock: 40 },
    { name: 'Wireless Earbuds', description: 'True wireless earbuds with active noise cancellation', price: 159.99, image_url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400', category: 'Electronics', stock: 60 },
    { name: 'Tablet Pro', description: 'Professional tablet for work and creativity', price: 449.99, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', category: 'Electronics', stock: 25 },
    { name: 'Bluetooth Speaker', description: 'Portable Bluetooth speaker with 360-degree sound', price: 79.99, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', category: 'Electronics', stock: 35 },
    { name: 'Gaming Console', description: 'Next-generation gaming console with 4K gaming', price: 499.99, image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400', category: 'Electronics', stock: 20 },
    { name: '4K Smart TV', description: '55-inch 4K Ultra HD Smart TV with HDR', price: 799.99, image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', category: 'Electronics', stock: 25 },
    { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard for gaming and typing', price: 149.99, image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400', category: 'Electronics', stock: 45 },
    { name: 'Webcam HD', description: '4K webcam for streaming and video calls', price: 89.99, image_url: 'https://images.unsplash.com/photo-1587825140708-d6a72c5c5d4b?w=400', category: 'Electronics', stock: 30 },
    { name: 'External SSD', description: '1TB external SSD for fast data transfer', price: 199.99, image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400', category: 'Electronics', stock: 40 },

    // Clothing
    { name: 'Premium T-Shirt', description: '100% cotton premium quality t-shirt', price: 29.99, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', category: 'Clothing', stock: 100 },
    { name: 'Denim Jeans', description: 'Classic blue denim jeans with perfect fit', price: 59.99, image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', category: 'Clothing', stock: 80 },
    { name: 'Winter Jacket', description: 'Warm winter jacket with water-resistant coating', price: 129.99, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', category: 'Clothing', stock: 50 },
    { name: 'Running Shoes', description: 'Comfortable running shoes with cushioning', price: 79.99, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', category: 'Clothing', stock: 60 },
    { name: 'Formal Shirt', description: 'Classic formal shirt for business occasions', price: 49.99, image_url: 'https://images.unsplash.com/photo-1594938298605-c04c1c0b0cde?w=400', category: 'Clothing', stock: 70 },
    { name: 'Summer Dress', description: 'Light and comfortable summer dress', price: 39.99, image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400', category: 'Clothing', stock: 45 },
    { name: 'Leather Jacket', description: 'Genuine leather jacket for style and warmth', price: 299.99, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', category: 'Clothing', stock: 30 },
    { name: 'Sneakers Collection', description: 'Limited edition sneakers collection', price: 199.99, image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', category: 'Clothing', stock: 25 },
    { name: 'Designer Handbag', description: 'Luxury designer handbag for special occasions', price: 399.99, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', category: 'Clothing', stock: 20 },
    { name: 'Cashmere Sweater', description: 'Soft cashmere sweater for winter comfort', price: 179.99, image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', category: 'Clothing', stock: 35 },

    // Sports
    { name: 'Yoga Mat', description: 'Non-slip yoga mat for exercise and meditation', price: 24.99, image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', category: 'Sports', stock: 80 },
    { name: 'Dumbbells Set', description: 'Adjustable dumbbells set for home workouts', price: 199.99, image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', category: 'Sports', stock: 40 },
    { name: 'Bicycle', description: 'Mountain bike for outdoor adventures', price: 299.99, image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400', category: 'Sports', stock: 25 },
    { name: 'Tennis Racket', description: 'Professional tennis racket for court play', price: 89.99, image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', category: 'Sports', stock: 35 },
    { name: 'Basketball', description: 'Official size basketball for court games', price: 34.99, image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400', category: 'Sports', stock: 50 },
    { name: 'Treadmill Pro', description: 'Professional treadmill for home fitness', price: 1299.99, image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', category: 'Sports', stock: 15 },
    { name: 'Yoga Set Complete', description: 'Complete yoga set with mat, blocks, and strap', price: 79.99, image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', category: 'Sports', stock: 30 },
    { name: 'Protein Powder', description: 'Whey protein powder for muscle building', price: 49.99, image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400', category: 'Sports', stock: 60 },
    { name: 'Resistance Bands', description: 'Set of resistance bands for strength training', price: 29.99, image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', category: 'Sports', stock: 45 },

    // Home
    { name: 'Coffee Maker', description: 'Automatic coffee maker for perfect morning brew', price: 149.99, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', category: 'Home', stock: 40 },
    { name: 'Blender', description: 'High-speed blender for smoothies and food prep', price: 89.99, image_url: 'https://images.unsplash.com/photo-1585515656519-5b3b8b5b5b5b?w=400', category: 'Home', stock: 35 },
    { name: 'Table Lamp', description: 'Modern LED table lamp with adjustable brightness', price: 39.99, image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', category: 'Home', stock: 50 },
    { name: 'Throw Pillows', description: 'Decorative throw pillows for home comfort', price: 19.99, image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', category: 'Home', stock: 60 },
    { name: 'Garden Tools Set', description: 'Complete set of garden tools for outdoor work', price: 69.99, image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400', category: 'Home', stock: 30 },
    { name: 'Kitchen Knife Set', description: 'Professional kitchen knife set for cooking', price: 129.99, image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400', category: 'Home', stock: 25 },
    { name: 'Smart Home Hub', description: 'Central hub for smart home automation', price: 199.99, image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400', category: 'Home', stock: 20 },
    { name: 'Air Purifier', description: 'HEPA air purifier for clean indoor air', price: 299.99, image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2f7c8?w=400', category: 'Home', stock: 15 },
    { name: 'Robot Vacuum', description: 'Smart robot vacuum for automated cleaning', price: 399.99, image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400', category: 'Home', stock: 18 },
    { name: 'Smart Doorbell', description: 'WiFi smart doorbell with video recording', price: 179.99, image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400', category: 'Home', stock: 22 },

    // Books
    { name: 'Bestseller Novel', description: 'Award-winning novel by acclaimed author', price: 24.99, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', category: 'Books', stock: 100 },
    { name: 'Cookbook Collection', description: 'Complete cookbook with 500+ recipes', price: 34.99, image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', category: 'Books', stock: 80 },
    { name: 'Self-Help Book', description: 'Inspirational self-help book for personal growth', price: 19.99, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', category: 'Books', stock: 90 },
    { name: 'Children\'s Book', description: 'Educational children\'s book with illustrations', price: 14.99, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', category: 'Books', stock: 120 },
    { name: 'Programming Guide', description: 'Complete guide to modern programming', price: 49.99, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', category: 'Books', stock: 60 },
    { name: 'Business Strategy Book', description: 'Strategic business planning and management', price: 29.99, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', category: 'Books', stock: 70 },
    { name: 'Art History Collection', description: 'Comprehensive art history reference book', price: 79.99, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', category: 'Books', stock: 40 },
    { name: 'Language Learning Kit', description: 'Complete language learning kit with audio', price: 59.99, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', category: 'Books', stock: 50 },

    // Beauty
    { name: 'Skincare Set', description: 'Complete skincare routine set', price: 79.99, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', category: 'Beauty', stock: 60 },
    { name: 'Hair Dryer', description: 'Professional hair dryer with multiple settings', price: 59.99, image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400', category: 'Beauty', stock: 45 },
    { name: 'Perfume', description: 'Luxury perfume with long-lasting fragrance', price: 89.99, image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400', category: 'Beauty', stock: 35 },
    { name: 'Makeup Brush Set', description: 'Professional makeup brush set', price: 29.99, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', category: 'Beauty', stock: 70 },
    { name: 'Anti-Aging Serum', description: 'Premium anti-aging serum for youthful skin', price: 129.99, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', category: 'Beauty', stock: 40 },
    { name: 'Professional Makeup Kit', description: 'Complete professional makeup kit', price: 199.99, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', category: 'Beauty', stock: 25 },
    { name: 'Hair Care Set', description: 'Complete hair care treatment set', price: 89.99, image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400', category: 'Beauty', stock: 30 },
    { name: 'Facial Cleanser', description: 'Gentle facial cleanser for all skin types', price: 39.99, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', category: 'Beauty', stock: 55 },

    // Toys
    { name: 'Board Game', description: 'Classic board game for family fun', price: 34.99, image_url: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400', category: 'Toys', stock: 80 },
    { name: 'Puzzle Set', description: '1000-piece puzzle set for brain training', price: 19.99, image_url: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400', category: 'Toys', stock: 90 },
    { name: 'Remote Control Car', description: 'High-speed remote control car', price: 49.99, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'Toys', stock: 60 },
    { name: 'Building Blocks', description: 'Educational building blocks set', price: 39.99, image_url: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400', category: 'Toys', stock: 100 },
    { name: 'Educational Robot', description: 'Interactive educational robot for learning', price: 199.99, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'Toys', stock: 30 },
    { name: 'LEGO Architecture Set', description: 'Detailed LEGO architecture building set', price: 149.99, image_url: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400', category: 'Toys', stock: 25 },
    { name: 'Drone with Camera', description: 'Camera drone for aerial photography', price: 299.99, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'Toys', stock: 20 },
    { name: 'Virtual Reality Headset', description: 'VR headset for immersive gaming', price: 399.99, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'Toys', stock: 15 }
  ];

  const stmt = db.prepare('INSERT INTO products (name, description, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?, ?)');
  
  sampleProducts.forEach(product => {
    stmt.run([product.name, product.description, product.price, product.image_url, product.category, product.stock]);
  });
  
  stmt.finalize();
  console.log(`✅ Inserted ${sampleProducts.length} sample products`);
};

// Initialize database
initDatabase();

// Authentication routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  bcrypt.hash(password, 12, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Error hashing password' });
    }

    db.run(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
          }
          return res.status(500).json({ success: false, error: 'Error creating user' });
        }

        const token = jwt.sign(
          { userId: this.lastID, email },
          'your-secret-key',
          { expiresIn: '24h' }
        );

        res.status(201).json({
          success: true,
          token,
          user: { id: this.lastID, email, name }
        });
      }
    );
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ success: false, error: 'Error comparing passwords' });
        }

        if (!isMatch) {
          return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          'your-secret-key',
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          token,
          user: { id: user.id, email: user.email, name: user.name }
        });
      });
    }
  );
});

// Products routes
app.get('/api/products', (req, res) => {
  const { category, search, limit } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  db.all(query, params, (err, products) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    res.json(products);
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json(product);
  });
});

app.get('/api/products/categories/list', (req, res) => {
  db.all('SELECT DISTINCT category FROM products ORDER BY category', (err, categories) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    res.json(categories.map(c => c.category));
  });
});

// Orders routes
app.post('/api/orders', (req, res) => {
  const { items, totalAmount } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    const userId = decoded.userId;

    db.run(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, totalAmount, 'pending'],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, error: 'Error creating order' });
        }

        const orderId = this.lastID;
        
        // Insert order items
        const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
        
        items.forEach(item => {
          insertItem.run([orderId, item.productId, item.quantity, item.price]);
        });
        
        insertItem.finalize();

        res.status(201).json({
          success: true,
          orderId,
          message: 'Order created successfully'
        });
      }
    );
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname)));

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 E-Commerce server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🛍️ Products: http://localhost:${PORT}/api/products`);
  console.log(`📦 Database: ${dbPath}`);
});

module.exports = app;
