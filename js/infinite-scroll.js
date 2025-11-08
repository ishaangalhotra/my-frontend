/**
 * Infinite Scroll - Load more products as user scrolls
 * Similar to Flipkart/Amazon infinite scroll
 */

class InfiniteScroll {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('products-container');
    this.loadMoreCallback = options.loadMoreCallback || null;
    this.hasMore = true;
    this.isLoading = false;
    this.page = 1;
    this.threshold = options.threshold || 200; // pixels from bottom
    
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
      // Fallback to scroll event
      this.setupScrollListener();
    }

    console.log('✅ Infinite scroll initialized');
  }

  setupIntersectionObserver() {
    // Create sentinel element
    this.sentinel = document.createElement('div');
    this.sentinel.id = 'infinite-scroll-sentinel';
    this.sentinel.style.cssText = `
      height: 1px;
      width: 100%;
      visibility: hidden;
    `;
    this.container.appendChild(this.sentinel);

    // Observe sentinel
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

    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);

    if (distanceFromBottom < this.threshold && this.hasMore && !this.isLoading) {
      this.loadMore();
    }
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.page++;

    // Show loading indicator
    this.showLoadingIndicator();

    try {
      if (this.loadMoreCallback) {
        const result = await this.loadMoreCallback(this.page);
        
        if (result && result.hasMore !== undefined) {
          this.hasMore = result.hasMore;
        } else {
          // Assume no more if callback returns falsy or empty array
          this.hasMore = result && Array.isArray(result) && result.length > 0;
        }
      } else {
        // Default: Load more products from API
        await this.loadMoreProducts();
      }
    } catch (error) {
      console.error('Infinite scroll load more error:', error);
      this.hasMore = false;
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  async loadMoreProducts() {
    const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || 
                      'https://ecommerce-backend-mlik.onrender.com/api/v1';
    
    try {
      const response = await fetch(
        `${apiBaseUrl}/products?page=${this.page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const products = data.products || data.data || data;
        
        if (Array.isArray(products) && products.length > 0) {
          // Append products to container
          this.appendProducts(products);
          this.hasMore = products.length >= 20; // Assume more if full page
        } else {
          this.hasMore = false;
        }
      } else {
        this.hasMore = false;
      }
    } catch (error) {
      console.error('Load more products error:', error);
      this.hasMore = false;
    }
  }

  appendProducts(products) {
    // This should be customized based on your product rendering
    const productsGrid = this.container.querySelector('.products-grid') || this.container;
    
    products.forEach(product => {
      const productCard = this.createProductCard(product);
      productsGrid.appendChild(productCard);
    });

    // Re-observe sentinel if using intersection observer
    if (this.observer && this.sentinel) {
      this.observer.observe(this.sentinel);
    }
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card product-card-interactive hover-lift';
    card.dataset.productId = product._id || product.id;
    card.innerHTML = `
      <div class="product-image-zoom">
        <img src="${product.images?.[0]?.url || 'https://placehold.co/300x200'}" 
             alt="${product.name}"
             loading="lazy">
      </div>
      <div style="padding: 1rem;">
        <h3 style="font-size: 0.875rem; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${product.name}
        </h3>
        <div style="font-size: 1.125rem; font-weight: 700; color: #6366f1; margin-bottom: 0.5rem;">
          ₹${product.price}
        </div>
        ${product.averageRating ? `
          <div style="font-size: 0.75rem; color: #64748b;">
            ⭐ ${product.averageRating} (${product.reviewCount || 0})
          </div>
        ` : ''}
      </div>
    `;

    // Add click handler
    card.addEventListener('click', () => {
      window.location.href = `/product-detail.html?id=${product._id || product.id}`;
    });

    return card;
  }

  showLoadingIndicator() {
    if (this.sentinel) {
      this.sentinel.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
        ">
          <div class="spinner"></div>
          <span style="color: #64748b;">Loading more products...</span>
        </div>
      `;
      this.sentinel.style.visibility = 'visible';
    }
  }

  hideLoadingIndicator() {
    if (this.sentinel) {
      this.sentinel.innerHTML = '';
      this.sentinel.style.visibility = 'hidden';
    }
  }

  reset() {
    this.page = 1;
    this.hasMore = true;
    this.isLoading = false;
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.sentinel && this.sentinel.parentElement) {
      this.sentinel.parentElement.removeChild(this.sentinel);
    }
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.InfiniteScroll = InfiniteScroll;
}

