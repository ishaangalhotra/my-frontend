/**
 * Enhanced Product Interactions Module
 * Provides modern e-commerce interactions like Flipkart/Amazon
 */

class EnhancedProductInteractions {
    constructor() {
        this.wishlist = new Set(JSON.parse(localStorage.getItem('quicklocal_wishlist') || '[]'));
        this.comparison = new Set();
        this.recentlyViewed = JSON.parse(localStorage.getItem('quicklocal_recently_viewed') || '[]');
        this.searchHistory = JSON.parse(localStorage.getItem('quicklocal_search_history') || '[]');
        
        // Throttling for scroll events
        this.lastScrollTrack = 0;
        this.scrollThrottle = 2000; // Only track scroll once every 2 seconds
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Enhanced Product Interactions...');
        this.setupEventListeners();
        this.setupQuickViewModal();
        this.setupSearchEnhancements();
        this.updateWishlistIndicators();
        this.renderComparisonBar();
        console.log('✅ Enhanced Product Interactions Ready');
    }

    // ================================
    // EVENT LISTENERS SETUP
    // ================================

    setupEventListeners() {
        // Product card interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn[data-action="wishlist"]')) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleWishlist(e.target.closest('.quick-action-btn'));
            }
            
            if (e.target.closest('.quick-action-btn[data-action="compare"]')) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleComparison(e.target.closest('.quick-action-btn'));
            }
            
            if (e.target.closest('.quick-action-btn[data-action="quick-view"]')) {
                e.preventDefault();
                e.stopPropagation();
                this.showQuickView(e.target.closest('.quick-action-btn').dataset.productId);
            }
            
            if (e.target.closest('.enhanced-product-card')) {
                this.trackProductView(e.target.closest('.enhanced-product-card'));
            }
        });

        // Search interactions
        const searchInputs = document.querySelectorAll('.search-input, .enhanced-search-input');
        searchInputs.forEach(input => {
            if (input.dataset.qlEnhancedBound === '1') return;
            input.dataset.qlEnhancedBound = '1';
            input.addEventListener('input', (e) => this.handleSearchInput(e));
            input.addEventListener('focus', (e) => this.showSearchSuggestions(e));
            input.addEventListener('blur', (e) => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => this.hideSearchSuggestions(e), 200);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        // Scroll tracking for infinite loading
        window.addEventListener('scroll', () => this.handleScroll());
    }

    // ================================
    // QUICK VIEW MODAL
    // ================================

    setupQuickViewModal() {
        if (document.querySelector('.quick-view-modal')) return;

        const modalHTML = `
            <div class="quick-view-modal" id="quickViewModal">
                <div class="quick-view-content">
                    <button class="quick-view-close" onclick="enhancedInteractions.hideQuickView()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="quick-view-body">
                        <div class="quick-view-images">
                            <div class="main-image-container">
                                <img id="quickViewMainImage" src="" alt="" class="main-image">
                                <div class="image-zoom-overlay"></div>
                            </div>
                            <div class="thumbnail-images" id="quickViewThumbnails"></div>
                        </div>
                        <div class="quick-view-details">
                            <div class="product-breadcrumb" id="quickViewBreadcrumb"></div>
                            <h2 class="product-title" id="quickViewTitle"></h2>
                            <div class="product-rating" id="quickViewRating"></div>
                            <div class="product-price" id="quickViewPrice"></div>
                            <div class="product-description" id="quickViewDescription"></div>
                            <div class="product-variants" id="quickViewVariants"></div>
                            <div class="product-quantity">
                                <label for="quickViewQuantity">Quantity:</label>
                                <div class="quantity-selector">
                                    <button class="quantity-btn minus">-</button>
                                    <input type="number" id="quickViewQuantity" value="1" min="1" max="10">
                                    <button class="quantity-btn plus">+</button>
                                </div>
                            </div>
                            <div class="quick-view-actions">
                                <button class="add-to-cart-enhanced" id="quickViewAddToCart">
                                    <i class="fas fa-shopping-cart"></i>
                                    Add to Cart
                                </button>
                                <button class="secondary-action-btn wishlist-btn" id="quickViewWishlist">
                                    <i class="far fa-heart"></i>
                                </button>
                                <button class="secondary-action-btn compare-btn" id="quickViewCompare">
                                    <i class="fas fa-balance-scale"></i>
                                </button>
                            </div>
                            <div class="delivery-info" id="quickViewDelivery"></div>
                            <div class="seller-info" id="quickViewSeller"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup quantity controls
        this.setupQuantityControls();
    }

    showQuickView(productId) {
        const product = this.getProductData(productId);
        if (!product) {
            this.showToast('Product not found', 'error');
            return;
        }

        const modal = document.getElementById('quickViewModal');
        
        // Populate modal content
        this.populateQuickViewContent(product);
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Track event
        this.trackEvent('quick_view', { productId });
    }

    hideQuickView() {
        const modal = document.getElementById('quickViewModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    populateQuickViewContent(product) {
        // Images
        const mainImage = document.getElementById('quickViewMainImage');
        const thumbnails = document.getElementById('quickViewThumbnails');
        
        mainImage.src = product.image || product.images?.[0]?.url || this.getPlaceholderImage();
        mainImage.alt = product.name;
        
        if (product.images && product.images.length > 1) {
            thumbnails.innerHTML = product.images.map((img, index) => `
                <img src="${img.url || img}" 
                     alt="${product.name}" 
                     class="thumbnail ${index === 0 ? 'active' : ''}"
                     onclick="enhancedInteractions.switchMainImage('${img.url || img}', this)">
            `).join('');
        }

        // Basic info
        document.getElementById('quickViewTitle').textContent = product.name;
        document.getElementById('quickViewBreadcrumb').innerHTML = `
            <a href="#">Home</a> > 
            <a href="#category=${product.category}">${product.category}</a> > 
            <span>${product.name}</span>
        `;

        // Rating
        document.getElementById('quickViewRating').innerHTML = `
            <div class="rating-stars">${this.generateStars(product.rating || 4)}</div>
            <span class="rating-text">(${product.reviews || 0} reviews)</span>
        `;

        // Price
        const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        document.getElementById('quickViewPrice').innerHTML = `
            <div class="current-price">₹${product.price?.toLocaleString()}</div>
            ${product.originalPrice ? `<div class="original-price">₹${product.originalPrice.toLocaleString()}</div>` : ''}
            ${discount > 0 ? `<div class="discount-percentage">${discount}% OFF</div>` : ''}
        `;

        // Description
        document.getElementById('quickViewDescription').textContent = 
            product.description || 'No description available.';

        // Variants (if available)
        const variantsContainer = document.getElementById('quickViewVariants');
        if (product.variants && product.variants.length > 0) {
            variantsContainer.innerHTML = `
                <div class="variant-group">
                    <label>Options:</label>
                    <div class="variant-options">
                        ${product.variants.map(variant => `
                            <button class="variant-option" data-variant="${variant.id}">
                                ${variant.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Update action buttons
        const wishlistBtn = document.getElementById('quickViewWishlist');
        const compareBtn = document.getElementById('quickViewCompare');
        
        wishlistBtn.dataset.productId = product.id;
        compareBtn.dataset.productId = product.id;
        
        if (this.wishlist.has(product.id)) {
            wishlistBtn.classList.add('active');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
        }
        
        if (this.comparison.has(product.id)) {
            compareBtn.classList.add('active');
        }

        // Delivery info
        document.getElementById('quickViewDelivery').innerHTML = `
            <div class="delivery-option">
                <i class="fas fa-shipping-fast"></i>
                <span>Free delivery by ${this.getDeliveryDate()}</span>
            </div>
            <div class="delivery-option">
                <i class="fas fa-undo"></i>
                <span>7-day return policy</span>
            </div>
        `;

        // Seller info
        document.getElementById('quickViewSeller').innerHTML = `
            <div class="seller-details">
                <span>Sold by: <strong>${product.seller?.name || 'QuickLocal'}</strong></span>
                <div class="seller-rating">
                    ${this.generateStars(product.seller?.rating || 4.5)}
                    <span>(${product.seller?.reviews || 100})</span>
                </div>
            </div>
        `;
    }

    switchMainImage(newImageSrc, thumbnail) {
        document.getElementById('quickViewMainImage').src = newImageSrc;
        
        // Update active thumbnail
        document.querySelectorAll('#quickViewThumbnails .thumbnail').forEach(t => 
            t.classList.remove('active'));
        thumbnail.classList.add('active');
    }

    setupQuantityControls() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-btn.minus')) {
                const input = e.target.nextElementSibling;
                const currentValue = parseInt(input.value) || 1;
                if (currentValue > 1) {
                    input.value = currentValue - 1;
                }
            }
            
            if (e.target.matches('.quantity-btn.plus')) {
                const input = e.target.previousElementSibling;
                const currentValue = parseInt(input.value) || 1;
                const maxValue = parseInt(input.max) || 10;
                if (currentValue < maxValue) {
                    input.value = currentValue + 1;
                }
            }
        });
    }

    // ================================
    // WISHLIST FUNCTIONALITY
    // ================================

    toggleWishlist(button) {
        const productId = button.dataset.productId;
        const isInWishlist = this.wishlist.has(productId);

        if (isInWishlist) {
            this.removeFromWishlist(productId);
        } else {
            this.addToWishlist(productId);
        }

        this.updateWishlistButton(button, !isInWishlist);
        this.updateWishlistIndicators();
        this.trackEvent('wishlist_toggle', { productId, action: !isInWishlist ? 'add' : 'remove' });
    }

    addToWishlist(productId) {
        this.wishlist.add(productId);
        localStorage.setItem('quicklocal_wishlist', JSON.stringify([...this.wishlist]));
        this.showToast('Added to wishlist', 'success');
    }

    removeFromWishlist(productId) {
        this.wishlist.delete(productId);
        localStorage.setItem('quicklocal_wishlist', JSON.stringify([...this.wishlist]));
        this.showToast('Removed from wishlist', 'info');
    }

    updateWishlistButton(button, isInWishlist) {
        const icon = button.querySelector('i');
        if (isInWishlist) {
            button.classList.add('active');
            icon.className = 'fas fa-heart';
        } else {
            button.classList.remove('active');
            icon.className = 'far fa-heart';
        }
    }

    updateWishlistIndicators() {
        const indicators = document.querySelectorAll('.wishlist-indicator');
        indicators.forEach(indicator => {
            if (this.wishlist.size > 0) {
                indicator.classList.add('has-items');
            } else {
                indicator.classList.remove('has-items');
            }
        });
    }

    // ================================
    // COMPARISON FUNCTIONALITY
    // ================================

    toggleComparison(button) {
        const productId = button.dataset.productId;
        const isInComparison = this.comparison.has(productId);

        if (isInComparison) {
            this.removeFromComparison(productId);
        } else {
            if (this.comparison.size >= 4) {
                this.showToast('You can compare maximum 4 products', 'warning');
                return;
            }
            this.addToComparison(productId);
        }

        this.updateComparisonButton(button, !isInComparison);
        this.renderComparisonBar();
        this.trackEvent('comparison_toggle', { productId, action: !isInComparison ? 'add' : 'remove' });
    }

    addToComparison(productId) {
        this.comparison.add(productId);
        this.showToast('Added to comparison', 'success');
    }

    removeFromComparison(productId) {
        this.comparison.delete(productId);
        this.showToast('Removed from comparison', 'info');
    }

    updateComparisonButton(button, isInComparison) {
        if (isInComparison) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    renderComparisonBar() {
        let comparisonBar = document.querySelector('.comparison-bar');
        
        if (this.comparison.size === 0) {
            if (comparisonBar) {
                comparisonBar.classList.remove('show');
            }
            return;
        }

        if (!comparisonBar) {
            const barHTML = `
                <div class="comparison-bar">
                    <div class="comparison-items">
                        <span class="comparison-count"></span>
                        <span>products selected for comparison</span>
                    </div>
                    <div class="comparison-actions">
                        <button class="comparison-btn" onclick="enhancedInteractions.clearComparison()">
                            Clear All
                        </button>
                        <button class="comparison-btn primary" onclick="enhancedInteractions.viewComparison()">
                            Compare Now
                        </button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', barHTML);
            comparisonBar = document.querySelector('.comparison-bar');
        }

        comparisonBar.querySelector('.comparison-count').textContent = this.comparison.size;
        comparisonBar.classList.add('show');
    }

    clearComparison() {
        this.comparison.clear();
        this.renderComparisonBar();
        
        // Update all comparison buttons
        document.querySelectorAll('.quick-action-btn[data-action="compare"]').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    viewComparison() {
        if (this.comparison.size < 2) {
            this.showToast('Select at least 2 products to compare', 'warning');
            return;
        }
        
        // You can implement a comparison page or modal here
        this.showToast('Opening comparison view...', 'info');
        
        // For now, just log the comparison data
        console.log('Comparing products:', [...this.comparison]);
        
        this.trackEvent('comparison_view', { products: [...this.comparison] });
    }

    // ================================
    // ENHANCED SEARCH
    // ================================

    isAdvancedSearchManagedInput(input) {
        if (!input) return false;
        if (input.id === 'globalSearchInput') return true;
        if (input.closest('.advanced-search-wrapper')) return true;
        return false;
    }

    findSuggestionsContainerForInput(input) {
        if (!input) return null;

        const owner = input.closest('.search-container, .enhanced-search-container, .advanced-search-wrapper') || input.parentElement;
        if (owner) {
            const dropdownSuggestions = owner.querySelector('.autocomplete-dropdown .search-suggestions');
            if (dropdownSuggestions) return dropdownSuggestions;

            const directSuggestions = owner.querySelector('.search-suggestions');
            if (directSuggestions) return directSuggestions;
        }

        return document.querySelector('.autocomplete-dropdown .search-suggestions') || document.querySelector('.search-suggestions');
    }

    setupSearchEnhancements() {
        // Create suggestions container if it doesn't exist
        const searchContainers = document.querySelectorAll('.search-container, .enhanced-search-container');
        searchContainers.forEach(container => {
            // Marketplace advanced-search.js owns this structure. Do not inject a second system.
            if (container.querySelector('.advanced-search-wrapper') || container.querySelector('.autocomplete-dropdown')) {
                return;
            }

            if (!container.querySelector('.search-suggestions')) {
                container.insertAdjacentHTML('beforeend', `
                    <div class="search-suggestions" id="searchSuggestions-${container.id || 'default'}">
                        <div class="suggestion-group">
                            <h4>Recent Searches</h4>
                            <div class="recent-searches"></div>
                        </div>
                        <div class="suggestion-group">
                            <h4>Popular Products</h4>
                            <div class="popular-suggestions"></div>
                        </div>
                        <div class="suggestion-group">
                            <h4>Categories</h4>
                            <div class="category-suggestions"></div>
                        </div>
                    </div>
                `);
            }
        });
    }

    handleSearchInput(e) {
        if (this.isAdvancedSearchManagedInput(e.target)) {
            return;
        }

        const query = e.target.value.trim();
        const suggestionsContainer = this.findSuggestionsContainerForInput(e.target);
        if (!suggestionsContainer) {
            return;
        }
        
        if (query.length < 2) {
            this.showDefaultSuggestions(suggestionsContainer);
            return;
        }

        // Debounce search suggestions
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.generateSearchSuggestions(query, suggestionsContainer);
        }, 300);
    }

    showSearchSuggestions(e) {
        if (this.isAdvancedSearchManagedInput(e.target)) {
            return;
        }

        const suggestionsContainer = this.findSuggestionsContainerForInput(e.target);
        if (suggestionsContainer) {
            suggestionsContainer.classList.add('active');
            this.showDefaultSuggestions(suggestionsContainer);
        }
    }

    hideSearchSuggestions(e) {
        if (this.isAdvancedSearchManagedInput(e.target)) {
            return;
        }

        const suggestionsContainer = this.findSuggestionsContainerForInput(e.target);
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('active');
        }
    }

    showDefaultSuggestions(container) {
        if (!container) return;

        const recentSearches = container.querySelector('.recent-searches');
        const popularSuggestions = container.querySelector('.popular-suggestions');
        const categorySuggestions = container.querySelector('.category-suggestions');

        // Recent searches
        if (recentSearches) {
            recentSearches.innerHTML = this.searchHistory.slice(0, 5).map(term => `
                <div class="suggestion-item" onclick="enhancedInteractions.selectSuggestion('${term}')">
                    <i class="fas fa-clock suggestion-icon"></i>
                    <span>${term}</span>
                </div>
            `).join('') || '<div class="suggestion-item disabled">No recent searches</div>';
        }

        // Popular products (mock data)
        const popularItems = [
            'Wireless Headphones', 'Smart Watch', 'Running Shoes', 
            'Coffee Maker', 'Bluetooth Speaker'
        ];
        if (popularSuggestions) {
            popularSuggestions.innerHTML = popularItems.map(item => `
                <div class="suggestion-item" onclick="enhancedInteractions.selectSuggestion('${item}')">
                    <i class="fas fa-fire suggestion-icon"></i>
                    <span>${item}</span>
                </div>
            `).join('');
        }

        // Categories
        const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books'];
        if (categorySuggestions) {
            categorySuggestions.innerHTML = categories.map(category => `
                <div class="suggestion-item" onclick="enhancedInteractions.selectSuggestion('${category}')">
                    <i class="fas fa-folder suggestion-icon"></i>
                    <span>${category}</span>
                </div>
            `).join('');
        }
    }

    generateSearchSuggestions(query, container) {
        if (!container) return;

        // This would typically make an API call to get suggestions
        // For now, we'll generate mock suggestions
        const mockSuggestions = this.getMockSuggestions(query);
        
        container.innerHTML = `
            <div class="suggestion-group">
                <h4>Suggestions</h4>
                ${mockSuggestions.map(suggestion => `
                    <div class="suggestion-item" onclick="enhancedInteractions.selectSuggestion('${suggestion}')">
                        <i class="fas fa-search suggestion-icon"></i>
                        <span>${suggestion}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    selectSuggestion(term) {
        const searchInputs = document.querySelectorAll('.search-input, .enhanced-search-input');
        searchInputs.forEach(input => {
            input.value = term;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });

        this.addToSearchHistory(term);
        
        // Hide suggestions
        document.querySelectorAll('.search-suggestions').forEach(container => {
            container.classList.remove('active');
        });

        this.trackEvent('search_suggestion_selected', { term });
    }

    addToSearchHistory(term) {
        if (!term || this.searchHistory.includes(term)) return;
        
        this.searchHistory.unshift(term);
        this.searchHistory = this.searchHistory.slice(0, 10); // Keep only last 10
        localStorage.setItem('quicklocal_search_history', JSON.stringify(this.searchHistory));
    }

    // ================================
    // PRODUCT TRACKING & ANALYTICS
    // ================================

    trackProductView(productCard) {
        const productId = productCard.dataset.productId;
        if (!productId) return;

        // Add to recently viewed (avoid duplicates)
        const existingIndex = this.recentlyViewed.findIndex(item => item.id === productId);
        if (existingIndex > -1) {
            this.recentlyViewed.splice(existingIndex, 1);
        }

        const productData = this.getProductData(productId);
        if (productData) {
            this.recentlyViewed.unshift({
                id: productId,
                name: productData.name,
                image: productData.image,
                price: productData.price,
                viewedAt: Date.now()
            });

            // Keep only last 20 items
            this.recentlyViewed = this.recentlyViewed.slice(0, 20);
            localStorage.setItem('quicklocal_recently_viewed', JSON.stringify(this.recentlyViewed));
        }

        this.trackEvent('product_view', { productId });
    }

    trackEvent(eventName, data) {
        // Send to analytics service
        console.log('📊 Event tracked:', eventName, data);
        
        // You can integrate with your analytics service here
        if (window.gtag) {
            window.gtag('event', eventName, data);
        }
    }

    // ================================
    // KEYBOARD NAVIGATION
    // ================================

    handleKeyboardNavigation(e) {
        // ESC key to close modals
        if (e.key === 'Escape') {
            this.hideQuickView();
            document.querySelectorAll('.search-suggestions').forEach(container => {
                container.classList.remove('active');
            });
        }

        // Enter key in search
        if (e.key === 'Enter' && e.target.matches('.search-input, .enhanced-search-input')) {
            if (this.isAdvancedSearchManagedInput(e.target)) {
                return;
            }
            e.preventDefault();
            this.performSearch(e.target.value);
        }
    }

    performSearch(query) {
        if (!query.trim()) return;
        
        this.addToSearchHistory(query);
        this.trackEvent('search_performed', { query });
        
        // Navigate to search results or trigger search function
        if (window.applyAllFilters) {
            const primaryInput = document.getElementById('globalSearchInput') || document.getElementById('search-input');
            if (primaryInput) {
                primaryInput.value = query;
            }
            window.applyAllFilters();
        }
    }

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    getProductData(productId) {
        // Try to get from global app state first
        if (window.appState && window.appState.products) {
            return window.appState.products.find(p => p.id === productId || p._id === productId);
        }
        
        // Fallback: get from product card DOM
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (productCard) {
            return {
                id: productId,
                name: productCard.querySelector('.product-name, .enhanced-product-title')?.textContent || 'Unknown Product',
                price: this.extractPrice(productCard.querySelector('.price-current, .current-price')?.textContent),
                image: productCard.querySelector('.product-image, .enhanced-product-image')?.src,
                category: productCard.querySelector('.product-category, .product-category-tag')?.textContent,
                description: productCard.querySelector('.product-description')?.textContent
            };
        }
        
        return null;
    }

    extractPrice(priceText) {
        if (!priceText) return 0;
        return parseInt(priceText.replace(/[^\d]/g, '')) || 0;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star star"></i>';
        if (hasHalfStar) stars += '<i class="fas fa-star-half-alt star"></i>';
        for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star star"></i>';
        
        return stars;
    }

    getPlaceholderImage() {
        return 'https://placehold.co/400x300/f0f0f0/999999?text=Product+Image';
    }

    getDeliveryDate() {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 5) + 1);
        return date.toLocaleDateString('en-IN', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    getMockSuggestions(query) {
        const allSuggestions = [
            'Wireless Bluetooth Headphones',
            'Smart Fitness Watch',
            'Running Shoes for Men',
            'Coffee Maker Machine',
            'Bluetooth Portable Speaker',
            'Gaming Mouse Pad',
            'LED Desk Lamp',
            'Protein Powder',
            'Water Bottle',
            'Phone Case Cover'
        ];

        return allSuggestions
            .filter(suggestion => 
                suggestion.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5);
    }

    handleScroll() {
        // Throttle scroll events to prevent spam
        const now = Date.now();
        if (now - this.lastScrollTrack < this.scrollThrottle) {
            return;
        }
        
        // Implement infinite scroll or other scroll-based features
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition > documentHeight - 1000) {
            // Near bottom - could trigger infinite loading
            this.trackEvent('scroll_near_bottom');
            this.lastScrollTrack = now;
        }
    }

    // ================================
    // ENHANCED TOAST SYSTEM
    // ================================

    showToast(message, type = 'success', duration = 4000) {
        const toastId = 'toast-' + Date.now();
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const toastHTML = `
            <div class="enhanced-toast ${type}" id="${toastId}">
                <i class="${icons[type]} toast-icon"></i>
                <div class="toast-content">
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close" onclick="enhancedInteractions.closeToast('${toastId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toast = document.getElementById(toastId);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => this.closeToast(toastId), duration);
    }

    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }

    // ================================
    // PUBLIC API
    // ================================

    // Method to update product cards with enhanced features
    enhanceProductCards() {
        const productCards = document.querySelectorAll('.product-card:not(.enhanced)');
        
        productCards.forEach(card => {
            if (card.classList.contains('enhanced')) return;
            
            card.classList.add('enhanced', 'enhanced-product-card');
            
            // Add quick action buttons
            const imageContainer = card.querySelector('.product-image-container, .enhanced-image-container');
            if (imageContainer && !imageContainer.querySelector('.product-quick-actions')) {
                const productId = card.dataset.productId || card.id;
                
                imageContainer.insertAdjacentHTML('beforeend', `
                    <div class="product-quick-actions">
                        <button class="quick-action-btn" data-action="quick-view" data-product-id="${productId}" title="Quick View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="quick-action-btn ${this.wishlist.has(productId) ? 'active' : ''}" data-action="wishlist" data-product-id="${productId}" title="Add to Wishlist">
                            <i class="${this.wishlist.has(productId) ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <button class="quick-action-btn ${this.comparison.has(productId) ? 'active' : ''}" data-action="compare" data-product-id="${productId}" title="Compare">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                    </div>
                `);
            }
        });

        console.log(`✅ Enhanced ${productCards.length} product cards`);
    }

    // Method to get user's interaction data
    getUserData() {
        return {
            wishlist: [...this.wishlist],
            comparison: [...this.comparison],
            recentlyViewed: this.recentlyViewed,
            searchHistory: this.searchHistory
        };
    }

    // Method to clear all user data
    clearUserData() {
        this.wishlist.clear();
        this.comparison.clear();
        this.recentlyViewed = [];
        this.searchHistory = [];
        
        localStorage.removeItem('quicklocal_wishlist');
        localStorage.removeItem('quicklocal_recently_viewed');
        localStorage.removeItem('quicklocal_search_history');
        
        this.updateWishlistIndicators();
        this.renderComparisonBar();
        
        this.showToast('All user data cleared', 'info');
    }
}

// Initialize the enhanced interactions
window.enhancedInteractions = new EnhancedProductInteractions();

// Make it available globally
window.EnhancedProductInteractions = EnhancedProductInteractions;

// Auto-enhance existing product cards when DOM changes
const productCardObserver = new MutationObserver((mutations) => {
    let shouldEnhance = false;
    
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList?.contains('product-card') || 
                        node.querySelector?.('.product-card')) {
                        shouldEnhance = true;
                    }
                }
            });
        }
    });
    
    if (shouldEnhance) {
        setTimeout(() => {
            window.enhancedInteractions.enhanceProductCards();
        }, 100);
    }
});

// Start observing
productCardObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Enhance cards on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.enhancedInteractions.enhanceProductCards();
    }, 500);
});

console.log('🎯 Enhanced Product Interactions Module Loaded');
