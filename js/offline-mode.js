/**
 * Offline Mode Support - PWA Offline Functionality
 * Allows users to browse cached products when offline
 */

class OfflineMode {
  constructor() {
    this.apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || '/api/v1';
    this.cacheName = 'quicklocal-cache-v1';
    this.isOnline = navigator.onLine;
    this.offlineIndicator = null;
    
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Check initial status
    if (!this.isOnline) {
      this.handleOffline();
    }
    
    // Setup service worker if available
    this.setupServiceWorker();
    
    // Setup cache
    this.setupCache();
    
    console.log('📴 Offline mode initialized');
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        if (typeof registration.update === 'function') {
          await registration.update();
        }
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        console.log('✅ Service Worker registered:', registration);
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }
  }

  async setupCache() {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        console.log('✅ Cache opened:', this.cacheName);
      } catch (error) {
        console.warn('⚠️ Cache setup failed:', error);
      }
    }
  }

  handleOnline() {
    this.isOnline = true;
    this.hideOfflineIndicator();
    this.syncOfflineData();
    console.log('🌐 Back online');
    
    // Show notification
    this.showNotification('You are back online!', 'success');
  }

  handleOffline() {
    this.isOnline = false;
    this.showOfflineIndicator();
    console.log('📴 Gone offline');
    
    // Show notification
    this.showNotification('You are offline. Browsing cached content.', 'warning');
  }

  showOfflineIndicator() {
    if (this.offlineIndicator) return;
    
    this.offlineIndicator = document.createElement('div');
    this.offlineIndicator.id = 'offline-indicator';
    this.offlineIndicator.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        padding: 0.75rem 1rem;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        animation: slideDown 0.3s ease-out;
      ">
        <i class="fas fa-wifi" style="margin-right: 0.5rem;"></i>
        You are offline. Browsing cached content.
      </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(this.offlineIndicator);
    
    // Adjust body padding to account for indicator
    document.body.style.paddingTop = '48px';
  }

  hideOfflineIndicator() {
    if (this.offlineIndicator) {
      this.offlineIndicator.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => {
        if (this.offlineIndicator && this.offlineIndicator.parentElement) {
          this.offlineIndicator.parentElement.removeChild(this.offlineIndicator);
        }
        this.offlineIndicator = null;
        document.body.style.paddingTop = '';
      }, 300);
    }
  }

  async cacheRequest(url, response) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        await cache.put(url, response.clone());
        return true;
      } catch (error) {
        console.error('Cache request failed:', error);
        return false;
      }
    }
    return false;
  }

  async getCachedResponse(url) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const cachedResponse = await cache.match(url);
        return cachedResponse;
      } catch (error) {
        console.error('Get cached response failed:', error);
        return null;
      }
    }
    return null;
  }

  async fetchWithCache(url, options = {}) {
    // Try network first
    if (this.isOnline) {
      try {
        const response = await fetch(url, options);
        
        // Cache successful responses
        if (response.ok) {
          await this.cacheRequest(url, response);
        }
        
        return response;
      } catch (error) {
        console.warn('Network request failed, trying cache:', error);
      }
    }
    
    // Fallback to cache
    const cachedResponse = await this.getCachedResponse(url);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available
    throw new Error('No network connection and no cached data available');
  }

  async cacheProducts(products) {
    if ('caches' in window && products && products.length > 0) {
      try {
        const cache = await caches.open(this.cacheName);
        const cacheData = {
          products,
          timestamp: Date.now(),
          version: '1.0'
        };
        
        const response = new Response(JSON.stringify(cacheData), {
          headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(`${this.apiBaseUrl}/products/cached`, response);
        console.log(`✅ Cached ${products.length} products`);
      } catch (error) {
        console.error('Cache products failed:', error);
      }
    }
  }

  async getCachedProducts() {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const cachedResponse = await cache.match(`${this.apiBaseUrl}/products/cached`);
        
        if (cachedResponse) {
          const data = await cachedResponse.json();
          return data.products || [];
        }
      } catch (error) {
        console.error('Get cached products failed:', error);
      }
    }
    return [];
  }

  async syncOfflineData() {
    // Sync any offline actions when back online
    const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
    
    if (offlineActions.length > 0) {
      console.log(`🔄 Syncing ${offlineActions.length} offline actions...`);
      
      for (const action of offlineActions) {
        try {
          await this.syncAction(action);
        } catch (error) {
          console.error('Sync action failed:', error);
        }
      }
      
      localStorage.removeItem('offlineActions');
      this.showNotification('Offline actions synced!', 'success');
    }
  }

  async syncAction(action) {
    const { type, url, data } = action;
    
    try {
      const response = await fetch(url, {
        credentials: 'include',
        method: type === 'POST' ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (response.ok) {
        console.log(`✅ Synced action: ${type} ${url}`);
        return true;
      }
    } catch (error) {
      console.error('Sync action error:', error);
      throw error;
    }
  }

  queueOfflineAction(type, url, data) {
    const offlineActions = JSON.parse(localStorage.getItem('offlineActions') || '[]');
    offlineActions.push({ type, url, data, timestamp: Date.now() });
    localStorage.setItem('offlineActions', JSON.stringify(offlineActions));
    console.log('📝 Queued offline action:', type, url);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `offline-notification offline-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    // Add animation
    if (!document.getElementById('offline-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'offline-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Check if online
  checkOnlineStatus() {
    return navigator.onLine;
  }
}

// Initialize offline mode
if (typeof window !== 'undefined') {
  window.offlineMode = new OfflineMode();
  
  // Export for use in other scripts
  window.isOnline = () => window.offlineMode.checkOnlineStatus();
  window.fetchWithCache = (url, options) => window.offlineMode.fetchWithCache(url, options);
}

