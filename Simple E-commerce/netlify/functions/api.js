// Netlify function to handle API routes
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize database
const db = new sqlite3.Database('./dist/server/ecommerce.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

exports.handler = async (event, context) => {
  const { httpMethod, path, body, queryStringParameters } = event;
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Route handling
    if (path.includes('/api/products')) {
      if (httpMethod === 'GET') {
        return await getProducts(queryStringParameters);
      }
    }
    
    if (path.includes('/api/auth/login') && httpMethod === 'POST') {
      return await loginUser(JSON.parse(body));
    }
    
    if (path.includes('/api/auth/register') && httpMethod === 'POST') {
      return await registerUser(JSON.parse(body));
    }
    
    if (path.includes('/api/orders') && httpMethod === 'POST') {
      return await createOrder(JSON.parse(body));
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Get products
async function getProducts(queryParams) {
  return new Promise((resolve) => {
    const { category, search, limit } = queryParams || {};
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
        resolve({
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Database error' }),
        });
      } else {
        resolve({
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(products),
        });
      }
    });
  });
}

// Login user
async function loginUser({ email, password }) {
  return new Promise((resolve) => {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, user) => {
        if (err) {
          resolve({
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Database error' }),
          });
          return;
        }

        if (!user) {
          resolve({
            statusCode: 401,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid credentials' }),
          });
          return;
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err || !isMatch) {
            resolve({
              statusCode: 401,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Invalid credentials' }),
            });
            return;
          }

          const token = jwt.sign(
            { userId: user.id, email: user.email },
            'your-secret-key',
            { expiresIn: '24h' }
          );

          resolve({
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              success: true,
              token,
              user: { id: user.id, email: user.email, name: user.name },
            }),
          });
        });
      }
    );
  });
}

// Register user
async function registerUser({ email, password, name }) {
  return new Promise((resolve) => {
    bcrypt.hash(password, 12, (err, hashedPassword) => {
      if (err) {
        resolve({
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Error hashing password' }),
        });
        return;
      }

      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              resolve({
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Email already exists' }),
              });
            } else {
              resolve({
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Error creating user' }),
              });
            }
            return;
          }

          const token = jwt.sign(
            { userId: this.lastID, email },
            'your-secret-key',
            { expiresIn: '24h' }
          );

          resolve({
            statusCode: 201,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              success: true,
              token,
              user: { id: this.lastID, email, name },
            }),
          });
        }
      );
    });
  });
}

// Create order
async function createOrder({ items, totalAmount, token }) {
  return new Promise((resolve) => {
    try {
      const decoded = jwt.verify(token, 'your-secret-key');
      const userId = decoded.userId;

      db.run(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [userId, totalAmount, 'pending'],
        function(err) {
          if (err) {
            resolve({
              statusCode: 500,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'Error creating order' }),
            });
            return;
          }

          const orderId = this.lastID;
          
          // Insert order items
          const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
          
          items.forEach(item => {
            insertItem.run([orderId, item.productId, item.quantity, item.price]);
          });
          
          insertItem.finalize();

          resolve({
            statusCode: 201,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              success: true,
              orderId,
              message: 'Order created successfully',
            }),
          });
        }
      );
    } catch (error) {
      resolve({
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' }),
      });
    }
  });
}
