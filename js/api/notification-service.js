// Notification Service for QuickLocal Frontend
class NotificationService {
  constructor() {
    this.baseURL = window.API_CONFIG?.full || '/api/v1';
    // FIXED: Removed all internal token management (this.token, loadToken)
    this.initialized = false;
    this.badgeInterval = null;
  }

  // FIXED: Replaced entire makeRequest with HybridAuthClient.apiCall
  async makeRequest(endpoint, options = {}) {
    if (!window.HybridAuthClient) {
      console.error('HybridAuthClient is not available!');
      throw new Error('Authentication client not found');
    }
    
    try {
      // Clean the endpoint: apiCall expects 'notifications/read-all', not '/notifications/read-all'
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

      const response = await window.HybridAuthClient.apiCall(cleanEndpoint, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      // The auth client will handle 401s; we just re-throw the final error
      throw error;
    }
  }

  // Get user notifications
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.read) queryParams.append('read', params.read);
    if (params.type) queryParams.append('type', params.type);
    if (params.priority) queryParams.append('priority', params.priority);

    const queryString = queryParams.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    return await this.makeRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  // Mark all notifications as read
  async markAllAsRead() {
    return await this.makeRequest('/notifications/read-all', {
      method: 'PATCH'
    });
  }

  // Delete notification
  async deleteNotification(notificationId) {
    return await this.makeRequest(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  // Clear all notifications
  async clearAllNotifications(read = 'all') {
    const queryParams = new URLSearchParams();
    if (read !== 'all') queryParams.append('read', read);
    
    const queryString = queryParams.toString();
    const endpoint = `/notifications/clear-all${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint, {
      method: 'DELETE'
    });
  }

  // Get notification settings
  async getNotificationSettings() {
    return await this.makeRequest('/notifications/settings');
  }

  // Update notification settings
  async updateNotificationSettings(settings) {
    return await this.makeRequest('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await this.getNotifications({ limit: 1, read: 'unread' });
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(callback) {
    if (typeof io === 'undefined') {
      console.warn('Socket.IO not available for real-time notifications');
      return null;
    }

    const authHeader = window.HybridAuthClient?.getAuthHeader?.();
    const token = typeof authHeader === 'string'
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : '';

    const socketOptions = {
      withCredentials: true,
      transports: ['polling'],
      upgrade: false,
      timeout: 8000,
      reconnection: false
    };

    // Cookie session is primary. If a bearer exists, include it.
    if (token) {
      socketOptions.auth = { token };
    }

    const socket = io(this.baseURL.replace('/api/v1', ''), socketOptions);
    
    socket.on('notification', (notification) => {
      callback(notification);
    });

    socket.on('connect', () => {
      console.log('Connected to notification service');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
    });

    socket.on('connect_error', (error) => {
      const message = String(error?.message || '');
      if (/unauthoriz|auth/i.test(message)) {
        console.info('[NotificationService] Real-time notifications unavailable for current session');
      } else {
        console.warn('[NotificationService] Socket polling unavailable:', error?.message || error);
      }
    });

    return socket;
  }

  // Initialize notification badge
  async initializeBadge() {
    try {
      const unreadCount = await this.getUnreadCount();
      this.updateBadge(unreadCount);
    } catch (error) {
      console.error('Failed to initialize notification badge:', error);
    }
  }

  // Update notification badge
  updateBadge(count) {
    const badges = document.querySelectorAll('.notification-badge, .notification-count');
    
    badges.forEach(badge => {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // Show notification toast
  showToast(notification) {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${notification.priority}`;
    toast.innerHTML = `
      <div class="toast-header">
        <i class="fas fa-${this.getTypeIcon(notification.type)}"></i>
        <span class="toast-title">${notification.title}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="toast-body">
        ${notification.message}
      </div>
      ${notification.actionUrl ? `
        <div class="toast-actions">
          <a href="${notification.actionUrl}" class="toast-action">
            ${notification.actionText || 'View Details'}
          </a>
        </div>
      ` : ''}
    `;

    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);

    this.playNotificationSound();
  }

  // Get type icon
  getTypeIcon(type) {
    const icons = {
      order: 'shopping-bag',
      promotion: 'gift',
      update: 'info-circle',
      security: 'shield-alt',
      system: 'cog'
    };
    return icons[type] || 'bell';
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors if audio fails to play
      });
    } catch (error) {
      // Ignore errors if audio is not supported
    }
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/images/notification-icon.png',
        badge: '/images/badge-icon.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent'
      });

      browserNotification.onclick = () => {
        if (notification.actionUrl) {
          window.open(notification.actionUrl, '_blank');
        }
        browserNotification.close();
      };

      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Initialize notification system
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      // FIXED: Check auth status using the central client
      if (!window.HybridAuthClient || !window.HybridAuthClient.getCurrentUser()) {
        console.log('[NotificationService] Skipping initialization - no authenticated user');
        return false;
      }

      await this.initializeBadge();
      // Avoid browser permission prompt spam on initial page load.
      // Permission prompts should be triggered from explicit user action flows.

      const socket = this.subscribeToNotifications((notification) => {
        this.updateBadge(notification.unreadCount || 0);
        this.showToast(notification);
        this.showBrowserNotification(notification);
      });

      // Set up periodic badge updates
      if (!this.badgeInterval) {
        this.badgeInterval = setInterval(async () => {
          // FIXED: Check auth status using the central client
          if (window.HybridAuthClient && window.HybridAuthClient.getCurrentUser()) {
            await this.initializeBadge();
          }
        }, 30000); // Update every 30 seconds
      }

      console.log('[NotificationService] ✅ Successfully initialized');
      this.initialized = true;
      return socket || true;
    } catch (error) {
      console.error('[NotificationService] Failed to initialize:', error);
      return false;
    }
  }
}

// Create global instance
window.notificationService = new NotificationService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialization is now handled by the 'auth-ready' event in marketplace.html
  // to ensure auth is available first.
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
}
