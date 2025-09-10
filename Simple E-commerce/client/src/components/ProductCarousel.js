import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ProductCarousel.css';

const ProductCarousel = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === products.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [products.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === products.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? products.length - 1 : prevIndex - 1
    );
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="product-carousel">
      <div className="carousel-container">
        <button className="carousel-btn prev" onClick={prevSlide}>
          <FaChevronLeft />
        </button>
        
        <div className="carousel-slide">
          <div className="carousel-product">
            <img 
              src={products[currentIndex].image_url} 
              alt={products[currentIndex].name} 
            />
            <div className="carousel-content">
              <h3>{products[currentIndex].name}</h3>
              <p>{products[currentIndex].description}</p>
              <div className="carousel-price">${products[currentIndex].price}</div>
              <Link 
                to={`/products/${products[currentIndex].id}`} 
                className="btn btn-primary"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>

        <button className="carousel-btn next" onClick={nextSlide}>
          <FaChevronRight />
        </button>
      </div>

      <div className="carousel-indicators">
        {products.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
