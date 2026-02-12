/**
 * Marketplace Integration - Optimized for UX
 * Fixes: CLS on Flash Sales, Search Styling Consistency, and Recommendation Logic
 */

class MarketplaceIntegration {
  constructor() {
    this.apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    this.userId = this.getUserId();
    
    // Debounce helper
    this.debounceTimer = null;
    
    this.init();
  }

  getUserId() {
    try {
      if (window.HybridAuthClient && typeof window.HybridAuthClient.getCurrentUser === 'function') {
        const user = window.HybridAuthClient.getCurrentUser();
        if (user && (user.id || user._id)) {
          return user.id || user._id;
        }
      }
    } catch (_) {}

    return null;
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async init() {
    console.log('🔌 Marketplace Integration initializing...');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupFeatures());
    } else {
      this.setupFeatures();
    }
  }

  setupFeatures() {
    this.setupSearchAutocomplete();
    this.setupRecommendations();
    this.setupFlashSales();
    this.setupRecentlyViewed();
    this.setupProductViewTracking();
    this.setupAbandonedCartTracking();
    console.log('✅ Marketplace Integration ready');
  }

  // ==================== IMPROVED SEARCH AUTOCOMPLETE ====================
  setupSearchAutocomplete() {
    const searchInput = document.getElementById('globalSearchInput') || document.querySelector('.search-input');
    if (!searchInput) return;

    // Use existing HTML structure if possible, or create one with matching classes
    let autocompleteContainer = document.querySelector('.autocomplete-dropdown');
    
    if (!autocompleteContainer) {
      // Fallback creation using CSS classes from marketplace.html
      autocompleteContainer = document.createElement('div');
      autocompleteContainer.className = 'autocomplete-dropdown search-suggestions';
      autocompleteContainer.style.display = 'none'; // Hidden by default
      searchInput.parentElement.appendChild(autocompleteContainer);
    }

    // Input Listener with Debounce
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        autocompleteContainer.style.display = 'none';
        autocompleteContainer.classList.add('hidden');
        return;
      }

      // Show loading state if spinner exists
      const loader = document.querySelector('.search-loader');
      if(loader) loader.classList.remove('hidden');

      this.debounceTimer = setTimeout(() => {
        this.fetchSearchSuggestions(query, autocompleteContainer);
        if(loader) loader.classList.add('hidden');
      }, 300);
    });

    // Hide on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
        autocompleteContainer.style.display = 'none';
        autocompleteContainer.classList.add('hidden');
      }
    });
  }

  async fetchSearchSuggestions(query, container) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/products/suggestions?q=${encodeURIComponent(query)}&limit=6`,
        { headers: this.getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      
      if (data.success && data.suggestions.length > 0) {
        this.renderSearchSuggestions(data.suggestions, container);
        container.style.display = 'block';
        container.classList.remove('hidden');
      } else {
        container.style.display = 'none';
      }
    } catch (error) {
      // Fail silently for UX
      container.style.display = 'none';
    }
  }

  renderSearchSuggestions(suggestions, container) {
    // Reuse existing styling from marketplace.html .suggestion-item
    const html = suggestions.map(item => {
      let icon = 'fa-tag';
      let typeClass = 'tag';
      
      if (item.type === 'product') {
        icon = 'fa-box';
        typeClass = 'product';
      } else if (item.type === 'category') {
        icon = 'fa-folder';
        typeClass = 'category';
      }

      return `
        <div class="suggestion-item" data-type="${item.type}" data-id="${item.id}" onclick="window.marketplaceIntegration.handleSuggestionClick('${item.type}', '${item.id}', '${item.text}')">
          <i class="fas ${icon}"></i>
          <div class="suggestion-text">
            <span class="main-text">${item.text}</span>
            ${item.price ? `<span class="sub-text">₹${item.price}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="suggestion-results">${html}</div>`;
  }

  handleSuggestionClick(type, id, text) {
    if (type === 'product') {
      window.location.href = `product-detail.html?id=${id}`;
    } else {
      // Trigger the main search function defined in marketplace.html
      const searchInput = document.getElementById('globalSearchInput');
      if (searchInput) {
        searchInput.value = text;
        if (window.applyAllFilters) window.applyAllFilters();
      }
    }
  }

  // ==================== RECOMMENDATIONS ====================
  async setupRecommendations() {
    const endpoints = this.userId
      ? [`${this.apiBaseUrl}/recommendations/personalized?limit=8`, `${this.apiBaseUrl}/products?limit=8`]
      : [`${this.apiBaseUrl}/products?limit=8`];

    try {
      let products = [];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
          headers: this.getAuthHeaders(),
          credentials: 'include'
        }).catch(() => null);

        if (!response || !response.ok) continue;

        const data = await response.json().catch(() => ({}));

        const recommendationItems = Array.isArray(data.recommendations)
          ? data.recommendations.map(r => r.product || r)
          : [];

        const productItems = Array.isArray(data.products)
          ? data.products
          : Array.isArray(data?.data?.products)
            ? data.data.products
            : Array.isArray(data?.data)
              ? data.data
              : [];

        products = (recommendationItems.length ? recommendationItems : productItems).filter(Boolean);
        if (products.length) break;
      }

      if (products.length) {
        this.renderRecommendations(products.slice(0, 8), this.userId ? 'personalized' : 'catalog');
      }
    } catch (_) {
      // Silent fallback for UX stability
    }
  }

  renderRecommendations(products, type) {
    // Target the existing empty container in HTML or create one
    let container = document.getElementById('recommended-list'); // Matches marketplace.html ID
    
    if (container) {
        // If using the carousel track
        container.innerHTML = products.map(p => window.createCarouselCard ? window.createCarouselCard(p) : '').join('');
        // Make section visible
        const section = document.getElementById('recommended-products');
        if(section) section.style.display = 'block';
    }
  }

  // ==================== SMOOTH FLASH SALES (NO CLS) ====================
  async setupFlashSales() {
    // Keep disabled unless backend endpoint is explicitly available.
    if (window.APP_CONFIG?.ENABLE_FLASH_SALES !== true) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/flash-sales/active`).catch(() => null);
      if (!response || !response.ok) return;

      const data = await response.json();
      if (data.success && data.sales && data.sales.length > 0) {
        this.renderFlashSales(data.sales);
      }
    } catch (_) {
      // Silent fallback
    }
  }

  renderFlashSales(sales) {
    let container = document.getElementById('flash-sales-section');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'flash-sales-section';
      // Add styles for smooth slide-down animation
      container.style.cssText = `
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition: all 0.5s ease-in-out;
        margin: 0 auto;
        max-width: 1400px;
        padding: 0 2rem;
      `;
      
      // Insert after header to prevent jumping content at very top
      const hero = document.getElementById('hero');
      if (hero) {
        hero.parentNode.insertBefore(container, hero);
      }
    }

    const sale = sales[0]; // Just show first active sale
    const timeRemaining = sale.timeRemainingSeconds || 0;

    container.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 1rem;
        padding: 1.5rem;
        margin: 1rem 0;
        color: white;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      ">
        <div style="flex: 1;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="background: #f59e0b; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">FLASH SALE</span>
                <h2 style="margin:0; font-size: 1.25rem; font-weight: 700;">${sale.name}</h2>
            </div>
            <p style="margin:0.5rem 0 0 0; opacity: 0.9;">${sale.description || 'Limited time offers on premium local products.'}</p>
        </div>
        
        <div style="display: flex; align-items: center; gap: 1.5rem;">
            <div style="text-align: center;">
                <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.8;">Ends In</div>
                <div id="fs-timer-${sale._id}" style="font-family: monospace; font-size: 1.5rem; font-weight: 700;">Loading...</div>
            </div>
            <a href="marketplace.html?flashSale=${sale._id}" style="
                background: white; 
                color: #6366f1; 
                padding: 0.75rem 1.5rem; 
                border-radius: 0.5rem; 
                font-weight: 600; 
                text-decoration: none;
                transition: transform 0.2s;
                white-space: nowrap;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                View Offers <i class="fas fa-arrow-right"></i>
            </a>
        </div>
      </div>
    `;

    // Animate open
    requestAnimationFrame(() => {
        container.style.maxHeight = '200px';
        container.style.opacity = '1';
    });

    if (timeRemaining > 0) {
      this.startTimer(`fs-timer-${sale._id}`, timeRemaining);
    }
  }

  startTimer(elementId, seconds) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const update = () => {
      if (seconds <= 0) {
        el.innerHTML = "Ended";
        return;
      }
      seconds--;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      el.innerHTML = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    };
    
    update();
    setInterval(update, 1000);
  }

  // ==================== TRACKING UTILS ====================
  async setupRecentlyViewed() {
    if (!this.userId) return;
    // Logic to fetch recently viewed can be added here if UI container exists
  }

  setupProductViewTracking() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-product-id]');
      if (card && this.userId) {
        this.trackEvent('product_view', { productId: card.dataset.productId });
      }
    });
  }

  setupAbandonedCartTracking() {
    // Hook into global addToCart if available
    const originalAdd = window.handleAddToCart;
    if (typeof originalAdd === 'function') {
        window.handleAddToCart = async (id) => {
            await originalAdd(id); // Call original
            if (this.userId) this.trackEvent('add_to_cart', { productId: id });
        };
    }
  }

  async trackEvent(type, data) {
    try {
        await fetch(`${this.apiBaseUrl}/analytics/track`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ type, data })
        });
    } catch (e) { /* Ignore tracking errors */ }
  }
}

// Make available globally
window.marketplaceIntegration = new MarketplaceIntegration();
