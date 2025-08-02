class QuickLocalIntegration {
    constructor() {
        this.baseURL = 'https://ecommerce-backend-8ykq.onrender.com/api/v1';
        this.token = null;
        this.cart = [];
        this.user = null;
        
        // Initialize token from cookie or session storage alternative
        this.initializeAuth();
        
        this.auth = new AuthService(this.baseURL);
        this.products = new ProductService(this.baseURL);
        this.cartService = new CartService(this.baseURL);
        this.orders = new OrderService(this.baseURL);
        this.payments = new PaymentService(this.baseURL);
        
        this.initializeEventListeners();
    }

    // Initialize authentication without localStorage
    initializeAuth() {
        // Try to get token from cookie
        this.token = this.getCookie('authToken');
        
        // If no cookie, check if user is logged in via API
        if (this.token) {
            this.validateToken();
        }
    }

    // Cookie helper functions
    setCookie(name, value, days = 7) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    // Validate token with backend
    async validateToken() {
        try {
            const response = await fetch(`${this.baseURL}/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                this.user = result.data;
            } else {
                this.token = null;
                this.deleteCookie('authToken');
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            this.token = null;
            this.deleteCookie('authToken');
        }
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventHandlers();
            });
        } else {
            this.setupEventHandlers();
        }
    }

    setupEventHandlers() {
        this.setupCheckoutButton();
        this.setupCartButtons();
        this.setupAuthForms();
        this.loadCartFromServer();
    }

    // Setup checkout button handler
    setupCheckoutButton() {
        const checkoutBtn = document.querySelector('[data-checkout-btn]') || 
                           document.querySelector('#checkout-btn') || 
                           document.querySelector('.checkout-btn');
        
        const checkoutForm = document.querySelector('#checkout-form') || 
                            document.querySelector('.checkout-form') ||
                            document.querySelector('form[data-checkout-form]');
        
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    // Check if user is authenticated
                    if (!this.token) {
                        this.showErrorNotification('Please login to proceed with checkout');
                        this.redirectToLogin();
                        return;
                    }

                    // Collect form data
                    let checkoutData = {};
                    
                    if (checkoutForm) {
                        const formData = new FormData(checkoutForm);
                        checkoutData = Object.fromEntries(formData.entries());
                    } else {
                        // Fallback: collect data from individual fields
                        checkoutData = this.collectCheckoutDataFromFields();
                    }
                    
                    // Get current cart items
                    await this.refreshCart();
                    checkoutData.items = this.cart;
                    
                    // Process checkout
                    await this.handleCheckout(checkoutData);
                    
                } catch (error) {
                    console.error('Checkout button error:', error);
                    this.showErrorNotification('Checkout failed. Please try again.');
                }
            });
        }
    }

    // Load cart from server
    async loadCartFromServer() {
        try {
            const cartResult = await this.cartService.getCart();
            if (cartResult.success) {
                this.cart = cartResult.data || [];
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    }

    // Refresh cart data
    async refreshCart() {
        await this.loadCartFromServer();
    }

    // Collect checkout data from form fields if no form element found
    collectCheckoutDataFromFields() {
        return {
            name: this.getFieldValue(['name', 'customer_name', 'billing_name']),
            email: this.getFieldValue(['email', 'customer_email', 'billing_email']),
            phone: this.getFieldValue(['phone', 'customer_phone', 'billing_phone']),
            address: this.getFieldValue(['address', 'billing_address', 'address_line_1']),
            city: this.getFieldValue(['city', 'billing_city']),
            state: this.getFieldValue(['state', 'billing_state']),
            pincode: this.getFieldValue(['pincode', 'zip', 'postal_code', 'billing_zip']),
            paymentMethod: this.getFieldValue(['payment_method', 'paymentMethod']) || 'razorpay'
        };
    }

    // Helper to get field value by multiple possible names
    getFieldValue(fieldNames) {
        for (const name of fieldNames) {
            const field = document.querySelector(`[name="${name}"]`) || 
                         document.querySelector(`#${name}`) ||
                         document.querySelector(`.${name}`);
            if (field && field.value) {
                return field.value.trim();
            }
        }
        return '';
    }

    // Main checkout handler
    async handleCheckout(checkoutData) {
        try {
            // Show loading state
            this.setCheckoutButtonState(true, 'Processing...');
            
            // Validate required fields
            if (!this.validateCheckoutData(checkoutData)) {
                return;
            }

            // Create order first
            console.log('Creating order with data:', checkoutData);
            const orderResult = await this.orders.createOrder(checkoutData);
            
            if (!orderResult.success) {
                throw new Error(orderResult.message || 'Order creation failed');
            }

            console.log('Order created successfully:', orderResult.data);

            // Initialize payment based on selected method
            const paymentMethod = checkoutData.paymentMethod?.toLowerCase();
            
            if (paymentMethod === 'razorpay') {
                await this.initiateRazorpayPayment(orderResult.data);
            } else if (paymentMethod === 'stripe') {
                await this.initiateStripePayment(orderResult.data);
            } else if (paymentMethod === 'cod' || paymentMethod === 'cash_on_delivery') {
                await this.handleCODOrder(orderResult.data);
            } else {
                // Default to Razorpay if no method specified
                await this.initiateRazorpayPayment(orderResult.data);
            }

        } catch (error) {
            console.error('Checkout error:', error);
            this.showErrorNotification(error.message || 'Checkout failed. Please try again.');
        } finally {
            // Re-enable checkout button
            this.setCheckoutButtonState(false, 'Proceed to Checkout');
        }
    }

    // Validate checkout data
    validateCheckoutData(data) {
        const required = [
            { field: 'name', label: 'Name' },
            { field: 'email', label: 'Email' },
            { field: 'phone', label: 'Phone' },
            { field: 'address', label: 'Address' },
            { field: 'city', label: 'City' },
            { field: 'pincode', label: 'PIN Code' }
        ];

        for (const { field, label } of required) {
            if (!data[field] || data[field].trim() === '') {
                this.showErrorNotification(`${label} is required`);
                this.focusField(field);
                return false;
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showErrorNotification('Please enter a valid email address');
            this.focusField('email');
            return false;
        }

        // Validate phone format (basic validation)
        if (data.phone && data.phone.length < 10) {
            this.showErrorNotification('Please enter a valid phone number');
            this.focusField('phone');
            return false;
        }

        // Check if cart has items
        if (!data.items || data.items.length === 0) {
            this.showErrorNotification('Your cart is empty');
            return false;
        }

        return true;
    }

    // Focus on field with error
    focusField(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`) || 
                     document.querySelector(`#${fieldName}`);
        if (field) {
            field.focus();
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Set checkout button state
    setCheckoutButtonState(loading, text) {
        const buttons = [
            document.querySelector('[data-checkout-btn]'),
            document.querySelector('#checkout-btn'),
            document.querySelector('.checkout-btn'),
            document.querySelector('button[type="submit"]')
        ].filter(Boolean);

        buttons.forEach(btn => {
            btn.disabled = loading;
            btn.innerHTML = text;
            
            if (loading) {
                btn.classList.add('loading');
            } else {
                btn.classList.remove('loading');
            }
        });
    }

    // Handle Cash on Delivery orders
    async handleCODOrder(orderData) {
        try {
            // Mark order as confirmed
            const confirmResult = await this.orders.confirmOrder(orderData.id, {
                paymentMethod: 'cod',
                paymentStatus: 'pending'
            });

            if (confirmResult.success) {
                this.showSuccessNotification('Order placed successfully!');
                this.redirectToSuccess(orderData.id);
                await this.cartService.clearCart();
                this.cart = [];
                this.updateCartUI();
            }
        } catch (error) {
            throw new Error('COD order processing failed');
        }
    }

    // Initiate Razorpay payment
    async initiateRazorpayPayment(orderData) {
        try {
            // Load Razorpay script if not already loaded
            if (typeof Razorpay === 'undefined') {
                await this.loadRazorpayScript();
            }

            const options = {
                key: 'rzp_test_your_key_id', // Replace with your actual Razorpay key
                amount: orderData.total * 100, // Amount in paise
                currency: 'INR',
                name: 'QuickLocal',
                description: `Order #${orderData.id}`,
                order_id: orderData.razorpayOrderId,
                handler: async (response) => {
                    await this.handlePaymentSuccess(response, orderData);
                },
                prefill: {
                    name: orderData.customerName,
                    email: orderData.customerEmail,
                    contact: orderData.customerPhone
                },
                theme: {
                    color: '#3399cc'
                },
                modal: {
                    ondismiss: () => {
                        this.showErrorNotification('Payment cancelled');
                        this.setCheckoutButtonState(false, 'Proceed to Checkout');
                    }
                }
            };

            const razorpay = new Razorpay(options);
            razorpay.open();

        } catch (error) {
            throw new Error('Payment initialization failed: ' + error.message);
        }
    }

    // Load Razorpay script dynamically
    loadRazorpayScript() {
        return new Promise((resolve, reject) => {
            if (typeof Razorpay !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Handle payment success
    async handlePaymentSuccess(paymentResponse, orderData) {
        try {
            const verifyResult = await this.payments.verifyPayment({
                orderId: orderData.id,
                paymentId: paymentResponse.razorpay_payment_id,
                signature: paymentResponse.razorpay_signature
            });

            if (verifyResult.success) {
                this.showSuccessNotification('Payment successful!');
                this.redirectToSuccess(orderData.id);
                await this.cartService.clearCart();
                this.cart = [];
                this.updateCartUI();
            } else {
                throw new Error('Payment verification failed');
            }
        } catch (error) {
            this.showErrorNotification('Payment verification failed');
        }
    }

    // Show success notification
    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }

    // Show error notification
    showErrorNotification(message) {
        this.showNotification(message, 'error');
    }

    // Generic notification function
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.quicklocal-notification');
        existingNotifications.forEach(n => n.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `quicklocal-notification quicklocal-notification-${type}`;
        notification.innerHTML = `
            <div class="quicklocal-notification-content">
                <span class="quicklocal-notification-message">${message}</span>
                <button class="quicklocal-notification-close">&times;</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Manual close
        notification.querySelector('.quicklocal-notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Redirect to success page
    redirectToSuccess(orderId) {
        setTimeout(() => {
            window.location.href = `/order-success?orderId=${orderId}`;
        }, 2000);
    }

    // Redirect to login page
    redirectToLogin() {
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }

    // Setup cart buttons (add to cart, remove from cart)
    setupCartButtons() {
        document.addEventListener('click', async (e) => {
            if (e.target.matches('[data-add-to-cart]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                const quantity = parseInt(e.target.getAttribute('data-quantity')) || 1;
                if (productId) {
                    await this.addToCart(productId, quantity);
                }
            }

            if (e.target.matches('[data-remove-from-cart]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                if (productId) {
                    await this.removeFromCart(productId);
                }
            }

            if (e.target.matches('[data-update-quantity]')) {
                e.preventDefault();
                const productId = e.target.getAttribute('data-product-id');
                const quantity = parseInt(e.target.value);
                if (productId && quantity > 0) {
                    await this.updateCartQuantity(productId, quantity);
                }
            }
        });
    }

    // Add to cart
    async addToCart(productId, quantity = 1) {
        try {
            if (!this.token) {
                this.showErrorNotification('Please login to add items to cart');
                this.redirectToLogin();
                return;
            }

            const result = await this.cartService.addToCart({ productId, quantity });
            if (result.success) {
                this.showSuccessNotification('Product added to cart!');
                await this.refreshCart();
            }
        } catch (error) {
            this.showErrorNotification('Failed to add product to cart');
        }
    }

    // Remove from cart
    async removeFromCart(productId) {
        try {
            const result = await this.cartService.removeFromCart(productId);
            if (result.success) {
                this.showSuccessNotification('Product removed from cart!');
                await this.refreshCart();
            }
        } catch (error) {
            this.showErrorNotification('Failed to remove product from cart');
        }
    }

    // Update cart quantity
    async updateCartQuantity(productId, quantity) {
        try {
            const result = await this.cartService.updateQuantity(productId, quantity);
            if (result.success) {
                await this.refreshCart();
            }
        } catch (error) {
            this.showErrorNotification('Failed to update quantity');
        }
    }

    // Update cart UI
    updateCartUI() {
        const cartCount = this.cart.reduce((total, item) => total + (item.quantity || 0), 0);
        const cartTotal = this.cart.reduce((total, item) => total + (item.price * item.quantity || 0), 0);
        
        // Update cart count elements
        const cartCountElements = document.querySelectorAll('[data-cart-count]');
        cartCountElements.forEach(el => el.textContent = cartCount);
        
        // Update cart total elements
        const cartTotalElements = document.querySelectorAll('[data-cart-total]');
        cartTotalElements.forEach(el => el.textContent = `₹${cartTotal.toFixed(2)}`);
        
        // Update cart items display
        const cartItemsContainer = document.querySelector('[data-cart-items]');
        if (cartItemsContainer) {
            this.renderCartItems(cartItemsContainer);
        }
    }

    // Render cart items
    renderCartItems(container) {
        if (this.cart.length === 0) {
            container.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="item-info">
                    <h4>${item.name || item.productName}</h4>
                    <p class="item-price">₹${item.price}</p>
                </div>
                <div class="item-controls">
                    <input type="number" value="${item.quantity}" min="1" data-update-quantity data-product-id="${item.productId}">
                    <button class="remove-btn" data-remove-from-cart data-product-id="${item.productId}">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Setup auth forms
    setupAuthForms() {
        // Login form
        const loginForm = document.querySelector('#login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                const email = formData.get('email');
                const password = formData.get('password');
                
                try {
                    const result = await this.auth.login({ email, password });
                    if (result.success) {
                        this.token = result.data.token;
                        this.user = result.data.user;
                        this.setCookie('authToken', this.token);
                        this.showSuccessNotification('Login successful!');
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        this.showErrorNotification(result.message || 'Login failed');
                    }
                } catch (error) {
                    this.showErrorNotification('Login failed');
                }
            });
        }

        // Register form
        const registerForm = document.querySelector('#register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const userData = Object.fromEntries(formData.entries());
                
                try {
                    const result = await this.auth.register(userData);
                    if (result.success) {
                        this.showSuccessNotification('Registration successful! Please login.');
                        setTimeout(() => {
                            if (registerForm.reset) registerForm.reset();
                        }, 1000);
                    } else {
                        this.showErrorNotification(result.message || 'Registration failed');
                    }
                } catch (error) {
                    this.showErrorNotification('Registration failed');
                }
            });
        }

        // Logout button
        const logoutBtns = document.querySelectorAll('[data-logout]');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    // Logout function
    logout() {
        this.token = null;
        this.user = null;
        this.cart = [];
        this.deleteCookie('authToken');
        this.showSuccessNotification('Logged out successfully');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

// Service classes
class AuthService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

class ProductService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async getProducts() {
        try {
            const response = await fetch(`${this.baseURL}/products`);
            const result = await response.json();
            return { success: response.ok, data: result.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getProduct(id) {
        try {
            const response = await fetch(`${this.baseURL}/products/${id}`);
            const result = await response.json();
            return { success: response.ok, data: result.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

class CartService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async getCart() {
        try {
            const response = await fetch(`${this.baseURL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                }
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data || [] };
        } catch (error) {
            return { success: false, data: [], message: error.message };
        }
    }

    async addToCart(item) {
        try {
            const response = await fetch(`${this.baseURL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                },
                body: JSON.stringify(item)
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async removeFromCart(productId) {
        try {
            const response = await fetch(`${this.baseURL}/cart/remove/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                }
            });
            
            const result = await response.json();
            return { success: response.ok, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async updateQuantity(productId, quantity) {
        try {
            const response = await fetch(`${this.baseURL}/cart/update/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                },
                body: JSON.stringify({ quantity })
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async clearCart() {
        try {
            const response = await fetch(`${this.baseURL}/cart/clear`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                }
            });
            
            return { success: response.ok };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

class OrderService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async createOrder(orderData) {
        try {
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async confirmOrder(orderId, confirmData) {
        try {
            const response = await fetch(`${this.baseURL}/orders/${orderId}/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                },
                body: JSON.stringify(confirmData)
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getOrders() {
        try {
            const response = await fetch(`${this.baseURL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                }
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

class PaymentService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async verifyPayment(paymentData) {
        try {
            const response = await fetch(`${this.baseURL}/payments/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.quickLocal?.token}`
                },
                body: JSON.stringify(paymentData)
            });
            
            const result = await response.json();
            return { success: response.ok, data: result.data };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Initialize the integration when the script loads
window.quickLocal = new QuickLocalIntegration();

// Add CSS for notifications and loading states
const notificationCSS = `
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

.quicklocal-notification {
    font-family: Arial, sans-serif;
}

.quicklocal-notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.quicklocal-notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    margin-left: 10px;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quicklocal-notification-close:hover {
    opacity: 0.8;
}

.loading {
    opacity: 0.7;
    cursor: not-allowed !important;
    position: relative;
}

.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #eee;
}

.cart-item:last-child {
    border-bottom: none;
}

.item-info h4 {
    margin: 0 0 5px 0;
    color: #333;
}

.item-price {
    color: #666;
    font-weight: bold;
}

.item-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.item-controls input[type="number"] {
    width: 60px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: center;
}

.remove-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.remove-btn:hover {
    background: #c0392b;
}

.empty-cart {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 20px;
}

/* Responsive design */
@media (max-width: 768px) {
    .quicklocal-notification {
        left: 10px;
        right: 10px;
        top: 10px;
        max-width: none;
    }
    
    .cart-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .item-controls {
        width: 100%;
        justify-content: space-between;
    }
}
`;

// Inject CSS
if (!document.querySelector('#quicklocal-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'quicklocal-styles';
    styleSheet.textContent = notificationCSS;
    document.head.appendChild(styleSheet);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickLocalIntegration;
}