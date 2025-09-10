const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPass123'
};

const testProduct = {
  name: 'Test Product',
  description: 'A test product for API testing',
  price: 29.99,
  category: 'Test',
  stock: 100
};

// Helper function to make requests
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
const testAuth = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  // Test user registration
  console.log('Testing user registration...');
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult.success) {
    console.log('✅ User registration successful');
    authToken = registerResult.data.token;
  } else {
    console.log('❌ User registration failed:', registerResult.error);
  }
  
  // Test user login
  console.log('Testing user login...');
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  if (loginResult.success) {
    console.log('✅ User login successful');
    authToken = loginResult.data.token;
  } else {
    console.log('❌ User login failed:', loginResult.error);
  }
  
  // Test get current user
  console.log('Testing get current user...');
  const meResult = await makeRequest('GET', '/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (meResult.success) {
    console.log('✅ Get current user successful');
  } else {
    console.log('❌ Get current user failed:', meResult.error);
  }
};

const testProducts = async () => {
  console.log('\n📦 Testing Products...');
  
  // Test get all products
  console.log('Testing get all products...');
  const productsResult = await makeRequest('GET', '/products');
  if (productsResult.success) {
    console.log('✅ Get all products successful');
  } else {
    console.log('❌ Get all products failed:', productsResult.error);
  }
  
  // Test get categories
  console.log('Testing get categories...');
  const categoriesResult = await makeRequest('GET', '/products/categories/list');
  if (categoriesResult.success) {
    console.log('✅ Get categories successful');
  } else {
    console.log('❌ Get categories failed:', categoriesResult.error);
  }
  
  // Test create product (requires auth)
  console.log('Testing create product...');
  const createResult = await makeRequest('POST', '/products', testProduct, {
    'Authorization': `Bearer ${authToken}`
  });
  if (createResult.success) {
    console.log('✅ Create product successful');
    return createResult.data.productId;
  } else {
    console.log('❌ Create product failed:', createResult.error);
    return null;
  }
};

const testOrders = async (productId) => {
  console.log('\n🛒 Testing Orders...');
  
  if (!productId) {
    console.log('❌ Cannot test orders without a product ID');
    return;
  }
  
  const testOrder = {
    items: [{
      productId: productId,
      quantity: 2,
      price: testProduct.price
    }],
    totalAmount: testProduct.price * 2
  };
  
  // Test create order
  console.log('Testing create order...');
  const createOrderResult = await makeRequest('POST', '/orders', testOrder, {
    'Authorization': `Bearer ${authToken}`
  });
  if (createOrderResult.success) {
    console.log('✅ Create order successful');
  } else {
    console.log('❌ Create order failed:', createOrderResult.error);
  }
  
  // Test get user orders
  console.log('Testing get user orders...');
  const ordersResult = await makeRequest('GET', '/orders/my-orders', null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (ordersResult.success) {
    console.log('✅ Get user orders successful');
  } else {
    console.log('❌ Get user orders failed:', ordersResult.error);
  }
};

const testErrorHandling = async () => {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test invalid registration
  console.log('Testing invalid registration...');
  const invalidRegisterResult = await makeRequest('POST', '/auth/register', {
    name: 'A', // Too short
    email: 'invalid-email',
    password: '123' // Too short
  });
  if (!invalidRegisterResult.success && invalidRegisterResult.status === 400) {
    console.log('✅ Invalid registration properly rejected');
  } else {
    console.log('❌ Invalid registration not properly handled');
  }
  
  // Test unauthorized access
  console.log('Testing unauthorized access...');
  const unauthorizedResult = await makeRequest('GET', '/orders/my-orders');
  if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
    console.log('✅ Unauthorized access properly rejected');
  } else {
    console.log('❌ Unauthorized access not properly handled');
  }
  
  // Test invalid product ID
  console.log('Testing invalid product ID...');
  const invalidProductResult = await makeRequest('GET', '/products/99999');
  if (!invalidProductResult.success && invalidProductResult.status === 404) {
    console.log('✅ Invalid product ID properly handled');
  } else {
    console.log('❌ Invalid product ID not properly handled');
  }
};

const testRateLimiting = async () => {
  console.log('\n⏱️ Testing Rate Limiting...');
  
  const requests = [];
  for (let i = 0; i < 105; i++) {
    requests.push(makeRequest('GET', '/products'));
  }
  
  const results = await Promise.all(requests);
  const rateLimited = results.some(result => result.status === 429);
  
  if (rateLimited) {
    console.log('✅ Rate limiting is working');
  } else {
    console.log('❌ Rate limiting may not be working properly');
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting API Tests...');
  console.log('Make sure the server is running on http://localhost:5000');
  
  try {
    await testAuth();
    const productId = await testProducts();
    await testOrders(productId);
    await testErrorHandling();
    await testRateLimiting();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testAuth,
  testProducts,
  testOrders,
  testErrorHandling,
  testRateLimiting
};
