import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { FaShoppingCart, FaMinus, FaPlus, FaCheck } from 'react-icons/fa';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addToCart(product, quantity);
      setAddedToCart(true);
      
      // Reset the success state after 3 seconds
      setTimeout(() => {
        setAddedToCart(false);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="error-message">
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-detail">
          <div className="product-image-section">
            <div className="product-image">
              <img src={product.image_url} alt={product.name} />
            </div>
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-description">{product.description}</p>
            
            <div className="product-meta">
              <div className="product-price">${product.price}</div>
              <div className="product-stock">
                {product.stock > 0 ? (
                  <span className="in-stock">{product.stock} in stock</span>
                ) : (
                  <span className="out-of-stock">Out of stock</span>
                )}
              </div>
              {product.category && (
                <div className="product-category">
                  Category: {product.category}
                </div>
              )}
            </div>

            {product.stock > 0 && (
              <div className="add-to-cart-section">
                <div className="quantity-selector">
                  <label htmlFor="quantity">Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="quantity-btn"
                      disabled={quantity <= 1}
                    >
                      <FaMinus />
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      min="1"
                      max={product.stock}
                      className="quantity-input"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="quantity-btn"
                      disabled={quantity >= product.stock}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`btn btn-primary add-to-cart-btn ${addedToCart ? 'added' : ''}`}
                  disabled={product.stock === 0}
                >
                  {addedToCart ? <FaCheck /> : <FaShoppingCart />}
                  {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                </button>
              </div>
            )}

            <div className="product-details">
              <h3>Product Details</h3>
              <ul>
                <li><strong>Name:</strong> {product.name}</li>
                <li><strong>Price:</strong> ${product.price}</li>
                <li><strong>Stock:</strong> {product.stock} units</li>
                {product.category && (
                  <li><strong>Category:</strong> {product.category}</li>
                )}
                <li><strong>Added:</strong> {new Date(product.created_at).toLocaleDateString()}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
