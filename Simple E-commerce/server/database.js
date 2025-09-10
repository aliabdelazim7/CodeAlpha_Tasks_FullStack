const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

const dbPath = path.join(__dirname, config.dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');

const init = () => {
  // Use serialize to ensure proper sequencing
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        category TEXT,
        stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Order items table
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Create indexes for better performance
    createIndexes();
    
    // Insert sample data
    insertSampleData();
  });
};

const createIndexes = () => {
  // Indexes for better query performance
  db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
  db.run('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)');
};

const insertSampleData = () => {
  // Sample products
  const sampleProducts = [
    // Electronics
    {
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
      price: 99.99,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      category: 'Electronics',
      stock: 50
    },
    {
      name: 'Smartphone Pro',
      description: 'Latest smartphone with advanced camera system and 5G connectivity',
      price: 699.99,
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      category: 'Electronics',
      stock: 30
    },
    {
      name: 'Gaming Laptop',
      description: 'High-performance gaming laptop with RTX graphics and 144Hz display',
      price: 1299.99,
      image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      category: 'Electronics',
      stock: 20
    },
    {
      name: 'Smart Watch',
      description: 'Fitness tracking smartwatch with heart rate monitor and GPS',
      price: 249.99,
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      category: 'Electronics',
      stock: 75
    },
    {
      name: 'Wireless Earbuds',
      description: 'True wireless earbuds with active noise cancellation',
      price: 159.99,
      image_url: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400',
      category: 'Electronics',
      stock: 60
    },
    {
      name: 'Tablet Pro',
      description: '10-inch tablet with high-resolution display and stylus support',
      price: 449.99,
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
      category: 'Electronics',
      stock: 35
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable waterproof Bluetooth speaker with 360-degree sound',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
      category: 'Electronics',
      stock: 45
    },
    {
      name: 'Gaming Console',
      description: 'Next-gen gaming console with 4K graphics and fast loading',
      price: 499.99,
      image_url: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400',
      category: 'Electronics',
      stock: 15
    },
    
    // Clothing
    {
      name: 'Premium T-Shirt',
      description: '100% cotton premium t-shirt with comfortable fit',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      category: 'Clothing',
      stock: 200
    },
    {
      name: 'Denim Jeans',
      description: 'Classic blue denim jeans with perfect stretch fit',
      price: 59.99,
      image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
      category: 'Clothing',
      stock: 150
    },
    {
      name: 'Winter Jacket',
      description: 'Warm winter jacket with waterproof exterior',
      price: 129.99,
      image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      category: 'Clothing',
      stock: 80
    },
    {
      name: 'Running Shoes',
      description: 'Lightweight running shoes with superior cushioning',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      category: 'Clothing',
      stock: 100
    },
    {
      name: 'Formal Shirt',
      description: 'Elegant formal shirt perfect for business meetings',
      price: 49.99,
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
      category: 'Clothing',
      stock: 120
    },
    {
      name: 'Summer Dress',
      description: 'Light and breezy summer dress with floral pattern',
      price: 39.99,
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
      category: 'Clothing',
      stock: 90
    },
    
    // Sports & Fitness
    {
      name: 'Yoga Mat',
      description: 'Non-slip yoga mat with carrying strap',
      price: 24.99,
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
      category: 'Sports',
      stock: 200
    },
    {
      name: 'Dumbbells Set',
      description: 'Adjustable dumbbells set from 5-50 lbs',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      category: 'Sports',
      stock: 30
    },
    {
      name: 'Bicycle',
      description: 'Mountain bike with 21-speed gear system',
      price: 299.99,
      image_url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400',
      category: 'Sports',
      stock: 25
    },
    {
      name: 'Tennis Racket',
      description: 'Professional tennis racket with carrying case',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
      category: 'Sports',
      stock: 60
    },
    {
      name: 'Basketball',
      description: 'Official size basketball with pump included',
      price: 34.99,
      image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
      category: 'Sports',
      stock: 100
    },
    
    // Home & Garden
    {
      name: 'Coffee Maker',
      description: 'Programmable coffee maker with thermal carafe',
      price: 149.99,
      image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
      category: 'Home',
      stock: 25
    },
    {
      name: 'Blender',
      description: 'High-speed blender for smoothies and food processing',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      category: 'Home',
      stock: 40
    },
    {
      name: 'Table Lamp',
      description: 'Modern LED table lamp with adjustable brightness',
      price: 39.99,
      image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
      category: 'Home',
      stock: 80
    },
    {
      name: 'Throw Pillows',
      description: 'Decorative throw pillows for sofa or bed',
      price: 19.99,
      image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400',
      category: 'Home',
      stock: 150
    },
    {
      name: 'Garden Tools Set',
      description: 'Complete garden tools set with storage bag',
      price: 69.99,
      image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      category: 'Home',
      stock: 35
    },
    {
      name: 'Kitchen Knife Set',
      description: 'Professional kitchen knife set with wooden block',
      price: 129.99,
      image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      category: 'Home',
      stock: 50
    },
    
    // Books & Media
    {
      name: 'Bestseller Novel',
      description: 'Latest bestselling fiction novel in hardcover',
      price: 24.99,
      image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      category: 'Books',
      stock: 300
    },
    {
      name: 'Cookbook Collection',
      description: 'Comprehensive cookbook with 500+ recipes',
      price: 34.99,
      image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
      category: 'Books',
      stock: 100
    },
    {
      name: 'Self-Help Book',
      description: 'Motivational self-help book for personal growth',
      price: 19.99,
      image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      category: 'Books',
      stock: 200
    },
    {
      name: 'Children\'s Book',
      description: 'Beautifully illustrated children\'s storybook',
      price: 14.99,
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      category: 'Books',
      stock: 250
    },
    
    // Beauty & Personal Care
    {
      name: 'Skincare Set',
      description: 'Complete skincare set with cleanser, toner, and moisturizer',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
      category: 'Beauty',
      stock: 120
    },
    {
      name: 'Hair Dryer',
      description: 'Professional hair dryer with multiple heat settings',
      price: 59.99,
      image_url: 'https://images.unsplash.com/photo-1522338140269-f46f5913618a?w=400',
      category: 'Beauty',
      stock: 80
    },
    {
      name: 'Perfume',
      description: 'Luxury perfume with long-lasting fragrance',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
      category: 'Beauty',
      stock: 60
    },
    {
      name: 'Makeup Brush Set',
      description: 'Professional makeup brush set with case',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
      category: 'Beauty',
      stock: 150
    },
    
    // Toys & Games
    {
      name: 'Board Game',
      description: 'Family board game for 2-6 players',
      price: 34.99,
      image_url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400',
      category: 'Toys',
      stock: 100
    },
    {
      name: 'Puzzle Set',
      description: '1000-piece jigsaw puzzle with beautiful artwork',
      price: 19.99,
      image_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
      category: 'Toys',
      stock: 80
    },
    {
      name: 'Remote Control Car',
      description: 'High-speed remote control car with rechargeable battery',
      price: 49.99,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'Toys',
      stock: 70
    },
    {
      name: 'Building Blocks',
      description: 'Educational building blocks set for creative play',
      price: 39.99,
      image_url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
      category: 'Toys',
      stock: 120
    },
    
    // Additional Electronics
    {
      name: '4K Smart TV',
      description: '55-inch 4K Ultra HD Smart TV with HDR and built-in streaming',
      price: 799.99,
      image_url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
      category: 'Electronics',
      stock: 25
    },
    {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical gaming keyboard with customizable switches',
      price: 149.99,
      image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
      category: 'Electronics',
      stock: 80
    },
    {
      name: 'Webcam HD',
      description: '1080p HD webcam with built-in microphone for video calls',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
      category: 'Electronics',
      stock: 60
    },
    {
      name: 'External SSD',
      description: '1TB portable SSD with USB-C connectivity',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400',
      category: 'Electronics',
      stock: 45
    },
    
    // Additional Clothing
    {
      name: 'Leather Jacket',
      description: 'Genuine leather jacket with classic biker style',
      price: 299.99,
      image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      category: 'Clothing',
      stock: 40
    },
    {
      name: 'Sneakers Collection',
      description: 'Limited edition sneakers with premium materials',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      category: 'Clothing',
      stock: 30
    },
    {
      name: 'Designer Handbag',
      description: 'Luxury designer handbag with premium leather',
      price: 399.99,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      category: 'Clothing',
      stock: 20
    },
    {
      name: 'Cashmere Sweater',
      description: '100% cashmere sweater for ultimate comfort',
      price: 179.99,
      image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
      category: 'Clothing',
      stock: 35
    },
    
    // Additional Sports & Fitness
    {
      name: 'Treadmill Pro',
      description: 'Professional treadmill with incline and heart rate monitoring',
      price: 1299.99,
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      category: 'Sports',
      stock: 15
    },
    {
      name: 'Yoga Set Complete',
      description: 'Complete yoga set with mat, blocks, and straps',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
      category: 'Sports',
      stock: 50
    },
    {
      name: 'Protein Powder',
      description: 'Premium whey protein powder for muscle building',
      price: 49.99,
      image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400',
      category: 'Sports',
      stock: 100
    },
    {
      name: 'Resistance Bands',
      description: 'Set of resistance bands for home workouts',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      category: 'Sports',
      stock: 75
    },
    
    // Additional Home & Garden
    {
      name: 'Smart Home Hub',
      description: 'Central hub for controlling smart home devices',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'Home',
      stock: 30
    },
    {
      name: 'Air Purifier',
      description: 'HEPA air purifier for clean indoor air',
      price: 299.99,
      image_url: 'https://images.unsplash.com/photo-1581578731548-c6a0c3f2fcc0?w=400',
      category: 'Home',
      stock: 25
    },
    {
      name: 'Robot Vacuum',
      description: 'Smart robot vacuum with app control and mapping',
      price: 399.99,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'Home',
      stock: 20
    },
    {
      name: 'Smart Doorbell',
      description: 'Video doorbell with motion detection and night vision',
      price: 179.99,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'Home',
      stock: 40
    },
    
    // Additional Books & Media
    {
      name: 'Programming Guide',
      description: 'Complete guide to modern web development',
      price: 49.99,
      image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      category: 'Books',
      stock: 80
    },
    {
      name: 'Business Strategy Book',
      description: 'Best-selling book on business strategy and leadership',
      price: 29.99,
      image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      category: 'Books',
      stock: 60
    },
    {
      name: 'Art History Collection',
      description: 'Comprehensive art history book with beautiful illustrations',
      price: 79.99,
      image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      category: 'Books',
      stock: 40
    },
    {
      name: 'Language Learning Kit',
      description: 'Complete language learning kit with audio CDs',
      price: 59.99,
      image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      category: 'Books',
      stock: 50
    },
    
    // Additional Beauty & Personal Care
    {
      name: 'Anti-Aging Serum',
      description: 'Premium anti-aging serum with retinol',
      price: 129.99,
      image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
      category: 'Beauty',
      stock: 40
    },
    {
      name: 'Professional Makeup Kit',
      description: 'Complete professional makeup kit with brushes',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
      category: 'Beauty',
      stock: 25
    },
    {
      name: 'Hair Care Set',
      description: 'Premium hair care set for all hair types',
      price: 89.99,
      image_url: 'https://images.unsplash.com/photo-1522338140269-f46f5913618a?w=400',
      category: 'Beauty',
      stock: 60
    },
    {
      name: 'Facial Cleanser',
      description: 'Gentle facial cleanser for sensitive skin',
      price: 39.99,
      image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
      category: 'Beauty',
      stock: 80
    },
    
    // Additional Toys & Games
    {
      name: 'Educational Robot',
      description: 'Programmable educational robot for kids',
      price: 199.99,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'Toys',
      stock: 30
    },
    {
      name: 'LEGO Architecture Set',
      description: 'LEGO architecture set of famous landmarks',
      price: 149.99,
      image_url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
      category: 'Toys',
      stock: 25
    },
    {
      name: 'Drone with Camera',
      description: 'HD camera drone with GPS and auto-return',
      price: 299.99,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'Toys',
      stock: 20
    },
    {
      name: 'Virtual Reality Headset',
      description: 'VR headset for immersive gaming experience',
      price: 399.99,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'Toys',
      stock: 15
    }
  ];

  sampleProducts.forEach(product => {
    db.run(`
      INSERT OR IGNORE INTO products (name, description, price, image_url, category, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [product.name, product.description, product.price, product.image_url, product.category, product.stock]);
  });
};

module.exports = {
  db,
  init
};
