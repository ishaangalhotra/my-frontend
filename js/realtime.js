// Real-time Socket.IO Client for QuickLocal
class RealtimeClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.user = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.eventHandlers = new Map();
    this.roomSubscriptions = new Set();
    
    this.init();
  }

  init() {
    this.connect();
    this.setupEventListeners();
  }

  connect() {
    try {
      // Connect to Socket.IO server
      this.socket = io('http://localhost:10000', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000
      });

      this.setupSocketEventHandlers();
      console.log('🔌 Connecting to Socket.IO server...');
    } catch (error) {
      console.error('❌ Failed to connect to Socket.IO:', error);
    }
  }

  setupSocketEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.triggerEvent('connected');
      
      // Auto-authenticate if token exists
      const token = this.getAuthToken();
      if (token) {
        this.authenticate(token);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.triggerEvent('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.reconnectAttempts++;
      this.triggerEvent('connection_error', { error });
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      this.isAuthenticated = true;
      this.user = data.user;
      this.triggerEvent('authenticated', data);
    });

    this.socket.on('auth_error', (error) => {
      console.error('❌ Socket authentication error:', error);
      this.isAuthenticated = false;
      this.triggerEvent('auth_error', error);
    });

    // Notification events
    this.socket.on('notification', (notification) => {
      console.log('📢 New notification:', notification);
      this.showNotification(notification);
      this.triggerEvent('notification', notification);
    });

    this.socket.on('pending_notifications', (notifications) => {
      console.log('📢 Pending notifications:', notifications);
      this.updateNotificationBadge(notifications.length);
      this.triggerEvent('pending_notifications', notifications);
    });

    // Order tracking events
    this.socket.on('order_update', (update) => {
      console.log('📦 Order update:', update);
      this.updateOrderStatus(update);
      this.triggerEvent('order_update', update);
    });

    this.socket.on('order_status_update', (update) => {
      console.log('📦 Order status update:', update);
      this.updateOrderTracking(update);
      this.triggerEvent('order_status_update', update);
    });

    this.socket.on('delivery_update', (update) => {
      console.log('🚚 Delivery update:', update);
      this.updateDeliveryTracking(update);
      this.triggerEvent('delivery_update', update);
    });

    this.socket.on('delivery_location_update', (update) => {
      console.log('📍 Delivery location update:', update);
      this.updateDeliveryLocation(update);
      this.triggerEvent('delivery_location_update', update);
    });

    // Chat events
    this.socket.on('new_message', (message) => {
      console.log('💬 New message:', message);
      this.displayMessage(message);
      this.triggerEvent('new_message', message);
    });

    this.socket.on('chat_history', (data) => {
      console.log('💬 Chat history:', data);
      this.displayChatHistory(data.messages);
      this.triggerEvent('chat_history', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      this.showTypingIndicator(data);
      this.triggerEvent('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      console.log('⌨️ User stopped typing:', data);
      this.hideTypingIndicator(data);
      this.triggerEvent('user_stop_typing', data);
    });

    this.socket.on('joined_chat', (data) => {
      console.log('💬 Joined chat:', data);
      this.roomSubscriptions.add(data.roomId);
      this.triggerEvent('joined_chat', data);
    });

    // System events
    this.socket.on('system_alert', (alert) => {
      console.log('🚨 System alert:', alert);
      this.showSystemAlert(alert);
      this.triggerEvent('system_alert', alert);
    });

    this.socket.on('heartbeat', (data) => {
      // Respond to heartbeat
      this.socket.emit('pong', { timestamp: Date.now() });
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.triggerEvent('error', error);
    });
  }

  // Authentication methods
  authenticate(token) {
    if (!this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot authenticate');
      return;
    }

    this.socket.emit('authenticate', { token });
  }

  getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  // Order tracking methods
  trackOrder(orderId) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Not authenticated, cannot track order');
      return;
    }

    this.socket.emit('track_order', { orderId });
  }

  joinUserRoom(userId) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Not authenticated, cannot join user room');
      return;
    }

    this.socket.emit('join_user_room', { userId });
  }

  // Chat methods
  joinChat(roomId, type) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Not authenticated, cannot join chat');
      return;
    }

    this.socket.emit('join_chat', { roomId, type });
  }

  sendMessage(roomId, type, message) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Not authenticated, cannot send message');
      return;
    }

    this.socket.emit('send_message', { roomId, type, message });
  }

  startTyping(roomId, type) {
    if (!this.isAuthenticated) return;
    this.socket.emit('typing', { roomId, type });
  }

  stopTyping(roomId, type) {
    if (!this.isAuthenticated) return;
    this.socket.emit('stop_typing', { roomId, type });
  }

  // Location updates (for delivery partners)
  updateLocation(latitude, longitude, orderId = null) {
    if (!this.isAuthenticated) return;
    
    this.socket.emit('update_location', {
      latitude,
      longitude,
      orderId
    });
  }

  // Support request
  requestSupport(orderId, issue, priority = 'medium') {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Not authenticated, cannot request support');
      return;
    }

    this.socket.emit('request_support', { orderId, issue, priority });
  }

  // Event handling
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  triggerEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // UI Update Methods
  showNotification(notification) {
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification notification-${notification.priority}`;
    notificationEl.innerHTML = `
      <div class="notification-header">
        <h4>${notification.title}</h4>
        <button class="notification-close">&times;</button>
      </div>
      <div class="notification-body">
        <p>${notification.message}</p>
      </div>
      <div class="notification-footer">
        <small>${new Date(notification.timestamp).toLocaleTimeString()}</small>
      </div>
    `;

    // Add to notification container
    const container = document.getElementById('notification-container') || document.body;
    container.appendChild(notificationEl);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notificationEl.parentNode) {
        notificationEl.remove();
      }
    }, 5000);

    // Update notification badge
    this.updateNotificationBadge();
  }

  updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  updateOrderStatus(update) {
    // Update order status in UI
    const orderElement = document.querySelector(`[data-order-id="${update.orderId}"]`);
    if (orderElement) {
      const statusElement = orderElement.querySelector('.order-status');
      if (statusElement) {
        statusElement.textContent = update.status;
        statusElement.className = `order-status status-${update.status}`;
      }
    }
  }

  updateOrderTracking(update) {
    // Update order tracking timeline
    const trackingElement = document.getElementById('order-tracking');
    if (trackingElement) {
      this.updateTrackingTimeline(trackingElement, update);
    }
  }

  updateDeliveryTracking(update) {
    // Update delivery tracking information
    const deliveryElement = document.getElementById('delivery-tracking');
    if (deliveryElement) {
      this.updateDeliveryInfo(deliveryElement, update);
    }
  }

  updateDeliveryLocation(update) {
    // Update delivery location on map
    if (window.deliveryMap) {
      this.updateMapLocation(update.location);
    }
  }

  displayMessage(message) {
    // Display message in chat
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${message.sender.id === this.user?.id ? 'own' : 'other'}`;
      messageEl.innerHTML = `
        <div class="message-header">
          <strong>${message.sender.name}</strong>
          <small>${new Date(message.timestamp).toLocaleTimeString()}</small>
        </div>
        <div class="message-body">
          <p>${message.message}</p>
        </div>
      `;
      chatContainer.appendChild(messageEl);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  displayChatHistory(messages) {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.innerHTML = '';
      messages.forEach(message => {
        this.displayMessage(message);
      });
    }
  }

  showTypingIndicator(data) {
    const typingElement = document.getElementById('typing-indicator');
    if (typingElement) {
      typingElement.textContent = `${data.userName} is typing...`;
      typingElement.style.display = 'block';
    }
  }

  hideTypingIndicator(data) {
    const typingElement = document.getElementById('typing-indicator');
    if (typingElement) {
      typingElement.style.display = 'none';
    }
  }

  showSystemAlert(alert) {
    // Show system alert
    const alertEl = document.createElement('div');
    alertEl.className = 'system-alert';
    alertEl.innerHTML = `
      <div class="alert-content">
        <span class="alert-icon">🚨</span>
        <span class="alert-message">${alert.message}</span>
        <button class="alert-close">&times;</button>
      </div>
    `;

    document.body.appendChild(alertEl);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (alertEl.parentNode) {
        alertEl.remove();
      }
    }, 10000);
  }

  // Utility methods
  updateTrackingTimeline(element, update) {
    const timeline = element.querySelector('.timeline');
    if (timeline) {
      const step = document.createElement('div');
      step.className = 'timeline-step active';
      step.innerHTML = `
        <div class="step-icon">📦</div>
        <div class="step-content">
          <h4>${update.status}</h4>
          <p>${new Date().toLocaleTimeString()}</p>
        </div>
      `;
      timeline.appendChild(step);
    }
  }

  updateDeliveryInfo(element, update) {
    const info = element.querySelector('.delivery-info');
    if (info) {
      info.innerHTML = `
        <div class="delivery-status">
          <h4>Delivery Status</h4>
          <p>${update.update?.message || 'Delivery in progress'}</p>
        </div>
        <div class="delivery-partner">
          <h4>Delivery Partner</h4>
          <p>${update.deliveryPartner?.name || 'Not assigned'}</p>
        </div>
      `;
    }
  }

  updateMapLocation(location) {
    if (location && window.deliveryMap) {
      // Update map marker position
      // This would integrate with your map library
      console.log('📍 Updating map location:', location);
    }
  }

  // Setup event listeners for UI interactions
  setupEventListeners() {
    // Auto-connect when page loads
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🚀 Initializing real-time client...');
    });

    // Handle authentication token changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'authToken') {
        if (event.newValue) {
          this.authenticate(event.newValue);
        } else {
          this.isAuthenticated = false;
          this.user = null;
        }
      }
    });
  }

  // Public API
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      user: this.user
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Initialize real-time client
window.realtimeClient = new RealtimeClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RealtimeClient;
}
