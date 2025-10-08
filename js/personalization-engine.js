/**
 * QuickLocal Advanced Personalization Engine
 * Implements AI-powered personalization like Flipkart/Amazon
 */

class PersonalizationEngine {
    constructor() {
        this.userId = this.getUserId();
        this.sessionId = this.generateSessionId();
        this.userProfile = this.loadUserProfile();
        this.behaviorData = this.loadBehaviorData();
        this.preferences = this.loadPreferences();
        this.recommendations = {
            homepage: [],
            product: [],
            category: [],
            search: []
        };
        
        this.init();
    }

    init() {
        console.log('🎯 Initializing Personalization Engine...');
        this.trackUserBehavior();
        this.loadPersonalizedContent();
        this.setupEventListeners();
        this.startBehaviorTracking();
        console.log('✅ Personalization Engine Ready');
    }

    // ================================
    // USER PROFILE MANAGEMENT
    // ================================
    
    getUserId() {
        let userId = localStorage.getItem('quicklocal_user_id');
        if (!userId) {
            userId = 'guest_' + this.generateUniqueId();
            localStorage.setItem('quicklocal_user_id', userId);
        }
        return userId;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    loadUserProfile() {
        const defaultProfile = {
            demographics: {
                age: null,
                gender: null,
                location: null,
                language: 'en'
            },
            preferences: {
                categories: [],
                brands: [],
                priceRange: { min: 0, max: 10000 },
                deliveryPreference: 'fastest',
                paymentMethod: null
            },
            behavior: {
                searchHistory: [],
                viewHistory: [],
                purchaseHistory: [],
                cartItems: [],
                wishlistItems: [],
                browsingSessions: []
            },
            engagement: {
                totalSessions: 0,
                totalTimeSpent: 0,
                averageSessionDuration: 0,
                lastVisit: null,
                frequency: 'new'
            }
        };

        const saved = localStorage.getItem('quicklocal_user_profile');
        return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    }

    saveUserProfile() {
        localStorage.setItem('quicklocal_user_profile', JSON.stringify(this.userProfile));
    }

    loadBehaviorData() {
        const saved = localStorage.getItem('quicklocal_behavior_data');
        return saved ? JSON.parse(saved) : {
            pageViews: [],
            clicks: [],
            searches: [],
            productViews: [],
            cartActions: [],
            purchases: [],
            timeOnPage: {},
            scrollDepth: {},
            interactionHeatmap: {}
        };
    }

    saveBehaviorData() {
        localStorage.setItem('quicklocal_behavior_data', JSON.stringify(this.behaviorData));
    }

    loadPreferences() {
        const saved = localStorage.getItem('quicklocal_preferences');
        return saved ? JSON.parse(saved) : {
            theme: 'light',
            layout: 'grid',
            itemsPerPage: 20,
            sortPreference: 'relevance',
            notifications: {
                priceDrops: true,
                newArrivals: true,
                recommendations: true,
                offers: true
            }
        };
    }

    savePreferences() {
        localStorage.setItem('quicklocal_preferences', JSON.stringify(this.preferences));
    }

    // ================================
    // BEHAVIOR TRACKING
    // ================================

    trackUserBehavior() {
        // Track page views
        this.trackPageView();
        
        // Track clicks
        document.addEventListener('click', (e) => this.trackClick(e));
        
        // Track scroll behavior
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => this.trackScrollDepth(), 150);
        });

        // Track time on page
        this.startTimeTracking();
        
        // Track form interactions
        this.trackFormInteractions();
        
        // Track product interactions
        this.trackProductInteractions();
    }

    trackPageView() {
        const pageData = {
            url: window.location.href,
            path: window.location.pathname,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`
        };

        this.behaviorData.pageViews.push(pageData);
        this.updateEngagementStats();
        this.saveBehaviorData();
    }

    trackClick(event) {
        const target = event.target;
        const clickData = {
            element: target.tagName,
            className: target.className,
            id: target.id,
            text: target.textContent?.substring(0, 100),
            href: target.href,
            timestamp: Date.now(),
            coordinates: { x: event.clientX, y: event.clientY },
            sessionId: this.sessionId
        };

        this.behaviorData.clicks.push(clickData);
        
        // Track specific product interactions
        if (target.closest('.product-card')) {
            this.trackProductClick(target.closest('.product-card'));
        }

        // Limit stored clicks to last 1000
        if (this.behaviorData.clicks.length > 1000) {
            this.behaviorData.clicks = this.behaviorData.clicks.slice(-1000);
        }

        this.saveBehaviorData();
    }

    trackProductClick(productElement) {
        const productId = productElement.dataset.productId || productElement.id;
        const productName = productElement.querySelector('.product-name')?.textContent;
        const productPrice = productElement.querySelector('.product-price')?.textContent;
        const productCategory = productElement.dataset.category;

        const productInteraction = {
            productId,
            productName,
            productPrice,
            productCategory,
            action: 'click',
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        this.behaviorData.productViews.push(productInteraction);
        this.updateUserPreferences(productInteraction);
    }

    trackScrollDepth() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        const currentPage = window.location.pathname;
        
        if (!this.behaviorData.scrollDepth[currentPage]) {
            this.behaviorData.scrollDepth[currentPage] = [];
        }
        
        this.behaviorData.scrollDepth[currentPage].push({
            depth: scrollPercent,
            timestamp: Date.now()
        });
    }

    startTimeTracking() {
        this.pageStartTime = Date.now();
        
        // Track time when user leaves page
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - this.pageStartTime;
            const currentPage = window.location.pathname;
            
            if (!this.behaviorData.timeOnPage[currentPage]) {
                this.behaviorData.timeOnPage[currentPage] = [];
            }
            
            this.behaviorData.timeOnPage[currentPage].push(timeSpent);
            this.userProfile.engagement.totalTimeSpent += timeSpent;
            this.saveBehaviorData();
            this.saveUserProfile();
        });
    }

    trackFormInteractions() {
        document.addEventListener('focus', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.trackFormField(e.target, 'focus');
            }
        });

        document.addEventListener('blur', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.trackFormField(e.target, 'blur');
            }
        });
    }

    trackFormField(element, action) {
        const formData = {
            fieldName: element.name || element.id,
            fieldType: element.type,
            action: action,
            timestamp: Date.now(),
            formId: element.closest('form')?.id
        };

        // Don't track sensitive data
        if (!['password', 'credit-card', 'cvv'].includes(element.type)) {
            this.behaviorData.formInteractions = this.behaviorData.formInteractions || [];
            this.behaviorData.formInteractions.push(formData);
        }
    }

    trackProductInteractions() {
        // Track product views
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.trackProductView(entry.target);
                }
            });
        }, { threshold: 0.5 });

        // Observe all product cards
        document.querySelectorAll('.product-card').forEach(card => {
            observer.observe(card);
        });
    }

    trackProductView(productElement) {
        const productId = productElement.dataset.productId;
        const productName = productElement.querySelector('.product-name')?.textContent;
        const productCategory = productElement.dataset.category;

        if (productId) {
            const viewData = {
                productId,
                productName,
                productCategory,
                timestamp: Date.now(),
                sessionId: this.sessionId,
                viewDuration: 0
            };

            this.behaviorData.productViews.push(viewData);
            this.updateRecentlyViewed(viewData);
        }
    }

    // ================================
    // PERSONALIZATION ALGORITHMS
    // ================================

    updateUserPreferences(interaction) {
        // Update category preferences
        if (interaction.productCategory) {
            const categories = this.userProfile.preferences.categories;
            const categoryIndex = categories.findIndex(c => c.name === interaction.productCategory);
            
            if (categoryIndex >= 0) {
                categories[categoryIndex].score += 1;
            } else {
                categories.push({
                    name: interaction.productCategory,
                    score: 1,
                    lastInteraction: Date.now()
                });
            }
        }

        // Update brand preferences (if available)
        if (interaction.brand) {
            const brands = this.userProfile.preferences.brands;
            const brandIndex = brands.findIndex(b => b.name === interaction.brand);
            
            if (brandIndex >= 0) {
                brands[brandIndex].score += 1;
            } else {
                brands.push({
                    name: interaction.brand,
                    score: 1,
                    lastInteraction: Date.now()
                });
            }
        }

        // Update price range preferences
        if (interaction.productPrice) {
            const price = parseFloat(interaction.productPrice.replace(/[^\d.]/g, ''));
            if (!isNaN(price)) {
                const currentRange = this.userProfile.preferences.priceRange;
                if (price < currentRange.min || currentRange.min === 0) {
                    currentRange.min = Math.floor(price * 0.8);
                }
                if (price > currentRange.max || currentRange.max === 10000) {
                    currentRange.max = Math.ceil(price * 1.2);
                }
            }
        }

        this.saveUserProfile();
    }

    updateRecentlyViewed(viewData) {
        let recentlyViewed = this.userProfile.behavior.viewHistory || [];
        
        // Remove if already exists
        recentlyViewed = recentlyViewed.filter(item => item.productId !== viewData.productId);
        
        // Add to beginning
        recentlyViewed.unshift(viewData);
        
        // Keep only last 50 items
        this.userProfile.behavior.viewHistory = recentlyViewed.slice(0, 50);
        
        this.saveUserProfile();
        this.renderRecentlyViewed();
    }

    updateEngagementStats() {
        this.userProfile.engagement.totalSessions += 1;
        this.userProfile.engagement.lastVisit = Date.now();
        
        // Calculate frequency
        const daysSinceFirstVisit = this.getDaysSinceFirstVisit();
        if (daysSinceFirstVisit < 1) {
            this.userProfile.engagement.frequency = 'new';
        } else if (daysSinceFirstVisit < 7) {
            this.userProfile.engagement.frequency = 'returning';
        } else if (this.userProfile.engagement.totalSessions > 20) {
            this.userProfile.engagement.frequency = 'loyal';
        } else {
            this.userProfile.engagement.frequency = 'occasional';
        }

        this.saveUserProfile();
    }

    getDaysSinceFirstVisit() {
        const firstVisit = this.behaviorData.pageViews[0]?.timestamp || Date.now();
        return (Date.now() - firstVisit) / (1000 * 60 * 60 * 24);
    }

    // ================================
    // RECOMMENDATION ENGINE
    // ================================

    async generateRecommendations() {
        console.log('🤖 Generating personalized recommendations...');
        
        try {
            // Generate different types of recommendations
            this.recommendations.homepage = await this.getHomepageRecommendations();
            this.recommendations.category = await this.getCategoryRecommendations();
            this.recommendations.trending = await this.getTrendingRecommendations();
            this.recommendations.similar = await this.getSimilarProductRecommendations();
            
            console.log('✅ Recommendations generated:', this.recommendations);
            return this.recommendations;
        } catch (error) {
            console.error('❌ Error generating recommendations:', error);
            return this.getFallbackRecommendations();
        }
    }

    async getHomepageRecommendations() {
        // Based on user's category preferences and browsing history
        const categoryPreferences = this.userProfile.preferences.categories
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        
        const recommendations = [];
        
        for (const category of categoryPreferences) {
            const products = await this.fetchProductsByCategory(category.name);
            recommendations.push({
                section: `Recommended in ${category.name}`,
                products: products.slice(0, 6),
                reason: 'Based on your browsing history'
            });
        }

        return recommendations;
    }

    async getCategoryRecommendations() {
        // Recommendations within current category
        const currentCategory = this.getCurrentCategory();
        if (!currentCategory) return [];

        const products = await this.fetchProductsByCategory(currentCategory);
        return [{
            section: 'You might also like',
            products: products.slice(0, 8),
            reason: 'Popular in this category'
        }];
    }

    async getTrendingRecommendations() {
        // Trending products based on overall user behavior
        return [{
            section: 'Trending Now',
            products: await this.fetchTrendingProducts(),
            reason: 'Popular right now'
        }];
    }

    async getSimilarProductRecommendations(productId = null) {
        if (!productId) return [];
        
        // Find similar products based on category, brand, price range
        const currentProduct = await this.fetchProduct(productId);
        if (!currentProduct) return [];

        const similarProducts = await this.fetchSimilarProducts(currentProduct);
        return [{
            section: 'Similar Products',
            products: similarProducts.slice(0, 6),
            reason: 'Similar to what you\'re viewing'
        }];
    }

    // ================================
    // API INTERACTIONS
    // ================================

    async fetchProductsByCategory(category) {
        try {
            // Use your existing API
            if (window.api && window.api.products) {
                return await window.api.products.list({ category });
            } else {
                // Fallback to mock data
                return this.getMockProductsByCategory(category);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            return this.getMockProductsByCategory(category);
        }
    }

    async fetchTrendingProducts() {
        try {
            if (window.api && window.api.products) {
                return await window.api.products.list({ sort: 'trending', limit: 8 });
            } else {
                return this.getMockTrendingProducts();
            }
        } catch (error) {
            console.error('Error fetching trending products:', error);
            return this.getMockTrendingProducts();
        }
    }

    async fetchProduct(productId) {
        try {
            if (window.api && window.api.products) {
                return await window.api.products.get(productId);
            } else {
                return this.getMockProduct(productId);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    }

    async fetchSimilarProducts(product) {
        try {
            if (window.api && window.api.products) {
                return await window.api.products.list({ 
                    category: product.category, 
                    exclude: product.id,
                    limit: 6 
                });
            } else {
                return this.getMockSimilarProducts(product);
            }
        } catch (error) {
            console.error('Error fetching similar products:', error);
            return this.getMockSimilarProducts(product);
        }
    }

    // ================================
    // UI RENDERING
    // ================================

    async loadPersonalizedContent() {
        console.log('🎨 Loading personalized content...');
        
        // Generate recommendations
        await this.generateRecommendations();
        
        // Render personalized sections
        this.renderPersonalizedHomepage();
        this.renderRecentlyViewed();
        this.renderPersonalizedOffers();
        this.renderUserPreferences();
        
        // Apply user preferences
        this.applyUserPreferences();
    }

    renderPersonalizedHomepage() {
        const homepageContainer = document.querySelector('.personalized-content');
        if (!homepageContainer) return;

        let html = '<div class="personalization-sections">';

        // Recently viewed section
        if (this.userProfile.behavior.viewHistory && this.userProfile.behavior.viewHistory.length > 0) {
            html += this.createRecentlyViewedSection();
        }

        // Recommendation sections
        this.recommendations.homepage.forEach(section => {
            html += this.createRecommendationSection(section);
        });

        // Trending section
        if (this.recommendations.trending && this.recommendations.trending.length > 0) {
            html += this.createRecommendationSection(this.recommendations.trending[0]);
        }

        html += '</div>';
        homepageContainer.innerHTML = html;
    }

    createRecentlyViewedSection() {
        const recentItems = this.userProfile.behavior.viewHistory.slice(0, 8);
        
        return `
            <div class="recommendation-section recently-viewed">
                <div class="section-header">
                    <h3>Recently Viewed</h3>
                    <p class="section-subtitle">Continue where you left off</p>
                </div>
                <div class="products-grid horizontal-scroll">
                    ${recentItems.map(item => this.createPersonalizedProductCard(item)).join('')}
                </div>
            </div>
        `;
    }

    createRecommendationSection(section) {
        return `
            <div class="recommendation-section">
                <div class="section-header">
                    <h3>${section.section}</h3>
                    <p class="section-subtitle">${section.reason}</p>
                    <a href="#" class="view-all-link">View All</a>
                </div>
                <div class="products-grid horizontal-scroll">
                    ${section.products.map(product => this.createPersonalizedProductCard(product)).join('')}
                </div>
            </div>
        `;
    }

    createPersonalizedProductCard(product) {
        const discount = this.calculateDiscount(product.originalPrice, product.price);
        const isInWishlist = this.isProductInWishlist(product.id || product.productId);
        
        return `
            <div class="personalized-product-card" data-product-id="${product.id || product.productId}">
                <div class="product-image-container">
                    <img src="${product.image || this.getPlaceholderImage()}" alt="${product.name || product.productName}" loading="lazy">
                    ${discount > 0 ? `<div class="discount-badge">${discount}% OFF</div>` : ''}
                    <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" data-product-id="${product.id || product.productId}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <div class="quick-actions">
                        <button class="quick-view-btn" data-product-id="${product.id || product.productId}">
                            <i class="fas fa-eye"></i> Quick View
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name || product.productName}</h4>
                    <div class="product-rating">
                        <div class="stars">${this.renderStars(product.rating || 4)}</div>
                        <span class="rating-count">(${product.reviewCount || Math.floor(Math.random() * 500)})</span>
                    </div>
                    <div class="product-pricing">
                        <span class="current-price">₹${product.price}</span>
                        ${product.originalPrice && product.originalPrice > product.price ? 
                            `<span class="original-price">₹${product.originalPrice}</span>` : ''}
                    </div>
                    <div class="personalization-reason">
                        ${this.getPersonalizationReason(product)}
                    </div>
                    <button class="add-to-cart-btn" data-product-id="${product.id || product.productId}">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    renderRecentlyViewed() {
        const container = document.querySelector('.recently-viewed-products');
        if (!container || !this.userProfile.behavior.viewHistory.length) return;

        const recentItems = this.userProfile.behavior.viewHistory.slice(0, 6);
        container.innerHTML = `
            <div class="section-header">
                <h3>Recently Viewed</h3>
                <a href="#" class="clear-history">Clear History</a>
            </div>
            <div class="products-slider">
                ${recentItems.map(item => this.createMiniProductCard(item)).join('')}
            </div>
        `;
    }

    renderPersonalizedOffers() {
        const offersContainer = document.querySelector('.personalized-offers');
        if (!offersContainer) return;

        const offers = this.generatePersonalizedOffers();
        offersContainer.innerHTML = offers.map(offer => this.createOfferCard(offer)).join('');
    }

    renderUserPreferences() {
        const preferencesPanel = document.querySelector('.user-preferences-panel');
        if (!preferencesPanel) return;

        preferencesPanel.innerHTML = `
            <div class="preferences-header">
                <h3>Your Preferences</h3>
                <button class="edit-preferences-btn">Edit</button>
            </div>
            <div class="preferences-content">
                ${this.createPreferencesDisplay()}
            </div>
        `;
    }

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    setupEventListeners() {
        // Search personalization
        const searchInput = document.querySelector('#searchInput, .search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.trackSearch(e.target.value));
        }

        // Product interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.wishlist-btn')) {
                this.handleWishlistToggle(e.target.closest('.wishlist-btn'));
            }
            
            if (e.target.closest('.quick-view-btn')) {
                this.handleQuickView(e.target.closest('.quick-view-btn'));
            }
            
            if (e.target.closest('.add-to-cart-btn')) {
                this.handleAddToCart(e.target.closest('.add-to-cart-btn'));
            }
        });

        // Preference updates
        document.addEventListener('change', (e) => {
            if (e.target.closest('.preference-setting')) {
                this.updatePreference(e.target);
            }
        });
    }

    startBehaviorTracking() {
        // Send behavior data to server periodically
        setInterval(() => {
            this.syncBehaviorData();
        }, 30000); // Every 30 seconds

        // Send data before page unload
        window.addEventListener('beforeunload', () => {
            this.syncBehaviorData();
        });
    }

    async syncBehaviorData() {
        try {
            if (window.api && window.api.analytics) {
                await window.api.analytics.track({
                    userId: this.userId,
                    sessionId: this.sessionId,
                    behaviorData: this.behaviorData,
                    userProfile: this.userProfile
                });
            }
        } catch (error) {
            console.error('Error syncing behavior data:', error);
        }
    }

    trackSearch(query) {
        if (query.length > 2) {
            this.behaviorData.searches.push({
                query,
                timestamp: Date.now(),
                sessionId: this.sessionId
            });
            
            this.userProfile.behavior.searchHistory.unshift(query);
            this.userProfile.behavior.searchHistory = this.userProfile.behavior.searchHistory.slice(0, 50);
            
            this.saveBehaviorData();
            this.saveUserProfile();
        }
    }

    handleWishlistToggle(button) {
        const productId = button.dataset.productId;
        const isActive = button.classList.contains('active');
        
        if (isActive) {
            this.removeFromWishlist(productId);
            button.classList.remove('active');
        } else {
            this.addToWishlist(productId);
            button.classList.add('active');
        }
    }

    addToWishlist(productId) {
        if (!this.userProfile.behavior.wishlistItems) {
            this.userProfile.behavior.wishlistItems = [];
        }
        
        if (!this.userProfile.behavior.wishlistItems.includes(productId)) {
            this.userProfile.behavior.wishlistItems.push(productId);
            this.saveUserProfile();
            
            // Track event
            this.behaviorData.productViews.push({
                productId,
                action: 'wishlist_add',
                timestamp: Date.now(),
                sessionId: this.sessionId
            });
            this.saveBehaviorData();
        }
    }

    removeFromWishlist(productId) {
        if (this.userProfile.behavior.wishlistItems) {
            this.userProfile.behavior.wishlistItems = this.userProfile.behavior.wishlistItems
                .filter(id => id !== productId);
            this.saveUserProfile();
            
            // Track event
            this.behaviorData.productViews.push({
                productId,
                action: 'wishlist_remove',
                timestamp: Date.now(),
                sessionId: this.sessionId
            });
            this.saveBehaviorData();
        }
    }

    isProductInWishlist(productId) {
        return this.userProfile.behavior.wishlistItems && 
               this.userProfile.behavior.wishlistItems.includes(productId);
    }

    handleQuickView(button) {
        const productId = button.dataset.productId;
        // Implementation for quick view modal
        if (window.quickLocalMarketplace && window.quickLocalMarketplace.showQuickView) {
            window.quickLocalMarketplace.showQuickView(productId);
        }
        
        // Track event
        this.behaviorData.productViews.push({
            productId,
            action: 'quick_view',
            timestamp: Date.now(),
            sessionId: this.sessionId
        });
        this.saveBehaviorData();
    }

    handleAddToCart(button) {
        const productId = button.dataset.productId;
        
        // Track event
        this.behaviorData.cartActions.push({
            productId,
            action: 'add',
            timestamp: Date.now(),
            sessionId: this.sessionId
        });
        this.saveBehaviorData();
        
        // Add to cart via existing functionality
        if (window.quickLocalMarketplace && window.quickLocalMarketplace.addToCart) {
            window.quickLocalMarketplace.addToCart(productId);
        }
    }

    applyUserPreferences() {
        // Apply theme preference
        if (this.preferences.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // Apply layout preference
        const productGrid = document.querySelector('.products-grid');
        if (productGrid && this.preferences.layout) {
            productGrid.classList.add(`layout-${this.preferences.layout}`);
        }
        
        // Apply items per page
        if (window.quickLocalMarketplace) {
            window.quickLocalMarketplace.productsPerPage = this.preferences.itemsPerPage;
        }
    }

    getCurrentCategory() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('category') || document.body.dataset.category;
    }

    calculateDiscount(originalPrice, currentPrice) {
        if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
        return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    getPersonalizationReason(product) {
        const reasons = [
            'Based on your browsing history',
            'Popular in your area',
            'Trending now',
            'Recommended for you',
            'Similar to your purchases',
            'Top rated in category'
        ];
        
        return `<small class="personalization-reason">${reasons[Math.floor(Math.random() * reasons.length)]}</small>`;
    }

    getPlaceholderImage() {
        return 'https://via.placeholder.com/200x200/f0f0f0/999999?text=Product';
    }

    // ================================
    // MOCK DATA FUNCTIONS
    // ================================

    getMockProductsByCategory(category) {
        const mockProducts = [
            { id: '1', name: 'Wireless Headphones', price: 2999, originalPrice: 3999, category: 'Electronics', rating: 4.5, image: 'https://via.placeholder.com/200x200' },
            { id: '2', name: 'Smart Watch', price: 8999, originalPrice: 12999, category: 'Electronics', rating: 4.2, image: 'https://via.placeholder.com/200x200' },
            { id: '3', name: 'Running Shoes', price: 3999, originalPrice: 5999, category: 'Fashion', rating: 4.7, image: 'https://via.placeholder.com/200x200' },
            { id: '4', name: 'Coffee Maker', price: 4999, originalPrice: 6999, category: 'Home', rating: 4.3, image: 'https://via.placeholder.com/200x200' },
            { id: '5', name: 'Protein Powder', price: 2499, originalPrice: 2999, category: 'Health', rating: 4.6, image: 'https://via.placeholder.com/200x200' },
            { id: '6', name: 'Bluetooth Speaker', price: 1999, originalPrice: 2999, category: 'Electronics', rating: 4.4, image: 'https://via.placeholder.com/200x200' }
        ];
        
        return mockProducts.filter(product => !category || product.category === category);
    }

    getMockTrendingProducts() {
        return this.getMockProductsByCategory().slice(0, 4);
    }

    getMockProduct(productId) {
        const products = this.getMockProductsByCategory();
        return products.find(p => p.id === productId) || products[0];
    }

    getMockSimilarProducts(product) {
        return this.getMockProductsByCategory(product.category).filter(p => p.id !== product.id);
    }

    getFallbackRecommendations() {
        const mockProducts = this.getMockProductsByCategory();
        return {
            homepage: [{
                section: 'Recommended for You',
                products: mockProducts.slice(0, 6),
                reason: 'Popular products'
            }],
            trending: [{
                section: 'Trending Now',
                products: mockProducts.slice(2, 6),
                reason: 'Popular right now'
            }]
        };
    }

    generatePersonalizedOffers() {
        return [
            {
                title: 'Your Category Favorites',
                description: '20% off on Electronics',
                validUntil: Date.now() + (7 * 24 * 60 * 60 * 1000),
                code: 'ELEC20'
            },
            {
                title: 'Welcome Back Offer',
                description: 'Free delivery on your next order',
                validUntil: Date.now() + (3 * 24 * 60 * 60 * 1000),
                code: 'FREEDEL'
            }
        ];
    }

    createOfferCard(offer) {
        return `
            <div class="personalized-offer-card">
                <h4>${offer.title}</h4>
                <p>${offer.description}</p>
                <div class="offer-code">Code: ${offer.code}</div>
                <div class="offer-expiry">Valid until: ${new Date(offer.validUntil).toLocaleDateString()}</div>
                <button class="use-offer-btn" data-code="${offer.code}">Use Offer</button>
            </div>
        `;
    }

    createMiniProductCard(item) {
        return `
            <div class="mini-product-card" data-product-id="${item.productId}">
                <img src="${item.image || this.getPlaceholderImage()}" alt="${item.productName}" loading="lazy">
                <h5>${item.productName}</h5>
                <span class="price">₹${item.price || 'N/A'}</span>
            </div>
        `;
    }

    createPreferencesDisplay() {
        const topCategories = this.userProfile.preferences.categories
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        
        return `
            <div class="preference-item">
                <strong>Favorite Categories:</strong>
                <div class="category-tags">
                    ${topCategories.map(cat => `<span class="category-tag">${cat.name}</span>`).join('')}
                </div>
            </div>
            <div class="preference-item">
                <strong>Price Range:</strong> ₹${this.userProfile.preferences.priceRange.min} - ₹${this.userProfile.preferences.priceRange.max}
            </div>
            <div class="preference-item">
                <strong>Shopping Frequency:</strong> ${this.userProfile.engagement.frequency}
            </div>
        `;
    }

    updatePreference(element) {
        const prefType = element.dataset.preference;
        const value = element.value;
        
        if (prefType && this.preferences[prefType] !== undefined) {
            this.preferences[prefType] = value;
            this.savePreferences();
            this.applyUserPreferences();
        }
    }

    // ================================
    // PUBLIC API
    // ================================

    getPersonalizationData() {
        return {
            userProfile: this.userProfile,
            behaviorData: this.behaviorData,
            preferences: this.preferences,
            recommendations: this.recommendations
        };
    }

    clearPersonalizationData() {
        localStorage.removeItem('quicklocal_user_profile');
        localStorage.removeItem('quicklocal_behavior_data');
        localStorage.removeItem('quicklocal_preferences');
        location.reload();
    }

    exportPersonalizationData() {
        const data = this.getPersonalizationData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quicklocal_personalization_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize personalization engine
window.PersonalizationEngine = PersonalizationEngine;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.personalizationEngine) {
        window.personalizationEngine = new PersonalizationEngine();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersonalizationEngine;
}
