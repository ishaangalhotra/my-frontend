// cache-buster.js
// Add this new file to your project root and include it in marketplace.html
// Add: <script src="cache-buster.js"></script> BEFORE other scripts

(function() {
    console.log('[CacheBuster] 🧹 Initializing cache management...');

    // Clear old API caches on page load
    async function clearStaleAPICaches() {
        if (!('caches' in window)) {
            console.log('[CacheBuster] ⚠️ Cache API not supported');
            return;
        }

        try {
            const cacheNames = await caches.keys();
            console.log('[CacheBuster] 📦 Found caches:', cacheNames);

            for (const cacheName of cacheNames) {
                if (cacheName.includes('api') || cacheName.includes('quicklocal-api')) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();
                    
                    let deletedCount = 0;
                    for (const request of requests) {
                        if (request.url.includes('/products') || 
                            request.url.includes('/categories') ||
                            request.url.includes('/api/v1')) {
                            await cache.delete(request);
                            deletedCount++;
                        }
                    }
                    
                    if (deletedCount > 0) {
                        console.log(`[CacheBuster] ✅ Cleared ${deletedCount} API cache entries from ${cacheName}`);
                    }
                }
            }
        } catch (error) {
            console.warn('[CacheBuster] ⚠️ Failed to clear caches:', error);
        }
    }

    // Force service worker update
    async function updateServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('[CacheBuster] ⚠️ Service Worker not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                console.log('[CacheBuster] 🔄 Updating service worker...');
                await registration.update();
                console.log('[CacheBuster] ✅ Service worker updated');
            }
        } catch (error) {
            console.warn('[CacheBuster] ⚠️ Failed to update SW:', error);
        }
    }

    // Add cache-busting parameter to fetch requests
    window.addCacheBuster = function(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_t=${Date.now()}&_v=${Math.random().toString(36).substring(7)}`;
    };

    // Clear all caches (emergency function)
    window.clearAllCaches = async function() {
        console.log('[CacheBuster] 🗑️ Clearing ALL caches...');
        
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('[CacheBuster] ✅ All caches cleared:', cacheNames.length);
            
            // Unregister service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
            console.log('[CacheBuster] ✅ Service workers unregistered:', registrations.length);
            
            alert('All caches cleared! Page will reload.');
            location.reload(true);
        } catch (error) {
            console.error('[CacheBuster] ❌ Failed to clear all caches:', error);
        }
    };

    // Clear only API caches
    window.clearAPICaches = async function() {
        console.log('[CacheBuster] 🗑️ Clearing API caches only...');
        await clearStaleAPICaches();
        alert('API caches cleared! Page will reload.');
        location.reload();
    };

    // Check cache status
    window.checkCacheStatus = async function() {
        if (!('caches' in window)) {
            console.log('Cache API not supported');
            return;
        }

        const cacheNames = await caches.keys();
        console.log('📦 Cache Status:');
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            console.log(`  - ${cacheName}: ${requests.length} items`);
            
            // Show API cache details
            if (cacheName.includes('api')) {
                requests.forEach(req => {
                    console.log(`    • ${req.url}`);
                });
            }
        }
    };

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            clearStaleAPICaches();
            updateServiceWorker();
        });
    } else {
        clearStaleAPICaches();
        updateServiceWorker();
    }

    // Periodic cache cleanup (every 5 minutes)
    setInterval(() => {
        console.log('[CacheBuster] 🔄 Periodic cache cleanup...');
        clearStaleAPICaches();
    }, 5 * 60 * 1000);

    console.log('[CacheBuster] ✅ Cache buster ready!');
    console.log('[CacheBuster] 📝 Available commands:');
    console.log('   window.clearAllCaches() - Nuclear option');
    console.log('   window.clearAPICaches() - Clear API caches only');
    console.log('   window.checkCacheStatus() - View cache status');
})();