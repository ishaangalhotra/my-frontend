// Advanced Push Notification Service for QuickLocal
class PushNotificationService {
  constructor() {
    // FIXED: Use external config or full backend URL for consistency and reliability
    this.baseURL = window.API_CONFIG?.full || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    
    this.serviceWorkerRegistration = null;
    this.pushSubscription = null;
    this.isSupported = this.checkPushSupport();
    this.loadToken() 
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


  // Check if push notifications are supported
  checkPushSupport() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    // FIXED: Ensure we are setting a reliable token key, defaulting to the one the login flow likely uses
    localStorage.setItem('quicklocal_access_token', token);
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

  // Register service worker
  async registerServiceWorker() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return this.serviceWorkerRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      // Register service worker if not already registered
      if (!this.serviceWorkerRegistration) {
        await this.registerServiceWorker();
      }

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission not granted');
      }

      // Get VAPID public key from server
      const response = await this.makeRequest('/notifications/vapid-public-key');
      const vapidPublicKey = response.publicKey;

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push manager
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.pushSubscription);

      console.log('Push subscription successful');
      return this.pushSubscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      if (this.pushSubscription) {
        await this.pushSubscription.unsubscribe();
        
        // Remove subscription from server
        await this.removeSubscriptionFromServer();
        
        this.pushSubscription = null;
        console.log('Push unsubscription successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      throw error;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    return await this.makeRequest('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  }

  // Remove subscription from server
  async removeSubscriptionFromServer() {
    if (this.pushSubscription) {
      return await this.makeRequest('/notifications/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: this.pushSubscription.endpoint
        })
      });
    }
  }

  // Send push notification (admin use)
  async sendPushNotification(notificationData) {
    return await this.makeRequest('/notifications/send-push', {
      method: 'POST',
      body: JSON.stringify({
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon || '/images/notification-icon.png',
        badge: notificationData.badge || '/images/badge-icon.png',
        image: notificationData.image,
        tag: notificationData.tag,
        url: notificationData.url,
        actions: notificationData.actions,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction || false,
        silent: notificationData.silent || false,
        timestamp: new Date().getTime(),
        recipients: notificationData.recipients || 'all' // 'all', 'customers', 'sellers', or array of user IDs
      })
    });
  }

  // Send targeted notification
  async sendTargetedNotification(userIds, notificationData) {
    return await this.sendPushNotification({
      ...notificationData,
      recipients: userIds
    });
  }

  // Send order update notification
  async sendOrderNotification(orderId, status, customMessage = null) {
    const orderStatusMessages = {
      'confirmed': {
        title: 'Order Confirmed! 🎉',
        body: customMessage || 'Your order has been confirmed and is being prepared.',
        icon: '/images/icons/order-confirmed.png',
        url: `/order-tracking.html?order=${orderId}`
      },
      'preparing': {
        title: 'Order Being Prepared 👨‍🍳',
        body: customMessage || 'Your order is being prepared with care.',
        icon: '/images/icons/preparing.png',
        url: `/order-tracking.html?order=${orderId}`
      },
      'out_for_delivery': {
        title: 'Out for Delivery! 🚚',
        body: customMessage || 'Your order is on its way to you. Track live location.',
        icon: '/images/icons/delivery-truck.png',
        url: `/order-tracking.html?order=${orderId}`,
        requireInteraction: true,
        actions: [
          {
            action: 'track',
            title: 'Track Order',
            icon: '/images/icons/track.png'
          },
          {
            action: 'call',
            title: 'Call Delivery',
            icon: '/images/icons/phone.png'
          }
        ]
      },
      'delivered': {
        title: 'Order Delivered! ✅',
        body: customMessage || 'Your order has been successfully delivered. Enjoy!',
        icon: '/images/icons/delivered.png',
        url: `/orders.html`,
        actions: [
          {
            action: 'rate',
            title: 'Rate Order',
            icon: '/images/icons/star.png'
          },
          {
            action: 'reorder',
            title: 'Order Again',
            icon: '/images/icons/reorder.png'
          }
        ]
      }
    };

    const notification = orderStatusMessages[status];
    if (notification) {
      notification.tag = `order-${orderId}`;
      notification.data = { orderId, status };
      
      return await this.sendPushNotification(notification);
    }
  }

  // Send promotional notification
  async sendPromotionalNotification(promotionData) {
    return await this.sendPushNotification({
      title: `${promotionData.title} 🎁`,
      body: promotionData.description,
      icon: '/images/icons/promotion.png',
      image: promotionData.image,
      url: promotionData.url || '/promotions.html',
      tag: `promotion-${promotionData.id}`,
      data: { type: 'promotion', promotionId: promotionData.id },
      actions: [
        {
          action: 'view',
          title: 'View Deal',
          icon: '/images/icons/eye.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/images/icons/close.png'
        }
      ]
    });
  }

  // Schedule notification
  async scheduleNotification(notificationData, scheduleTime) {
    return await this.makeRequest('/notifications/schedule', {
      method: 'POST',
      body: JSON.stringify({
        ...notificationData,
        scheduleTime: scheduleTime.toISOString()
      })
    });
  }

  // Get notification templates
  async getNotificationTemplates() {
    return await this.makeRequest('/notifications/templates');
  }

  // Create notification template
  async createNotificationTemplate(templateData) {
    return await this.makeRequest('/notifications/templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  }

  // Get push notification stats
  async getPushStats(timeframe = '7d') {
    return await this.makeRequest(`/notifications/push-stats?timeframe=${timeframe}`);
  }

  // Get subscriber count
  async getSubscriberCount() {
    return await this.makeRequest('/notifications/subscriber-count');
  }

  // Test push notification
  async testPushNotification() {
    return await this.sendPushNotification({
      title: 'Test Notification 🧪',
      body: 'This is a test push notification from QuickLocal!',
      tag: 'test-notification',
      url: '/dashboard.html'
    });
  }

  // Check subscription status
  async getSubscriptionStatus() {
    try {
      if (!this.isSupported) return { supported: false };

      if (!this.serviceWorkerRegistration) {
        await this.registerServiceWorker();
      }

      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      return {
        supported: true,
        subscribed: !!this.pushSubscription,
        subscription: this.pushSubscription
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { supported: false, error: error.message };
    }
  }

  // Utility: Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility: Convert ArrayBuffer to Base64
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Show rich notification with actions
  async showRichNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: data.body,
        icon: data.icon || '/images/notification-icon.png',
        badge: data.badge || '/images/badge-icon.png',
        image: data.image,
        tag: data.tag,
        renotify: data.renotify || false,
        silent: data.silent || false,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || []
      };

      const notification = new Notification(data.title, options);
      
      notification.onclick = (event) => {
        event.preventDefault();
        if (data.url) {
          window.open(data.url, '_blank');
        }
        notification.close();
      };

      return notification;
    }
  }

  // Initialize push notification system
  async initialize() {
  try {
    if (!this.isSupported) {
      console.warn('[PushNotificationService] Push notifications are not supported in this browser');
      return false;
    }

    // Reload token
    this.loadToken();

    // Note: Push notification initialization doesn't require auth,
    // so we don't skip here, but we log a warning
    if (!this.token) {
      console.log('[PushNotificationService] No auth token - limited functionality');
    }

    // Check current subscription status
    const status = await this.getSubscriptionStatus();
    console.log('[PushNotificationService] Push notification status:', status);

    // Set up message handler for service worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          this.handleNotificationClick(event.data);
        }
      });
    }

    console.log('[PushNotificationService] ✅ Successfully initialized');
    return true;
  } catch (error) {
    console.error('[PushNotificationService] Failed to initialize:', error);
    return false;
  }
}

      // Check current subscription status
      const status = await this.getSubscriptionStatus();
      console.log('Push notification status:', status);

      // Set up message handler for service worker
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
            this.handleNotificationClick(event.data);
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      return false;
    }
  }

  // Handle notification click events
  handleNotificationClick(data) {
    console.log('Notification clicked:', data);
    
    // Emit custom event for handling
    const event = new CustomEvent('notificationClicked', { 
      detail: data 
    });
    document.dispatchEvent(event);
    
    // Handle specific actions
    if (data.action && data.orderId) {
      switch (data.action) {
        case 'track':
          window.open(`/order-tracking.html?order=${data.orderId}`, '_blank');
          break;
        case 'rate':
          window.open(`/rate-order.html?order=${data.orderId}`, '_blank');
          break;
        case 'reorder':
          window.open(`/reorder.html?order=${data.orderId}`, '_blank');
          break;
      }
    }
  }

  // Get notification permission status
  getPermissionStatus() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission;
  }

  // Show permission request dialog
  showPermissionDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'permission-dialog-overlay';
    dialog.innerHTML = `
      <div class="permission-dialog">
        <div class="dialog-header">
          <i class="fas fa-bell"></i>
          <h3>Enable Notifications</h3>
        </div>
        <div class="dialog-body">
          <p>Stay updated with real-time order updates, delivery notifications, and exclusive deals!</p>
          <ul class="permission-benefits">
            <li><i class="fas fa-check"></i> Get instant order status updates</li>
            <li><i class="fas fa-check"></i> Track deliveries in real-time</li>
            <li><i class="fas fa-check"></i> Never miss exclusive deals</li>
            <li><i class="fas fa-check"></i> Receive important account alerts</li>
          </ul>
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            Maybe Later
          </button>
          <button class="btn-primary" onclick="window.pushNotificationService.subscribe().then(() => this.parentElement.parentElement.parentElement.remove())">
            Enable Notifications
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
  }
}

// Create global instance
window.pushNotificationService = new PushNotificationService();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.pushNotificationService) {
    window.pushNotificationService.initialize();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PushNotificationService;
}