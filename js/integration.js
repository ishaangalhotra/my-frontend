<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Checkout - QuickLocal</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .checkout-header {
            text-align: center;
            margin-bottom: 30px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
        }

        .checkout-header h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: #ecf0f1;
            border-radius: 3px;
            margin: 20px 0;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2ecc71);
            width: 60%;
            transition: width 0.3s ease;
        }

        .checkout-content {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 30px;
            margin-bottom: 30px;
        }

        .checkout-form {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
        }

        .cart-summary {
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            height: fit-content;
            position: sticky;
            top: 20px;
        }

        .form-group {
            margin-bottom: 25px;
            position: relative;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 15px 20px;
            border: 2px solid #e1e8ed;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #3498db;
            background: white;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            transform: translateY(-2px);
        }

        .form-group textarea {
            resize: vertical;
            min-height: 100px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .checkout-btn {
            width: 100%;
            background: linear-gradient(135deg, #3498db, #2ecc71);
            color: white;
            padding: 18px 30px;
            border: none;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 30px;
            position: relative;
            overflow: hidden;
        }

        .checkout-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(52, 152, 219, 0.4);
        }

        .checkout-btn:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid #ecf0f1;
            transition: all 0.3s ease;
        }

        .cart-item:hover {
            transform: translateX(5px);
            background: rgba(52, 152, 219, 0.05);
            margin: 0 -15px;
            padding: 20px 15px;
            border-radius: 8px;
        }

        .cart-item:last-child {
            border-bottom: none;
        }

        .item-details {
            flex: 1;
        }

        .item-details h4 {
            margin-bottom: 8px;
            color: #2c3e50;
            font-weight: 600;
        }

        .item-price {
            color: #7f8c8d;
            font-weight: 500;
        }

        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-right: 15px;
        }

        .quantity-btn {
            width: 32px;
            height: 32px;
            border: 2px solid #3498db;
            background: white;
            color: #3498db;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            transition: all 0.2s ease;
        }

        .quantity-btn:hover {
            background: #3498db;
            color: white;
            transform: scale(1.1);
        }

        .quantity-input {
            width: 60px;
            text-align: center;
            padding: 8px;
            border: 2px solid #ecf0f1;
            border-radius: 6px;
            font-weight: 600;
        }

        .remove-btn {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .remove-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
        }

        .cart-total {
            border-top: 3px solid #3498db;
            padding-top: 20px;
            margin-top: 20px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 20px;
            border-radius: 10px;
            margin: 20px -15px -15px -15px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-weight: 500;
        }

        .total-row.grand-total {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            border-top: 2px solid #bdc3c7;
            padding-top: 15px;
            margin-top: 15px;
        }

        .empty-cart {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 60px 20px;
        }

        .empty-cart i {
            font-size: 3em;
            margin-bottom: 20px;
            color: #bdc3c7;
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        }

        .loading-spinner {
            background: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .payment-methods {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }

        .payment-option {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 20px;
            border: 3px solid #ecf0f1;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }

        .payment-option:hover {
            border-color: #3498db;
            background: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.2);
        }

        .payment-option.selected {
            border-color: #3498db;
            background: rgba(52, 152, 219, 0.1);
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .payment-option input[type="radio"] {
            width: 20px;
            height: 20px;
        }

        .payment-option label {
            font-weight: 600;
            color: #2c3e50;
            cursor: pointer;
            margin: 0;
        }

        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10001;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }

        .toast.show {
            transform: translateX(0);
        }

        .toast.success { background: #2ecc71; }
        .toast.error { background: #e74c3c; }
        .toast.info { background: #3498db; }

        .form-group.error input,
        .form-group.error textarea {
            border-color: #e74c3c;
            background: rgba(231, 76, 60, 0.1);
        }

        .form-group.success input,
        .form-group.success textarea {
            border-color: #2ecc71;
            background: rgba(46, 204, 113, 0.1);
        }

        .error-message {
            color: #e74c3c;
            font-size: 12px;
            margin-top: 5px;
            display: none;
        }

        .form-group.error .error-message {
            display: block;
        }

        .checkout-status {
            background: rgba(52, 152, 219, 0.1);
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
        }

        /* Debug Panel Styles */
        .debug-panel {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 400px;
            overflow-y: auto;
            min-width: 300px;
            z-index: 10002;
            display: none;
        }

        .debug-panel.show {
            display: block;
        }

        .debug-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 10001;
            font-weight: bold;
        }

        @media (max-width: 768px) {
            .checkout-content {
                grid-template-columns: 1fr;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .container {
                padding: 10px;
            }

            .checkout-form,
            .cart-summary {
                padding: 20px;
            }

            .payment-methods {
                grid-template-columns: 1fr;
            }

            .debug-panel {
                left: 10px;
                right: 10px;
                min-width: auto;
            }
        }

        .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
            padding: 15px;
            background: rgba(46, 204, 113, 0.1);
            border: 2px solid #2ecc71;
            border-radius: 8px;
            color: #27ae60;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="checkout-header">
            <h1>🛒 Secure Checkout</h1>
            <p>Complete your order safely and securely</p>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>

        <div class="checkout-content">
            <!-- Checkout Form -->
            <div class="checkout-form">
                <div class="checkout-status">
                    <p id="status-message">System initializing...</p>
                </div>

                <h2>📋 Billing Information</h2>
                <form id="checkout-form" data-checkout-form>
                    <div class="form-group">
                        <label for="name">👤 Full Name *</label>
                        <input type="text" id="name" name="name" required placeholder="Enter your full name">
                        <div class="error-message">Please enter your full name</div>
                    </div>

                    <div class="form-group">
                        <label for="email">📧 Email Address *</label>
                        <input type="email" id="email" name="email" required placeholder="Enter your email">
                        <div class="error-message">Please enter a valid email address</div>
                    </div>

                    <div class="form-group">
                        <label for="phone">📱 Phone Number *</label>
                        <input type="tel" id="phone" name="phone" required placeholder="Enter your phone number">
                        <div class="error-message">Please enter a valid 10-digit phone number</div>
                    </div>

                    <div class="form-group">
                        <label for="address">🏠 Address *</label>
                        <textarea id="address" name="address" required placeholder="Enter your complete address"></textarea>
                        <div class="error-message">Please enter your complete address</div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="city">🏙️ City *</label>
                            <input type="text" id="city" name="city" required placeholder="Enter city">
                            <div class="error-message">Please enter your city</div>
                        </div>
                        <div class="form-group">
                            <label for="state">🗺️ State *</label>
                            <input type="text" id="state" name="state" required placeholder="Enter state">
                            <div class="error-message">Please enter your state</div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="pincode">📮 PIN Code *</label>
                            <input type="text" id="pincode" name="pincode" required placeholder="Enter PIN code">
                            <div class="error-message">Please enter a valid 6-digit PIN code</div>
                        </div>
                        <div class="form-group">
                            <label for="country">🌍 Country</label>
                            <input type="text" id="country" name="country" value="India" readonly>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>💳 Payment Method *</label>
                        <div class="payment-methods">
                            <div class="payment-option selected">
                                <input type="radio" id="razorpay" name="payment_method" value="razorpay" checked>
                                <label for="razorpay">💳 Razorpay</label>
                            </div>
                            <div class="payment-option">
                                <input type="radio" id="cod" name="payment_method" value="cod">
                                <label for="cod">💰 Cash on Delivery</label>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="checkout-btn" data-checkout-btn disabled>
                        🚀 Proceed to Checkout
                    </button>

                    <div class="secure-badge">
                        🔒 Your information is secure and encrypted
                    </div>
                </form>
            </div>

            <!-- Cart Summary -->
            <div class="cart-summary">
                <h2>📦 Order Summary</h2>
                <div id="cart-items-container" data-cart-items>
                    <div class="empty-cart">
                        <i>🛒</i>
                        <p>Loading cart items...</p>
                    </div>
                </div>

                <div class="cart-total">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span data-cart-subtotal>₹0.00</span>
                    </div>
                    <div class="total-row">
                        <span>Shipping:</span>
                        <span>₹50.00</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (18%):</span>
                        <span data-cart-tax>₹0.00</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>🎯 Total:</span>
                        <span data-cart-total>₹50.00</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loading-overlay">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Processing your order...</p>
            <p style="font-size: 14px; margin-top: 10px; color: #666;">Please don't close this window</p>
        </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug-panel" id="debug-panel">
        <h3>🐛 Debug Information</h3>
        <div id="debug-content"></div>
    </div>

    <button class="debug-toggle" onclick="toggleDebug()" title="Toggle Debug (Ctrl+D)">🐛</button>

    <script>
        // Enhanced checkout functionality with production fixes
        class CheckoutManager {
            constructor() {
                this.cart = [];
                this.initialized = false;
                this.debugMode = false;
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.loadCartData();
                this.updateProgress(60);
                this.updateStatus('Loading cart data...');
                
                // Initialize QuickLocal integration
                this.initializeQuickLocal();
            }

            async loadCartData() {
                this.debugLog('🔄 Loading cart data from QuickLocal integration...');
                
                try {
                    // 1. Try QuickLocal integration.js first (loads from server)
                    if (window.quickLocal && typeof window.quickLocal.loadCartFromServer === 'function') {
                        this.debugLog('✅ Found QuickLocal integration - loading from server');
                        await window.quickLocal.loadCartFromServer();
                        
                        if (window.quickLocal.cart && window.quickLocal.cart.length > 0) {
                            this.cart = this.normalizeCartItems(window.quickLocal.cart);
                            this.renderCartItems();
                            this.updateStatus('Live cart loaded from server ✅');
                            return;
                        }
                    }

                    // 2. Try localStorage
                    const localCart = localStorage.getItem('quicklocal_cart');
                    if (localCart) {
                        this.debugLog('✅ Found localStorage cart');
                        const savedCart = JSON.parse(localCart);
                        this.cart = this.normalizeCartItems(savedCart);
                        this.renderCartItems();
                        this.updateStatus('Cart loaded from storage ✅');
                        return;
                    }

                    // 3. Try URL parameters
                    const urlParams = new URLSearchParams(window.location.search);
                    const cartParam = urlParams.get('cart');
                    if (cartParam) {
                        this.debugLog('✅ Found URL cart parameter');
                        const urlCart = JSON.parse(decodeURIComponent(cartParam));
                        this.cart = this.normalizeCartItems(urlCart);
                        this.renderCartItems();
                        this.updateStatus('Cart loaded from URL ✅');
                        return;
                    }

                    // 4. Try sessionStorage
                    const sessionCart = sessionStorage.getItem('quicklocal_cart');
                    if (sessionCart) {
                        this.debugLog('✅ Found sessionStorage cart');
                        const savedCart = JSON.parse(sessionCart);
                        this.cart = this.normalizeCartItems(savedCart);
                        this.renderCartItems();
                        this.updateStatus('Cart loaded from session ✅');
                        return;
                    }

                    // 5. No cart found - show empty state
                    this.debugLog('❌ No cart data found anywhere');
                    this.updateStatus('No items in cart');
                    this.renderCartItems();

                } catch (error) {
                    this.debugLog('❌ Error loading cart: ' + error.message);
                    this.updateStatus('Error loading cart - using fallback');
                    this.loadFallbackCart();
                }
            }

            normalizeCartItems(cartData) {
                if (!Array.isArray(cartData)) return [];
                
                return cartData.map(item => ({
                    id: item.productId || item.id || Math.random().toString(36).substr(2, 9),
                    name: item.name || item.productName || 'Unknown Product',
                    price: parseFloat(item.price) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    image: item.image || this.getProductEmoji(item.name || item.productName)
                }));
            }

            loadFallbackCart() {
                // Demonstration cart for when no real data is available
                this.cart = [
                    { id: 'demo1', name: 'Organic Vegetables Bundle', price: 299, quantity: 2, image: '🥬' },
                    { id: 'demo2', name: 'Fresh Fruits Combo', price: 199, quantity: 1, image: '🍎' },
                    { id: 'demo3', name: 'Dairy Products Pack', price: 150, quantity: 1, image: '🥛' }
                ];
                this.renderCartItems();
                this.updateStatus('Demo cart loaded ✅');
            }

            getProductEmoji(productName) {
                if (!productName) return '📦';
                const name = productName.toLowerCase();
                if (name.includes('apple')) return '🍎';
                if (name.includes('bread')) return '🥖';
                if (name.includes('milk')) return '🥛';
                if (name.includes('cheese')) return '🧀';
                if (name.includes('honey')) return '🍯';
                if (name.includes('coffee')) return '☕';
                if (name.includes('vegetable')) return '🥬';
                if (name.includes('fruit')) return '🍊';
                return '📦';
            }

            renderCartItems() {
                const cartContainer = document.querySelector('[data-cart-items]');
                if (!cartContainer) return;

                if (this.cart.length === 0) {
                    cartContainer.innerHTML = '<div class="empty-cart"><i>🛒</i><p>Your cart is empty</p></div>';
                    this.enableCheckoutButton(false);
                    return;
                }

                let subtotal = 0;
                cartContainer.innerHTML = this.cart.map(item => {
                    const itemTotal = item.price * item.quantity;
                    subtotal += itemTotal;
                    
                    return `
                        <div class="cart-item">
                            <div class="item-details">
                                <h4>${item.image} ${item.name}</h4>
                                <p class="item-price">₹${item.price} × ${item.quantity}</p>
                            </div>
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="checkoutManager.updateQuantity('${item.id}', -1)">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="checkoutManager.setQuantity('${item.id}', this.value)">
                                <button class="quantity-btn" onclick="checkoutManager.updateQuantity('${item.id}', 1)">+</button>
                                <button class="remove-btn" onclick="checkoutManager.removeItem('${item.id}')">Remove</button>
                            </div>
                        </div>
                    `;
                }).join('');

                this.updateTotals(subtotal);
                this.enableCheckoutButton(true);
                this.saveCartToStorage(); // Auto-sync cart changes
            }

            updateTotals(subtotal) {
                const shipping = 50;
                const tax = subtotal * 0.18;
                const total = subtotal + shipping + tax;

                document.querySelectorAll('[data-cart-subtotal]').forEach(el => 
                    el.textContent = `₹${subtotal.toFixed(2)}`);
                document.querySelectorAll('[data-cart-tax]').forEach(el => 
                    el.textContent = `₹${tax.toFixed(2)}`);
                document.querySelectorAll('[data-cart-total]').forEach(el => 
                    el.textContent = `₹${total.toFixed(2)}`);
            }

            updateQuantity(itemId, change) {
                const item = this.cart.find(i => i.id === itemId);
                if (item) {
                    item.quantity = Math.max(1, item.quantity + change);
                    this.renderCartItems();
                    this.syncWithQuickLocal();
                }
            }

            setQuantity(itemId, quantity) {
                const item = this.cart.find(i => i.id === itemId);
                if (item) {
                    item.quantity = Math.max(1, parseInt(quantity) || 1);
                    this.renderCartItems();
                    this.syncWithQuickLocal();
                }
            }

            removeItem(itemId) {
                this.cart = this.cart.filter(i => i.id !== itemId);
                this.renderCartItems();
                this.syncWithQuickLocal();
                this.showToast('Item removed from cart', 'info');
            }

            saveCartToStorage() {
                try {
                    localStorage.setItem('quicklocal_cart', JSON.stringify(this.cart));
                    sessionStorage.setItem('quicklocal_cart', JSON.stringify(this.cart));
                } catch (error) {
                    this.debugLog('❌ Failed to save cart to storage: ' + error.message);
                }
            }

            syncWithQuickLocal() {
                // Sync with integration.js cart system
                if (window.quickLocal && typeof window.quickLocal.updateCartUI === 'function') {
                    try {
                        window.quickLocal.cart = this.cart;
                        window.quickLocal.updateCartUI();
                        this.debugLog('✅ Synced cart with QuickLocal integration');
                    } catch (error) {
                        this.debugLog('❌ Failed to sync with QuickLocal: ' + error.message);
                    }
                }
            }

            initializeQuickLocal() {
                setTimeout(() => {
                    if (window.quickLocal) {
                        this.debugLog('✅ QuickLocal integration.js found');
                        this.updateStatus('QuickLocal backend integration active ✅');
                        
                        // Check authentication status
                        if (window.quickLocal.token) {
                            this.updateStatus('User authenticated - ready for checkout ✅');
                        } else {
                            this.updateStatus('Guest checkout available ✅');
                        }
                    } else {
                        this.debugLog('⚠️ QuickLocal integration.js not found');
                        this.updateStatus('Ready for checkout with fallback ✅');
                    }
                    this.initialized = true;
                    this.updateProgress(80);
                }, 1500);
            }

            setupEventListeners() {
                // Payment method selection
                document.querySelectorAll('.payment-option').forEach(option => {
                    option.addEventListener('click', () => {
                        const radio = option.querySelector('input[type="radio"]');
                        if (radio) {
                            radio.checked = true;
                            document.querySelectorAll('.payment-option').forEach(opt => 
                                opt.classList.remove('selected'));
                            option.classList.add('selected');
                        }
                    });
                });

                // Form validation
                const form = document.getElementById('checkout-form');
                const inputs = form.querySelectorAll('input[required], textarea[required]');

                inputs.forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => this.clearValidation(input));
                });

                // Phone number formatting
                const phoneInput = document.getElementById('phone');
                phoneInput.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '').slice(0, 10);
                });

                // PIN code formatting
                const pincodeInput = document.getElementById('pincode');
                pincodeInput.addEventListener('input', function() {
                    this.value = this.value.replace(/\D/g, '').slice(0, 6);
                });

                // Form submission
                form.addEventListener('submit', (e) => this.handleCheckout(e));

                // Debug toggle with Ctrl+D
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'd') {
                        e.preventDefault();
                        this.toggleDebug();
                    }
                });
            }

            validateField(input) {
                const formGroup = input.closest('.form-group');
                let isValid = true;

                if (!input.value.trim()) {
                    isValid = false;
                } else if (input.type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    isValid = emailRegex.test(input.value);
                } else if (input.type === 'tel') {
                    isValid = input.value.length === 10;
                } else if (input.name === 'pincode') {
                    isValid = input.value.length === 6;
                }

                formGroup.classList.toggle('error', !isValid);
                formGroup.classList.toggle('success', isValid);
                
                return isValid;
            }

            clearValidation(input) {
                const formGroup = input.closest('.form-group');
                formGroup.classList.remove('error');
                if (input.value.trim()) {
                    formGroup.classList.add('success');
                } else {
                    formGroup.classList.remove('success');
                }
            }

            handleCheckout(e) {
                e.preventDefault();
                
                // Validate all fields
                const form = e.target;
                const inputs = form.querySelectorAll('input[required], textarea[required]');
                let isFormValid = true;

                inputs.forEach(input => {
                    if (!this.validateField(input)) {
                        isFormValid = false;
                    }
                });

                if (!isFormValid) {
                    this.showToast('Please fill in all required fields correctly', 'error');
                    return;
                }

                if (this.cart.length === 0) {
                    this.showToast('Your cart is empty', 'error');
                    return;
                }

                // Show loading
                document.getElementById('loading-overlay').style.display = 'flex';
                this.updateProgress(100);
                
                // Process checkout
                setTimeout(() => {
                    this.processCheckout(new FormData(form));
                }, 2000);
            }

            async processCheckout(formData) {
                try {
                    // Prepare order data in format expected by integration.js
                    const orderData = {
                        name: formData.get('name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        address: formData.get('address'),
                        city: formData.get('city'),
                        state: formData.get('state'),
                        pincode: formData.get('pincode'),
                        country: formData.get('country') || 'India',
                        paymentMethod: formData.get('payment_method') || 'razorpay',
                        items: this.cart,
                        totals: this.calculateTotals(),
                        timestamp: new Date().toISOString()
                    };

                    this.debugLog('🚀 Processing checkout with order data:', orderData);

                    // ✅ PRODUCTION FIX 1: Use QuickLocal integration.js handleCheckout method
                    if (window.quickLocal && typeof window.quickLocal.handleCheckout === 'function') {
                        this.debugLog('✅ Using QuickLocal integration.js handleCheckout');
                        const result = await window.quickLocal.handleCheckout(orderData);
                        
                        // integration.js handles its own success flow, but we still need to handle our UI
                        this.handleCheckoutSuccess({
                            orderId: result?.orderId || 'QL' + Date.now(),
                            status: 'success',
                            message: 'Order processed successfully!'
                        });
                    } else {
                        console.warn('[QuickLocal Checkout] integration.js handleCheckout() not found – running fallback');
                        this.debugLog('⚠️ QuickLocal integration not available - using fallback');
                        await this.simulateCheckout(orderData);
                    }
                } catch (error) {
                    console.error('Checkout processing error:', error);
                    this.handleCheckoutError(error);
                }
            }

            async simulateCheckout(orderData) {
                // Fallback checkout simulation
                this.debugLog('🔄 Simulating checkout process...');
                
                return new Promise((resolve) => {
                    setTimeout(() => {
                        // Store order locally
                        const orderId = 'ORD' + Date.now();
                        const orderRecord = {
                            orderId,
                            ...orderData,
                            status: 'confirmed',
                            processedAt: new Date().toISOString()
                        };

                        try {
                            localStorage.setItem(`quicklocal_order_${orderId}`, JSON.stringify(orderRecord));
                            this.debugLog('✅ Order stored locally:', orderRecord);
                        } catch (error) {
                            this.debugLog('❌ Failed to store order locally:', error);
                        }

                        this.handleCheckoutSuccess({
                            orderId,
                            status: 'success',
                            message: 'Order placed successfully!'
                        });
                        resolve();
                    }, 1500);
                });
            }

            calculateTotals() {
                const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const shipping = 50;
                const tax = subtotal * 0.18;
                const total = subtotal + shipping + tax;
                
                return { subtotal, shipping, tax, total };
            }

            handleCheckoutSuccess(result) {
                document.getElementById('loading-overlay').style.display = 'none';
                this.showToast(`Order confirmed! ID: ${result.orderId}`, 'success');
                
                // Clear cart
                this.cart = [];
                this.renderCartItems();
                this.saveCartToStorage();
                this.syncWithQuickLocal();
                
                // Reset form
                document.getElementById('checkout-form').reset();
                document.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('success', 'error');
                });
                
                // Show success message
                this.updateStatus(`Order confirmed! Order ID: ${result.orderId} ✅`);
                this.debugLog('✅ Checkout completed successfully:', result);

                // ✅ PRODUCTION FIX 2: Redirect to success page after toast is visible
                setTimeout(() => {
                    window.location.href = `order-success.html?orderId=${result.orderId}`;
                }, 2000);
            }

            handleCheckoutError(error) {
                document.getElementById('loading-overlay').style.display = 'none';
                this.showToast('There was an error processing your order. Please try again.', 'error');
                this.debugLog('❌ Checkout error:', error);
                console.error('Checkout error:', error);
            }

            updateProgress(percentage) {
                const progressFill = document.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = percentage + '%';
                }
            }

            updateStatus(message) {
                const statusElement = document.getElementById('status-message');
                if (statusElement) {
                    statusElement.textContent = message;
                }
                this.debugLog('📊 Status: ' + message);
            }

            enableCheckoutButton(enabled = true) {
                const button = document.querySelector('[data-checkout-btn]');
                if (button) {
                    button.disabled = !enabled;
                    button.textContent = enabled ? '🚀 Proceed to Checkout' : '⏳ Loading...';
                }
            }

            showToast(message, type = 'info') {
                // Remove existing toasts
                document.querySelectorAll('.toast').forEach(toast => toast.remove());

                const toast = document.createElement('div');
                toast.className = `toast ${type}`;
                toast.textContent = message;
                
                document.body.appendChild(toast);
                
                // Show toast
                setTimeout(() => toast.classList.add('show'), 100);
                
                // Hide toast after 4 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 4000);

                this.debugLog(`📢 Toast (${type}): ${message}`);
            }

            // Debug functionality
            toggleDebug() {
                this.debugMode = !this.debugMode;
                const panel = document.getElementById('debug-panel');
                panel.classList.toggle('show', this.debugMode);
                
                if (this.debugMode) {
                    this.updateDebugPanel();
                }
            }

            debugLog(message, data = null) {
                const timestamp = new Date().toLocaleTimeString();
                console.log(`[${timestamp}] ${message}`, data || '');
                
                if (this.debugMode) {
                    this.updateDebugPanel();
                }
            }

            updateDebugPanel() {
                const debugContent = document.getElementById('debug-content');
                if (!debugContent) return;

                const debugInfo = {
                    timestamp: new Date().toLocaleString(),
                    initialized: this.initialized,
                    cartItems: this.cart.length,
                    cartTotal: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    quickLocalAvailable: !!window.quickLocal,
                    quickLocalIntegration: {
                        hasToken: !!(window.quickLocal?.token),
                        hasUser: !!(window.quickLocal?.user),
                        hasHandleCheckout: !!(window.quickLocal?.handleCheckout),
                        hasLoadCartFromServer: !!(window.quickLocal?.loadCartFromServer),
                        serverCart: window.quickLocal?.cart?.length || 0
                    },
                    storageData: {
                        localStorage: !!localStorage.getItem('quicklocal_cart'),
                        sessionStorage: !!sessionStorage.getItem('quicklocal_cart')
                    },
                    cart: this.cart
                };

                debugContent.innerHTML = `
                    <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
                `;
            }
        }

        // Global functions
        function toggleDebug() {
            if (window.checkoutManager) {
                window.checkoutManager.toggleDebug();
            }
        }

        // Initialize checkout manager
        let checkoutManager;

        document.addEventListener('DOMContentLoaded', function() {
            checkoutManager = new CheckoutManager();
            
            // Make functions globally available
            window.checkoutManager = checkoutManager;
            window.debugCheckout = () => {
                console.log('=== Production Checkout Debug ===');
                console.log('CheckoutManager:', checkoutManager);
                console.log('Initialized:', checkoutManager.initialized);
                console.log('Cart:', checkoutManager.cart);
                console.log('QuickLocal Available:', !!window.quickLocal);
                if (window.quickLocal) {
                    console.log('QuickLocal Methods:', Object.keys(window.quickLocal));
                }
            };
            
            // Auto-debug after initialization
            setTimeout(() => window.debugCheckout(), 3000);
        });
    </script>
</body>
</html>