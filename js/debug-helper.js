/**
 * Debug Helper for QuickLocal Marketplace
 * Provides debugging utilities and diagnostics
 */

window.QLDebug = {
    // Check system status
    checkStatus() {
        console.group('🔍 QuickLocal Debug Status');
        
        // Check if key objects exist
        console.log('AppState:', window.appState ? '✅ Available' : '❌ Missing');
        console.log('Products:', window.appState?.products?.length || 0, 'loaded');
        console.log('Enhanced Interactions:', window.enhancedInteractions ? '✅ Available' : '❌ Missing');
        console.log('Mobile Interactions:', window.mobileInteractions ? '✅ Available' : '❌ Missing');
        console.log('Personalization Engine:', window.personalizationEngine ? '✅ Available' : '❌ Missing');
        
        // Check critical DOM elements
        const elements = {
            'Products Container': document.getElementById('products-container'),
            'Category List': document.getElementById('categoryList'),
            'Search Input': document.getElementById('search-input'),
            'Cart Count': document.getElementById('cart-count'),
            'Loading Container': document.getElementById('productsLoading')
        };
        
        console.group('DOM Elements');
        Object.entries(elements).forEach(([name, element]) => {
            console.log(`${name}:`, element ? '✅ Found' : '❌ Missing');
        });
        console.groupEnd();
        
        // Check mobile detection
        console.log('Screen Width:', window.innerWidth);
        console.log('Mobile Mode:', window.mobileInteractions?.isMobile || 'Unknown');
        console.log('Touch Support:', 'ontouchstart' in window ? '✅ Yes' : '❌ No');
        
        // Check API configuration
        console.group('API Configuration');
        console.log('Base URL:', window.appState?.apiBaseUrl || 'Not set');
        console.log('Environment:', window.APP_CONFIG?.ENVIRONMENT || 'Unknown');
        console.groupEnd();
        
        console.groupEnd();
        
        return {
            appState: !!window.appState,
            products: window.appState?.products?.length || 0,
            enhanced: !!window.enhancedInteractions,
            mobile: !!window.mobileInteractions,
            screenWidth: window.innerWidth
        };
    },
    
    // Force reload products
    async reloadProducts() {
        console.log('🔄 Force reloading products...');
        
        if (window.compatibleLoadProducts) {
            await window.compatibleLoadProducts();
        } else if (window.loadProducts) {
            await window.loadProducts();
        } else {
            console.error('No product loading function available');
        }
    },
    
    // Test product rendering
    testRender() {
        console.log('🎨 Testing product rendering...');
        
        if (!window.appState || !window.appState.products.length) {
            console.warn('No products to render');
            return;
        }
        
        const testProducts = window.appState.products.slice(0, 3);
        
        if (window.renderProductsCompatible) {
            window.renderProductsCompatible(testProducts);
        } else if (window.renderProducts) {
            window.renderProducts(testProducts);
        } else {
            console.error('No rendering function available');
        }
        
        console.log(`✅ Rendered ${testProducts.length} test products`);
    },
    
    // Show demo products
    showDemo() {
        console.log('📝 Loading demo products...');
        
        const demoProducts = [
            {
                id: 'debug_1',
                name: '🎧 Debug Headphones',
                description: 'These are test headphones for debugging purposes.',
                price: 1999,
                originalPrice: 2999,
                category: 'Debug',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=220&fit=crop',
                rating: 4.5,
                reviews: 42,
                stock: 10
            },
            {
                id: 'debug_2',
                name: '⌚ Debug Watch',
                description: 'A test smartwatch for debugging the marketplace.',
                price: 9999,
                originalPrice: 14999,
                category: 'Debug',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=220&fit=crop',
                rating: 4.2,
                reviews: 73,
                stock: 5
            },
            {
                id: 'debug_3',
                name: '👟 Debug Shoes',
                description: 'Testing running shoes for marketplace debugging.',
                price: 3999,
                originalPrice: 5999,
                category: 'Debug',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=220&fit=crop',
                rating: 4.8,
                reviews: 156,
                stock: 20
            }
        ];
        
        if (window.appState) {
            window.appState.products = demoProducts;
            window.appState.allProducts = demoProducts;
            window.appState.filteredProducts = demoProducts;
            
            if (window.renderProductsCompatible) {
                window.renderProductsCompatible();
                console.log('✅ Demo products rendered');
            }
        } else {
            console.error('AppState not available');
        }
    },
    
    // Clear all data
    clearData() {
        console.log('🗑️ Clearing all data...');
        
        if (window.appState) {
            window.appState.products = [];
            window.appState.allProducts = [];
            window.appState.filteredProducts = [];
            window.appState.categories = new Set();
        }
        
        // Clear containers
        const container = document.getElementById('products-container');
        if (container) {
            container.innerHTML = '<div class="empty-state"><h3>Data cleared</h3><p>Use QLDebug.showDemo() to load test products.</p></div>';
        }
        
        console.log('✅ Data cleared');
    },
    
    // Test enhancements
    testEnhancements() {
        console.group('🧪 Testing Enhancements');
        
        // Test enhanced interactions
        if (window.enhancedInteractions) {
            console.log('Enhanced Interactions:', '✅ Available');
            console.log('Wishlist items:', window.enhancedInteractions.getUserData().wishlist.length);
            console.log('Recently viewed:', window.enhancedInteractions.getUserData().recentlyViewed.length);
        } else {
            console.log('Enhanced Interactions:', '❌ Not available');
        }
        
        // Test mobile interactions
        if (window.mobileInteractions) {
            console.log('Mobile Interactions:', '✅ Available');
            console.log('Device Info:', window.mobileInteractions.getDeviceInfo());
        } else {
            console.log('Mobile Interactions:', '❌ Not available');
        }
        
        // Test personalization
        if (window.personalizationEngine) {
            console.log('Personalization Engine:', '✅ Available');
            console.log('User Profile:', window.personalizationEngine.getPersonalizationData());
        } else {
            console.log('Personalization Engine:', '❌ Not available');
        }
        
        console.groupEnd();
    },
    
    // Monitor events
    startEventMonitor() {
        console.log('👂 Starting event monitor...');
        
        let eventCount = 0;
        const events = ['click', 'scroll', 'resize', 'load'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, () => {
                eventCount++;
                if (eventCount % 10 === 0) {
                    console.log(`📊 Events captured: ${eventCount}`);
                }
            });
        });
        
        console.log('✅ Event monitor started');
    },
    
    // Performance check
    checkPerformance() {
        console.group('⚡ Performance Check');
        
        // Check load times
        if (performance.timing) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log('Page Load Time:', loadTime + 'ms');
            
            const domReady = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
            console.log('DOM Ready Time:', domReady + 'ms');
        }
        
        // Check memory usage (if available)
        if (performance.memory) {
            const memory = performance.memory;
            console.log('Memory Used:', Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB');
            console.log('Memory Limit:', Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB');
        }
        
        // Check CSS and JS files loaded
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length;
        const scripts = document.querySelectorAll('script[src]').length;
        console.log('Stylesheets loaded:', stylesheets);
        console.log('Scripts loaded:', scripts);
        
        console.groupEnd();
    },
    
    // Quick fixes
    quickFix() {
        console.log('🔧 Applying quick fixes...');
        
        // Force show products container
        const container = document.getElementById('products-container');
        if (container) {
            container.style.display = 'grid';
            container.style.minHeight = '200px';
        }
        
        // Hide loading state
        const loading = document.getElementById('productsLoading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Ensure app state exists
        if (!window.appState) {
            window.appState = {
                products: [],
                filteredProducts: [],
                categories: new Set(),
                cart: [],
                apiBaseUrl: 'https://quicklocal-backend.onrender.com/api/v1',
                isLoading: false,
                pagination: {
                    currentPage: 1,
                    itemsPerPage: 20,
                    totalItems: 0,
                    totalPages: 0
                }
            };
        }
        
        console.log('✅ Quick fixes applied');
    },
    
    // Help menu
    help() {
        console.group('📖 QuickLocal Debug Help');
        console.log('Available commands:');
        console.log('QLDebug.checkStatus() - Check system status');
        console.log('QLDebug.reloadProducts() - Force reload products');
        console.log('QLDebug.showDemo() - Load demo products');
        console.log('QLDebug.testRender() - Test product rendering');
        console.log('QLDebug.testEnhancements() - Test enhancement modules');
        console.log('QLDebug.clearData() - Clear all product data');
        console.log('QLDebug.quickFix() - Apply common fixes');
        console.log('QLDebug.checkPerformance() - Check performance metrics');
        console.log('QLDebug.startEventMonitor() - Monitor page events');
        console.groupEnd();
    }
};

// Auto-run basic status check on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🚀 QuickLocal Debug Helper loaded');
        console.log('Type QLDebug.help() for available commands');
        
        // Auto-check if products are missing
        if (!window.appState?.products?.length) {
            console.warn('⚠️ No products detected. Use QLDebug.showDemo() to load test products.');
        }
    }, 2000);
});

// Make it globally available
window.QLDebug = QLDebug;
