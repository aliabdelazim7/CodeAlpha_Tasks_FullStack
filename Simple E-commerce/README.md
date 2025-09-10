# E-Commerce - Professional Full Stack Application

A professional, full-stack ecommerce application built with React, Node.js, Express, and SQLite. This application provides a complete shopping experience with user authentication, product management, shopping cart, and order processing. **Ready for production deployment!**

## Features

### 🛍️ Shopping Experience

- **Product Catalog**: Browse products with search and category filtering
- **Product Details**: Detailed product pages with images and descriptions
- **Shopping Cart**: Add, remove, and update items with real-time total calculation
- **Checkout Process**: Complete order processing with order confirmation
- **Order History**: View past orders and their status

### 👤 User Management

- **User Registration**: Create new accounts with email validation
- **User Login**: Secure authentication with JWT tokens
- **Profile Management**: Update user information and preferences
- **Order Tracking**: Track order status and delivery information

### 🛠️ Technical Features

- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Real-time Updates**: Dynamic cart updates and inventory management
- **Search & Filter**: Advanced product search and category filtering
- **Image Optimization**: Optimized product images for fast loading

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### 1. Clone the Repository

```bash
git clone https://github.com/aliabdelazim7/E-Commerce.git
cd E-Commerce
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm run server  # Backend only
npm run client  # Frontend only
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## Project Structure

```
E-Commerce/
├── server/                 # Backend code
│   ├── routes/            # API routes
│   ├── middleware/         # Custom middleware
│   ├── database.js        # Database setup
│   └── index.js           # Server entry point
├── client/                # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context
│   │   └── App.js         # Main App component
│   └── public/            # Static files
├── dist/                  # Production build
└── package.json           # Root package.json
```

## Product Catalog

The application features a comprehensive product catalog with **130 products** across **multiple categories**:

### **Product Categories**

- **Electronics** (12 products) - Smartphones, laptops, TVs, accessories
- **Clothing** (10 products) - T-shirts, jackets, shoes, handbags
- **Sports** (9 products) - Fitness equipment, sports gear
- **Home** (10 products) - Appliances, smart home devices
- **Books** (8 products) - Educational and entertainment books
- **Beauty** (8 products) - Skincare, makeup, personal care
- **Toys** (8 products) - Games, educational toys, electronics

### **Price Range**

- **Budget**: $14.99 - $49.99
- **Mid-Range**: $50.00 - $299.99
- **Premium**: $300.00 - $1,299.99

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
DB_PATH=ecommerce.db
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## Production Deployment

### **Quick Production Setup**

1. **Navigate to dist folder**:

   ```bash
   cd dist
   ```

2. **Install production dependencies**:

   ```bash
   npm install
   ```

3. **Start production server**:

   ```bash
   node server.js
   ```

4. **Access your application**: http://localhost:5000

### **Production Features**

- ✅ **Optimized Build** - Minified and compressed assets
- ✅ **Security Headers** - Helmet.js protection
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Database** - Pre-populated with 130 products

## Documentation

- **[API Documentation](API_DOCUMENTATION.md)**: Complete API reference
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Detailed production deployment instructions
- **[Upload Guide](UPLOAD_GUIDE.md)**: Complete upload and deployment guide
- **[Final Project Review](FINAL_PROJECT_REVIEW.md)**: Complete project overview and handover guide

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications for orders
- [ ] Admin dashboard for product management
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Mobile app development

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help with the project, please:

1. Check the [Documentation](DEPLOYMENT_GUIDE.md)
2. Review the [API Documentation](API_DOCUMENTATION.md)
3. Open an issue on GitHub

---

**Built with ❤️ using React, Node.js, Express, and SQLite**

**Repository**: [https://github.com/aliabdelazim7/E-Commerce.git](https://github.com/aliabdelazim7/E-Commerce.git)
