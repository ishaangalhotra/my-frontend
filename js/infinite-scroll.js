/**
 * Infinite Scroll - Load more products as user scrolls
 * Integrated with Global AppState and Advanced Search
 */

class InfiniteScroll {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('products-container');
    this.loadMoreCallback = options.loadMoreCallback || null;
    this.hasMore = true;
    this.isLoading = false;
    this.page = 1;
    this.threshold = options.threshold || 300; // pixels from bottom
    
    // Bind methods
    this.checkScrollPosition = this.checkScrollPosition.bind(this);
    this.loadMore = this.loadMore.bind(this);
    
    this.init();
  }

  init() {
    if (!this.container) {
      console.warn('InfiniteScroll: Container not found');
      return;
    }

    // Setup intersection observer for better performance
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      this.setupScrollListener();
    }

    // Listen for search results to reset pagination
    document.addEventListener('searchResults', (e) => {
        // When a new search happens, reset the infinite scroll page
        const { currentPage, totalPages } = e.detail;
        this.page = currentPage || 1;
        this.hasMore = this.page < (totalPages || 1);
        console.log(`🔄 InfiniteScroll reset: Page ${this.page}, HasMore: ${this.hasMore}`);
    });

    console.log('✅ Infinite scroll initialized (Integrated)');
  }

  setupIntersectionObserver() {
    // Create sentinel element
    this.sentinel = document.createElement('div');
    this.sentinel.id = 'infinite-scroll-sentinel';
    this.sentinel.style.cssText = `
      height: 10px;
      width: 100%;
      visibility: hidden;
      margin-top: 20px;
    `;
    
    // Append sentinel after the product grid
    // Note: We append to the parent of the grid if the grid is strictly for cards
    if(this.container.parentNode) {
        this.container.parentNode.appendChild(this.sentinel);
    } else {
        this.container.appendChild(this.sentinel);
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.hasMore && !this.isLoading) {
            this.loadMore();
          }
        });
      },
      {
        rootMargin: `${this.threshold}px`
      }
    );

    this.observer.observe(this.sentinel);
  }

  setupScrollListener() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.checkScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  checkScrollPosition() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (documentHeight - (scrollTop + windowHeight) < this.threshold) {
        if (this.hasMore && !this.isLoading) {
            this.loadMore();
        }
    }
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) return;

    // Double check appState to prevent over-fetching
    if (window.appState && window.appState.isLoading) return;

    this.isLoading = true;
    if(window.appState) window.appState.isLoading = true;

    this.page++;
    this.showLoadingIndicator();

    try {
        // 1. Construct URL based on GLOBAL FILTERS
        const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || '/api/v1';
        let queryParams = new URLSearchParams();
        
        // Add Pagination
        queryParams.append('page', this.page);
        queryParams.append('limit', '20');

        // Add Filters from Global State
        if (window.appState && window.appState.currentFilters) {
            const f = window.appState.currentFilters;
            if (f.search) queryParams.append('search', f.search);
            if (f.category) queryParams.append('category', f.category);
            
            // Handle price
            if (f.priceRange) {
                 // Parse logic matching advanced-search.js or marketplace.html
                 if (f.priceRange === '5000+') {
                     queryParams.append('minPrice', '5000');
                 } else if (f.priceRange.includes('-')) {
                     const [min, max] = f.priceRange.split('-');
                     queryParams.append('minPrice', min);
                     queryParams.append('maxPrice', max);
                 }
            }
            if (f.sortBy) {
                // Map sort values
                if(f.sortBy === 'price-low') queryParams.append('sort', 'price_asc');
                else if(f.sortBy === 'price-high') queryParams.append('sort', 'price_desc');
                else if(f.sortBy === 'rating') queryParams.append('sort', 'rating_desc');
                else queryParams.append('sort', 'name_asc');
            }
        }

        console.log(`📜 Infinite Scroll loading page ${this.page}`, queryParams.toString());

        const response = await fetch(`${apiBaseUrl}/products?${queryParams.toString()}`);
        const data = await response.json();
        
        let products = [];
        if (data.success && data.data && data.data.products) {
            products = data.data.products;
        } else if (Array.isArray(data)) {
            products = data;
        } else if (data.products) {
            products = data.products;
        }

        if (products.length > 0) {
            this.appendProducts(products);
            // Assume we have more if we got a full page
            this.hasMore = products.length >= 10; 
        } else {
            this.hasMore = false;
        }

    } catch (error) {
      console.error('Infinite scroll error:', error);
      this.hasMore = false;
    } finally {
      this.isLoading = false;
      if(window.appState) window.appState.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  appendProducts(products) {
    // Use the same container
    const grid = this.container.classList.contains('products-grid') ? 
                 this.container : 
                 this.container.querySelector('.products-grid');
                 
    if (!grid) return;

    const fragment = document.createDocumentFragment();

    products.forEach(product => {
        // FIX: Use the unified renderer if available to match UI
        if (window.productCardUtils && typeof window.productCardUtils.generateProductCard === 'function') {
            // Normalize data for the utility
            const p = { ...product, id: product._id || product.id };
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = window.productCardUtils.generateProductCard(p);
            const card = tempDiv.firstElementChild;
            
            // Ensure the card is visible for animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            fragment.appendChild(card);
        } else {
            // Fallback
            const card = this.createFallbackCard(product);
            fragment.appendChild(card);
        }
    });

    grid.appendChild(fragment);

    // Trigger animations for new elements
    requestAnimationFrame(() => {
        const newCards = grid.querySelectorAll('.product-card[style*="opacity: 0"]');
        newCards.forEach(card => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });
    
    // Re-attach variant listeners if needed
    if (window.productCardUtils && window.productCardUtils.attachVariantListeners) {
        window.productCardUtils.attachVariantListeners();
    }
  }
  
  createFallbackCard(product) {
      // Simplified fallback matching the main HTML structure
      const card = document.createElement('div');
      card.className = 'product-card';
      card.dataset.productId = product._id || product.id;
      card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image || 'https://placehold.co/300x220'}" class="product-image" loading="lazy">
        </div>
        <div class="product-content">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">₹${product.price}</div>
        </div>
      `;
      return card;
  }

  showLoadingIndicator() {
    if (this.sentinel) {
      this.sentinel.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';
      this.sentinel.style.visibility = 'visible';
    }
  }

  hideLoadingIndicator() {
    if (this.sentinel) {
      this.sentinel.innerHTML = '';
      this.sentinel.style.visibility = 'hidden';
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.InfiniteScroll = InfiniteScroll;
}