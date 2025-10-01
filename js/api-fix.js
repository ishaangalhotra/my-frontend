// QUICK API FIX - Load this before other scripts to fix API issues
console.log('🔧 Loading API Fix Script...');

// Wait for APP_CONFIG to be available
function waitForConfig(callback) {
    if (window.APP_CONFIG) {
        callback();
    } else {
        setTimeout(() => waitForConfig(callback), 50);
    }
}

waitForConfig(() => {
    // Fix 1: Clean up API Base URL to avoid duplication
    if (window.APP_CONFIG.API_BASE_URL.includes('/api/v1')) {
        window.APP_CONFIG.API_BASE_URL_CLEAN = window.APP_CONFIG.API_BASE_URL;
        window.APP_CONFIG.API_BASE_URL_BASE = window.APP_CONFIG.API_BASE_URL.replace('/api/v1', '');
    }
    
    console.log('🌐 API URLs configured:', {
        full: window.APP_CONFIG.API_BASE_URL,
        base: window.APP_CONFIG.API_BASE_URL_BASE
    });
    
    // Fix 2: Override enhanced API to handle auth better
    if (window.enhancedAPI) {
        const originalRequest = window.enhancedAPI.request;
        window.enhancedAPI.request = async function(endpoint, options = {}) {
            console.log('🔧 API Fix - Processing request:', endpoint);
            
            // Handle auth token issues
            try {
                const isPublicEndpoint = ['/products', '/categories', '/health'].some(ep => endpoint.includes(ep));
                
                if (isPublicEndpoint) {
                    console.log('📂 Public endpoint, removing auth headers');
                    // Remove auth headers for public endpoints
                    if (options.headers && options.headers.Authorization) {
                        delete options.headers.Authorization;
                    }
                }
                
                return await originalRequest.call(this, endpoint, options);
            } catch (error) {
                if (error.message.includes('No authentication token')) {
                    console.log('🔑 Token error on public endpoint, retrying without auth');
                    // Retry without auth for public endpoints
                    const newOptions = {...options};
                    if (newOptions.headers && newOptions.headers.Authorization) {
                        delete newOptions.headers.Authorization;
                    }
                    return await originalRequest.call(this, endpoint, newOptions);
                }
                throw error;
            }
        };
    }
    
    // Fix 3: Override marketplace API if needed
    if (window.enhancedLoadProducts) {
        const originalLoadProducts = window.enhancedLoadProducts;
        window.enhancedLoadProducts = async function() {
            console.log('🛠️ API Fix - Enhanced load products called');
            
            try {
                // Try the fixed version first
                return await originalLoadProducts.call(this);
            } catch (error) {
                console.warn('Enhanced load products failed, trying fallback');
                
                // Fallback to direct fetch without auth for products
                try {
                    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/products`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ Fallback fetch successful');
                        
                        // Process the data similar to enhanced load products
                        let products = [];
                        if (data.success && data.data && data.data.products) {
                            products = data.data.products;
                        } else if (data.success && data.data) {
                            products = Array.isArray(data.data) ? data.data : [];
                        } else if (Array.isArray(data)) {
                            products = data;
                        }
                        
                        // Update app state if it exists
                        if (window.appState) {
                            window.appState.products = products;
                            window.appState.allProducts = [...products];
                            window.appState.filteredProducts = [...products];
                            
                            if (typeof window.renderAll === 'function') {
                                window.renderAll();
                            }
                        }
                        
                        return { success: true, data: products };
                    }
                } catch (fallbackError) {
                    console.error('All attempts failed:', fallbackError);
                }
                
                throw error;
            }
        };
    }
    
    console.log('✅ API Fix Script loaded successfully');
});

// Fix 4: Handle hybrid auth client token expiration gracefully
window.addEventListener('DOMContentLoaded', () => {
    // Override auth check to be more lenient for public content
    if (window.auth && window.auth.isLoggedIn) {
        const originalIsLoggedIn = window.auth.isLoggedIn;
        window.auth.isLoggedIn = function() {
            try {
                return originalIsLoggedIn.call(this);
            } catch (error) {
                console.warn('Auth check failed, assuming not logged in');
                return false;
            }
        };
    }
});
