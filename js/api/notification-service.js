// Notification Service for QuickLocal Frontend
class NotificationService {
  constructor() {
    // FIXED: Use backend URL instead of frontend origin
    this.baseURL = window.API_CONFIG?.full || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    this.token = null; // FIXED: Don't use localStorage in constructor
    this.loadToken() {
  try {
    let token = null;

    // Priority 1: Check the dedicated token keys
    token = localStorage.getItem('quicklocal_access_token') || 
            localStorage.getItem('supabase_access_token') ||
            localStorage.getItem('token');

    // Priority 2: Fallback to checking inside the user object (as a last resort)
    if (!token) {
      const storedUser = localStorage.getItem('quicklocal_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          token = parsed?.access_token || parsed?.token || parsed?.accessToken;
        } catch (e) {
          console.warn(`[${this.constructor.name}] Failed to parse user object:`, e);
        }
      }
    }

    this.token = token;

    if (!token) {
      console.log(`[${this.constructor.name}] No auth token found (user may not be logged in)`);
    } else {
      console.log(`[${this.constructor.name}] ✅ Auth token loaded successfully`);
    }
  } catch (error) {
    console.warn(`[${this.constructor.name}] Failed to load token:`, error);
    this.token = null;
  }
}

  // Load token from localStorage
  
loadToken() {
  try {
    let token = null;

    // Priority 1: Check the dedicated token keys
    token = localStorage.getItem('quicklocal_access_token') || 
            localStorage.getItem('supabase_access_token') ||
            localStorage.getItem('token');

    // Priority 2: Fallback to checking inside the user object (as a last resort)
    if (!token) {
      const storedUser = localStorage.getItem('quicklocal_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        token = parsed?.access_token || parsed?.token || parsed?.accessToken;
      }
    }

    this.token = token;

    if (!token) {
      // This log is now expected on logout, but shows the bug if user is logged in
      console.warn(`[${this.constructor.name}] No valid auth token found.`);
    } else {
      // Optional: Add a success log for debugging
      console.log(`[${this.constructor.name}] Auth token loaded successfully.`);
    }
  } catch (error) {
    console.warn(`[${this.constructor.name}] Failed to load token:`, error);
    this.token = null;
  }
}
  // Set authentication token
  setToken(token) {
    this.token = token;
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.warn('Unable to save token to localStorage:', error);
    }
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
    if (typeof io !== 'undefined') {
      const socket = io(this.baseURL.replace('/api/v1', ''));
      
      socket.on('notification', (notification) => {
        callback(notification);
      });

      socket.on('connect', () => {
        console.log('Connected to notification service');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from notification service');
      });

      return socket;
    } else {
      console.warn('Socket.IO not available for real-time notifications');
      return null;
    }
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

    // Add to toast container
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);

    // Play notification sound
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

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Initialize notification system
  async initialize() {
  try {
    // Reload token in case it was set after construction
    this.loadToken();

    // Check if we actually have a token before making API calls
    if (!this.token) {
      console.log('[NotificationService] Skipping initialization - no auth token available');
      return false;
    }

    // Initialize badge
    await this.initializeBadge();

    // Request permission for browser notifications
    await this.requestPermission();

    // Subscribe to real-time notifications
    const socket = this.subscribeToNotifications((notification) => {
      // Update badge
      this.updateBadge(notification.unreadCount || 0);

      // Show toast notification
      this.showToast(notification);

      // Show browser notification
      this.showBrowserNotification(notification);
    });

    // Set up periodic badge updates
    setInterval(async () => {
      if (this.token) { // Only update if we still have a token
        await this.initializeBadge();
      }
    }, 30000); // Update every 30 seconds

    console.log('[NotificationService] ✅ Successfully initialized');
    return socket;
  } catch (error) {
    console.error('[NotificationService] Failed to initialize:', error);
    return false;
  }
});

      // Set up periodic badge updates
      setInterval(async () => {
        await this.initializeBadge();
      }, 30000); // Update every 30 seconds

      return socket;
    } catch (error) {
      console.error('Failed to initialize notification system:', error);
    }
  }
}

// Create global instance
window.notificationService = new NotificationService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.notificationService) {
    window.notificationService.initialize();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
}