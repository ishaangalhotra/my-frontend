/**
 * Marketplace Integration - Connects all new backend features to marketplace.html
 * This file integrates: Recommendations, Flash Sales, Reviews, Search Autocomplete, etc.
 */

class MarketplaceIntegration {
  constructor() {
    this.apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    this.token = localStorage.getItem('token') || localStorage.getItem('quicklocal_access_token');
    this.userId = this.getUserId();
    
    // Initialize on load
    this.init();
  }

  getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('quicklocal_user') || '{}');
      return user.id || user._id || null;
    } catch {
      return null;
    }
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async init() {
    console.log('🔌 Marketplace Integration initializing...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupFeatures());
    } else {
      this.setupFeatures();
    }
  }

  setupFeatures() {
    // Setup search autocomplete
    this.setupSearchAutocomplete();
    
    // Setup recommendations
    this.setupRecommendations();
    
    // Setup flash sales
    this.setupFlashSales();
    
    // Setup recently viewed
    this.setupRecentlyViewed();
    
    // Setup product view tracking
    this.setupProductViewTracking();
    
    // Setup abandoned cart tracking
    this.setupAbandonedCartTracking();
    
    console.log('✅ Marketplace Integration ready');
  }

  // ==================== SEARCH AUTOCOMPLETE ====================
  setupSearchAutocomplete() {
    const searchInput = document.querySelector('.search-input, #product-search, input[type="search"]');
    if (!searchInput) return;

    let autocompleteContainer = document.getElementById('search-autocomplete');
    if (!autocompleteContainer) {
      autocompleteContainer = document.createElement('div');
      autocompleteContainer.id = 'search-autocomplete';
      autocompleteContainer.className = 'search-autocomplete';
      autocompleteContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        margin-top: 0.5rem;
      `;
      searchInput.parentElement.style.position = 'relative';
      searchInput.parentElement.appendChild(autocompleteContainer);
    }

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        autocompleteContainer.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(() => {
        this.fetchSearchSuggestions(query, autocompleteContainer);
      }, 300);
    });

    // Hide on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
        autocompleteContainer.style.display = 'none';
      }
    });
  }

  async fetchSearchSuggestions(query, container) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/products/suggestions?q=${encodeURIComponent(query)}&limit=8`,
        { headers: this.getAuthHeaders() }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      
      if (data.success && data.suggestions.length > 0) {
        this.renderSearchSuggestions(data.suggestions, container);
        container.style.display = 'block';
      } else {
        container.style.display = 'none';
      }
    } catch (error) {
      console.error('Search autocomplete error:', error);
      container.style.display = 'none';
    }
  }

  renderSearchSuggestions(suggestions, container) {
    container.innerHTML = suggestions.map(item => {
      if (item.type === 'product') {
        return `
          <div class="suggestion-item" data-type="product" data-id="${item.id}" style="
            padding: 0.75rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.2s;
          " onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            ${item.image ? `<img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 0.25rem;">` : ''}
            <div style="flex: 1;">
              <div style="font-weight: 500; color: #0f172a;">${item.text}</div>
              <div style="font-size: 0.875rem; color: #64748b;">₹${item.price} ${item.brand ? '• ' + item.brand : ''}</div>
            </div>
          </div>
        `;
      } else if (item.type === 'category') {
        return `
          <div class="suggestion-item" data-type="category" data-id="${item.id}" style="
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.2s;
          " onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            <i class="fas fa-folder" style="margin-right: 0.5rem; color: #6366f1;"></i>
            ${item.text}
          </div>
        `;
      } else {
        return `
          <div class="suggestion-item" data-type="${item.type}" style="
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.2s;
          " onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            <i class="fas fa-tag" style="margin-right: 0.5rem; color: #f59e0b;"></i>
            ${item.text}
          </div>
        `;
      }
    }).join('');

    // Add click handlers
    container.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        const id = item.dataset.id;
        
        if (type === 'product') {
          window.location.href = `/product-detail.html?id=${id}`;
        } else if (type === 'category') {
          window.location.href = `/marketplace.html?category=${id}`;
        } else {
          // Search for brand/tag
          window.location.href = `/marketplace.html?search=${encodeURIComponent(item.textContent.trim())}`;
        }
      });
    });
  }

  // ==================== RECOMMENDATIONS ====================
  async setupRecommendations() {
    if (!this.userId) {
      // Show trending recommendations for non-logged-in users
      this.loadTrendingRecommendations();
      return;
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/recommendations/personalized?limit=12`,
        { headers: this.getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recommendations.length > 0) {
          this.renderRecommendations(data.recommendations, 'personalized');
        }
      }
    } catch (error) {
      console.error('Recommendations error:', error);
      this.loadTrendingRecommendations();
    }
  }

  async loadTrendingRecommendations() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/recommendations/trending?limit=12`).catch(() => null);
      if (!response || !response.ok) {
        console.log('⚠️ Trending recommendations not available (404) - this is optional');
        return;
      }
      const data = await response.json();
      if (data.success && data.recommendations && data.recommendations.length > 0) {
        this.renderRecommendations(data.recommendations, 'trending');
      }
    } catch (error) {
      console.error('Trending recommendations error:', error);
    }
  }

  renderRecommendations(recommendations, type) {
    let container = document.getElementById('recommendations-section');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recommendations-section';
      container.className = 'recommendations-section';
      container.style.cssText = `
        margin: 2rem 0;
        padding: 1.5rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;
      
      const productsContainer = document.querySelector('.products-grid, #products-container');
      if (productsContainer) {
        productsContainer.parentElement.insertBefore(container, productsContainer);
      }
    }

    container.innerHTML = `
      <h2 style="margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700;">
        ${type === 'personalized' ? '✨ Recommended for You' : '🔥 Trending Now'}
      </h2>
      <div class="recommendations-grid" style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      ">
        ${recommendations.map(rec => {
          const product = rec.product;
          return `
            <div class="product-card" style="
              background: white;
              border-radius: 0.5rem;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              cursor: pointer;
              transition: transform 0.2s;
            " onclick="window.location.href='/product-detail.html?id=${product._id || product.id}'">
              <img src="${product.images?.[0]?.url || 'https://placehold.co/200x200'}" 
                   style="width: 100%; height: 200px; object-fit: cover;">
              <div style="padding: 1rem;">
                <h3 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; 
                           overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${product.name}
                </h3>
                <div style="font-size: 1.125rem; font-weight: 700; color: #6366f1;">
                  ₹${product.price}
                </div>
                ${product.averageRating ? `
                  <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #64748b;">
                    ⭐ ${product.averageRating} (${product.reviewCount || 0})
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ==================== FLASH SALES ====================
  async setupFlashSales() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/flash-sales/active`).catch(() => null);
      if (!response || !response.ok) {
        console.log('⚠️ Flash sales not available (404) - this is optional');
        return;
      }
      const data = await response.json();
      if (data.success && data.sales && data.sales.length > 0) {
        this.renderFlashSales(data.sales);
      }
    } catch (error) {
      console.error('Flash sales error:', error);
    }
  }

  renderFlashSales(sales) {
    let container = document.getElementById('flash-sales-section');
    if (!container) {
      container = document.createElement('div');
      container.id = 'flash-sales-section';
      container.className = 'flash-sales-section';
      container.style.cssText = `
        margin: 2rem 0;
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 1rem;
        color: white;
      `;
      
      const header = document.querySelector('.header, .nav-container');
      if (header) {
        header.parentElement.insertBefore(container, header.nextSibling);
      }
    }

    sales.forEach(sale => {
      const timeRemaining = sale.timeRemainingSeconds || 0;
      const hours = Math.floor(timeRemaining / 3600);
      const minutes = Math.floor((timeRemaining % 3600) / 60);
      const seconds = timeRemaining % 60;

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
              ⚡ ${sale.name}
            </h2>
            <p style="opacity: 0.9;">${sale.description || 'Limited time offer!'}</p>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Ends in</div>
            <div id="flash-sale-countdown-${sale._id}" style="
              font-size: 1.5rem;
              font-weight: 700;
              font-family: monospace;
            ">
              ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
            </div>
          </div>
          <a href="/marketplace.html?flashSale=${sale._id}" 
             style="
               background: white;
               color: #667eea;
               padding: 0.75rem 1.5rem;
               border-radius: 0.5rem;
               text-decoration: none;
               font-weight: 600;
               transition: transform 0.2s;
             " 
             onmouseover="this.style.transform='scale(1.05)'"
             onmouseout="this.style.transform='scale(1)'">
            Shop Now →
          </a>
        </div>
      `;

      // Start countdown
      if (timeRemaining > 0) {
        this.startFlashSaleCountdown(sale._id, timeRemaining);
      }
    });
  }

  startFlashSaleCountdown(saleId, initialSeconds) {
    let seconds = initialSeconds;
    const countdownEl = document.getElementById(`flash-sale-countdown-${saleId}`);
    
    if (!countdownEl) return;

    const interval = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(interval);
        countdownEl.textContent = '00:00:00';
        return;
      }

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      countdownEl.textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
  }

  // ==================== RECENTLY VIEWED ====================
  async setupRecentlyViewed() {
    if (!this.userId) return;

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/user/recently-viewed?limit=6`,
        { headers: this.getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products.length > 0) {
          this.renderRecentlyViewed(data.products);
        }
      }
    } catch (error) {
      console.error('Recently viewed error:', error);
    }
  }

  renderRecentlyViewed(products) {
    // Similar to recommendations rendering
    // Implementation similar to renderRecommendations
  }

  // ==================== PRODUCT VIEW TRACKING ====================
  setupProductViewTracking() {
    // Track when user views a product
    document.addEventListener('click', (e) => {
      const productCard = e.target.closest('.product-card, [data-product-id]');
      if (productCard && this.userId) {
        const productId = productCard.dataset.productId || 
                         productCard.querySelector('[data-id]')?.dataset.id;
        
        if (productId) {
          this.trackProductView(productId);
        }
      }
    });
  }

  async trackProductView(productId) {
    if (!this.userId) return;

    try {
      await fetch(`${this.apiBaseUrl}/user/recently-viewed`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ productId })
      });
    } catch (error) {
      console.error('Track product view error:', error);
    }
  }

  // ==================== ABANDONED CART TRACKING ====================
  setupAbandonedCartTracking() {
    // Track cart abandonment when user adds items but doesn't checkout
    // This would be called from cart.js when items are added
    window.trackAbandonedCart = async (items) => {
      if (!this.userId) return;

      try {
        await fetch(`${this.apiBaseUrl}/abandoned-cart/track`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ items })
        });
      } catch (error) {
        console.error('Abandoned cart tracking error:', error);
      }
    };
  }
}

// Initialize on page load
if (typeof window !== 'undefined') {
  window.marketplaceIntegration = new MarketplaceIntegration();
}

