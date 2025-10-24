/**
 * Advanced Shopping Cart System - Amazon/Flipkart Style
 * Features: Smart quantity controls, Save for later, Cart recommendations, Seamless checkout
 */

class AdvancedShoppingCart {
  constructor() {
    this.cart = this.loadCart();
    this.savedForLater = this.loadSavedForLater();
    this.cartTotal = 0;
    this.cartCount = 0;
    this.apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    this.debounceTimeout = null;
    
    this.init();
  }

  init() {
    this.updateCartUI();
    this.bindEvents();
    this.loadRecommendations();
    this.autoSave();
    console.log('🛒 Advanced Shopping Cart initialized');
  }

  // ==================== CART MANAGEMENT ====================

  addToCart(productId, quantity = 1, variant = null) {
    return new Promise(async (resolve) => {
      try {
        // Fetch product details
        const product = await this.fetchProductDetails(productId);
        if (!product) {
          this.showNotification('Product not found', 'error');
          resolve(false);
          return;
        }

        // Check stock availability
        if (product.stock < quantity) {
          this.showNotification(`Only ${product.stock} items available`, 'warning');
          resolve(false);
          return;
        }

        const existingItem = this.cart.find(item => 
          item.productId === productId && 
          JSON.stringify(item.variant) === JSON.stringify(variant)
        );

        if (existingItem) {
          // Update quantity with stock check
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity <= product.stock && newQuantity <= 10) {
            existingItem.quantity = newQuantity;
            existingItem.updatedAt = new Date().toISOString();
            this.showNotification(`Updated quantity to ${newQuantity}`, 'success');
          } else {
            this.showNotification(`Maximum ${Math.min(product.stock, 10)} items allowed`, 'warning');
            resolve(false);
            return;
          }
        } else {
          // Add new item
          const cartItem = {
            cartId: this.generateCartId(),
            productId,
            name: product.name,
            price: product.finalPrice || product.price,
            originalPrice: product.price,
            discount: product.discountPercentage || 0,
            image: product.image || (product.images && product.images[0]?.url),
            quantity,
            variant,
            stock: product.stock,
            seller: product.seller,
            category: product.category,
            deliveryInfo: product.deliveryInfo || { time: '20-30 mins', fee: 0 },
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          this.cart.push(cartItem);
          this.showNotification(`${product.name} added to cart!`, 'success');
        }

        this.saveCart();
        this.updateCartUI();
        this.trackAnalytics('add_to_cart', { productId, quantity, value: product.price * quantity });
        resolve(true);

      } catch (error) {
        console.error('Add to cart error:', error);
        this.showNotification('Failed to add item to cart', 'error');
        resolve(false);
      }
    });
  }

  updateQuantity(cartId, newQuantity) {
    const item = this.cart.find(item => item.cartId === cartId);
    if (!item) return;

    if (newQuantity <= 0) {
      this.removeFromCart(cartId);
      return;
    }

    if (newQuantity > item.stock) {
      this.showNotification(`Only ${item.stock} items available`, 'warning');
      return;
    }

    if (newQuantity > 10) {
      this.showNotification('Maximum 10 items allowed per product', 'warning');
      return;
    }

    const oldQuantity = item.quantity;
    item.quantity = newQuantity;
    item.updatedAt = new Date().toISOString();

    this.saveCart();
    this.updateCartUI();
    this.trackAnalytics('cart_quantity_change', { 
      productId: item.productId, 
      oldQuantity, 
      newQuantity 
    });
  }

  removeFromCart(cartId) {
    const itemIndex = this.cart.findIndex(item => item.cartId === cartId);
    if (itemIndex === -1) return;

    const item = this.cart[itemIndex];
    this.cart.splice(itemIndex, 1);
    
    this.saveCart();
    this.updateCartUI();
    this.showNotification(`${item.name} removed from cart`, 'info');
    this.trackAnalytics('remove_from_cart', { productId: item.productId });
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartUI();
    this.showNotification('Cart cleared', 'info');
  }

  // ==================== SAVE FOR LATER ====================

  saveForLater(cartId) {
    const itemIndex = this.cart.findIndex(item => item.cartId === cartId);
    if (itemIndex === -1) return;

    const item = this.cart[itemIndex];
    item.savedAt = new Date().toISOString();
    
    this.savedForLater.push(item);
    this.cart.splice(itemIndex, 1);

    this.saveCart();
    this.saveSavedForLater();
    this.updateCartUI();
    this.showNotification(`${item.name} saved for later`, 'info');
  }

  moveToCart(cartId) {
    const itemIndex = this.savedForLater.findIndex(item => item.cartId === cartId);
    if (itemIndex === -1) return;

    const item = this.savedForLater[itemIndex];
    delete item.savedAt;
    item.updatedAt = new Date().toISOString();
    
    this.cart.push(item);
    this.savedForLater.splice(itemIndex, 1);

    this.saveCart();
    this.saveSavedForLater();
    this.updateCartUI();
    this.showNotification(`${item.name} moved to cart`, 'success');
  }

  removeFromSavedForLater(cartId) {
    const itemIndex = this.savedForLater.findIndex(item => item.cartId === cartId);
    if (itemIndex === -1) return;

    const item = this.savedForLater[itemIndex];
    this.savedForLater.splice(itemIndex, 1);
    
    this.saveSavedForLater();
    this.updateCartUI();
    this.showNotification(`${item.name} removed from saved items`, 'info');
  }

  // ==================== CART CALCULATIONS ====================

  calculateTotals() {
    let subtotal = 0;
    let savings = 0;
    let deliveryFee = 0;
    let itemCount = 0;

    this.cart.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      const itemSavings = (item.originalPrice - item.price) * item.quantity;
      
      subtotal += itemSubtotal;
      savings += itemSavings;
      itemCount += item.quantity;

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
        <div class="cart-actions">
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

    if (this.cart.length === 0 && this.savedForLater.length === 0) {
      container.innerHTML = this.renderEmptyCart();
      return;
    }

    container.innerHTML = `
      <div class="cart-content">
        <div class="cart-main">
          ${this.cart.length > 0 ? this.renderCartItems() : ''}
          ${this.savedForLater.length > 0 ? this.renderSavedForLater() : ''}
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
          <h2>Shopping Cart (${this.cart.length} item${this.cart.length !== 1 ? 's' : ''})</h2>
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
            <button class="action-btn save-later" onclick="advancedCart.saveForLater('${item.cartId}')">
              <i class="fas fa-heart"></i> Save for later
            </button>
            <button class="action-btn remove" onclick="advancedCart.removeFromCart('${item.cartId}')">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
          
          ${item.stock < 10 ? `<div class="stock-warning">Only ${item.stock} left in stock</div>` : ''}
        </div>
      </div>
    `;
  }

  renderSavedForLater() {
    if (this.savedForLater.length === 0) return '';

    return `
      <div class="cart-section saved-for-later-section">
        <div class="section-header">
          <h2>Saved for Later (${this.savedForLater.length} item${this.savedForLater.length !== 1 ? 's' : ''})</h2>
        </div>
        <div class="saved-items">
          ${this.savedForLater.map(item => this.renderSavedItem(item)).join('')}
        </div>
      </div>
    `;
  }

  renderSavedItem(item) {
    return `
      <div class="saved-item" data-cart-id="${item.cartId}">
        <img src="${item.image}" alt="${item.name}" class="item-image">
        <div class="item-details">
          <h4>${item.name}</h4>
          <div class="item-price">₹${item.price.toFixed(2)}</div>
          <div class="item-actions">
            <button class="btn-primary" onclick="advancedCart.moveToCart('${item.cartId}')">
              Move to Cart
            </button>
            <button class="btn-secondary" onclick="advancedCart.removeFromSavedForLater('${item.cartId}')">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== CART RECOMMENDATIONS ====================

  async loadRecommendations() {
    // Load cart-based recommendations
    if (this.cart.length === 0) return;

    try {
      const productIds = this.cart.map(item => item.productId);
      const response = await fetch(`${this.apiBaseUrl}/products/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productIds, type: 'cart_based' })
      });

      if (response.ok) {
        const data = await response.json();
        this.recommendations = data.success ? data.data.products : [];
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
          <h2>🎯 Frequently bought together</h2>
        </div>
        <div class="recommendations-grid">
          ${this.recommendations.slice(0, 4).map(product => this.renderRecommendationItem(product)).join('')}
        </div>
      </div>
    `;
  }

  renderRecommendationItem(product) {
    return `
      <div class="recommendation-item" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="rec-image">
        <div class="rec-details">
          <h4>${product.name}</h4>
          <div class="rec-price">
            <span class="current-price">₹${product.finalPrice || product.price}</span>
            ${product.discountPercentage > 0 ? `<span class="original-price">₹${product.price}</span>` : ''}
          </div>
          <div class="rec-rating">
            ${'★'.repeat(Math.floor(product.averageRating || 4))}${'☆'.repeat(5 - Math.floor(product.averageRating || 4))}
            <span>(${product.totalReviews || 0})</span>
          </div>
        </div>
        <button class="add-rec-btn" onclick="advancedCart.addToCart('${product.id}')">
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
          <div class="offer-item" onclick="advancedCart.applyPromoCode('FREESHIP')">
            <div class="offer-code">FREESHIP</div>
            <div class="offer-desc">Free delivery on any order</div>
          </div>
        </div>
      </div>
    `;
  }

  applyPromoCode(code = null) {
    const promoCode = code || document.getElementById('promo-code-input')?.value;
    if (!promoCode) {
      this.showNotification('Please enter a promo code', 'warning');
      return;
    }

    // Simulate promo code validation
    const promoCodes = {
      'SAVE10': { type: 'percentage', value: 10, minOrder: 200 },
      'SAVE20': { type: 'percentage', value: 20, minOrder: 500 },
      'FREESHIP': { type: 'free_shipping', value: 0, minOrder: 0 },
      'FLAT50': { type: 'fixed', value: 50, minOrder: 300 }
    };

    const promo = promoCodes[promoCode.toUpperCase()];
    if (!promo) {
      this.showNotification('Invalid promo code', 'error');
      return;
    }

    const totals = this.calculateTotals();
    if (totals.subtotal < promo.minOrder) {
      this.showNotification(`Minimum order value ₹${promo.minOrder} required`, 'warning');
      return;
    }

    this.appliedPromo = { code: promoCode.toUpperCase(), ...promo };
    this.updateCartUI();
    this.showNotification(`Promo code ${promoCode.toUpperCase()} applied!`, 'success');
  }

  removePromoCode() {
    this.appliedPromo = null;
    this.updateCartUI();
    this.showNotification('Promo code removed', 'info');
  }

  // ==================== EMPTY STATES ====================

  updateEmptyState() {
    // This method can be extended to show/hide empty state messages
    const emptyStates = document.querySelectorAll('.empty-cart-state');
    emptyStates.forEach(state => {
      state.style.display = this.cart.length === 0 ? 'block' : 'none';
    });
  }

  renderEmptyCart() {
    return `
      <div class="empty-cart">
        <div class="empty-cart-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <button class="continue-shopping-btn" onclick="window.location.href='marketplace.html'">
          <i class="fas fa-arrow-left"></i> Continue Shopping
        </button>
        ${this.savedForLater.length > 0 ? `
          <div class="saved-reminder">
            <p>You have ${this.savedForLater.length} item(s) saved for later</p>
            <button class="view-saved-btn" onclick="document.querySelector('.saved-for-later-section').scrollIntoView()">
              View Saved Items
            </button>
          </div>
        ` : ''}
      </div>
    `;
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
      const response = await fetch(`${this.apiBaseUrl}/products/${productId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.success ? data.data.product : null;
    } catch (error) {
      console.error('Fetch product error:', error);
      return null;
    }
  }

  generateCartId() {
    return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  formatVariant(variant) {
    if (!variant) return '';
    return Object.entries(variant).map(([key, value]) => `${key}: ${value}`).join(', ');
  }

  // ==================== STORAGE ====================

  loadCart() {
    try {
      const saved = localStorage.getItem('quicklocal_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem('quicklocal_cart', JSON.stringify(this.cart));
      
      // Auto-save to server if user is logged in
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.syncCartToServer();
      }, 2000);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  loadSavedForLater() {
    try {
      const saved = localStorage.getItem('quicklocal_saved_for_later');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved for later:', error);
      return [];
    }
  }

  saveSavedForLater() {
    try {
      localStorage.setItem('quicklocal_saved_for_later', JSON.stringify(this.savedForLater));
    } catch (error) {
      console.error('Error saving saved for later:', error);
    }
  }

  async syncCartToServer() {
    // Sync cart with server for logged-in users
    if (!window.auth?.isLoggedIn()) return;

    try {
      await fetch(`${this.apiBaseUrl}/cart/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cart: this.cart, savedForLater: this.savedForLater })
      });
    } catch (error) {
      console.error('Cart sync error:', error);
    }
  }

  // ==================== EVENT HANDLERS ====================

  bindEvents() {
    // Cart icon click
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cart-icon, .cart-btn')) {
        this.toggleCartDropdown();
      }
      
      // Close dropdown when clicking outside
      if (!e.target.closest('.cart-dropdown-container')) {
        this.hideCartDropdown();
      }
    });

    // Auto-save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveCart();
      this.saveSavedForLater();
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
          const quantity = parseInt(e.target.value) || 1;
          this.updateQuantity(cartId, quantity);
        }, 500);
      });
    });
  }

  // ==================== NOTIFICATIONS ====================

  showNotification(message, type = 'info') {
    // Use existing toast system or create simple notification
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

  // ==================== AUTO-SAVE ====================

  autoSave() {
    // Auto-save cart every 30 seconds
    setInterval(() => {
      this.saveCart();
      this.saveSavedForLater();
    }, 30000);
  }

  // ==================== PUBLIC API ====================

  getCart() {
    return {
      items: this.cart,
      savedForLater: this.savedForLater,
      totals: this.calculateTotals()
    };
  }

  getCartCount() {
    return this.cartCount;
  }

  getCartTotal() {
    return this.cartTotal;
  }
}

// Initialize advanced cart system
document.addEventListener('DOMContentLoaded', () => {
  window.advancedCart = new AdvancedShoppingCart();
  console.log('🛒 Advanced Shopping Cart System loaded!');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedShoppingCart;
}
