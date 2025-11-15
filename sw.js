// Service Worker for QuickLocal Push Notifications
const CACHE_NAME = 'quicklocal-v4'; // BUMPED VERSION
const API_CACHE_NAME = 'quicklocal-api-v2'; // BUMPED VERSION
const IMAGE_CACHE_NAME = 'quicklocal-images-v1';
const STATIC_CACHE_NAME = 'quicklocal-static-v3'; // BUMPED VERSION

// URLs to cache on install
const STATIC_URLS_TO_CACHE = [
  '/',
  '/marketplace.html',
  '/index.html',
  '/cart.html',
  '/checkout.html',
  '/login.html',
  '/register.html',
  '/profile.html',
  '/my-orders.html',
  
  // CSS files (keep these, they rarely change and benefit from caching)
  '/css/main.css',
  '/css/product-cards.css',
  '/css/mobile-responsive.css',
  '/css/skeleton-loading.css',
  '/css/micro-interactions.css',
  
  '/js/main.js',
  '/js/auth.js',
  '/js/offline-mode.js',
  '/js/ux-polish.js',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v4...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_URLS_TO_CACHE).catch((error) => {
          console.error('[SW] Cache addAll failed', error);
        });
      })
  );
  
  // Force immediate activation
  self.skipWaiting();
});

// CRITICAL FIX: Cleanup stale API cache with shorter TTL
async function cleanupStaleAPICache() {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    
    const now = Date.now();
    const MAX_AGE = 2 * 60 * 1000; // REDUCED to 2 minutes for API calls
    
    for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
                const age = now - new Date(dateHeader).getTime();
                if (age > MAX_AGE) {
                    await cache.delete(request);
                    console.log('[SW] ✅ Removed stale API cache:', request.url);
                }
            }
        }
    }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v4...');
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME, STATIC_CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[SW] ✅ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clean stale API cache
      cleanupStaleAPICache()
    ]).then(() => {
      console.log('[SW] ✅ Cleanup complete');
      return self.clients.claim();
    })
  );
});

// Helper function to check if request is API
function isAPIRequest(url) {
  return url.includes('/api/v1');
}

// Helper function to check if request is static
function isStaticRequest(url) {
  const staticExtensions = ['.html', '.css', '.js', '.json', '.xml'];
  return staticExtensions.some(ext => url.includes(ext));
}

// CRITICAL FIX: Enhanced fetch with proper cache control
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  
  // Skip caching for all non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  const isApi = isAPIRequest(request.url);
  const isImage = requestUrl.pathname.match(/\.(jpe?g|png|gif|svg|webp)$/i);
  const isStatic = isStaticRequest(request.url);

  // 1. CRITICAL FIX: API Cache Strategy - Network First with short-lived cache
  if (isApi) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        // Always try network first for API calls
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              // Clone and cache the response with timestamp
              const responseToCache = networkResponse.clone();
              cache.put(request, responseToCache);
              console.log('[SW] 🔄 Cached fresh API response:', requestUrl.pathname);
            }
            return networkResponse;
          })
          .catch(async (error) => {
            console.warn('[SW] ⚠️ Network failed, trying cache:', requestUrl.pathname);
            
            // Only use cache as fallback when offline
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
              console.log('[SW] 📦 Serving stale API from cache (offline):', requestUrl.pathname);
              
              // Add header to indicate this is cached
              const headers = new Headers(cachedResponse.headers);
              headers.append('X-Cache-Status', 'STALE');
              
              return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers
              });
            }
            
            // No cache available
            console.error('[SW] ❌ No cache available for:', requestUrl.pathname);
            throw error;
          });
      })
    );
    return;
  }

  // 2. Image Cache Strategy (Cache-First, with expiry)
  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Revalidate in background to keep cache fresh
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
            });
            return cachedResponse;
          }
          // Fall back to network if not in cache
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // 3. Static Assets Strategy (Cache-First) - Only for HTML/CSS/Core JS
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log('[SW] 📦 Serving static file from cache:', requestUrl.href);
          return response;
        }
        // Fall back to network
        return fetch(request);
      })
    );
    return;
  }

  // 4. Default: Network-First (For all dynamic JS and unlisted files)
  event.respondWith(
    fetch(request).catch(() => {
      // Fallback to cache for critical paths if network fails
      if (requestUrl.pathname.includes('marketplace.html') || requestUrl.pathname === '/') {
        return caches.match('/marketplace.html') || caches.match('/index.html');
      }
      return caches.match(request);
    })
  );
});

// Messaging event for version control and cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  // NEW: Force cache clear command
  if (event.data && event.data.type === 'CLEAR_API_CACHE') {
    caches.open(API_CACHE_NAME).then((cache) => {
      cache.keys().then((requests) => {
        requests.forEach((request) => {
          cache.delete(request);
        });
      });
    });
    event.ports[0].postMessage({ success: true });
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
  console.log('[SW] Periodic background sync', event.tag);

  if (event.tag === 'update-order-status') {
    event.waitUntil(updateOrderStatusInBackground());
  }
  
  // NEW: Clean stale cache periodically
  if (event.tag === 'clean-cache') {
    event.waitUntil(cleanupStaleAPICache());
  }
});

// Update order status in background
async function updateOrderStatusInBackground() {
  try {
    const response = await fetch('https://ecommerce-backend-mlik.onrender.com/api/v1/orders/active-status');
    const orders = await response.json();

    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ORDER_STATUS_UPDATE',
        orders: orders,
        timestamp: Date.now()
      });
    });

  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

console.log('[SW] ✅ Service Worker v4 loaded with API cache fixes');