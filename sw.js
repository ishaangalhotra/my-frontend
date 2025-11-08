// Service Worker for QuickLocal Push Notifications
const CACHE_NAME = 'quicklocal-v3'; // BUMPED VERSION
const API_CACHE_NAME = 'quicklocal-api-v1';
const IMAGE_CACHE_NAME = 'quicklocal-images-v1';
const STATIC_CACHE_NAME = 'quicklocal-static-v2'; // BUMPED VERSION

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
  
  // NOTE: All dynamic JS files have been REMOVED from this list (e.g., marketplace.js,
  // marketplace-integration.js, marketplace-api-patch.js, etc.) to ensure the browser 
  // always fetches the latest version from the network during development.
  '/js/main.js',
  '/js/auth.js',
  '/js/offline-mode.js',
  '/js/ux-polish.js',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_URLS_TO_CACHE).catch((error) => {
          console.error('Service Worker: Cache addAll failed', error);
          // If some files fail, log and continue, don't fail the whole install
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Only keep caches with the latest names
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME, STATIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Ensure the Service Worker takes control of clients immediately
  event.waitUntil(self.clients.claim());
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

// Fetch event - serving content
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  
  // Skip POST requests for caching - FIX FOR THE MAIN ERROR
  if (request.method === 'POST') {
    event.respondWith(fetch(request));
    return;
  }

  const isApi = isAPIRequest(request.url);
  const isImage = requestUrl.pathname.match(/\.(jpe?g|png|gif|svg|webp)$/i);
  const isStatic = isStaticRequest(request.url);

  // 1. API Cache Strategy (Stale-While-Revalidate)
  if (isApi) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchedCopy = fetch(request).then((response) => {
            if (response.ok) {
              // Cache the new response
              cache.put(request, response.clone());
            }
            return response;
          }).catch((error) => {
            console.warn(`[SW] API fetch failed for ${requestUrl.pathname}:`, error.message);
            // This is handled by returning the cachedResponse if available
          });

          if (cachedResponse) {
            console.log(`[SW] Serving API from cache: ${requestUrl.href}`);
            return cachedResponse;
          }
          
          return fetchedCopy;
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

  // 3. Static Assets Strategy (Cache-First) - Now only for HTML/CSS/Core JS
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log(`[SW] Serving static file from cache: ${requestUrl.href}`);
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

// Messaging event for version control and offline data
self.addEventListener('message', (event) => {
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

  // Handle POST request skipping
  if (event.data && event.data.type === 'SKIP_POST_CACHING') {
    console.log('[SW] Received instruction to skip POST caching');
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
    // Handle error
    console.error('Background sync failed:', error);
  }
}