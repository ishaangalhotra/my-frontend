// Service Worker for QuickLocal Push Notifications
const CACHE_NAME = 'quicklocal-v11'; // BUMPED VERSION
const API_CACHE_NAME = 'quicklocal-api-v9'; // BUMPED VERSION
const IMAGE_CACHE_NAME = 'quicklocal-images-v4';
const STATIC_CACHE_NAME = 'quicklocal-static-v10'; // BUMPED VERSION

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
  console.log('[SW] Installing v11...');
  
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
  const MAX_AGE = 2 * 60 * 1000; // 2 minutes for API calls
  
  for (const request of requests) {
    if (!shouldCacheAPIResponse(request.url)) {
      await cache.delete(request);
      continue;
    }

    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const age = now - new Date(dateHeader).getTime();
        if (age > MAX_AGE) {
          await cache.delete(request);
          console.log('[SW] Removed stale API cache:', request.url);
        }
      }
    }
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v11...');
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME, STATIC_CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clean stale API cache
      cleanupStaleAPICache()
    ]).then(() => {
      console.log('[SW] Cleanup complete');
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
  const staticExtensions = ['.css', '.js', '.json', '.xml'];
  return staticExtensions.some(ext => url.includes(ext));
}

// Never cache auth-sensitive or highly-volatile endpoints.
function shouldCacheAPIResponse(url) {
  const noCacheEndpoints = [
    '/auth/me',
    '/auth/login',
    '/auth/logout',
    '/auth/register',
    '/auth/refresh',
    '/cart',
    '/orders',
    '/notifications'
  ];
  return !noCacheEndpoints.some(endpoint => url.includes(endpoint));
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

  const acceptHeader = request.headers.get('accept') || '';
  const isDocument = request.mode === 'navigate' || request.destination === 'document' || acceptHeader.includes('text/html');
  const isApi = isAPIRequest(request.url);
  const isImage = requestUrl.pathname.match(/\.(jpe?g|png|gif|svg|webp)$/i);
  const isStatic = isStaticRequest(request.url);

  // 1. Document strategy - Network first to avoid stale pages after deploy/login
  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            try {
              const cacheCopy = networkResponse.clone();
              event.waitUntil(
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => cache.put(request, cacheCopy))
                  .catch((err) => console.warn('[SW] Document cache put skipped:', err && err.message ? err.message : err))
              );
            } catch (cloneError) {
              console.warn('[SW] Document clone skipped:', cloneError && cloneError.message ? cloneError.message : cloneError);
            }
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. API Cache Strategy - Network first with selective caching
  if (isApi) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok && shouldCacheAPIResponse(request.url)) {
              const responseToCache = networkResponse.clone();
              cache.put(request, responseToCache);
              if (Math.random() < 0.1) {
                console.log('[SW] Cached API response');
              }
            }
            return networkResponse;
          })
          .catch(async (error) => {
            console.warn('[SW] Network failed, trying cache:', requestUrl.pathname);

            // Never serve stale auth/cart/order responses.
            if (!shouldCacheAPIResponse(request.url)) {
              throw error;
            }

            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
              return cachedResponse.clone();
            }

            throw error;
          });
      })
    );
    return;
  }

  // 3. Image Cache Strategy (Cache-First, with revalidation)
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

  // 4. Static Assets Strategy (Stale-While-Revalidate)
  // Serve cache immediately for speed, but always refresh in background.
  if (isStatic) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const networkFetch = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => null);

          if (cachedResponse) {
            event.waitUntil(networkFetch);
            return cachedResponse;
          }

          return networkFetch.then((networkResponse) => {
            if (networkResponse) {
              return networkResponse;
            }
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          });
        });
      })
    );
    return;
  }

  // 5. Default: Network-First (For dynamic/unlisted requests)
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

// Messaging event for version control and cache management (FIXED)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  const replyPort = event.ports && event.ports[0] ? event.ports[0] : null;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'GET_VERSION') {
    if (replyPort) {
      replyPort.postMessage({ version: CACHE_NAME });
    } else {
      // Fallback: broadcast to all clients
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_VERSION', version: CACHE_NAME });
        });
      });
    }
  }

  // Force cache clear command - work even without MessageChannel
  if (data.type === 'CLEAR_API_CACHE') {
    const clearPromise = (async () => {
      const cache = await caches.open(API_CACHE_NAME);
      const requests = await cache.keys();
      for (const request of requests) {
        await cache.delete(request);
      }
      console.log('[SW] API cache cleared via message');
    })();

    event.waitUntil(
      clearPromise.then(() =>
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'API_CACHE_CLEARED', timestamp: Date.now() });
          });
        })
      )
    );

    if (replyPort) {
      replyPort.postMessage({ success: true });
    }
  }

  // Offline data storage (disabled here - SW cannot use localStorage)
  if (data.type === 'STORE_OFFLINE_DATA') {
    if (replyPort) {
      replyPort.postMessage({
        success: false,
        error: 'Offline storage not implemented in service worker (no localStorage).'
      });
    }
  }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic background sync', event.tag);

  if (event.tag === 'update-order-status') {
    event.waitUntil(updateOrderStatusInBackground());
  }
  
  // Clean stale cache periodically
  if (event.tag === 'clean-cache') {
    event.waitUntil(cleanupStaleAPICache());
  }
});

// Update order status in background
async function updateOrderStatusInBackground() {
  try {
    const response = await fetch('/api/v1/orders/active-status');
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

console.log('[SW] Service Worker v11 loaded');
