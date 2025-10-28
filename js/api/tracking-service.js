// Real-time Order Tracking Service for QuickLocal
class TrackingService {
  constructor() {
    this.baseURL = 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    this.socketURL = 'https://ecommerce-backend-mlik.onrender.com';
    this.token = localStorage.getItem('token');
    this.socket = null;
    this.activeTrackings = new Map(); // Store active order trackings
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make API request
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: this.getHeaders(),
        ...options
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Get order tracking information
  async getOrderTracking(orderId) {
    return await this.makeRequest(`/orders/${orderId}/tracking`);
  }

  // Update order status with tracking details
  async updateOrderStatus(orderId, statusData) {
    return await this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: statusData.status,
        location: statusData.location,
        notes: statusData.notes,
        estimatedDelivery: statusData.estimatedDelivery,
        deliveryPersonId: statusData.deliveryPersonId,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Get real-time delivery location
  async getDeliveryLocation(orderId) {
    return await this.makeRequest(`/orders/${orderId}/delivery-location`);
  }

  // Get delivery ETA
  async getDeliveryETA(orderId) {
    return await this.makeRequest(`/orders/${orderId}/eta`);
  }

  // Get tracking history for an order
  async getTrackingHistory(orderId) {
    return await this.makeRequest(`/orders/${orderId}/tracking-history`);
  }

  // Subscribe to real-time order tracking updates
  subscribeToOrderTracking(orderId, callback) {
    if (typeof io !== 'undefined') {
      if (!this.socket) {
        this.socket = io(this.socketURL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
      }
      
      // Join order tracking room
      this.socket.emit('join-order-tracking', orderId);
      
      // Listen for tracking updates
      this.socket.on(`order-${orderId}-tracking`, (trackingData) => {
        callback(trackingData);
        this.activeTrackings.set(orderId, trackingData);
      });

      // Listen for delivery location updates
      this.socket.on(`order-${orderId}-location`, (locationData) => {
        callback({ type: 'location', ...locationData });
      });

      // Listen for ETA updates
      this.socket.on(`order-${orderId}-eta`, (etaData) => {
        callback({ type: 'eta', ...etaData });
      });

      return () => {
        this.socket.off(`order-${orderId}-tracking`);
        this.socket.off(`order-${orderId}-location`);
        this.socket.off(`order-${orderId}-eta`);
        this.socket.emit('leave-order-tracking', orderId);
        this.activeTrackings.delete(orderId);
      };
    } else {
      console.warn('Socket.IO not available for real-time tracking');
      return null;
    }
  }

  // Unsubscribe from order tracking
  unsubscribeFromOrderTracking(orderId) {
    if (this.socket) {
      this.socket.off(`order-${orderId}-tracking`);
      this.socket.off(`order-${orderId}-location`);
      this.socket.off(`order-${orderId}-eta`);
      this.socket.emit('leave-order-tracking', orderId);
      this.activeTrackings.delete(orderId);
    }
  }

  // Get order status timeline
  getStatusTimeline() {
    return [
      {
        status: 'pending',
        title: 'Order Received',
        description: 'Your order has been received and is being processed',
        icon: 'fas fa-clock',
        color: '#f59e0b'
      },
      {
        status: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed by the seller',
        icon: 'fas fa-check-circle',
        color: '#3b82f6'
      },
      {
        status: 'preparing',
        title: 'Preparing',
        description: 'Your order is being prepared for pickup',
        icon: 'fas fa-box-open',
        color: '#8b5cf6'
      },
      {
        status: 'ready_for_pickup',
        title: 'Ready for Pickup',
        description: 'Your order is ready and waiting for our delivery partner',
        icon: 'fas fa-warehouse',
        color: '#06b6d4'
      },
      {
        status: 'picked_up',
        title: 'Picked Up',
        description: 'Your order has been picked up by our delivery partner',
        icon: 'fas fa-truck-loading',
        color: '#10b981'
      },
      {
        status: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Your order is on its way to you',
        icon: 'fas fa-shipping-fast',
        color: '#f97316'
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Your order has been successfully delivered',
        icon: 'fas fa-check-double',
        color: '#22c55e'
      },
      {
        status: 'cancelled',
        title: 'Cancelled',
        description: 'Your order has been cancelled',
        icon: 'fas fa-times-circle',
        color: '#ef4444'
      }
    ];
  }

  // Get status information by status code
  getStatusInfo(status) {
    const timeline = this.getStatusTimeline();
    return timeline.find(item => item.status === status) || {
      status: 'unknown',
      title: 'Unknown Status',
      description: 'Status information not available',
      icon: 'fas fa-question-circle',
      color: '#6b7280'
    };
  }

  // Calculate delivery progress percentage
  calculateProgress(currentStatus) {
    const timeline = this.getStatusTimeline();
    const completedStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered'];
    
    const currentIndex = completedStatuses.indexOf(currentStatus);
    if (currentIndex === -1) return 0;
    
    return Math.round(((currentIndex + 1) / completedStatuses.length) * 100);
  }

  // Format ETA display
  formatETA(etaTimestamp) {
    if (!etaTimestamp) return 'ETA not available';
    
    const eta = new Date(etaTimestamp);
    const now = new Date();
    const diffMs = eta.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Should arrive soon';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}min`;
    } else {
      return `${diffMins} min`;
    }
  }

  // Send delivery confirmation
  async confirmDelivery(orderId, confirmationData) {
    return await this.makeRequest(`/orders/${orderId}/confirm-delivery`, {
      method: 'POST',
      body: JSON.stringify({
        signature: confirmationData.signature,
        photos: confirmationData.photos,
        recipientName: confirmationData.recipientName,
        deliveryNotes: confirmationData.deliveryNotes,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Report delivery issue
  async reportDeliveryIssue(orderId, issueData) {
    return await this.makeRequest(`/orders/${orderId}/report-issue`, {
      method: 'POST',
      body: JSON.stringify({
        issueType: issueData.issueType,
        description: issueData.description,
        photos: issueData.photos,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Get nearby delivery partners (for admin use)
  async getNearbyDeliveryPartners(location, radius = 5) {
    return await this.makeRequest(`/delivery-partners/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radius}`);
  }

  // Assign delivery partner to order
  async assignDeliveryPartner(orderId, partnerId) {
    return await this.makeRequest(`/orders/${orderId}/assign-delivery`, {
      method: 'POST',
      body: JSON.stringify({ deliveryPartnerId: partnerId })
    });
  }

  // Get delivery performance metrics
  async getDeliveryMetrics(timeframe = '7d') {
    return await this.makeRequest(`/analytics/delivery-metrics?timeframe=${timeframe}`);
  }

  // Initialize tracking system
  async initialize() {
    try {
      // Initialize Socket.IO connection
      if (typeof io !== 'undefined' && !this.socket) {
        this.socket = io(this.socketURL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          auth: {
            token: this.token
          }
        });
        
        this.socket.on('connect', () => {
          console.log('Connected to tracking service');
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from tracking service');
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        // Handle global tracking events
        this.socket.on('tracking-update', (data) => {
          this.handleGlobalTrackingUpdate(data);
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize tracking service:', error);
      return false;
    }
  }

  // Handle global tracking updates
  handleGlobalTrackingUpdate(data) {
    // Emit custom events for components to listen to
    const event = new CustomEvent('trackingUpdate', { 
      detail: data 
    });
    document.dispatchEvent(event);
    
    // Update notification badges if needed
    if (window.notificationService) {
      window.notificationService.updateBadge(data.unreadCount || 0);
    }
  }

  // Cleanup resources
  cleanup() {
    if (this.socket) {
      // Unsubscribe from all active trackings
      this.activeTrackings.forEach((_, orderId) => {
        this.unsubscribeFromOrderTracking(orderId);
      });
      
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeTrackings.clear();
  }
}

// Create global instance
window.trackingService = new TrackingService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.trackingService) {
    window.trackingService.initialize();
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.trackingService) {
    window.trackingService.cleanup();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrackingService;
}