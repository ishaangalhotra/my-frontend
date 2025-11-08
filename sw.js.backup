// Service Worker for QuickLocal Push Notifications
const CACHE_NAME = 'quicklocal-v1';

// Only cache essential files that definitely exist
// Remove paths that cause 404 errors
const urlsToCache = [
  '/',
  '/marketplace.html'
  // Removed problematic paths:
  // - '/offline.html' (may not exist)
  // - '/images/notification-icon.png' (may not exist)
  // - '/images/badge-icon.png' (may not exist)
  // - JS files (already loaded from HTML)
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        // Use addAll with error handling
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('Service Worker: Cache addAll failed', error);
          // Try adding files individually to identify which one fails
          return Promise.allSettled(
            urlsToCache.map(url => 
              cache.add(url).catch(err => {
                console.error(`Failed to cache ${url}:`, err);
                return null;
              })
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch(() => {
          // If both fail and it's a navigation request, return a basic offline message
          if (event.request.mode === 'navigate') {
            return new Response(
              '<html><body><h1>Offline</h1><p>You are currently offline. Please check your internet connection.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);

  let options = {
    body: 'You have a new notification from QuickLocal',
    icon: '/images/notification-icon.png',
    badge: '/images/badge-icon.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/images/icons/eye.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/icons/close.png'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      
      options = {
        body: data.body || options.body,
        icon: data.icon || options.icon,
        badge: data.badge || options.badge,
        image: data.image,
        tag: data.tag || 'quicklocal-notification',
        renotify: data.renotify || false,
        silent: data.silent || false,
        requireInteraction: data.requireInteraction || false,
        vibrate: data.vibrate || options.vibrate,
        data: data.data || options.data,
        actions: data.actions || options.actions,
        timestamp: data.timestamp || Date.now()
      };

      // Special handling for order notifications
      if (data.type === 'order_update') {
        options.requireInteraction = true;
        options.tag = `order-${data.orderId}`;
        
        switch (data.status) {
          case 'confirmed':
            options.icon = '/images/icons/order-confirmed.png';
            options.vibrate = [200, 100, 200, 100, 200];
            break;
          case 'out_for_delivery':
            options.icon = '/images/icons/delivery-truck.png';
            options.vibrate = [300, 100, 300, 100, 300];
            options.requireInteraction = true;
            break;
          case 'delivered':
            options.icon = '/images/icons/delivered.png';
            options.vibrate = [500, 100, 500, 100, 500];
            options.requireInteraction = true;
            break;
        }
      }
      
      // Special handling for promotional notifications
      if (data.type === 'promotion') {
        options.tag = `promotion-${data.promotionId}`;
        options.icon = '/images/icons/promotion.png';
        options.requireInteraction = false;
      }

    } catch (error) {
      console.error('Service Worker: Error parsing push data', error);
    }
  }

  const title = event.data ? 
    (event.data.json().title || 'QuickLocal') : 
    'QuickLocal';

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  let url = '/';
  let shouldFocus = true;

  // Handle different actions
  switch (action) {
    case 'explore':
    case 'view':
      url = data.url || '/dashboard.html';
      break;
    case 'track':
      url = `/order-tracking.html?order=${data.orderId}`;
      break;
    case 'rate':
      url = `/rate-order.html?order=${data.orderId}`;
      break;
    case 'reorder':
      url = `/reorder.html?order=${data.orderId}`;
      break;
    case 'call':
      // Handle call delivery person
      if (data.deliveryPhone) {
        url = `tel:${data.deliveryPhone}`;
        shouldFocus = false;
      }
      break;
    case 'close':
    case 'dismiss':
      // Just close, don't open anything
      return;
    default:
      // Default click behavior
      if (data.url) {
        url = data.url;
      } else if (data.orderId) {
        url = `/order-tracking.html?order=${data.orderId}`;
      } else if (data.promotionId) {
        url = `/promotions.html?id=${data.promotionId}`;
      }
      break;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let client of clientList) {
          if (client.url === url && 'focus' in client && shouldFocus) {
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow && shouldFocus) {
          return clients.openWindow(url);
        }
      })
      .then((windowClient) => {
        // Send message to client about the notification click
        if (windowClient) {
          windowClient.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: action,
            data: data,
            timestamp: Date.now()
          });
        }
      })
  );
});

// Notification close event - handle when user dismisses notification
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event);
  
  const notification = event.notification;
  const data = notification.data || {};

  // Send analytics data about dismissed notification
  event.waitUntil(
    fetch('https://ecommerce-backend-mlik.onrender.com/api/v1/notifications/analytics/dismissed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: data.notificationId || notification.tag,
        dismissedAt: new Date().toISOString(),
        action: 'dismissed'
      })
    }).catch(() => {
      // Ignore errors for analytics
    })
  );
});

// Background Sync - handle offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event);

  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOrderUpdates());
  }
  
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotificationStatus());
  }
});

// Sync order updates when back online
async function syncOrderUpdates() {
  try {
    // Get pending order updates from IndexedDB or localStorage
    const pendingUpdates = await getPendingOrderUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch(`https://ecommerce-backend-mlik.onrender.com/api/v1/orders/${update.orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        });
        
        // Remove from pending updates
        await removePendingOrderUpdate(update.id);
        
      } catch (error) {
        console.error('Failed to sync order update:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync notification read status
async function syncNotificationStatus() {
  try {
    const pendingNotifications = await getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      try {
        await fetch(`https://ecommerce-backend-mlik.onrender.com/api/v1/notifications/${notification.id}/read`, {
          method: 'PATCH'
        });
        
        await removePendingNotification(notification.id);
        
      } catch (error) {
        console.error('Failed to sync notification status:', error);
      }
    }
  } catch (error) {
    console.error('Notification sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingOrderUpdates() {
  // Implement IndexedDB operations or use localStorage as fallback
  try {
    const stored = localStorage.getItem('pendingOrderUpdates');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function removePendingOrderUpdate(id) {
  try {
    const updates = await getPendingOrderUpdates();
    const filtered = updates.filter(update => update.id !== id);
    localStorage.setItem('pendingOrderUpdates', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending order update:', error);
  }
}

async function getPendingNotifications() {
  try {
    const stored = localStorage.getItem('pendingNotifications');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function removePendingNotification(id) {
  try {
    const notifications = await getPendingNotifications();
    const filtered = notifications.filter(notification => notification.id !== id);
    localStorage.setItem('pendingNotifications', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending notification:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  // Handle offline data storage
  if (event.data && event.data.type === 'STORE_OFFLINE_DATA') {
    const { key, data } = event.data;
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
      event.ports[0].postMessage({ success: true });
    } catch (error) {
      event.ports[0].postMessage({ success: false, error: error.message });
    }
  }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic background sync', event.tag);

  if (event.tag === 'update-order-status') {
    event.waitUntil(updateOrderStatusInBackground());
  }
});

// Update order status in background
async function updateOrderStatusInBackground() {
  try {
    // Fetch latest order status for active orders
    const response = await fetch('https://ecommerce-backend-mlik.onrender.com/api/v1/orders/active-status');
    const orders = await response.json();

    // Send status updates to any open tabs
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ORDER_STATUS_UPDATE',
        orders: orders,
        timestamp: Date.now()
      });
    });

  } catch (error) {
    console.error('Background order status update failed:', error);
  }
}

console.log('Service Worker: Loaded and ready');