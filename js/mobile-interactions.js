/**
 * Mobile Interactions Module
 * Handles mobile-specific interactions, PWA features, and touch gestures
 */

class MobileInteractions {
    constructor() {
        this.isMobile = window.innerWidth <= 767;
        this.touchStartY = 0;
        this.pullDistance = 0;
        this.isRefreshing = false;
        this.installPrompt = null;
        
        this.init();
    }

    init() {
        console.log('📱 Initializing Mobile Interactions...');
        
        if (this.isMobile) {
            this.setupMobileLayout();
            this.setupMobileNavigation();
            this.setupTouchGestures();
            this.setupPullToRefresh();
        }
        
        this.setupPWA();
        this.setupResizeHandler();
        
        console.log('✅ Mobile Interactions Ready');
    }

    // ================================
    // MOBILE LAYOUT SETUP
    // ================================

    setupMobileLayout() {
        // Add mobile navigation HTML
        this.createMobileNavigation();
        
        // Add mobile filters overlay
        this.createMobileFilters();
        
        // Add mobile search overlay
        this.createMobileSearch();
        
        // Convert existing product grid to mobile format
        this.convertToMobileProducts();
        
        // Setup mobile floating action button
        this.createMobileFAB();
    }

    createMobileNavigation() {
        // Top mobile header
        const mobileHeaderHTML = `
            <div class="mobile-header">
                <div class="mobile-nav-container">
                    <a href="#" class="mobile-logo">
                        <i class="fas fa-rocket"></i> QuickLocal
                    </a>
                    <div class="mobile-nav-actions">
                        <button class="mobile-nav-btn" id="mobileSearchBtn">
                            <i class="fas fa-search"></i>
                        </button>
                        <button class="mobile-nav-btn" id="mobileCartBtn">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="badge" id="mobileCartCount">0</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Bottom navigation
        const mobileBottomNavHTML = `
            <div class="mobile-bottom-nav">
                <div class="mobile-nav-items">
                    <a href="#" class="mobile-nav-item active" data-tab="home">
                        <i class="fas fa-home"></i>
                        <span>Home</span>
                    </a>
                    <a href="#" class="mobile-nav-item" data-tab="categories">
                        <i class="fas fa-th-large"></i>
                        <span>Categories</span>
                    </a>
                    <a href="#" class="mobile-nav-item" data-tab="search">
                        <i class="fas fa-search"></i>
                        <span>Search</span>
                    </a>
                    <a href="#" class="mobile-nav-item" data-tab="wishlist" id="mobileWishlistBtn">
                        <i class="far fa-heart"></i>
                        <span>Wishlist</span>
                    </a>
                    <a href="#" class="mobile-nav-item" data-tab="account">
                        <i class="far fa-user"></i>
                        <span>Account</span>
                    </a>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', mobileHeaderHTML);
        document.body.insertAdjacentHTML('beforeend', mobileBottomNavHTML);
    }

    createMobileFilters() {
        const mobileFiltersHTML = `
            <div class="mobile-filters-overlay" id="mobileFiltersOverlay">
                <div class="mobile-filters-panel">
                    <div class="mobile-filters-header">
                        <h3 class="mobile-filters-title">Filter Products</h3>
                        <button class="mobile-filters-close" id="mobileFiltersClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="mobile-filter-section">
                        <label class="mobile-filter-label">Categories</label>
                        <div class="mobile-filter-options" id="mobileCategoryFilters">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                    
                    <div class="mobile-filter-section">
                        <label class="mobile-filter-label">Price Range</label>
                        <div class="mobile-filter-options" id="mobilePriceFilters">
                            <button class="mobile-filter-option" data-price="">All Prices</button>
                            <button class="mobile-filter-option" data-price="0-500">Under ₹500</button>
                            <button class="mobile-filter-option" data-price="500-1000">₹500 - ₹1000</button>
                            <button class="mobile-filter-option" data-price="1000-5000">₹1000 - ₹5000</button>
                            <button class="mobile-filter-option" data-price="5000+">Above ₹5000</button>
                        </div>
                    </div>
                    
                    <div class="mobile-filter-section">
                        <label class="mobile-filter-label">Sort By</label>
                        <div class="mobile-filter-options" id="mobileSortFilters">
                            <button class="mobile-filter-option active" data-sort="name">Name (A-Z)</button>
                            <button class="mobile-filter-option" data-sort="price-low">Price: Low to High</button>
                            <button class="mobile-filter-option" data-sort="price-high">Price: High to Low</button>
                            <button class="mobile-filter-option" data-sort="rating">Highest Rated</button>
                        </div>
                    </div>
                    
                    <div class="mobile-filters-actions">
                        <button class="mobile-filter-btn mobile-filter-clear" id="mobileClearFilters">
                            Clear All
                        </button>
                        <button class="mobile-filter-btn mobile-filter-apply" id="mobileApplyFilters">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', mobileFiltersHTML);
    }

    createMobileSearch() {
        const mobileSearchHTML = `
            <div class="mobile-search-overlay" id="mobileSearchOverlay">
                <div class="mobile-search-container">
                    <div class="mobile-search-header">
                        <input type="text" class="mobile-search-input" 
                               placeholder="Search for products..." 
                               id="mobileSearchInput">
                        <button class="mobile-search-cancel" id="mobileSearchCancel">
                            Cancel
                        </button>
                    </div>
                    <div class="mobile-search-suggestions" id="mobileSearchSuggestions">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', mobileSearchHTML);
    }

    createMobileFAB() {
        const fabHTML = `
            <button class="mobile-fab" id="mobileFab" title="Scroll to top">
                <i class="fas fa-arrow-up"></i>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', fabHTML);
    }

    convertToMobileProducts() {
        // Check if we already have mobile products grid
        if (document.querySelector('.mobile-products-grid')) return;

        const productsContainer = document.querySelector('#products-container');
        if (!productsContainer) return;

        // Create mobile products grid
        const mobileGrid = document.createElement('div');
        mobileGrid.className = 'mobile-products-grid';
        mobileGrid.id = 'mobile-products-container';

        // Insert mobile grid after the regular products container
        productsContainer.parentNode.insertBefore(mobileGrid, productsContainer.nextSibling);

        // Convert existing products to mobile format
        this.refreshMobileProducts();
    }

    refreshMobileProducts() {
        const regularGrid = document.querySelector('.products-grid, #products-container');
        const mobileGrid = document.querySelector('#mobile-products-container');
        
        if (!regularGrid || !mobileGrid) return;

        const products = Array.from(regularGrid.querySelectorAll('.product-card, .enhanced-product-card'));
        
        mobileGrid.innerHTML = products.map(productCard => {
            const productId = productCard.dataset.productId || productCard.id;
            const productName = productCard.querySelector('.product-name, .enhanced-product-title')?.textContent || 'Product';
            const productPrice = productCard.querySelector('.price-current, .current-price')?.textContent || '₹0';
            const productImage = productCard.querySelector('.product-image, .enhanced-product-image')?.src || '';
            const productRating = productCard.querySelector('.rating-text')?.textContent || '(0)';

            return `
                <div class="mobile-product-card touch-feedback" 
                     data-product-id="${productId}" 
                     onclick="mobileInteractions.handleMobileProductClick('${productId}')">
                    <img src="${productImage}" 
                         alt="${productName}" 
                         class="mobile-product-image"
                         loading="lazy"
                         onerror="this.src='https://placehold.co/200x200/f0f0f0/999999?text=Product';">
                    <div class="mobile-product-info">
                        <h3 class="mobile-product-title">${productName}</h3>
                        <div class="mobile-product-price">${productPrice}</div>
                        <div class="mobile-product-rating">
                            <i class="fas fa-star" style="color: #fbbf24;"></i>
                            <span>${productRating}</span>
                        </div>
                        <div class="mobile-product-actions">
                            <button class="mobile-add-to-cart" 
                                    onclick="event.stopPropagation(); mobileInteractions.handleMobileAddToCart('${productId}')">
                                <i class="fas fa-shopping-cart"></i>
                                Add to Cart
                            </button>
                            <button class="mobile-quick-action" 
                                    onclick="event.stopPropagation(); mobileInteractions.toggleMobileWishlist('${productId}')"
                                    title="Add to Wishlist">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ================================
    // MOBILE NAVIGATION
    // ================================

    setupMobileNavigation() {
        // Bottom navigation tabs
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleMobileNavClick(e));
        });

        // Mobile search button
        document.getElementById('mobileSearchBtn')?.addEventListener('click', () => {
            this.showMobileSearch();
        });

        // Mobile search cancel
        document.getElementById('mobileSearchCancel')?.addEventListener('click', () => {
            this.hideMobileSearch();
        });

        // Mobile filters
        document.getElementById('mobileFiltersClose')?.addEventListener('click', () => {
            this.hideMobileFilters();
        });

        document.getElementById('mobileApplyFilters')?.addEventListener('click', () => {
            this.applyMobileFilters();
        });

        document.getElementById('mobileClearFilters')?.addEventListener('click', () => {
            this.clearMobileFilters();
        });

        // Mobile FAB
        document.getElementById('mobileFab')?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Filter options
        document.querySelectorAll('.mobile-filter-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleMobileFilterClick(e));
        });

        // Setup mobile cart updates
        this.updateMobileCartCount();
    }

    handleMobileNavClick(e) {
        e.preventDefault();
        const tab = e.currentTarget.dataset.tab;
        
        // Update active state
        document.querySelectorAll('.mobile-nav-item').forEach(item => 
            item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Handle different tab actions
        switch (tab) {
            case 'home':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'categories':
                this.showMobileCategories();
                break;
            case 'search':
                this.showMobileSearch();
                break;
            case 'wishlist':
                this.showMobileWishlist();
                break;
            case 'account':
                this.showMobileAccount();
                break;
        }

        this.addTouchFeedback(e.currentTarget);
    }

    showMobileSearch() {
        const overlay = document.getElementById('mobileSearchOverlay');
        const input = document.getElementById('mobileSearchInput');
        
        overlay.classList.add('active');
        setTimeout(() => input.focus(), 300);
    }

    hideMobileSearch() {
        const overlay = document.getElementById('mobileSearchOverlay');
        overlay.classList.remove('active');
    }

    showMobileFilters() {
        const overlay = document.getElementById('mobileFiltersOverlay');
        overlay.classList.add('active');
    }

    hideMobileFilters() {
        const overlay = document.getElementById('mobileFiltersOverlay');
        overlay.classList.remove('active');
    }

    showMobileCategories() {
        // Scroll to categories section or show category filter
        const categoriesSection = document.getElementById('categoryList') || 
                                  document.querySelector('.category-item');
        
        if (categoriesSection) {
            categoriesSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            this.showMobileFilters();
        }
    }

    showMobileWishlist() {
        if (window.enhancedInteractions) {
            const userData = window.enhancedInteractions.getUserData();
            if (userData.wishlist.length > 0) {
                this.showToast(`You have ${userData.wishlist.length} items in your wishlist`, 'info');
            } else {
                this.showToast('Your wishlist is empty', 'info');
            }
        }
    }

    showMobileAccount() {
        if (window.auth && window.auth.isLoggedIn()) {
            const user = window.auth.getUser();
            this.showToast(`Logged in as ${user.name}`, 'info');
        } else {
            this.showToast('Please login to access your account', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }

    // ================================
    // MOBILE PRODUCT INTERACTIONS
    // ================================

    handleMobileProductClick(productId) {
        this.addTouchFeedback(event.currentTarget);
        
        // Navigate to product detail page or show quick view
        if (window.handleCardClick) {
            window.handleCardClick(productId);
        } else if (window.enhancedInteractions) {
            window.enhancedInteractions.showQuickView(productId);
        }
    }

    handleMobileAddToCart(productId) {
        const button = event.currentTarget;
        
        // Add loading state
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        
        // Call existing add to cart function
        if (window.handleAddToCart) {
            window.handleAddToCart(productId).then(() => {
                this.updateMobileCartCount();
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-check"></i> Added!';
                
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
                }, 2000);
            }).catch(() => {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            });
        }
    }

    toggleMobileWishlist(productId) {
        const button = event.currentTarget;
        const icon = button.querySelector('i');
        
        if (window.enhancedInteractions) {
            const userData = window.enhancedInteractions.getUserData();
            const isInWishlist = userData.wishlist.includes(productId);
            
            if (isInWishlist) {
                window.enhancedInteractions.removeFromWishlist(productId);
                icon.className = 'far fa-heart';
                button.classList.remove('active');
            } else {
                window.enhancedInteractions.addToWishlist(productId);
                icon.className = 'fas fa-heart';
                button.classList.add('active');
            }
        }
        
        this.addTouchFeedback(button);
    }

    updateMobileCartCount() {
        const mobileCartCount = document.getElementById('mobileCartCount');
        const regularCartCount = document.getElementById('cart-count');
        
        if (mobileCartCount && regularCartCount) {
            mobileCartCount.textContent = regularCartCount.textContent;
            mobileCartCount.style.display = regularCartCount.style.display;
        }
    }

    // ================================
    // MOBILE FILTERS
    // ================================

    handleMobileFilterClick(e) {
        const option = e.currentTarget;
        const section = option.closest('.mobile-filter-section');
        
        // Remove active from siblings
        section.querySelectorAll('.mobile-filter-option').forEach(opt => 
            opt.classList.remove('active'));
        
        // Add active to clicked option
        option.classList.add('active');
        
        this.addTouchFeedback(option);
    }

    applyMobileFilters() {
        // Collect filter values
        const categoryFilter = document.querySelector('#mobileCategoryFilters .mobile-filter-option.active')?.dataset.category || '';
        const priceFilter = document.querySelector('#mobilePriceFilters .mobile-filter-option.active')?.dataset.price || '';
        const sortFilter = document.querySelector('#mobileSortFilters .mobile-filter-option.active')?.dataset.sort || 'name';
        
        // Apply filters using existing desktop filter system
        if (window.appState) {
            window.appState.currentFilters = {
                ...window.appState.currentFilters,
                category: categoryFilter,
                priceRange: priceFilter,
                sortBy: sortFilter,
                page: 1
            };
            
            if (window.applyAllFilters) {
                window.applyAllFilters();
            }
        }
        
        this.hideMobileFilters();
        this.showToast('Filters applied', 'success');
    }

    clearMobileFilters() {
        // Clear all filter selections
        document.querySelectorAll('.mobile-filter-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Activate default options
        document.querySelector('#mobileCategoryFilters .mobile-filter-option[data-category=""]')?.classList.add('active');
        document.querySelector('#mobilePriceFilters .mobile-filter-option[data-price=""]')?.classList.add('active');
        document.querySelector('#mobileSortFilters .mobile-filter-option[data-sort="name"]')?.classList.add('active');
    }

    // ================================
    // TOUCH GESTURES
    // ================================

    setupTouchGestures() {
        // Touch feedback for all interactive elements
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.touch-feedback, .mobile-nav-item, .mobile-filter-option, .mobile-add-to-cart')) {
                this.addTouchFeedback(e.target.closest('.touch-feedback, .mobile-nav-item, .mobile-filter-option, .mobile-add-to-cart'));
            }
        });

        // Swipe gestures for navigation
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Swipe thresholds
            const minSwipeDistance = 50;
            const maxSwipeTime = 300;

            if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < Math.abs(deltaX) / 2) {
                if (deltaX > 0) {
                    // Swipe right
                    this.handleSwipeRight();
                } else {
                    // Swipe left
                    this.handleSwipeLeft();
                }
            }

            touchStartX = 0;
            touchStartY = 0;
        });
    }

    addTouchFeedback(element) {
        if (!element || !element.classList) return;
        
        element.classList.add('touched');
        setTimeout(() => {
            element.classList.remove('touched');
        }, 300);
    }

    handleSwipeLeft() {
        // Navigate to next tab or close overlays
        const activeOverlay = document.querySelector('.mobile-search-overlay.active, .mobile-filters-overlay.active');
        if (activeOverlay) {
            activeOverlay.classList.remove('active');
        }
    }

    handleSwipeRight() {
        // Navigate to previous tab or show side menu
        console.log('Swipe right detected');
    }

    // ================================
    // PULL TO REFRESH
    // ================================

    setupPullToRefresh() {
        let pullStart = 0;
        let pullChange = 0;
        let pullIndicator = this.createPullIndicator();

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                pullStart = e.touches[0].screenY;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && pullStart) {
                pullChange = e.touches[0].screenY - pullStart;
                
                if (pullChange > 0) {
                    e.preventDefault();
                    
                    if (pullChange > 100) {
                        pullIndicator.classList.add('active');
                        pullIndicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
                    } else {
                        pullIndicator.classList.remove('active');
                        pullIndicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
                    }
                }
            }
        });

        document.addEventListener('touchend', () => {
            if (pullChange > 100 && !this.isRefreshing) {
                this.triggerPullRefresh(pullIndicator);
            } else {
                pullIndicator.classList.remove('active');
            }
            
            pullStart = 0;
            pullChange = 0;
        });
    }

    createPullIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'pull-indicator';
        indicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
        
        const container = document.querySelector('.products-section, main') || document.body;
        container.style.position = 'relative';
        container.appendChild(indicator);
        
        return indicator;
    }

    async triggerPullRefresh(indicator) {
        if (this.isRefreshing) return;
        
        this.isRefreshing = true;
        indicator.classList.add('active', 'loading');
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        try {
            // Refresh products data
            if (window.loadProducts) {
                await window.loadProducts();
            }
            
            // Refresh mobile product grid
            this.refreshMobileProducts();
            
            this.showToast('Products refreshed', 'success');
        } catch (error) {
            this.showToast('Failed to refresh', 'error');
        } finally {
            setTimeout(() => {
                indicator.classList.remove('active', 'loading');
                this.isRefreshing = false;
            }, 1000);
        }
    }

    // ================================
    // PROGRESSIVE WEB APP (PWA)
    // ================================

    setupPWA() {
        // Handle PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showPWAInstallPrompt();
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            this.hidePWAInstallPrompt();
            this.showToast('App installed successfully!', 'success');
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showToast('You are back online', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.showToast('You are offline. Some features may be limited.', 'warning');
        });
    }

    showPWAInstallPrompt() {
        if (document.querySelector('.pwa-install-prompt')) return;

        const promptHTML = `
            <div class="pwa-install-prompt" id="pwaInstallPrompt">
                <div class="pwa-prompt-header">
                    <div class="pwa-app-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <div class="pwa-app-info">
                        <h3>Install QuickLocal</h3>
                        <p>Get quick access and better performance</p>
                    </div>
                </div>
                <div class="pwa-prompt-actions">
                    <button class="pwa-btn pwa-btn-dismiss" id="pwaDismiss">
                        Maybe Later
                    </button>
                    <button class="pwa-btn pwa-btn-install" id="pwaInstall">
                        Install App
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', promptHTML);

        // Show prompt after delay
        setTimeout(() => {
            document.getElementById('pwaInstallPrompt').classList.add('show');
        }, 2000);

        // Setup event listeners
        document.getElementById('pwaInstall').addEventListener('click', () => {
            this.installPWA();
        });

        document.getElementById('pwaDismiss').addEventListener('click', () => {
            this.hidePWAInstallPrompt();
        });
    }

    async installPWA() {
        if (!this.installPrompt) return;

        try {
            const result = await this.installPrompt.prompt();
            console.log('PWA install prompt result:', result.outcome);
            
            if (result.outcome === 'accepted') {
                this.hidePWAInstallPrompt();
            }
        } catch (error) {
            console.error('Error installing PWA:', error);
        }

        this.installPrompt = null;
    }

    hidePWAInstallPrompt() {
        const prompt = document.getElementById('pwaInstallPrompt');
        if (prompt) {
            prompt.classList.remove('show');
            setTimeout(() => prompt.remove(), 300);
        }
    }

    syncOfflineData() {
        // Sync any cached data when coming back online
        console.log('Syncing offline data...');
        
        // You can implement offline data synchronization here
        if (window.enhancedInteractions) {
            const userData = window.enhancedInteractions.getUserData();
            // Sync wishlist, cart, etc.
        }
    }

    // ================================
    // RESPONSIVE HANDLING
    // ================================

    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasMobile = this.isMobile;
                this.isMobile = window.innerWidth <= 767;
                
                if (wasMobile !== this.isMobile) {
                    this.handleLayoutChange();
                }
            }, 250);
        });
    }

    handleLayoutChange() {
        if (this.isMobile) {
            // Switching to mobile
            if (!document.querySelector('.mobile-header')) {
                this.setupMobileLayout();
                this.setupMobileNavigation();
            }
        } else {
            // Switching to desktop
            this.hideMobileSearch();
            this.hideMobileFilters();
        }
    }

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    showToast(message, type = 'info', duration = 3000) {
        // Use enhanced toast system if available
        if (window.enhancedInteractions && window.enhancedInteractions.showToast) {
            window.enhancedInteractions.showToast(message, type, duration);
            return;
        }

        // Fallback simple toast
        const toast = document.createElement('div');
        toast.className = `mobile-toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--primary);
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Public API methods
    refreshProducts() {
        this.refreshMobileProducts();
    }

    updateCartCount() {
        this.updateMobileCartCount();
    }

    showFilters() {
        if (this.isMobile) {
            this.showMobileFilters();
        }
    }

    // Device detection utilities
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: window.innerWidth >= 768 && window.innerWidth <= 1024,
            isDesktop: window.innerWidth > 1024,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            isOnline: navigator.onLine,
            hasTouchSupport: 'ontouchstart' in window,
            isPWA: window.matchMedia('(display-mode: standalone)').matches
        };
    }
}

// Initialize mobile interactions
window.mobileInteractions = new MobileInteractions();

// Make it globally available
window.MobileInteractions = MobileInteractions;

// Update mobile products when the main product grid updates
if (window.MutationObserver) {
    const productObserver = new MutationObserver((mutations) => {
        let shouldRefresh = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && 
                mutation.target.id === 'products-container') {
                shouldRefresh = true;
            }
        });
        
        if (shouldRefresh && window.mobileInteractions.isMobile) {
            setTimeout(() => {
                window.mobileInteractions.refreshProducts();
            }, 100);
        }
    });
    
    const productsContainer = document.querySelector('#products-container');
    if (productsContainer) {
        productObserver.observe(productsContainer, {
            childList: true,
            subtree: true
        });
    }
}

// Listen for cart updates
document.addEventListener('cartUpdated', () => {
    window.mobileInteractions.updateCartCount();
});

console.log('📱 Mobile Interactions Module Loaded');
