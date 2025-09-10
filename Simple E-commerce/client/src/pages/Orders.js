import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaEye } from 'react-icons/fa';
import './Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'processing':
        return '#17a2b8';
      case 'shipped':
        return '#007bff';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="auth-required">
            <h2>Authentication Required</h2>
            <p>Please log in to view your orders.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">My Orders</h1>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="no-orders">
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet. Start shopping to see your order history here.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3>Order #{order.id}</h3>
                        <p className="order-date">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="order-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="order-summary">
                      <div className="order-items">
                        <p><strong>{order.items.length}</strong> item{order.items.length !== 1 ? 's' : ''}</p>
                        <div className="items-preview">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="item-preview">
                              <img src={item.image_url} alt={item.product_name} />
                              <span>{item.product_name}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <span className="more-items">+{order.items.length - 3} more</span>
                          )}
                        </div>
                      </div>
                      <div className="order-total">
                        <span className="total-label">Total:</span>
                        <span className="total-amount">${order.total_amount}</span>
                      </div>
                    </div>

                    <div className="order-actions">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="btn btn-secondary view-order-btn"
                      >
                        <FaEye />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="modal-overlay" onClick={() => setShowOrderDetail(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Order #{selectedOrder.id}</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowOrderDetail(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="order-detail-info">
                  <div className="detail-row">
                    <span className="label">Order Date:</span>
                    <span>{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                    >
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total Amount:</span>
                    <span className="total-amount">${selectedOrder.total_amount}</span>
                  </div>
                </div>

                <div className="order-items-detail">
                  <h3>Order Items</h3>
                  <div className="items-list">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="item-detail">
                        <div className="item-image">
                          <img src={item.image_url} alt={item.product_name} />
                        </div>
                        <div className="item-info">
                          <h4>{item.product_name}</h4>
                          <p>Quantity: {item.quantity}</p>
                          <p>Price: ${item.price}</p>
                          <p>Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
