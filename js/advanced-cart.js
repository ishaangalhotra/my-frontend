/**
 * advanced-cart-final.js (FIXED VERSION)
 * Fully integrated with your backend API structure
 * Fixes: Added 5% Tax calculation and UI row.
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
    console.log('🛒 Advanced Cart Final initialized');
  }

  // ==================== PUBLIC API ====================

  async initializeCartData() {
    console.log('🔍 Auth confirmed — initializing cart from server...');
    await this.loadCartFromServer();
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
      console.log('➕ Adding to cart:', { productId, quantity });
      
      const response = await window.HybridAuthClient.apiCall('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, variant })
      });

      const data = await response.json();
      console.log('📦 Add to cart response:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.errors?.[0]?.msg || 'Failed to add item');
      }

      await this.loadCartFromServer();
      this.notify('Item added to cart', 'success');
      this.track('add_to_cart', { productId, quantity });
      return true;
    } catch (err) {
      console.error('❌ addToCart error:', err);
      this.notify(err.message || 'Failed to add item', 'error');
      return false;
    }
  }

  async removeFromCart(cartId) {
    const item = this.cart.find(i => i.cartId === cartId);
    if (!item) {
      console.warn('⚠️ Item not found:', cartId);
      return;
    }

    try {
      console.log('🗑️ Removing from cart:', item.productId);
      
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
      console.error('❌ removeFromCart error:', err);
      this.notify(err.message || 'Failed to remove item', 'error');
    }
  }

  async updateQuantity(cartId, newQuantity) {
    console.log('🔄 Update quantity debounced:', { cartId, newQuantity });
    
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
      console.log('🔄 Updating quantity on server:', { productId: item.productId, newQuantity });
      
      const res = await window.HybridAuthClient.apiCall(`/cart/items/${item.cartId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQuantity })
      });

      const data = await res.json();
      console.log('📦 Update quantity response:', data);
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update quantity');
      }

      await this.loadCartFromServer();
      this.notify('Quantity updated', 'success');
      this.track('cart_quantity_change', { productId: item.productId, newQuantity });
    } catch (err) {
      console.error('❌ updateQuantity error:', err);
      this.notify(err.message || 'Failed to update quantity', 'error');
      await this.loadCartFromServer();
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
      console.error('❌ clearCart error:', err);
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
      
      const input = document.getElementById('promo-code-input');
      if (input) input.value = '';
      
    } catch (err) {
      console.error('❌ applyPromoCode error:', err);
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
      console.error('❌ removePromoCode error:', err);
      this.notify(err.message || 'Failed to remove promo', 'error');
    }
  }

  // ==================== RECOMMENDATIONS ====================

  async loadRecommendations() {
    if (this.cart.length === 0) {
      this.recommendations = [];
      return;
    }

    try {
      const firstProductId = this.cart[0].productId;
      
      const resp = await window.HybridAuthClient.apiCall(
        `/products/${firstProductId}/recommendations?limit=${this.config.recommendationsLimit}`, 
        { method: 'GET' }
      );
      
      if (!resp.ok) {
        this.recommendations = [];
        return;
      }
      
      const data = await resp.json();
      
      if (data.success && data.recommendations) {
        this.recommendations = data.recommendations.slice(0, this.config.recommendationsLimit);
      } else {
        this.recommendations = [];
      }
      
      this.updateCartUI();
      
    } catch (err) {
      console.error('❌ loadRecommendations error:', err);
      this.recommendations = [];
    }
  }

  // ==================== CALCULATIONS (FIXED) ====================

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

    // ✅ FIX: ADD TAX CALCULATION (5%)
    const tax = subtotal * 0.05;

    // ✅ FIX: INCLUDE TAX IN TOTAL
    const total = subtotal + deliveryFee + tax;

    this.cartTotal = total;
    this.cartCount = itemCount;

    return {
      itemCount,
      subtotal,
      savings,
      deliveryFee,
      tax, // Export tax for rendering
      total,
      freeDeliveryThreshold: this.config.freeDeliveryThreshold,
      amountForFreeDelivery: Math.max(0, this.config.freeDeliveryThreshold - subtotal)
    };
  }

  // ==================== SERVER SYNC ====================

  async loadCartFromServer() {
    if (this._loadingCart) {
      return this.cart;
    }
    
    this._loadingCart = true;

    const fetchOnce = async () => {
      console.log('📡 Fetching cart from server...');
      
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
      console.log('📦 Server cart response:', payload);
      
      if (!payload.success) {
        throw new Error(payload.message || 'Cart fetch failed');
      }

      const serverItems = payload.data?.items ?? payload.data ?? [];
      
      this.cart = this.formatServerCart(serverItems);
      this.updateCartUI();
      this.saveCartBackup();
      
      return this.cart;
    };

    try {
      try {
        return await fetchOnce();
      } catch (err) {
        const retryable = err && (err.code >= 500 || err.name === 'TypeError');
        if (retryable) {
          await this._delay(500);
          return await fetchOnce();
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('❌ loadCartFromServer final error:', err);
      this.handleCartLoadFailure(err);
      return this.cart;
    } finally {
      this._loadingCart = false;
    }
  }

  formatServerCart(serverItems) {
    if (!Array.isArray(serverItems)) return [];

    return serverItems.map((it, idx) => {
      try {
        const product = it.product ?? it;
        const productId = product._id || product.id || it.productId;
        
        if (!productId) return null;

        const name = product.name || product.title || it.name || 'Product';
        const images = product.images || [];
        let imageUrl = 'https://via.placeholder.com/100';
        
        if (Array.isArray(images) && images.length > 0) {
          const first = images[0];
          imageUrl = first.url || first.src || first;
        } else if (product.image) {
          imageUrl = product.image;
        }

        const originalPrice = Number(product.originalPrice ?? product.price ?? it.priceAtAdd ?? 0);
        const discount = Number(product.discountPercentage ?? product.discount ?? 0);
        const price = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

        return {
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
          addedAt: it.addedAt || new Date().toISOString()
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);
  }

  // ==================== FALLBACKS ====================

  handleCartLoadFailure(error) {
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
    } catch (e) {}

    this.cart = [];
    const msg = error?.code === 401 ? 'Please log in' : 'Could not load cart';
    this.notify(msg, 'error');
    this.updateCartUI();
  }

  saveCartBackup() {
    try {
      localStorage.setItem(this.config.backupKey, JSON.stringify(this.cart));
    } catch (err) {}
  }

  // ==================== UI RENDERING ====================

  updateCartUI() {
    const totals = this.calculateTotals();
    
    this.updateCartBadge(totals.itemCount);
    this.updateCartDropdown();
    
    if (document.getElementById('cart-items-container')) {
      this.renderCartPage();
    }
    
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
      </div>
      <div class="cart-dropdown-items">
        ${items.length 
          ? items.map(i => this.renderDropdownItem(i)).join('') 
          : '<div class="empty-cart-dropdown">Your cart is empty</div>'}
      </div>
      <div class="cart-dropdown-footer">
        <div class="cart-total">Total: ₹${this.cartTotal.toFixed(2)}</div>
        <div class="cart-actions">
          <button class="btn-secondary" onclick="window.location.href='cart.html'">View Cart</button>
          <button class="btn-primary" onclick="window.location.href='checkout.html'" ${!this.cart.length ? 'disabled' : ''}>Checkout</button>
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
          <div class="item-price">₹${item.price.toFixed(2)} × ${item.quantity}</div>
        </div>
        <button class="remove-item" onclick="advancedCart.removeFromCart('${item.cartId}')">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }

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

    this.bindCartEvents();
  }

  renderCartItemsSection() {
    return `
      <div class="section-header">
        <h2>Shopping Cart (${this.cartCount} items)</h2>
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
          <div class="item-price">
            ₹${item.price.toFixed(2)}
            ${item.discount > 0 ? `<span class="original-price">₹${item.originalPrice.toFixed(2)}</span>` : ''}
          </div>
        </div>
        
        <div class="item-actions">
          <div class="quantity-controls">
            <button class="qty-btn" onclick="advancedCart.updateQuantity('${item.cartId}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="qty-btn" onclick="advancedCart.updateQuantity('${item.cartId}', ${item.quantity + 1})" ${item.quantity >= max ? 'disabled' : ''}>+</button>
          </div>
          <div class="item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
          <button class="remove-btn" onclick="advancedCart.removeFromCart('${item.cartId}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  }

  renderCartRecommendations() {
    if (!this.recommendations || !this.recommendations.length) return '';
    return `
      <div class="recommendations-section">
        <h3>🎯 You might also like</h3>
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
          <div class="rec-price">₹${final.toFixed(2)}</div>
        </div>
        <button class="add-rec-btn" onclick="advancedCart.addToCart('${id}')">Add</button>
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
          <span class="summary-value">₹${totals.subtotal.toFixed(2)}</span>
        </div>
        
        ${totals.savings > 0 ? `
          <div class="summary-row">
            <span class="summary-label" style="color: var(--success)">You saved</span>
            <span class="summary-value" style="color: var(--success)">-₹${totals.savings.toFixed(2)}</span>
          </div>
        ` : ''}
        
        <div class="summary-row">
          <span class="summary-label">Delivery Fee</span>
          <span class="summary-value">
            ${totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee.toFixed(2)}`}
          </span>
        </div>
        
        <div class="summary-row">
          <span class="summary-label">Tax (5%)</span>
          <span class="summary-value">₹${totals.tax.toFixed(2)}</span>
        </div>
        
        <div class="summary-row total">
          <span class="summary-label">Total</span>
          <span class="summary-value total">₹${totals.total.toFixed(2)}</span>
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
          <input type="text" id="promo-code-input" placeholder="Enter promo code" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); margin-bottom: 0.5rem;">
          <button onclick="advancedCart.applyPromoCode()" style="width: 100%; padding: 0.75rem; background: var(--primary); color: white; border: none; cursor: pointer;">Apply Promo</button>
        </div>

        <button class="checkout-btn" onclick="window.location.href='checkout.html'" ${!this.cart.length ? 'disabled' : ''}>
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

  bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const cartIcon = e.target.closest('.cart-icon, .cart-btn');
      const cartDropdown = e.target.closest('.cart-dropdown-container');
      if (cartIcon) this.toggleCartDropdown();
      else if (!cartDropdown) this.hideCartDropdown();
    });
    window.addEventListener('beforeunload', () => this.saveCartBackup());
  }

  bindCartEvents() {
    const qtyInputs = document.querySelectorAll('.qty-input');
    qtyInputs.forEach(input => {
      if (input._advancedCartBound) return;
      input._advancedCartBound = true;
      input.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10) || 1;
        const cartId = e.target.closest('.cart-item')?.dataset?.cartId;
        if (cartId) this.updateQuantity(cartId, val);
      });
    });
  }

  toggleCartDropdown() {
    const dd = document.getElementById('cart-dropdown');
    if (dd) dd.classList.toggle('show');
    if (dd?.classList.contains('show')) this.updateCartDropdown();
  }

  hideCartDropdown() {
    const dd = document.getElementById('cart-dropdown');
    if (dd) dd.classList.remove('show');
  }

  notify(message, type = 'info') {
    if (window.showToast) window.showToast(message, type);
    else console.log(`${type.toUpperCase()}: ${message}`);
  }

  track(event, data = {}) {
    if (typeof gtag !== 'undefined') gtag('event', event, { event_category: 'ecommerce', ...data });
  }

  _esc(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

window.advancedCart = new AdvancedShoppingCart();
if (typeof module !== 'undefined' && module.exports) module.exports = AdvancedShoppingCart;