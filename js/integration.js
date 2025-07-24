// ============================================================================
// COMPLETE FRONTEND-BACKEND INTEGRATION
// ============================================================================

// 🚀 STEP 1: Enhanced API Configuration
const API_CONFIG = {
    baseURL: 'https://ecommerce-backend-8ykq.onrender.com/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    
    // Authentication endpoints
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        verify: '/auth/verify-email',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password'
    },
    
    // User endpoints
    user: {
        profile: '/user/profile',
        updateProfile: '/user/profile',
        addresses: '/user/addresses',
        orders: '/user/orders',
        wishlist: '/user/wishlist'
    },
    
    // Product endpoints
    products: {
        list: '/products',
        details: '/products/:id',
        search: '/products/search',
        categories: '/products/categories',
        reviews: '/products/:id/reviews'
    },
    
    // Order endpoints
    orders: {
        create: '/orders',
        list: '/orders',
        details: '/orders/:id',
        cancel: '/orders/:id/cancel',
        track: '/orders/:id/track'
    },
    
    // Payment endpoints
    payments: {
        createRazorpayOrder: '/payment/razorpay/create-order',
        verifyRazorpay: '/payment/razorpay/verify',
        createStripeIntent: '/payment/stripe/create-intent',
        confirmStripe: '/payment/stripe/confirm',
        refundRazorpay: '/payment/refund/razorpay',
        refundStripe: '/payment/refund/stripe',
        status: '/payment/status/:orderId',
        analytics: '/payment/analytics'
    },
    
    // Admin endpoints
    admin: {
        dashboard: '/admin/dashboard',
        orders: '/admin/orders',
        products: '/admin/products',
        users: '/admin/users',
        payments: '/admin/payments',
        analytics: '/admin/analytics',
        sellers: '/admin/sellers'
    },
    
    // Seller endpoints
    seller: {
        dashboard: '/seller/dashboard',
        products: '/seller/products',
        orders: '/seller/orders',
        analytics: '/seller/analytics',
        profile: '/seller/profile'
    },
    
    // Cart endpoints
    cart: {
        get: '/cart',
        add: '/cart/add',
        update: '/cart/update',
        remove: '/cart/remove',
        clear: '/cart/clear'
    }
};

// 🚀 STEP 2: Enhanced API Client with Error Handling
class QuickLocalAPIClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
        this.timeout = API_CONFIG.timeout;
        this.retryAttempts = API_CONFIG.retryAttempts;
        this.retryDelay = API_CONFIG.retryDelay;
        
        // Request interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        this.setupDefaultInterceptors();
    }
    
    setupDefaultInterceptors() {
        // Add auth token to requests
        this.addRequestInterceptor((config) => {
            const token = this.getAuthToken();
            if (token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
            return config;
        });
        
        // Handle token refresh on 401
        this.addResponseInterceptor(
            (response) => response,
            async (error) => {
                if (error.status === 401 && !error.config._retry) {
                    error.config._retry = true;
                    
                    try {
                        await this.refreshToken();
                        const token = this.getAuthToken();
                        error.config.headers['Authorization'] = `Bearer ${token}`;
                        return this.request(error.config);
                    } catch (refreshError) {
                        this.handleAuthError();
                        throw refreshError;
                    }
                }
                throw error;
            }
        );
    }
    
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }
    
    addResponseInterceptor(onSuccess, onError) {
        this.responseInterceptors.push({ onSuccess, onError });
    }
    
    async request(config) {
        // Apply request interceptors
        let processedConfig = { ...config };
        for (const interceptor of this.requestInterceptors) {
            processedConfig = await interceptor(processedConfig);
        }
        
        // Set default headers
        processedConfig.headers = {
            'Content-Type': 'application/json',
            ...processedConfig.headers
        };
        
        let lastError;
        
        for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                const response = await fetch(`${this.baseURL}${processedConfig.url}`, {
                    method: processedConfig.method || 'GET',
                    headers: processedConfig.headers,
                    body: processedConfig.data ? JSON.stringify(processedConfig.data) : undefined,
                    signal: controller.signal,
                    ...processedConfig.options
                });
                
                clearTimeout(timeoutId);
                
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = await response.text();
                }
                
                const result = {
                    data,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    config: processedConfig
                };
                
                if (!response.ok) {
                    const error = new Error(data.message || `HTTP ${response.status}`);
                    error.response = result;
                    error.status = response.status;
                    error.config = processedConfig;
                    throw error;
                }
                
                // Apply response interceptors
                let processedResult = result;
                for (const interceptor of this.responseInterceptors) {
                    if (interceptor.onSuccess) {
                        processedResult = await interceptor.onSuccess(processedResult);
                    }
                }
                
                return processedResult;
                
            } catch (error) {
                lastError = error;
                
                // Apply error interceptors
                for (const interceptor of this.responseInterceptors) {
                    if (interceptor.onError) {
                        try {
                            return await interceptor.onError(error);
                        } catch (interceptorError) {
                            lastError = interceptorError;
                        }
                    }
                }
                
                // Don't retry on client errors (4xx) except 401
                if (error.status >= 400 && error.status < 500 && error.status !== 401) {
                    break;
                }
                
                // Don't retry on the last attempt
                if (attempt === this.retryAttempts) {
                    break;
                }
                
                // Wait before retrying
                await this.delay(this.retryDelay * Math.pow(2, attempt));
            }
        }
        
        throw lastError;
    }
    
    // HTTP methods
    async get(url, config = {}) {
        return this.request({ ...config, method: 'GET', url });
    }
    
    async post(url, data = null, config = {}) {
        return this.request({ ...config, method: 'POST', url, data });
    }
    
    async put(url, data = null, config = {}) {
        return this.request({ ...config, method: 'PUT', url, data });
    }
    
    async delete(url, config = {}) {
        return this.request({ ...config, method: 'DELETE', url });
    }
    
    async patch(url, data = null, config = {}) {
        return this.request({ ...config, method: 'PATCH', url, data });
    }
    
    // Utility methods
    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }
    
    setAuthToken(token, remember = false) {
        if (remember) {
            localStorage.setItem('authToken', token);
            sessionStorage.removeItem('authToken');
        } else {
            sessionStorage.setItem('authToken', token);
            localStorage.removeItem('authToken');
        }
    }
    
    removeAuthToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    }
    
    async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const response = await fetch(`${this.baseURL}${API_CONFIG.auth.refresh}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed');
        }
        
        const data = await response.json();
        this.setAuthToken(data.token, true);
        
        return data;
    }
    
    handleAuthError() {
        this.removeAuthToken();
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // URL parameter replacement
    replaceUrlParams(url, params) {
        let processedUrl = url;
        for (const [key, value] of Object.entries(params)) {
            processedUrl = processedUrl.replace(`:${key}`, value);
        }
        return processedUrl;
    }
}

// 🚀 STEP 3: Service Layer - Authentication
class AuthService {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    async login(credentials) {
        try {
            const response = await this.api.post(API_CONFIG.auth.login, credentials);
            
            if (response.data.success) {
                this.api.setAuthToken(response.data.token, credentials.rememberMe);
                
                if (response.data.refreshToken) {
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                }
                
                if (response.data.user) {
                    localStorage.setItem('userData', JSON.stringify(response.data.user));
                }
                
                return {
                    success: true,
                    user: response.data.user,
                    token: response.data.token,
                    message: 'Login successful'
                };
            }
            
            return response.data;
            
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    }
    
    async register(userData) {
        try {
            const response = await this.api.post(API_CONFIG.auth.register, userData);
            
            if (response.data.success && response.data.token) {
                this.api.setAuthToken(response.data.token);
                
                if (response.data.user) {
                    localStorage.setItem('userData', JSON.stringify(response.data.user));
                }
            }
            
            return response.data;
            
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.message || 'Registration failed'
            };
        }
    }
    
    async logout() {
        try {
            await this.api.post(API_CONFIG.auth.logout);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.api.removeAuthToken();
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
        }
    }
    
    async forgotPassword(email) {
        try {
            const response = await this.api.post(API_CONFIG.auth.forgotPassword, { email });
            return response.data;
        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                message: error.message || 'Failed to send reset email'
            };
        }
    }
    
    async resetPassword(token, newPassword) {
        try {
            const response = await this.api.post(API_CONFIG.auth.resetPassword, { 
                token, 
                password: newPassword 
            });
            return response.data;
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: error.message || 'Password reset failed'
            };
        }
    }
    
    isAuthenticated() {
        return !!this.api.getAuthToken();
    }
    
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
}

// 🚀 STEP 4: Service Layer - Products
class ProductService {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    async getProducts(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_CONFIG.products.list}${queryString ? `?${queryString}` : ''}`;
            
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Get products error:', error);
            return {
                success: false,
                message: error.message || 'Failed to load products'
            };
        }
    }
    
    async getProduct(productId) {
        try {
            const url = this.api.replaceUrlParams(API_CONFIG.products.details, { id: productId });
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Get product error:', error);
            return {
                success: false,
                message: error.message || 'Failed to load product'
            };
        }
    }
    
    async searchProducts(query, filters = {}) {
        try {
            const params = { q: query, ...filters };
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_CONFIG.products.search}?${queryString}`;
            
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Search products error:', error);
            return {
                success: false,
                message: error.message || 'Search failed'
            };
        }
    }
    
    async getCategories() {
        try {
            const response = await this.api.get(API_CONFIG.products.categories);
            return response.data;
        } catch (error) {
            console.error('Get categories error:', error);
            return {
                success: false,
                message: error.message || 'Failed to load categories'
            };
        }
    }
    
    async getProductReviews(productId) {
        try {
            const url = this.api.replaceUrlParams(API_CONFIG.products.reviews, { id: productId });
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Get reviews error:', error);
            return {
                success: false,
                message: error.message || 'Failed to load reviews'
            };
        }
    }
}

// 🚀 STEP 5: Service Layer - Orders
class OrderService {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    async createOrder(orderData) {
        try {
            const response = await this.api.post(API_CONFIG.orders.create, orderData);
            return response.data;
        } catch (error) {
            console.error('Create order error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create order'
            };
        }
    }
    
    async getOrders(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_CONFIG.orders.list}${queryString ? `?${queryString}` : ''}`;
            
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Get orders error:', error);
            return {
                success: false,
                message: error.message || 'Failed to load orders'
            };
        }
    }
    
    async getOrder(orderId) {
        try {
            const url = this.api.replaceUrlParams(API_CONFIG.orders.details, { id: orderId });
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Get order error:', error);
            return {
                success: false,
                message: error.message || 'Failed to load order'
            };
        }
    }
    
    async cancelOrder(orderId, reason) {
        try {
            const url = this.api.replaceUrlParams(API_CONFIG.orders.cancel, { id: orderId });
            const response = await this.api.post(url, { reason });
            return response.data;
        } catch (error) {
            console.error('Cancel order error:', error);
            return {
                success: false,
                message: error.message || 'Failed to cancel order'
            };
        }
    }
    
    async trackOrder(orderId) {
        try {
            const url = this.api.replaceUrlParams(API_CONFIG.orders.track, { id: orderId });
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Track order error:', error);
            return {
                success: false,
                message: error.message || 'Failed to track order'
            };
        }
    }
}

// 🚀 STEP 6: Service Layer - Payments
class PaymentService {
    constructor(apiClient) {
        this.api = apiClient;
    }
    
    async createRazorpayOrder(orderData) {
        try {
            const response = await this.api.post(API_CONFIG.payments.createRazorpayOrder, orderData);
            return response.data;
        } catch (error) {
            console.error('Create Razorpay order error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create payment order'
            };
        }
    }
    
    async verifyRazorpayPayment(paymentData) {
        try {
            const response = await this.api.post(API_CONFIG.payments.verifyRazorpay, paymentData);
            return response.data;
        } catch (error) {
            console.error('Verify Razorpay payment error:', error);
            return {
                success: false,
                message: error.message || 'Payment verification failed'
            };
        }
    }
    
    async createStripeIntent(orderData) {
        try {
            const response = await this.api.post(API_CONFIG.payments.createStripeIntent, orderData);
            return response.data;
        } catch (error) {
            console.error('Create Stripe intent error:', error);
            return {
                success: false,
                message: error.message || 'Failed to create payment intent'
            };
        }
    }
    
    async confirmStripePayment(paymentIntentId, orderId) {
        try {
            const response = await this.api.post(API_CONFIG.payments.confirmStripe, {
                paymentIntentId,
                orderId
            });
            return response.data;
        } catch (error) {
            console.error('Confirm Stripe payment error:', error);
            return {
                success: false,
                message: error.message || 'Payment confirmation failed'
            };
        }
    }
    
    async getPaymentStatus(orderId) {
        try {
            const url = this.api.replaceUrlParams(API_CONFIG.payments.status, { orderId });
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Get payment status error:', error);
            return {
                success: false,
                message: error.message || 'Failed to get payment status'
            };
        }
    }
    
    async getPaymentAnalytics(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_CONFIG.payments.analytics}${queryString ? `?${queryString}` : ''}`;
            
            const response = await this.api.get(url);
            return response.data;
        } catch (error) {
            console.error('Get payment analytics error:', error);
            return {
                success: false,
                message: error.message || 'Failed to get payment analytics'
            };
        }
    }
}

// 🚀 STEP 7: Service Layer - Cart
class CartService {
    constructor(apiClient) {
        this.api = apiClient;
        this.localCart = this.loadLocalCart();
    }
    
    async getCart() {
        try {
            if (this.api.getAuthToken()) {
                // Get server cart for authenticated users
                const response = await this.api.get(API_CONFIG.cart.get);
                if (response.data.success) {
                    return response.data;
                }
            }
            
            // Return local cart for non-authenticated users
            return {
                success: true,
                data: this.localCart
            };
        } catch (error) {
            console.error('Get cart error:', error);
            return {
                success: true,
                data: this.localCart
            };
        }
    }
    
    async addToCart(productId, quantity = 1, options = {}) {
        try {
            const itemData = { productId, quantity, ...options };
            
            if (this.api.getAuthToken()) {
                // Add to server cart for authenticated users
                const response = await this.api.post(API_CONFIG.cart.add, itemData);
                return response.data;
            }
            
            // Add to local cart for non-authenticated users
            this.addToLocalCart(itemData);
            return {
                success: true,
                message: 'Item added to cart'
            };
        } catch (error) {
            console.error('Add to cart error:', error);
            
            // Fallback to local cart
            this.addToLocalCart({ productId, quantity, ...options });
            return {
                success: true,
                message: 'Item added to cart (offline)'
            };
        }
    }
    
    async updateCartItem(itemId, quantity) {
        try {
            if (this.api.getAuthToken()) {
                const response = await this.api.put(API_CONFIG.cart.update, { itemId, quantity });
                return response.data;
            }
            
            this.updateLocalCartItem(itemId, quantity);
            return {
                success: true,
                message: 'Cart updated'
            };
        } catch (error) {
            console.error('Update cart error:', error);
            this.updateLocalCartItem(itemId, quantity);
            return {
                success: true,
                message: 'Cart updated (offline)'
            };
        }
    }
    
    async removeFromCart(itemId) {
        try {
            if (this.api.getAuthToken()) {
                const response = await this.api.delete(`${API_CONFIG.cart.remove}/${itemId}`);
                return response.data;
            }
            
            this.removeFromLocalCart(itemId);
            return {
                success: true,
                message: 'Item removed from cart'
            };
        } catch (error) {
            console.error('Remove from cart error:', error);
            this.removeFromLocalCart(itemId);
            return {
                success: true,
                message: 'Item removed from cart (offline)'
            };
        }
    }
    
    async clearCart() {
        try {
            if (this.api.getAuthToken()) {
                const response = await this.api.delete(API_CONFIG.cart.clear);
                if (response.data.success) {
                    this.localCart = [];
                    this.saveLocalCart();
                }
                return response.data;
            }
            
            this.localCart = [];
            this.saveLocalCart();
            return {
                success: true,
                message: 'Cart cleared'
            };
        } catch (error) {
            console.error('Clear cart error:', error);
            this.localCart = [];
            this.saveLocalCart();
            return {
                success: true,
                message: 'Cart cleared (offline)'
            };
        }
    }
    
    // Local cart methods
    loadLocalCart() {
        try {
            const cart = localStorage.getItem('cart');
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error loading local cart:', error);
            return [];
        }
    }
    
    saveLocalCart() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.localCart));
        } catch (error) {
            console.error('Error saving local cart:', error);
        }
    }
    
    addToLocalCart(item) {
        const existingItem = this.localCart.find(cartItem => cartItem.productId === item.productId);
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.localCart.push({
                id: Date.now().toString(),
                ...item,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveLocalCart();
    }
    
    updateLocalCartItem(itemId, quantity) {
        const item = this.localCart.find(cartItem => cartItem.id === itemId);
        if (item) {
            item.quantity = quantity;
            this.saveLocalCart();
        }
    }
    
    removeFromLocalCart(itemId) {
        this.localCart = this.localCart.filter(item => item.id !== itemId);
        this.saveLocalCart();
    }
    
    async syncWithServer() {
        if (!this.api.getAuthToken() || this.localCart.length === 0) {
            return;
        }
        
        try {
            // Sync local cart with server
            for (const item of this.localCart) {
                await this.api.post(API_CONFIG.cart.add, {
                    productId: item.productId,
                    quantity: item.quantity
                });
            }
            
            // Clear local cart after successful sync
            this.localCart = [];
            this.saveLocalCart();
            
        } catch (error) {
            console.error('Cart sync error:', error);
        }
    }
}

// 🚀 STEP 8: Main Integration Class
class QuickLocalIntegration {
    constructor() {
        this.apiClient = new QuickLocalAPIClient();
        this.auth = new AuthService(this.apiClient);
        this.products = new ProductService(this.apiClient);
        this.orders = new OrderService(this.apiClient);
        this.payments = new PaymentService(this.apiClient);
        this.cart = new CartService(this.apiClient);
        
        this.init();
    }
    
    init() {
        // Set up global error handling
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // Set up authentication state management
        this.setupAuthStateManagement();
        
        // Sync cart on login
        this.setupCartSync();
        
        console.log('🚀 QuickLocal Frontend-Backend Integration initialized');
    }
    
    handleUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Show user-friendly error message
        this.showErrorNotification('Something went wrong. Please try again.');
        
        // Prevent the default unhandled rejection behavior
        event.preventDefault();
    }
    
    setupAuthStateManagement() {
        // Check authentication on page load
        if (this.auth.isAuthenticated()) {
            this.handleAuthenticatedState();
        }
        
        // Listen for storage changes (multi-tab support)
        window.addEventListener('storage', (event) => {
            if (event.key === 'authToken') {
                if (event.newValue) {
                    this.handleAuthenticatedState();
                } else {
                    this.handleUnauthenticatedState();
                }
            }
        });
    }
    
    setupCartSync() {
        // Sync cart when user logs in
        document.addEventListener('userLoggedIn', () => {
            this.cart.syncWithServer();
        });
    }
    
    handleAuthenticatedState() {
        // Update UI for authenticated users
        this.updateAuthenticationUI(true);
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { user: this.auth.getCurrentUser() }
        }));
    }
    
    handleUnauthenticatedState() {
        // Update UI for unauthenticated users
        this.updateAuthenticationUI(false);
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
    
    updateAuthenticationUI(isAuthenticated) {
        // Update navigation based on auth state
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const requiresAuth = element.dataset.auth === 'true';
            
            if (requiresAuth === isAuthenticated) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
        
        // Update user info
        if (isAuthenticated) {
            const user = this.auth.getCurrentUser();
            const userNameElements = document.querySelectorAll('[data-user-name]');
            userNameElements.forEach(element => {
                element.textContent = user?.name || 'User';
            });
            
            const userEmailElements = document.querySelectorAll('[data-user-email]');
            userEmailElements.forEach(element => {
                element.textContent = user?.email || '';
            });
        }
    }
    
    showErrorNotification(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            document.body.removeChild(toast);
        });
    }
    
    showSuccessNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            document.body.removeChild(toast);
        });
    }
}

// 🚀 STEP 9: Integration Helper Functions
function createIntegratedLoginForm() {
    return {
        async handleLogin(formData) {
            const loginButton = document.getElementById('loginButton');
            const originalText = loginButton.textContent;
            
            try {
                loginButton.textContent = 'Signing in...';
                loginButton.disabled = true;
                
                const result = await quickLocal.auth.login({
                    email: formData.email,
                    password: formData.password,
                    rememberMe: formData.rememberMe || false
                });
                
                if (result.success) {
                    quickLocal.showSuccessNotification('Login successful!');
                    
                    // Redirect to intended page or dashboard
                    const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'index.html';
                    localStorage.removeItem('redirectAfterLogin');
                    
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    quickLocal.showErrorNotification(result.message || 'Login failed');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                quickLocal.showErrorNotification('Login failed. Please try again.');
            } finally {
                loginButton.textContent = originalText;
                loginButton.disabled = false;
            }
        }
    };
}

function createIntegratedProductList() {
    return {
        async loadProducts(filters = {}) {
            const loadingElement = document.getElementById('productsLoading');
            const productsContainer = document.getElementById('productsContainer');
            const errorElement = document.getElementById('productsError');
            
            try {
                if (loadingElement) loadingElement.style.display = 'block';
                if (errorElement) errorElement.style.display = 'none';
                
                const result = await quickLocal.products.getProducts(filters);
                
                if (result.success) {
                    this.renderProducts(result.data, productsContainer);
                } else {
                    throw new Error(result.message);
                }
                
            } catch (error) {
                console.error('Load products error:', error);
                if (errorElement) {
                    errorElement.textContent = error.message || 'Failed to load products';
                    errorElement.style.display = 'block';
                }
            } finally {
                if (loadingElement) loadingElement.style.display = 'none';
            }
        },
        
        renderProducts(products, container) {
            if (!container) return;
            
            container.innerHTML = products.map(product => `
                <div class="product-card" data-product-id="${product._id}">
                    <div class="product-image">
                        <img src="${product.images?.[0] || 'https://via.placeholder.com/300'}" 
                             alt="${product.name}" 
                             loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-price">
                            ${product.discountedPrice ? `
                                <span class="price-discounted">₹${product.discountedPrice}</span>
                                <span class="price-original">₹${product.price}</span>
                            ` : `
                                <span class="price">₹${product.price}</span>
                            `}
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-primary add-to-cart" 
                                    onclick="addToCart('${product._id}')">
                                Add to Cart
                            </button>
                            <button class="btn btn-secondary" 
                                    onclick="viewProduct('${product._id}')">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    };
}

function createIntegratedCart() {
    return {
        async addToCart(productId, quantity = 1) {
            try {
                const result = await quickLocal.cart.addToCart(productId, quantity);
                
                if (result.success) {
                    quickLocal.showSuccessNotification('Item added to cart!');
                    this.updateCartBadge();
                } else {
                    quickLocal.showErrorNotification(result.message || 'Failed to add item to cart');
                }
                
            } catch (error) {
                console.error('Add to cart error:', error);
                quickLocal.showErrorNotification('Failed to add item to cart');
            }
        },
        
        async updateCartBadge() {
            try {
                const result = await quickLocal.cart.getCart();
                
                if (result.success) {
                    const itemCount = result.data.reduce((total, item) => total + item.quantity, 0);
                    const badge = document.querySelector('.cart-badge');
                    
                    if (badge) {
                        badge.textContent = itemCount;
                        badge.style.display = itemCount > 0 ? 'inline' : 'none';
                    }
                }
                
            } catch (error) {
                console.error('Update cart badge error:', error);
            }
        },
        
        async loadCart() {
            const cartContainer = document.getElementById('cartContainer');
            const loadingElement = document.getElementById('cartLoading');
            
            try {
                if (loadingElement) loadingElement.style.display = 'block';
                
                const result = await quickLocal.cart.getCart();
                
                if (result.success) {
                    this.renderCart(result.data, cartContainer);
                } else {
                    throw new Error(result.message);
                }
                
            } catch (error) {
                console.error('Load cart error:', error);
                if (cartContainer) {
                    cartContainer.innerHTML = '<p class="error">Failed to load cart</p>';
                }
            } finally {
                if (loadingElement) loadingElement.style.display = 'none';
            }
        },
        
        renderCart(cartItems, container) {
            if (!container) return;
            
            if (cartItems.length === 0) {
                container.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Your cart is empty</h3>
                        <p>Start shopping to add items to your cart</p>
                        <a href="products.html" class="btn btn-primary">Browse Products</a>
                    </div>
                `;
                return;
            }
            
            const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            container.innerHTML = `
                <div class="cart-items">
                    ${cartItems.map(item => `
                        <div class="cart-item" data-item-id="${item.id}">
                            <div class="item-image">
                                <img src="${item.image || 'https://via.placeholder.com/100'}" 
                                     alt="${item.name}">
                            </div>
                            <div class="item-details">
                                <h4>${item.name}</h4>
                                <p class="item-price">₹${item.price}</p>
                            </div>
                            <div class="item-quantity">
                                <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                            </div>
                            <div class="item-total">
                                ₹${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div class="item-actions">
                                <button onclick="removeFromCart('${item.id}')" class="btn-remove">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-summary">
                    <div class="cart-total">
                        <h3>Total: ₹${total.toFixed(2)}</h3>
                    </div>
                    <div class="cart-actions">
                        <button onclick="clearCart()" class="btn btn-secondary">Clear Cart</button>
                        <button onclick="proceedToCheckout()" class="btn btn-primary">Checkout</button>
                    </div>
                </div>
            `;
        }
    };
}

function createIntegratedCheckout() {
    return {
        async processCheckout(orderData) {
            const checkoutButton = document.getElementById('checkoutButton');
            const originalText = checkoutButton.textContent;
            
            try {
                checkoutButton.textContent = 'Processing...';
                checkoutButton.disabled = true;
                
                // Create order
                const orderResult = await quickLocal.orders.createOrder(orderData);
                
                if (!orderResult.success) {
                    throw new Error(orderResult.message);
                }
                
                const order = orderResult.data;
                
                // Process payment if not COD
                if (orderData.paymentMethod !== 'cod') {
                    const paymentResult = await this.processPayment(order, orderData.paymentMethod);
                    
                    if (!paymentResult.success) {
                        throw new Error(paymentResult.message);
                    }
                }
                
                // Clear cart
                await quickLocal.cart.clearCart();
                
                // Redirect to success page
                window.location.href = `order-success.html?orderId=${order._id}`;
                
            } catch (error) {
                console.error('Checkout error:', error);
                quickLocal.showErrorNotification(error.message || 'Checkout failed');
            } finally {
                checkoutButton.textContent = originalText;
                checkoutButton.disabled = false;
            }
        },
        
        async processPayment(order, paymentMethod) {
            if (paymentMethod === 'razorpay') {
                return await this.processRazorpayPayment(order);
            } else if (paymentMethod === 'stripe') {
                return await this.processStripePayment(order);
            }
            
            throw new Error('Unsupported payment method');
        },
        
        async processRazorpayPayment(order) {
            try {
                // Create Razorpay order
                const razorpayResult = await quickLocal.payments.createRazorpayOrder({
                    orderId: order._id,
                    amount: order.totalAmount,
                    customerName: order.shippingInfo.name,
                    customerEmail: order.shippingInfo.email
                });
                
                if (!razorpayResult.success) {
                    throw new Error(razorpayResult.message);
                }
                
                // Open Razorpay checkout
                const rzp = new Razorpay({
                    key: 'rzp_test_your_key_here', // Your Razorpay key
                    amount: razorpayResult.data.amount,
                    currency: razorpayResult.data.currency,
                    order_id: razorpayResult.data.orderId,
                    name: 'QuickLocal',
                    description: `Order #${order.orderNumber}`,
                    prefill: {
                        name: order.shippingInfo.name,
                        email: order.shippingInfo.email,
                        contact: order.shippingInfo.phone
                    },
                    handler: async (response) => {
                        // Verify payment
                        const verifyResult = await quickLocal.payments.verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: order._id
                        });
                        
                        return verifyResult;
                    }
                });
                
                rzp.open();
                
                return { success: true };
                
            } catch (error) {
                console.error('Razorpay payment error:', error);
                return {
                    success: false,
                    message: error.message || 'Payment failed'
                };
            }
        }
    };
}

// 🚀 STEP 10: Global Integration Instance
let quickLocal;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    quickLocal = new QuickLocalIntegration();
    window.quickLocal = quickLocal;
    
    // Initialize page-specific functionality
    initializePageSpecificFeatures();
});

function initializePageSpecificFeatures() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'login.html':
            initializeLoginPage();
            break;
        case 'register.html':
            initializeRegisterPage();
            break;
        case 'products.html':
        case 'index.html':
            initializeProductsPage();
            break;
        case 'cart.html':
            initializeCartPage();
            break;
        case 'checkout.html':
            initializeCheckoutPage();
            break;
        case 'myorders.html':
            initializeOrdersPage();
            break;
        case 'business-analytics.html':
            initializeAdminPage();
            break;
    }
}

// Page-specific initialization functions
function initializeLoginPage() {
    const loginForm = createIntegratedLoginForm();
    
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        await loginForm.handleLogin({
            email: formData.get('email'),
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on'
        });
    });
}

function initializeRegisterPage() {
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const result = await quickLocal.auth.register({
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            phone: formData.get('phone')
        });
        
        if (result.success) {
            quickLocal.showSuccessNotification('Registration successful!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            quickLocal.showErrorNotification(result.message || 'Registration failed');
        }
    });
}

function initializeProductsPage() {
    const productList = createIntegratedProductList();
    
    // Load products on page load
    productList.loadProducts();
    
    // Set up search functionality
    document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const query = formData.get('query');
        
        const result = await quickLocal.products.searchProducts(query);
        
        if (result.success) {
            productList.renderProducts(result.data, document.getElementById('productsContainer'));
        }
    });
}

function initializeCartPage() {
    const cart = createIntegratedCart();
    
    // Load cart on page load
    cart.loadCart();
    
    // Update cart badge
    cart.updateCartBadge();
}

function initializeCheckoutPage() {
    const checkout = createIntegratedCheckout();
    
    // Set up checkout form
    document.getElementById('checkoutForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const orderData = {
            shippingInfo: {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                pincode: formData.get('pincode')
            },
            paymentMethod: formData.get('paymentMethod')
        };
        
        await checkout.processCheckout(orderData);
    });
}

function initializeOrdersPage() {
    // Load user orders
    loadUserOrders();
}

function initializeAdminPage() {
    // Initialize admin features
    if (quickLocal.auth.getCurrentUser()?.role === 'admin') {
        initializeAdminDashboard();
    } else {
        window.location.href = 'login.html';
    }
}

// Global helper functions
async function addToCart(productId, quantity = 1) {
    const cart = createIntegratedCart();
    await cart.addToCart(productId, quantity);
}

async function removeFromCart(itemId) {
    try {
        const result = await quickLocal.cart.removeFromCart(itemId);
        
        if (result.success) {
            quickLocal.showSuccessNotification('Item removed from cart');
            
            // Reload cart if on cart page
            if (window.location.pathname.includes('cart.html')) {
                const cart = createIntegratedCart();
                cart.loadCart();
            }
            
            cart.updateCartBadge();
        }
    } catch (error) {
        quickLocal.showErrorNotification('Failed to remove item');
    }
}

async function updateCartQuantity(itemId, quantity) {
    if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
    }
    
    try {
        const result = await quickLocal.cart.updateCartItem(itemId, quantity);
        
        if (result.success) {
            // Reload cart display
            const cart = createIntegratedCart();
            cart.loadCart();
            cart.updateCartBadge();
        }
    } catch (error) {
        quickLocal.showErrorNotification('Failed to update quantity');
    }
}

async function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        try {
            const result = await quickLocal.cart.clearCart();
            
            if (result.success) {
                quickLocal.showSuccessNotification('Cart cleared');
                
                // Reload cart display
                const cart = createIntegratedCart();
                cart.loadCart();
                cart.updateCartBadge();
            }
        } catch (error) {
            quickLocal.showErrorNotification('Failed to clear cart');
        }
    }
}

function viewProduct(productId) {
    window.location.href = `product-details.html?id=${productId}`;
}

function proceedToCheckout() {
    if (quickLocal.auth.isAuthenticated()) {
        window.location.href = 'checkout.html';
    } else {
        localStorage.setItem('redirectAfterLogin', 'checkout.html');
        window.location.href = 'login.html';
    }
}

async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        await quickLocal.auth.logout();
    }
}

// 🚀 CSS for Toast Notifications
const integrationStyles = `
<style>
.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    min-width: 300px;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
}

.toast-notification.success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
}

.toast-notification.error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toast-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    margin-left: auto;
    opacity: 0.7;
}

.toast-close:hover {
    opacity: 1;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Authentication state styling */
[data-auth="true"] {
    display: none;
}

[data-auth="false"] {
    display: block;
}

.authenticated [data-auth="true"] {
    display: block;
}

.authenticated [data-auth="false"] {
    display: none;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', integrationStyles);

console.log('🚀 QuickLocal Frontend-Backend Integration Complete!');