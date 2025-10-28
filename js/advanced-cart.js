/**
 * Advanced Shopping Cart System - Server-Driven (FIXED)
 * Features: Smart quantity controls, Cart recommendations, Seamless checkout
 * * NOTE: "Save for Later" has been removed as it was a client-only
 * feature that conflicts with this server-driven cart.
 * To re-enable it, it must be implemented on the backend.
 *
 * ---
 * ✅ FIX: Replaced all `fetch()` calls with `window.HybridAuthClient.apiCall()`
 * to ensure all API requests are authenticated.
 * ---
 */

class AdvancedShoppingCart {
  constructor() {
    // Start with an empty cart. Server will populate this.
    this.cart = []; 
    this.cartTotal = 0;
    this.cartCount = 0;
    // this.apiBaseUrl = window.APP_CONFIG?.API_BASE_URL; // No longer needed, apiCall handles it
    this.debounceTimeout = null;
    this.recommendations = [];
    // Prevent concurrent cart loads
    this._loadingCart = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
    console.log('🛒 Advanced Shopping Cart initialized');
    
    // Data loading is deferred until authentication is confirmed.
    // this.loadCartFromServer(); // <- REMOVED
    // this.loadRecommendations(); // <- REMOVED
  }

  /**
   * Public method to be called *after* authentication is confirmed.
   */
  async initializeCartData() {
    console.log('Auth confirmed. Initializing cart data from server...');
    await this.loadCartFromServer();
    // await this.loadRecommendations(); // <-- COMMENT THIS OUT
  }

  // ==================== CART MANAGEMENT (SERVER-DRIVEN) ====================

  async addToCart(productId, quantity = 1, variant = null) {
    try {
      // ✅ FIX: Use apiCall to send auth token
      const response = await window.HybridAuthClient.apiCall('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, variant })
      });
      
      const res = await response.json();
      
      if (!response.ok || !res.success) {
        throw new Error(res.message || res.errors[0].msg || 'Failed to add item');
      }

      await this.loadCartFromServer();
      this.showNotification('Item added to cart', 'success');
      this.trackAnalytics('add_to_cart', { productId, quantity });
      return true;
    } catch (error) {
      console.error('Add to cart error:', error);
      this.showNotification(error.message, 'error');
      return false;
    }
  }

  async updateQuantity(cartId, newQuantity) {
    const item = this.cart.find(item => item.cartId === cartId);
    if (!item) return;

    if (newQuantity <= 0) {
      await this.removeFromCart(cartId);
      return;
    }

    if (newQuantity > 10) {
      this.showNotification('Maximum 10 items allowed per product', 'warning');
      // Revert the UI
      this.updateCartUI(); 
      return;
    }

    try {
      // ✅ FIX: Use apiCall to send auth token
      const res = await window.HybridAuthClient.apiCall(`/cart/items/${item.productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQuantity })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update quantity');
      }
      
      await this.loadCartFromServer();
      this.showNotification('Quantity updated', 'success');
      this.trackAnalytics('cart_quantity_change', { productId: item.productId, newQuantity });
    } catch (error) {
      console.error('Update quantity error:', error);
      this.showNotification(error.message, 'error');
      // Re-load server state to fix any UI mismatch
      await this.loadCartFromServer();
    }
  }

  async removeFromCart(cartId) {
    const item = this.cart.find(i => i.cartId === cartId);
    if (!item) return;

    try {
      // ✅ FIX: Use apiCall to send auth token
      const res = await window.HybridAuthClient.apiCall(`/cart/items/${item.productId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove item');
      }

      await this.loadCartFromServer();
      this.showNotification('Item removed from cart', 'info');
      this.trackAnalytics('remove_from_cart', { productId: item.productId });
    } catch (error) {
      console.error('Remove from cart error:', error);
      this.showNotification(error.message, 'error');
    }
  }

  async clearCart() {
    try {
      // ✅ FIX: Use apiCall to send auth token
      const res = await window.HybridAuthClient.apiCall('/cart/clear', {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to clear cart');
      }
      
      await this.loadCartFromServer();
      this.showNotification('Cart cleared', 'info');
    } catch (error) {
      console.error('Clear cart error:', error);
      this.showNotification(error.message, 'error');
    }
  }

  // ==================== SAVE FOR LATER (REMOVED) ====================
  // All "Save for Later" functions (saveForLater, moveToCart,
  // removeFromSavedForLater, loadSavedForLater, saveSavedForLater)
  // have been removed. This feature must be built on the
  // backend to work with a server-authoritative cart.

  // ==================== CART CALCULATIONS ====================

  calculateTotals() {
    let subtotal = 0;
    let savings = 0;
    let deliveryFee = 0;
    let itemCount = 0;

    this.cart.forEach(item => {
      const itemPrice = item.price || 0;
      const itemOrigPrice = item.originalPrice || itemPrice;
      const itemQty = item.quantity || 0;
      
      const itemSubtotal = itemPrice * itemQty;
      const itemSavings = (itemOrigPrice - itemPrice) * itemQty;
      
      subtotal += itemSubtotal;
      savings += itemSavings;
      itemCount += itemQty;

      // Calculate delivery fee (free above threshold)
      if (itemSubtotal < (item.deliveryInfo?.freeAbove || 500)) {
        deliveryFee += item.deliveryInfo?.fee || 25;
      }
    });

    // Apply delivery fee cap and free delivery logic
    if (subtotal >= 500) deliveryFee = 0; // Free delivery above ₹500
    if (deliveryFee > 50) deliveryFee = 50; // Cap delivery fee at ₹50

    const total = subtotal + deliveryFee;

    this.cartTotal = total;
    this.cartCount = itemCount;

    return {
      itemCount,
      subtotal,
      savings,
      deliveryFee,
      total,
      freeDeliveryThreshold: 500,
      amountForFreeDelivery: Math.max(0, 500 - subtotal)
    };
  }

  // ==================== UI UPDATES ====================

  updateCartUI() {
    const totals = this.calculateTotals();
    
    // Update cart badge
    this.updateCartBadge(totals.itemCount);
    
    // Update cart dropdown
    this.updateCartDropdown();
    
    // Update cart page if open
    if (document.getElementById('cart-items-container')) {
      this.renderCartPage();
    }

    // Update cart summary
    this.updateCartSummary(totals);

    // Update empty state
    this.updateEmptyState();
  }

  updateCartBadge(count) {
    const badges = document.querySelectorAll('.cart-badge, .cart-count');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }

  updateCartDropdown() {
    const dropdown = document.getElementById('cart-dropdown');
    if (!dropdown) return;

    const cartItems = this.cart.slice(0, 3); // Show only first 3 items
    
    dropdown.innerHTML = `
      <div class="cart-dropdown-header">
        <h3>Shopping Cart (${this.cartCount})</h3>
        ${this.cart.length > 3 ? `<span class="more-items">+${this.cart.length - 3} more</span>` : ''}
      </div>
      <div class="cart-dropdown-items">
        ${cartItems.length > 0 ? cartItems.map(item => this.renderDropdownItem(item)).join('') : 
          '<div class="empty-cart-dropdown">Your cart is empty</div>'}
      </div>
      <div class="cart-dropdown-footer">
        <div class="cart-total">Total: ₹${this.cartTotal.toFixed(2)}</div>
        <div class.cart-actions">
          <button class="btn-secondary" onclick="window.location.href='cart.html'">View Cart</button>
          <button class="btn-primary" onclick="window.location.href='checkout.html'" ${this.cart.length === 0 ? 'disabled' : ''}>
            Checkout
          </button>
        </div>
      </div>
    `;
  }

  renderDropdownItem(item) {
    return `
      <div class="cart-dropdown-item" data-cart-id="${item.cartId}">
        <img src="${item.image}" alt="${item.name}" class="item-image">
        <div class="item-details">
          <h4>${item.name}</h4>
          <div class="item-price">
            ₹${item.price.toFixed(2)} × ${item.quantity}
            ${item.discount > 0 ? `<span class="original-price">₹${item.originalPrice.toFixed(2)}</span>` : ''}
          </div>
        </div>
        <button class="remove-item" onclick="advancedCart.removeFromCart('${item.cartId}')" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }

  // ==================== CART PAGE RENDERING ====================

  renderCartPage() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    
    // Hide loading spinner
    const loadingEl = document.getElementById('loadingContainer');
    if (loadingEl) loadingEl.style.display = 'none';

    if (this.cart.length === 0) {
      container.innerHTML = this.renderEmptyCart();
      const emptyEl = document.getElementById('emptyCart');
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    
    // Hide default empty cart message if we are rendering items
    const emptyEl = document.getElementById('emptyCart');
    if (emptyEl) emptyEl.style.display = 'none';

    container.innerHTML = `
      <div class="cart-content">
        <div class="cart-main">
          ${this.cart.length > 0 ? this.renderCartItems() : ''}
          ${this.renderCartRecommendations()}
        </div>
        <div class="cart-sidebar">
          ${this.renderCartSummary()}
          ${this.renderDeliveryInfo()}
          ${this.renderPromoCode()}
        </div>
      </div>
    `;

    this.bindCartEvents();
  }

  renderCartItems() {
    return `
      <div class="cart-section">
        <div class="section-header">
          <h2>Shopping Cart (${this.cartCount} item${this.cartCount !== 1 ? 's' : ''})</h2>
          <button class="clear-cart-btn" onclick="advancedCart.clearCart()">Clear All</button>
        </div>
        <div class="cart-items">
          ${this.cart.map(item => this.renderCartItem(item)).join('')}
        </div>
      </div>
    `;
  }

  renderCartItem(item) {
    return `
      <div class="cart-item" data-cart-id="${item.cartId}">
        <div class="item-image-container">
          <img src="${item.image}" alt="${item.name}" class="item-image">
        </div>
        
        <div class="item-details">
          <h3 class="item-name">${item.name}</h3>
          ${item.variant ? `<div class="item-variant">${this.formatVariant(item.variant)}</div>` : ''}
          <div class="item-seller">Sold by: ${item.seller?.name || 'QuickLocal'}</div>
          
          <div class="item-price-info">
            <span class="current-price">₹${item.price.toFixed(2)}</span>
            ${item.discount > 0 ? `
              <span class="original-price">₹${item.originalPrice.toFixed(2)}</span>
              <span class="discount-tag">${item.discount}% OFF</span>
            ` : ''}
          </div>
          
          <div class="item-delivery">
            <i class="fas fa-truck"></i>
            Delivery in ${item.deliveryInfo?.time || '20-30 mins'}
            ${item.deliveryInfo?.fee === 0 ? '<span class="free-delivery">FREE</span>' : ''}
          </div>
        </div>
        
        <div class="item-controls">
          <div class="quantity-controls">
            <button class="qty-btn minus" onclick="advancedCart.updateQuantity('${item.cartId}', ${item.quantity - 1})">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${Math.min(item.stock, 10)}" 
                   onchange="advancedCart.updateQuantity('${item.cartId}', parseInt(this.value))">
            <button class="qty-btn plus" onclick="advancedCart.updateQuantity('${item.cartId}', ${item.quantity + 1})" 
                    ${item.quantity >= Math.min(item.stock, 10) ? 'disabled' : ''}>
              <i class="fas fa-plus"></i>
            </button>
          </div>
          
          <div class="item-total">
            <strong>₹${(item.price * item.quantity).toFixed(2)}</strong>
          </div>
          
          <div class="item-actions">
            <button class="action-btn remove" onclick="advancedCart.removeFromCart('${item.cartId}')">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
          
          ${item.stock < 10 ? `<div class="stock-warning">Only ${item.stock} left in stock</div>` : ''}
        </div>
      </div>
    `;
  }

  // ==================== CART RECOMMENDATIONS ====================

  async loadRecommendations() {
    // This route 404s per your logs. You must create it in your backend.
    // Example: GET /api/v1/products/recommendations?type=cart
    
    // Don't run if cart is empty
    if (this.cart.length === 0 && (await this.loadCartFromServer()).length === 0) {
        return;
    }

    try {
      // ✅ FIX: Use apiCall to send auth token
      const response = await window.HybridAuthClient.apiCall('/products/recommendations', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        this.recommendations = data.success ? data.data : []; // Adjust based on your API response
        this.updateCartUI(); // Re-render to show recommendations
      }
    } catch (error) {
      console.error('Load recommendations error:', error);
      this.recommendations = [];
    }
  }

  renderCartRecommendations() {
    if (!this.recommendations || this.recommendations.length === 0) return '';

    return `
      <div class="cart-section recommendations-section">
        <div class="section-header">
          <h2>🎯 You might also like</h2>
        </div>
        <div class="recommendations-grid">
          ${this.recommendations.slice(0, 4).map(product => this.renderRecommendationItem(product)).join('')}
        </div>
      </div>
    `;
  }

  renderRecommendationItem(product) {
    // Adjust product fields based on your actual recommendation API response
    const productId = product._id || product.id;
    const productName = product.name;
    const productImg = product.images ? product.images[0]?.url : 'default-image.jpg';
    const productPrice = product.price;
    const productDiscount = product.discountPercentage || 0;
    const finalPrice = productPrice * (1 - productDiscount / 100);

    return `
      <div class="recommendation-item" data-product-id="${productId}">
        <img src="${productImg}" alt="${productName}" class="rec-image">
        <div class="rec-details">
          <h4>${productName}</h4>
          <div class="rec-price">
            <span class="current-price">₹${finalPrice.toFixed(2)}</span>
            ${productDiscount > 0 ? `<span class="original-price">₹${productPrice.toFixed(2)}</span>` : ''}
          </div>
        </div>
        <button class="add-rec-btn" onclick="advancedCart.addToCart('${productId}')">
          <i class="fas fa-plus"></i> Add
        </button>
      </div>
    `;
  }

  // ==================== CART SUMMARY ====================

  updateCartSummary(totals) {
    const summaryContainer = document.getElementById('cart-summary');
    if (!summaryContainer) return;

    summaryContainer.innerHTML = this.renderCartSummary(totals);
  }

  renderCartSummary(totals = null) {
    if (!totals) totals = this.calculateTotals();

    return `
      <div class="cart-summary">
        <div class="summary-header">Order Summary</div>
        <div class="summary-row">
          <span>Items (${totals.itemCount})</span>
          <span>₹${totals.subtotal.toFixed(2)}</span>
        </div>
        ${totals.savings > 0 ? `
          <div class="summary-row">
            <span class="savings">You saved</span>
            <span class="savings">-₹${totals.savings.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="summary-row">
          <span class="delivery-fee">Delivery Fee</span>
          <span class="delivery-fee">
            ${totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee.toFixed(2)}`}
          </span>
        </div>
        ${totals.amountForFreeDelivery > 0 ? `
          <div class="free-delivery-progress">
            <div class="progress-text">
              Add ₹${totals.amountForFreeDelivery.toFixed(2)} more for FREE delivery
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(100, (totals.subtotal / totals.freeDeliveryThreshold) * 100)}%"></div>
            </div>
          </div>
        ` : `
          <div class="free-delivery-achieved">
            <i class="fas fa-truck"></i> FREE Delivery achieved!
          </div>
        `}
        <div class="summary-row total">
          <span>Total</span>
          <span>₹${totals.total.toFixed(2)}</span>
        </div>
        <button class="checkout-btn" onclick="window.location.href='checkout.html'" ${this.cart.length === 0 ? 'disabled' : ''}>
          <i class="fas fa-lock"></i> Proceed to Checkout
        </button>
      </div>
    `;
  }

  renderDeliveryInfo() {
    return `
      <div class="delivery-info">
        <h3><i class="fas fa-truck"></i> Delivery Information</h3>
        <div class="delivery-options">
          <div class="delivery-option active">
            <div class="delivery-time">
              <i class="fas fa-clock"></i>
              <span>Express: 20-30 mins</span>
            </div>
            <div class="delivery-fee">₹25</div>
          </div>
          <div class="delivery-option">
            <div class="delivery-time">
              <i class="fas fa-calendar"></i>
              <span>Standard: Same day</span>
            </div>
            <div class="delivery-fee">FREE</div>
          </div>
        </div>
        <div class="delivery-note">
          <i class="fas fa-info-circle"></i>
          FREE delivery on orders above ₹500
        </div>
      </div>
    `;
  }

  renderPromoCode() {
    // This is client-side only. For real promos, this must call the backend.
    return `
      <div class="promo-code-section">
        <h3><i class="fas fa-tag"></i> Promo Code</h3>
        <div class="promo-input-container">
          <input type="text" class="promo-input" placeholder="Enter promo code" id="promo-code-input">
          <button class="apply-promo-btn" onclick="advancedCart.applyPromoCode()">
            Apply
          </button>
        </div>
        <div class="available-offers">
          <div class="offer-item" onclick="advancedCart.applyPromoCode('SAVE10')">
            <div class="offer-code">SAVE10</div>
            <div class="offer-desc">Get 10% off on orders above ₹200</div>
          </div>
        </div>
      </div>
    `;
  }

  async applyPromoCode(code = null) {
    // This is a placeholder. Real implementation should call:
    // POST /api/v1/cart/coupons
    // and then call this.loadCartFromServer()
    
    const promoCode = code || document.getElementById('promo-code-input')?.value;
    if (!promoCode) {
      this.showNotification('Please enter a promo code', 'warning');
      return;
    }
    this.showNotification(`Applying ${promoCode}...`, 'info');
    
    // TODO: Convert this to call the backend API
    // Example:
    /*
    try {
      const response = await window.HybridAuthClient.apiCall('/cart/coupons', {
        method: 'POST',
        body: JSON.stringify({ couponCode: promoCode })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        this.showNotification('Promo code applied!', 'success');
        await this.loadCartFromServer(); // Reload cart to reflect new totals
      } else {
        throw new Error(data.message || 'Invalid promo code');
      }
    } catch (error) {
      this.showNotification(error.message, 'error');
    }
    */
    this.showNotification('Promo code validation not implemented', 'warning');
  }

  removePromoCode() {
    // This is a placeholder. Real implementation should call:
    // DELETE /api/v1/cart/coupons/:couponCode
    // and then call this.loadCartFromServer()
    this.showNotification('Promo code removal not implemented', 'warning');
  }

  // ==================== EMPTY STATES ====================

  updateEmptyState() {
    // This method is called by updateCartUI
    // It ensures the correct container is shown/hidden
    const emptyEl = document.getElementById('emptyCart');
    if (!emptyEl) return;

    if (this.cart.length === 0) {
      emptyEl.style.display = 'block';
    } else {
      emptyEl.style.display = 'none';
    }
  }

  renderEmptyCart() {
    // This just returns the HTML. It is rendered by renderCartPage
    // The emptyCart element is already in cart.html
    return ''; 
  }

  // ==================== DROPDOWN METHODS ====================

  toggleCartDropdown() {
    const dropdown = document.getElementById('cart-dropdown');
    if (!dropdown) return;

    const isVisible = dropdown.classList.contains('show');
    if (isVisible) {
      this.hideCartDropdown();
    } else {
      this.showCartDropdown();
    }
  }

  showCartDropdown() {
    const dropdown = document.getElementById('cart-dropdown');
    if (dropdown) {
      dropdown.classList.add('show');
      this.updateCartDropdown();
    }
  }

  hideCartDropdown() {
    const dropdown = document.getElementById('cart-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
  }

  // ==================== HELPER METHODS ====================

  async fetchProductDetails(productId) {
    try {
      // ✅ FIX: Use apiCall to send auth token (though this route might be public)
      const response = await window.HybridAuthClient.apiCall(`/products/${productId}`, {
        method: 'GET'
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.success ? data.data.product : null;
    } catch (error) {
      console.error('Fetch product error:', error);
      return null;
    }
  }

  formatVariant(variant) {
    if (!variant) return '';
    return Object.entries(variant).map(([key, value]) => `${key}: ${value}`).join(', ');
  }

  // ==================== STORAGE (BACKUP ONLY) ====================

  loadCart() {
    // This is only used as a non-essential backup
    try {
      const saved = localStorage.getItem('quicklocal_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading cart from backup:', error);
      return [];
    }
  }

  saveCart() {
    // Saves the current (server-fetched) state to localStorage as a backup
    try {
      localStorage.setItem('quicklocal_cart', JSON.stringify(this.cart));
    } catch (error)
      {
      console.error('Error saving cart to backup:', error);
    }
  }

  // ==================== EVENT HANDLERS ====================

  bindEvents() {
    // Cart icon click
    document.addEventListener('click', (e) => {
      const cartIcon = e.target.closest('.cart-icon, .cart-btn');
      const cartDropdown = e.target.closest('.cart-dropdown-container');

      if (cartIcon) {
        this.toggleCartDropdown();
      } else if (!cartDropdown) {
        // Click was outside the cart icon and dropdown
        this.hideCartDropdown();
      }
    });

    // Auto-save backup on page unload
    window.addEventListener('beforeunload', () => {
      this.saveCart();
    });
  }

  bindCartEvents() {
    // Quantity input debouncing
    const qtyInputs = document.querySelectorAll('.qty-input');
    qtyInputs.forEach(input => {
      let timeout;
      input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const cartId = e.target.closest('.cart-item').dataset.cartId;
          let quantity = parseInt(e.target.value) || 1;
          
          // Enforce max
          const max = parseInt(e.target.max) || 10;
          if (quantity > max) {
            quantity = max;
            e.target.value = max;
          }
          // Enforce min
          if (quantity < 1) {
            quantity = 1;
            e.target.value = 1;
          }
          
          this.updateQuantity(cartId, quantity);
        }, 500);
      });
    });
  }

  // ==================== NOTIFICATIONS ====================

  showNotification(message, type = 'info') {
    // Use existing global toast system
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // ==================== ANALYTICS ====================

  trackAnalytics(event, data = {}) {
    // Track cart events for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        event_category: 'ecommerce',
        ...data
      });
    }
    
    console.log(`📊 Analytics: ${event}`, data);
  }

  // ==================== PUBLIC API ====================

  getCart() {
    return {
      items: this.cart,
      totals: this.calculateTotals()
    };
  }

  getCartCount() {
    return this.cartCount;
  }

  getCartTotal() {
    return this.cartTotal;
  }

  // ==================== SERVER SYNC (MOVED FROM BOTTOM) ====================

  /**
   * Fetches the cart data from the server and updates the local state.
   * This is the new "single source of truth" for loading the cart.
   */
  async loadCartFromServer() {
    if (this._loadingCart) {
      console.warn('Cart load is already in progress. Skipping duplicate call.');
      return this.cart;
    }
    this._loadingCart = true;
    // Optional retry once on transient failures
    const tryFetch = async () => {
      // ✅ FIX: Use apiCall to send auth token
      const response = await window.HybridAuthClient.apiCall('/cart', { method: 'GET' });
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Auth token invalid or expired during cart fetch.');
          this.showNotification('Session expired. Please log in again.', 'error');
        }
        throw Object.assign(new Error(`Failed to fetch cart (Status: ${response.status})`), { code: response.status });
      }
      const res = await response.json();
      let itemsToFormat = [];
      if (res.success && res.data) {
        if (res.data.availableItems) {
          itemsToFormat = res.data.availableItems; // From new cart.js
        } else if (res.data.items) {
          itemsToFormat = res.data.items; // From old cartcontroller.js
        }
      }
      this.cart = this.formatServerCart(itemsToFormat);
    };

    try {
      await tryFetch();
    } catch (error) {
      console.error('Error loading cart from server:', error);
      // Retry once on network/transient errors (5xx or fetch TypeError)
      const retryable = (error && (error.code >= 500 || error.name === 'TypeError'));
      if (retryable) {
        try {
          await new Promise(r => setTimeout(r, 500));
          await tryFetch();
          this.showNotification('Recovered from a temporary issue.', 'info');
        } catch (retryErr) {
          console.error('Retry failed:', retryErr);
          this.handleCartLoadFailure(retryErr);
        }
      } else {
        this.handleCartLoadFailure(error);
      }
    }
    // Update UI and save backup AFTER fetching
    try {
      this.updateCartUI();
      this.saveCart();
      return this.cart;
    } finally {
      this._loadingCart = false;
    }
  }

  /**
   * Helper function to map the server's cart item structure
   * to the structure your frontend UI expects.
   */
  formatServerCart(serverItems) {
    if (!serverItems) return [];
    
    // ✅ FIX: Updated to match the populated response from `cart.js`
    return serverItems.map(item => ({
      cartId: item._id, // This is the cart *item* ID
      productId: item.product?._id || item.productId || item.id,
      name: item.product?.name || item.name || 'Unnamed Product',
      
      // Use finalPrice if available (from cartcontroller), else calculate
      price: item.product?.finalPrice ?? (item.product?.price * (1 - (item.product?.discountPercentage || 0) / 100)) ?? item.priceAtAdd ?? 0,
      originalPrice: item.product?.originalPrice ?? item.product?.price ?? item.priceAtAdd ?? 0,
      discount: item.product?.discountPercentage ?? 0,
      
      image: item.product?.images && item.product.images.length > 0 ? item.product.images[0]?.url : 'https://via.placeholder.com/100', // Default image
      quantity: item.quantity ?? 1,
      variant: item.selectedVariant ?? item.variant ?? null,
      stock: item.product?.stock ?? item.stock ?? 10,
      seller: item.product?.seller ?? item.seller ?? null,
      category: item.product?.category ?? item.category ?? null,
      deliveryInfo: item.product?.deliveryInfo || { time: '20-30 mins', fee: 0 },
      addedAt: item.addedAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    }));
  }

  // Graceful fallback when cart load fails
  handleCartLoadFailure(error) {
    // Prefer backup cart if available
    let backup = [];
    try {
      const raw = localStorage.getItem('quicklocal_cart');
      backup = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to read backup cart:', e);
    }

    if (Array.isArray(backup) && backup.length > 0) {
      this.cart = backup;
      this.showNotification('Loaded saved cart (offline mode).', 'warning');
    } else {
      this.cart = [];
      const msg = (error && error.code === 401)
        ? 'Session expired. Please log in to view your cart.'
        : 'Could not load your cart. Please try again.';
      this.showNotification(msg, 'error');
    }
  }

} // <-- *** THIS IS THE CORRECT END OF THE CLASS ***


// Initialize advanced cart system
// REMOVED: document.addEventListener('DOMContentLoaded', () => { ... });
window.advancedCart = new AdvancedShoppingCart();
console.log('🛒 Advanced Shopping Cart System loaded!');


// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedShoppingCart;
}