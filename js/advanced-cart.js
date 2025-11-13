/**
 * advanced-cart-final.js (FIXED VERSION)
 * Fully integrated with your backend API structure
 */

class AdvancedShoppingCart {
  constructor(opts = {}) {
    this.config = Object.assign({
      freeDeliveryThreshold: 500,
      defaultDeliveryFee: 25,
      maxDeliveryFee: 50,
      maxPerItem: 10,
      backupKey: 'quicklocal_cart',
      recommendationsLimit: 4,
      promoEndpoint: '/cart/coupons',
      recommendationsEndpoint: '/products/recommendations'
    }, opts);

    this.cart = [];
    this.cartTotal = 0;
    this.cartCount = 0;
    this.recommendations = [];
    this._loadingCart = false;
    this._pendingQuantityDebouncers = new Map();

    this.bindGlobalEvents();
    console.log('ðŸ›’ Advanced Cart Final initialized');
  }

  // ==================== PUBLIC API ====================

  async initializeCartData() {
    console.log('ðŸ” Auth confirmed â€” initializing cart from server...');
    await this.loadCartFromServer();
    // Don't load recommendations on init to avoid 404s
    // They'll load when needed on the cart page
  }

  getCart() {
    return { items: this.cart, totals: this.calculateTotals() };
  }

  getCartCount() {
    return this.cartCount;
  }

  getCartTotal() {
    return this.cartTotal;
  }

  // ==================== CART ACTIONS ====================

  async addToCart(productId, quantity = 1, variant = null) {
    try {
      console.log('âž• Adding to cart:', { productId, quantity });
      
      const response = await window.HybridAuthClient.apiCall('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, variant })
      });

      const data = await response.json();
      console.log('ðŸ“¦ Add to cart response:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.errors?.[0]?.msg || 'Failed to add item');
      }

      await this.loadCartFromServer();
      this.notify('Item added to cart', 'success');
      this.track('add_to_cart', { productId, quantity });
      return true;
    } catch (err) {
      console.error('âŒ addToCart error:', err);
      this.notify(err.message || 'Failed to add item', 'error');
      return false;
    }
  }

  async removeFromCart(cartId) {
    const item = this.cart.find(i => i.cartId === cartId);
    if (!item) {
      console.warn('âš ï¸  Item not found:', cartId);
      return;
    }

    try {
      console.log('ðŸ—‘ï¸  Removing from cart:', item.productId);
      
      const res = await window.HybridAuthClient.apiCall(`/cart/items/${item.cartId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove');
      }

      await this.loadCartFromServer();
      this.notify('Item removed from cart', 'info');
      this.track('remove_from_cart', { productId: item.productId });
    } catch (err) {
      console.error('âŒ removeFromCart error:', err);
      this.notify(err.message || 'Failed to remove item', 'error');
    }
  }

  async updateQuantity(cartId, newQuantity) {
    console.log('ðŸ”„ Update quantity debounced:', { cartId, newQuantity });
    
    // Debounce to avoid spamming backend
    if (this._pendingQuantityDebouncers.has(cartId)) {
      clearTimeout(this._pendingQuantityDebouncers.get(cartId));
    }
    
    const deb = setTimeout(() => this._updateQuantityNow(cartId, newQuantity), 350);
    this._pendingQuantityDebouncers.set(cartId, deb);
  }

  async _updateQuantityNow(cartId, newQuantity) {
    this._pendingQuantityDebouncers.delete(cartId);
    
    const item = this.cart.find(i => i.cartId === cartId);
    if (!item) return;

    if (newQuantity <= 0) {
      return this.removeFromCart(cartId);
    }

    if (newQuantity > this.config.maxPerItem) {
      this.notify(`Maximum ${this.config.maxPerItem} items allowed`, 'warning');
      this.updateCartUI();
      return;
    }

    try {
      console.log('ðŸ”„ Updating quantity on server:', { productId: item.productId, newQuantity });
      
      const res = await window.HybridAuthClient.apiCall(`/cart/items/${item.cartId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQuantity })
      });

      const data = await res.json();
      console.log('ðŸ“¦ Update quantity response:', data);
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update quantity');
      }

      await this.loadCartFromServer();
      this.notify('Quantity updated', 'success');
      this.track('cart_quantity_change', { productId: item.productId, newQuantity });
    } catch (err) {
      console.error('âŒ updateQuantity error:', err);
      this.notify(err.message || 'Failed to update quantity', 'error');
      await this.loadCartFromServer(); // Reload to fix UI
    }
  }

  async clearCart() {
    if (!confirm('Clear all items from cart?')) return;
    
    try {
      const res = await window.HybridAuthClient.apiCall('/cart/clear', { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to clear');
      }

      await this.loadCartFromServer();
      this.notify('Cart cleared', 'info');
    } catch (err) {
      console.error('âŒ clearCart error:', err);
      this.notify(err.message || 'Failed to clear cart', 'error');
    }
  }

  // ==================== PROMO CODES ====================

  async applyPromoCode(code = null) {
    const coupon = code || document.getElementById('promo-code-input')?.value?.trim();
    
    if (!coupon) {
      this.notify('Please enter a promo code', 'warning');
      return;
    }

    this.notify(`Applying ${coupon}...`, 'info');

    try {
      const resp = await window.HybridAuthClient.apiCall(this.config.promoEndpoint, {
        method: 'POST',
        body: JSON.stringify({ couponCode: coupon })
      });
      
      const data = await resp.json();
      
      if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Invalid promo code');
      }

      await this.loadCartFromServer();
      this.notify('Promo code applied!', 'success');
      this.track('apply_promo', { coupon });
      
      // Clear input
      const input = document.getElementById('promo-code-input');
      if (input) input.value = '';
      
    } catch (err) {
      console.error('âŒ applyPromoCode error:', err);
      this.notify(err.message || 'Invalid promo code', 'error');
    }
  }

  async removePromoCode(code) {
    if (!code) return;
    
    try {
      const resp = await window.HybridAuthClient.apiCall(
        `${this.config.promoEndpoint}/${encodeURIComponent(code)}`, 
        { method: 'DELETE' }
      );
      
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || 'Failed to remove promo');
      }
      
      await this.loadCartFromServer();
      this.notify('Promo removed', 'info');
    } catch (err) {
      console.error('âŒ removePromoCode error:', err);
      this.notify(err.message || 'Failed to remove promo', 'error');
    }
  }

  // ==================== RECOMMENDATIONS ====================

  async loadRecommendations() {
    // Only load if we have cart items
    if (this.cart.length === 0) {
      this.recommendations = [];
      return;
    }

    try {
      // Use the first cart item's product ID for recommendations
      const firstProductId = this.cart[0].productId;
      
      const resp = await window.HybridAuthClient.apiCall(
        `/products/${firstProductId}/recommendations?limit=${this.config.recommendationsLimit}`, 
        { method: 'GET' }
      );
      
      if (!resp.ok) {
        console.warn('âš ï¸  Recommendations not available (status ' + resp.status + ')');
        this.recommendations = [];
        return;
      }
      
      const data = await resp.json();
      
      if (data.success && data.recommendations) {
        this.recommendations = data.recommendations.slice(0, this.config.recommendationsLimit);
        console.log('âœ… Loaded recommendations:', this.recommendations.length);
      } else {
        this.recommendations = [];
      }
      
      this.updateCartUI();
      
    } catch (err) {
      console.error('âŒ loadRecommendations error:', err);
      this.recommendations = [];
    }
  }

  // ==================== CALCULATIONS ====================

  calculateTotals() {
    let subtotal = 0;
    let savings = 0;
    let deliveryFee = 0;
    let itemCount = 0;

    for (const item of this.cart) {
      const price = Number(item.price || 0);
      const orig = Number(item.originalPrice ?? price);
      const qty = Number(item.quantity || 0);

      subtotal += price * qty;
      savings += Math.max(0, (orig - price) * qty);
      itemCount += qty;
    }

    // Delivery fee logic
    if (subtotal >= this.config.freeDeliveryThreshold) {
      deliveryFee = 0;
    } else {
      deliveryFee = this.config.defaultDeliveryFee;
    }

    const total = subtotal + deliveryFee;

    this.cartTotal = total;
    this.cartCount = itemCount;

    return {
      itemCount,
      subtotal,
      savings,
      deliveryFee,
      total,
      freeDeliveryThreshold: this.config.freeDeliveryThreshold,
      amountForFreeDelivery: Math.max(0, this.config.freeDeliveryThreshold - subtotal)
    };
  }

  // ==================== SERVER SYNC ====================

  async loadCartFromServer() {
    if (this._loadingCart) {
      console.warn('âš ï¸  Cart load already in progress');
      return this.cart;
    }
    
    this._loadingCart = true;

    const fetchOnce = async () => {
      console.log('ðŸ“¡ Fetching cart from server...');
      
      const res = await window.HybridAuthClient.apiCall('/cart', { method: 'GET' });
      
      if (!res.ok) {
        if (res.status === 401) {
          this.notify('Session expired. Please log in again.', 'error');
          throw Object.assign(new Error('Unauthorized'), { code: 401 });
        }
        throw Object.assign(
          new Error(`Cart fetch failed (status ${res.status})`), 
          { code: res.status }
        );
      }
      
      const payload = await res.json();
      console.log('ðŸ“¦ Server cart response:', payload);
      
      if (!payload.success) {
        throw new Error(payload.message || 'Cart fetch failed');
      }

      // ==================================================================
      // == START: FIX
      // == The logic was incorrectly looking for `payload.data.availableItems`
      // == which doesn't exist. It is now corrected to look for
      // == `payload.data.items` as per the backend controller.
      // ==================================================================
      const serverItems = payload.data?.items 
                       ?? payload.data 
                       ?? [];

      console.log(`âœ… Found ${serverItems.length} cart items from 'payload.data.items'`);
      // ==================================================================
      // == END: FIX
      // ==================================================================
      
      this.cart = this.formatServerCart(serverItems);
      console.log('ðŸ›’ Formatted cart:', this.cart);
      
      this.updateCartUI();
      this.saveCartBackup();
      
      return this.cart;
    };

    try {
      try {
        return await fetchOnce();
      } catch (err) {
        // Retry once for 5xx or network errors
        const retryable = err && (err.code >= 500 || err.name === 'TypeError');
        if (retryable) {
          console.warn('âš ï¸  Retrying cart fetch...');
          await this._delay(500);
          return await fetchOnce();
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('âŒ loadCartFromServer final error:', err);
      this.handleCartLoadFailure(err);
      return this.cart;
    } finally {
      this._loadingCart = false;
    }
  }

  formatServerCart(serverItems) {
    if (!Array.isArray(serverItems)) {
      console.warn('âš ï¸  Server items not an array:', serverItems);
      return [];
    }

    console.log('ðŸ”„ Formatting cart items...');

    const formatted = serverItems.map((it, idx) => {
      try {
        // Support both nested product object and flat item
        const product = it.product ?? it;
        const productId = product._id || product.id || it.productId;
        
        if (!productId) {
          console.warn(`âš ï¸  Item ${idx} missing product ID`, it);
          return null;
        }

        const name = product.name || product.title || it.name || 'Product';
        
        // Handle images
        const images = product.images || [];
        let imageUrl = 'https://via.placeholder.com/100';
        
        if (Array.isArray(images) && images.length > 0) {
          const first = images[0];
          imageUrl = first.url || first.src || first;
        } else if (product.image) {
          imageUrl = product.image;
        }

        // Calculate pricing
        const originalPrice = Number(
          product.originalPrice ?? product.price ?? it.priceAtAdd ?? 0
        );
        const discount = Number(
          product.discountPercentage ?? product.discount ?? 0
        );
        const price = discount > 0 
          ? originalPrice * (1 - discount / 100) 
          : originalPrice;

        const formattedItem = {
          cartId: it._id || `temp-${idx}`,
          productId,
          name,
          price,
          originalPrice,
          discount,
          image: imageUrl,
          quantity: Number(it.quantity ?? 1),
          stock: Number(product.stock ?? it.stock ?? 100),
          seller: product.seller ?? it.seller ?? null,
          category: product.category ?? it.category ?? null,
          variant: it.selectedVariant ?? it.variant ?? null,
          deliveryInfo: product.deliveryInfo ?? it.deliveryInfo ?? { 
            time: '20-30 mins', 
            fee: 0 
          },
          addedAt: it.addedAt || new Date().toISOString()
        };

        console.log(`âœ… Formatted item ${idx}: ${formattedItem.name}`);
        return formattedItem;
        
      } catch (err) {
        console.error(`âŒ Error formatting item ${idx}:`, err, it);
        return null;
      }
    }).filter(Boolean);

    return formatted;
  }

  // ==================== FALLBACKS ====================

  handleCartLoadFailure(error) {
    console.error('ðŸ’¥ Cart load failure:', error);
    
    // Try backup
    try {
      const raw = localStorage.getItem(this.config.backupKey);
      if (raw) {
        const backup = JSON.parse(raw);
        if (Array.isArray(backup) && backup.length) {
          this.cart = backup;
          this.notify('Loaded saved cart (offline mode)', 'warning');
          this.updateCartUI();
          return;
        }
      }
    } catch (e) {
      console.warn('âš ï¸  Failed to load backup:', e);
    }

    // Empty cart
    this.cart = [];
    const msg = error?.code === 401 
      ? 'Please log in to view your cart' 
      : 'Could not load your cart';
    this.notify(msg, 'error');
    this.updateCartUI();
  }

  saveCartBackup() {
    try {
      localStorage.setItem(this.config.backupKey, JSON.stringify(this.cart));
    } catch (err) {
      console.warn('âš ï¸  saveCartBackup failed:', err);
    }
  }

  // ==================== UI RENDERING ====================

  updateCartUI() {
    const totals = this.calculateTotals();
    
    this.updateCartBadge(totals.itemCount);
    this.updateCartDropdown();
    
    // Update cart page if present
    if (document.getElementById('cart-items-container')) {
      this.renderCartPage();
      this.loadRecommendations(); // <--- FIX: MOVED HERE FROM renderCartPage()
    }
    
    // Update summary (standalone or embedded)
    const summaryContainer = document.getElementById('cart-summary');
    if (summaryContainer) {
      summaryContainer.outerHTML = this.renderCartSummary(totals);
    }
    
    this.updateEmptyState();
  }

  updateCartBadge(count) {
    const badges = document.querySelectorAll('.cart-badge, .cart-count');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }

  updateCartDropdown() {
    const dropdown = document.getElementById('cart-dropdown');
    if (!dropdown) return;
    
    const items = this.cart.slice(0, 3);
    
    dropdown.innerHTML = `
      <div class="cart-dropdown-header">
        <h3>Shopping Cart (${this.cartCount})</h3>
        ${this.cart.length > 3 ? `<span class="more-items">+${this.cart.length - 3} more</span>` : ''}
      </div>
      <div class="cart-dropdown-items">
        ${items.length 
          ? items.map(i => this.renderDropdownItem(i)).join('') 
          : '<div class="empty-cart-dropdown">Your cart is empty</div>'}
      </div>
      <div class="cart-dropdown-footer">
        <div class="cart-total">Total: â‚¹${this.cartTotal.toFixed(2)}</div>
        <div class="cart-actions">
          <button class="btn-secondary" onclick="window.location.href='cart.html'">View Cart</button>
          <button class="btn-primary" onclick="window.location.href='checkout.html'" ${!this.cart.length ? 'disabled' : ''}>
            Checkout
          </button>
        </div>
      </div>
    `;
  }

  renderDropdownItem(item) {
    return `
      <div class="cart-dropdown-item" data-cart-id="${item.cartId}">
        <img src="${item.image}" alt="${this._esc(item.name)}" class="item-image">
        <div class="item-details">
          <h4>${this._esc(item.name)}</h4>
          <div class="item-price">
            â‚¹${item.price.toFixed(2)} Ã— ${item.quantity}
            ${item.discount > 0 ? `<span class="original-price">â‚¹${item.originalPrice.toFixed(2)}</span>` : ''}
          </div>
        </div>
        <button class="remove-item" onclick="advancedCart.removeFromCart('${item.cartId}')" title="Remove">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }

  // ==================== CART PAGE ====================

  renderCartPage() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    const loadingEl = document.getElementById('loadingContainer');
    if (loadingEl) loadingEl.style.display = 'none';

    if (!this.cart.length) {
      const emptyEl = document.getElementById('emptyCart');
      if (emptyEl) emptyEl.style.display = 'block';
      container.innerHTML = '';
      return;
    }

    const emptyEl = document.getElementById('emptyCart');
    if (emptyEl) emptyEl.style.display = 'none';

    container.innerHTML = `
      <div class="cart-content">
        <div class="cart-items">
          ${this.renderCartItemsSection()}
        </div>
        <div class="cart-summary">
          ${this.renderCartSummary()}
        </div>
      </div>
    `;

    // Bind events after DOM insertion
    this.bindCartEvents();
    
    // Load recommendations after cart is rendered
    // this.loadRecommendations(); // <--- FIX: REMOVED FROM HERE
  }

  renderCartItemsSection() {
    return `
      <div class="section-header">
        <h2>Shopping Cart (${this.cartCount} item${this.cartCount !== 1 ? 's' : ''})</h2>
        ${this.cart.length > 0 ? '<button class="clear-cart-btn" onclick="advancedCart.clearCart()">Clear All</button>' : ''}
      </div>
      ${this.cart.map(item => this.renderCartItem(item)).join('')}
      ${this.renderCartRecommendations()}
    `;
  }

  renderCartItem(item) {
    const max = Math.min(this.config.maxPerItem, item.stock || this.config.maxPerItem);
    
    return `
      <div class="cart-item" data-cart-id="${item.cartId}">
        <img src="${item.image}" alt="${this._esc(item.name)}" class="item-image">
        
        <div class="item-info">
          <h3 class="item-name">${this._esc(item.name)}</h3>
          ${item.variant ? `<div class="item-variant">${this._esc(this.formatVariant(item.variant))}</div>` : ''}
          ${item.seller?.name ? `<div class="item-seller">Sold by: ${this._esc(item.seller.name)}</div>` : ''}
          
          <div class="item-price">
            â‚¹${item.price.toFixed(2)}
            ${item.discount > 0 ? `
              <span class="original-price">â‚¹${item.originalPrice.toFixed(2)}</span>
              <span class="discount-tag">${item.discount}% OFF</span>
            ` : ''}
          </div>
          
          ${item.stock < 10 ? `<div class="stock-warning">Only ${item.stock} left in stock</div>` : ''}
        </div>
        
        <div class="item-actions">
          <div class="quantity-controls">
            <button class="qty-btn" onclick="advancedCart.updateQuantity('${item.cartId}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <span class="quantity">${item.quantity}</span>
            <button class="qty-btn" onclick="advancedCart.updateQuantity('${item.cartId}', ${item.quantity + 1})" ${item.quantity >= max ? 'disabled' : ''}>
              <i class="fas fa-plus"></i>
            </button>
          </div>
          
          <div class="item-total">â‚¹${(item.price * item.quantity).toFixed(2)}</div>
          
          <button class="remove-btn" onclick="advancedCart.removeFromCart('${item.cartId}')" title="Remove">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  renderCartRecommendations() {
    if (!this.recommendations || !this.recommendations.length) return '';
    
    return `
      <div class="recommendations-section">
        <h3>ðŸŽ¯ You might also like</h3>
        <div class="recommendations-grid">
          ${this.recommendations.map(p => this.renderRecommendationItem(p)).join('')}
        </div>
      </div>
    `;
  }

  renderRecommendationItem(product) {
    const id = product._id || product.id || '';
    const name = product.name || product.title || 'Product';
    const img = product.images?.[0]?.url || product.image || 'https://via.placeholder.com/150';
    const price = Number(product.price ?? 0);
    const discount = Number(product.discountPercentage ?? 0);
    const final = discount > 0 ? price * (1 - discount / 100) : price;

    return `
      <div class="recommendation-item" data-product-id="${id}">
        <img src="${img}" alt="${this._esc(name)}" class="rec-image">
        <div class="rec-details">
          <h4>${this._esc(name)}</h4>
          <div class="rec-price">
            <span>â‚¹${final.toFixed(2)}</span>
            ${discount > 0 ? `<span class="original-price">â‚¹${price.toFixed(2)}</span>` : ''}
          </div>
        </div>
        <button class="add-rec-btn" onclick="advancedCart.addToCart('${id}')">
          <i class="fas fa-plus"></i> Add
        </button>
      </div>
    `;
  }

  renderCartSummary(totals = null) {
    if (!totals) totals = this.calculateTotals();

    return `
      <div class="cart-summary" id="cart-summary">
        <div class="summary-title">Order Summary</div>
        
        <div class="summary-row">
          <span class="summary-label">Items (${totals.itemCount})</span>
          <span class="summary-value">â‚¹${totals.subtotal.toFixed(2)}</span>
        </div>
        
        ${totals.savings > 0 ? `
          <div class="summary-row">
            <span class="summary-label" style="color: var(--success)">You saved</span>
            <span class="summary-value" style="color: var(--success)">-â‚¹${totals.savings.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="summary-row">
          <span class="summary-label">Delivery Fee</span>
          <span class="summary-value">
            ${totals.deliveryFee === 0 ? 'FREE' : `â‚¹${totals.deliveryFee.toFixed(2)}`}
          </span>
        </div>
        
        ${totals.amountForFreeDelivery > 0 ? `
          <div style="margin: 1rem 0; padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius);">
            <div style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
              Add â‚¹${totals.amountForFreeDelivery.toFixed(2)} more for FREE delivery
            </div>
            <div style="height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; background: var(--primary); width: ${Math.min(100, (totals.subtotal / totals.freeDeliveryThreshold) * 100)}%;"></div>
            </div>
          </div>
        ` : `
          <div style="color: var(--success); padding: 0.5rem; text-align: center;">
            <i class="fas fa-truck"></i> FREE Delivery achieved!
          </div>
        `}
        
        <div class="summary-row total">
          <span class="summary-label">Total</span>
          <span class="summary-value total">â‚¹${totals.total.toFixed(2)}</span>
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
          <input 
            type="text" 
            id="promo-code-input" 
            placeholder="Enter promo code" 
            style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 0.5rem;"
          >
          <button 
            onclick="advancedCart.applyPromoCode()"
            style="width: 100%; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: var(--radius); cursor: pointer; font-weight: 600;"
          >
            Apply Promo Code
          </button>
        </div>

        <button 
          class="checkout-btn" 
          onclick="window.location.href='checkout.html'" 
          ${!this.cart.length ? 'disabled' : ''}
        >
          <i class="fas fa-lock"></i>
          Proceed to Checkout
        </button>
      </div>
    `;
  }

  updateEmptyState() {
    const el = document.getElementById('emptyCart');
    if (!el) return;
    el.style.display = this.cart.length ? 'none' : 'block';
  }

  // ==================== EVENTS ====================

  bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const cartIcon = e.target.closest('.cart-icon, .cart-btn');
      const cartDropdown = e.target.closest('.cart-dropdown-container');
      
      if (cartIcon) {
        this.toggleCartDropdown();
      } else if (!cartDropdown) {
        this.hideCartDropdown();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.saveCartBackup();
    });
  }

  bindCartEvents() {
    // Bind quantity input changes (for manual typing)
    const qtyInputs = document.querySelectorAll('.qty-input');
    qtyInputs.forEach(input => {
      if (input._advancedCartBound) return;
      input._advancedCartBound = true;

      input.addEventListener('input', (e) => {
        const el = e.target;
        let val = parseInt(el.value, 10) || 1;
        const max = parseInt(el.max, 10) || this.config.maxPerItem;
        val = Math.min(Math.max(1, val), max);
        el.value = val;

        const cartId = el.closest('.cart-item')?.dataset?.cartId;
        if (cartId) {
          this.updateQuantity(cartId, val);
        }
      });
    });
  }

  toggleCartDropdown() {
    const dd = document.getElementById('cart-dropdown');
    if (!dd) return;
    
    dd.classList.toggle('show');
    if (dd.classList.contains('show')) {
      this.updateCartDropdown();
    }
  }

  showCartDropdown() {
    const dd = document.getElementById('cart-dropdown');
    if (dd) {
      dd.classList.add('show');
      this.updateCartDropdown();
    }
  }

  hideCartDropdown() {
    const dd = document.getElementById('cart-dropdown');
    if (dd) dd.classList.remove('show');
  }

  // ==================== UTILITIES ====================

  notify(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  track(event, data = {}) {
    if (typeof gtag !== 'undefined') {
      try {
        gtag('event', event, { event_category: 'ecommerce', ...data });
      } catch (e) {
        console.warn('Analytics tracking failed:', e);
      }
    }
    console.log(`ðŸ“Š Analytics: ${event}`, data);
  }

  formatVariant(variant) {
    if (!variant) return '';
    if (typeof variant === 'string') return variant;
    return Object.entries(variant)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  _esc(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[s]));
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

// ==================== INITIALIZE ====================

window.advancedCart = new AdvancedShoppingCart();
console.log('ðŸ›’ Advanced Cart Final loaded and ready!');

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedShoppingCart;
}