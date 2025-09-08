/**
 * Enhanced QuickLocal Marketplace Configuration
 * This file contains all configuration settings for the frontend marketplace
 */

(function(window) {
    'use strict';
    
    // Create global QuickLocal namespace
    window.QuickLocal = window.QuickLocal || {};
    
    // API Configuration
    window.QuickLocal.API = {
        // Auto-detect API base URL based on environment
        getBaseUrl: function() {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = window.location.port;
            
            // Development environment detection
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                // Backend typically runs on port 10000 in development
                const backendPort = window.location.port === '3000' ? '10000' : '10000';
                return `${protocol}//${hostname}:${backendPort}/api/v1`;
            } else {
                // Production: Use same host
                return `${protocol}//${hostname}${port ? ':' + port : ''}/api/v1`;
            }
        },
        
        // API Endpoints
        endpoints: {
            // Product endpoints
            products: '/products',
            productDetails: '/products/:id',
            productSearch: '/products/search',
            productSuggestions: '/products/suggestions',
            categories: '/categories',
            
            // User endpoints
            auth: '/auth',
            login: '/auth/login',
            register: '/auth/register',
            profile: '/auth/me',
            logout: '/auth/logout',
            
            // Cart & Orders
            cart: '/cart',
            addToCart: '/cart/add',
            removeFromCart: '/cart/remove',
            updateCart: '/cart/update',
            orders: '/orders',
            createOrder: '/orders',
            
            // Wishlist
            wishlist: '/wishlist',
            addToWishlist: '/wishlist/add',
            removeFromWishlist: '/wishlist/remove',
            
            // Reviews
            reviews: '/reviews',
            addReview: '/reviews',
            
            // Seller
            seller: '/seller',
            sellerProducts: '/seller/products',
            sellerDashboard: '/seller/dashboard'
        },
        
        // Request configuration
        defaultHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        
        // Timeout settings
        timeout: 10000, // 10 seconds
        
        // Retry configuration
        retryAttempts: 3,
        retryDelay: 1000 // 1 second
    };
    
    // UI Configuration
    window.QuickLocal.UI = {
        // Animation settings
        animations: {
            duration: 800,
            easing: 'ease-out-cubic',
            once: true
        },
        
        // Pagination settings
        pagination: {
            productsPerPage: 24,
            maxVisiblePages: 7
        },
        
        // Search settings
        search: {
            debounceDelay: 300,
            minSearchLength: 2,
            maxSuggestions: 8
        },
        
        // Toast notifications
        toast: {
            duration: 4000,
            position: 'top-right'
        },
        
        // Modal settings
        modal: {
            closeOnBackdrop: true,
            closeOnEscape: true
        },
        
        // Theme settings
        theme: {
            primaryColor: '#2874f0',
            secondaryColor: '#ff9f00',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
        }
    };
    
    // Application State Management
    window.QuickLocal.State = {
        // Default state structure
        getDefaultState: function() {
            return {
                products: [],
                filteredProducts: [],
                currentPage: 1,
                productsPerPage: window.QuickLocal.UI.pagination.productsPerPage,
                totalProducts: 0,
                loading: false,
                filters: {
                    search: '',
                    category: '',
                    priceRange: { min: 0, max: Infinity },
                    brands: new Set(),
                    rating: 0,
                    discount: 0
                },
                sortBy: 'relevance',
                viewMode: 'grid',
                cart: this.getLocalStorageData('quicklocal_cart', []),
                wishlist: this.getLocalStorageData('quicklocal_wishlist', []),
                user: this.getLocalStorageData('quicklocal_user', null)
            };
        },
        
        // Local storage helpers
        getLocalStorageData: function(key, defaultValue) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },
        
        setLocalStorageData: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error writing to localStorage:', error);
                return false;
            }
        },
        
        removeLocalStorageData: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        }
    };
    
    // Utility Functions
    window.QuickLocal.Utils = {
        // Debounce function
        debounce: function(func, wait, immediate) {
            let timeout;
            return function executedFunction() {
                const context = this;
                const args = arguments;
                
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                
                if (callNow) func.apply(context, args);
            };
        },
        
        // Format currency
        formatCurrency: function(amount, currency = 'INR') {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        },
        
        // Format number
        formatNumber: function(number) {
            return new Intl.NumberFormat('en-IN').format(number);
        },
        
        // Generate unique ID
        generateId: function() {
            return 'ql_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        // Validate email
        validateEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        // Validate phone number (Indian)
        validatePhone: function(phone) {
            const phoneRegex = /^[6-9]\d{9}$/;
            return phoneRegex.test(phone);
        },
        
        // Get placeholder image
        getPlaceholderImage: function(text = 'QuickLocal', width = 240, height = 240) {
            return `https://via.placeholder.com/${width}x${height}/f1f3f6/999?text=${encodeURIComponent(text)}`;
        },
        
        // Calculate discount percentage
        calculateDiscount: function(originalPrice, currentPrice) {
            if (originalPrice <= currentPrice) return 0;
            return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        },
        
        // Scroll to top
        scrollToTop: function(smooth = true) {
            window.scrollTo({
                top: 0,
                behavior: smooth ? 'smooth' : 'auto'
            });
        },
        
        // Copy to clipboard
        copyToClipboard: function(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'absolute';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return Promise.resolve();
            }
        }
    };
    
    // Event Management
    window.QuickLocal.Events = {
        listeners: {},
        
        // Add event listener
        on: function(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
        },
        
        // Remove event listener
        off: function(event, callback) {
            if (!this.listeners[event]) return;
            
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        },
        
        // Trigger event
        trigger: function(event, data) {
            if (!this.listeners[event]) return;
            
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event callback error:', error);
                }
            });
        }
    };
    
    // Performance Monitoring
    window.QuickLocal.Performance = {
        marks: {},
        
        // Start timing
        mark: function(name) {
            this.marks[name] = performance.now();
        },
        
        // End timing and log
        measure: function(name, log = true) {
            if (!this.marks[name]) return null;
            
            const duration = performance.now() - this.marks[name];
            
            if (log) {
                console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
            }
            
            delete this.marks[name];
            return duration;
        }
    };
    
    // Initialize configuration
    window.QuickLocal.init = function() {
        console.log('🚀 QuickLocal Configuration Loaded');
        console.log('📍 API Base URL:', window.QuickLocal.API.getBaseUrl());
        
        // Set up global error handling
        window.addEventListener('error', function(e) {
            console.error('Global error:', e.error);
        });
        
        // Set up unhandled promise rejection handling
        window.addEventListener('unhandledrejection', function(e) {
            console.error('Unhandled promise rejection:', e.reason);
        });
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.QuickLocal.init);
    } else {
        window.QuickLocal.init();
    }
    
})(window);
