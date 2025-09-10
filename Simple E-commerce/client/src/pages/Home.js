import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import ProductCarousel from '../components/ProductCarousel';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [carouselProducts, setCarouselProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featuredResponse, carouselResponse] = await Promise.all([
          axios.get('/api/products?limit=4'),
          axios.get('/api/products?limit=6')
        ]);
        setFeaturedProducts(featuredResponse.data);
        setCarouselProducts(carouselResponse.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="home">
      <div className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Welcome to Simple Ecommerce</h1>
            <p>Discover amazing products at great prices. Shop with confidence and enjoy a seamless shopping experience.</p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary">Shop Now</Link>
              <Link to="/register" className="btn btn-secondary">Join Us</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {!loading && carouselProducts.length > 0 && (
          <section className="carousel-section">
            <h2 className="section-title">Featured Products</h2>
            <ProductCarousel products={carouselProducts} />
          </section>
        )}
      </div>

      <div className="container">
        <section className="featured-section">
          <h2 className="section-title">Latest Products</h2>
          {loading ? (
            <div className="loading">Loading featured products...</div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <div className="text-center mt-20">
            <Link to="/products" className="btn btn-primary">View All Products</Link>
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title">Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Get your products delivered quickly and securely to your doorstep.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Best Prices</h3>
              <p>We offer competitive prices on all our products with regular discounts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Secure Shopping</h3>
              <p>Your security is our priority with encrypted payment processing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📞</div>
              <h3>24/7 Support</h3>
              <p>Our customer support team is always here to help you.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
