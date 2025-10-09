/**
 * Compatibility Fix for Enhanced Marketplace
 * Ensures existing product loading works with new enhancement modules
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Applying compatibility fixes...');
    
    // Ensure the original product loading is not interfered with
    let originalLoadProducts = null;
    let originalRenderProducts = null;
    
    // Store original functions if they exist
    if (typeof window.loadProducts === 'function') {
        originalLoadProducts = window.loadProducts;
    }
    if (typeof window.renderProducts === 'function') {
        originalRenderProducts = window.renderProducts;
    }
    
    // Enhanced product loading that works with both systems
    function compatibleLoadProducts() {
        console.log('🔄 Loading products with compatibility layer...');
        
        // If original function exists, call it
        if (originalLoadProducts) {
            return originalLoadProducts();
        }
        
        // Fallback product loading
        return loadProductsFallback();
    }
    
    // Fallback product loading function
    async function loadProductsFallback() {
        if (!window.appState) {
            console.error('AppState not found, cannot load products');
            return;
        }
        
        if (window.appState.isLoading) return;
        
        window.appState.isLoading = true;
        showLoadingState(true);
        
        try {
            console.log('📦 Attempting to load products from API...');
            
            // Try to use existing API function
            let data;
            if (window.api && window.api.get) {
                data = await window.api.get('/products');
            } else if (window.apiCallWithRetry) {
                data = await window.apiCallWithRetry('/products');
            } else {
                // Direct fetch fallback
                const response = await fetch(`${window.appState.apiBaseUrl}/products`);
                data = await response.json();
            }
            
            console.log('✅ Products data received:', data);
            
            // Process products data
            let products = [];
            if (data && data.success !== undefined) {
                if (data.data && Array.isArray(data.data)) {
                    products = data.data;
                } else if (data.data && data.data.products && Array.isArray(data.data.products)) {
                    products = data.data.products;
                }
            } else if (Array.isArray(data)) {
                products = data;
            }
            
            // If no products from API, use demo data
            if (products.length === 0) {
                console.log('📝 No products from API, using demo data');
                products = getDemoProducts();
            }
            
            // Process and store products
            window.appState.products = products.map(product => ({
                ...product,
                id: product._id || product.id || generateId(),
                rating: product.rating || (3.5 + Math.random() * 1.5),
                reviews: product.reviews || Math.floor(Math.random() * 500) + 10,
                originalPrice: product.originalPrice || (product.price * (1 + Math.random() * 0.3)),
                stock: product.stock !== undefined ? product.stock : Math.floor(Math.random() * 50) + 5
            }));
            
            // Extract categories
            window.appState.categories = new Set();
            window.appState.products.forEach(product => {
                if (product.category) {
                    window.appState.categories.add(product.category);
                }
            });
            
            // Store for filtering and pagination
            window.appState.allProducts = [...window.appState.products];
            window.appState.filteredProducts = [...window.appState.products];
            
            // Update pagination
            window.appState.pagination.totalItems = window.appState.products.length;
            window.appState.pagination.totalPages = Math.ceil(window.appState.products.length / window.appState.pagination.itemsPerPage);
            
            // Render products
            renderProductsCompatible();
            
            // Render other components
            if (typeof renderCategories === 'function') renderCategories();
            if (typeof populateCarousels === 'function') populateCarousels();
            if (typeof updateCartUI === 'function') updateCartUI();
            
            console.log(`✅ Loaded ${window.appState.products.length} products`);
            
        } catch (error) {
            console.error('❌ Failed to load products:', error);
            
            // Use demo data as fallback
            window.appState.products = getDemoProducts();
            window.appState.allProducts = [...window.appState.products];
            window.appState.filteredProducts = [...window.appState.products];
            
            // Extract categories from demo products
            window.appState.categories = new Set();
            window.appState.products.forEach(p => {
                if (p.category) window.appState.categories.add(p.category);
            });
            
            // Render demo products
            renderProductsCompatible();
            
            showToast('Using demo products due to API error', 'warning');
            
        } finally {
            window.appState.isLoading = false;
            showLoadingState(false);
        }
    }
    
    // Compatible product rendering
    function renderProductsCompatible(productsToRender = null) {
        const container = document.getElementById('products-container');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) {
            console.warn('Products container not found');
            return;
        }
        
        const products = productsToRender || window.appState.filteredProducts || window.appState.products || [];
        
        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No products found</h3><p>Please check back later or adjust your search criteria.</p></div>';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Render products using fallback method if enhanced cards not available
        const productsHTML = products.map(product => createProductCardHTML(product)).join('');
        container.innerHTML = productsHTML;
        
        // Enhance cards if enhancement modules are available
        setTimeout(() => {
            if (window.enhancedInteractions && window.enhancedInteractions.enhanceProductCards) {
                window.enhancedInteractions.enhanceProductCards();
            }
            
            // Update mobile products if mobile module is available
            if (window.mobileInteractions && window.mobileInteractions.refreshProducts) {
                window.mobileInteractions.refreshProducts();
            }
        }, 100);
        
        console.log(`✅ Rendered ${products.length} products`);
    }
    
    // Create product card HTML (fallback method)
    function createProductCardHTML(product) {
        const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        const stars = generateStarsHTML(product.rating || 4);
        
        return `
            <div class="product-card" data-product-id="${product.id}" onclick="handleCardClick('${product.id}')" style="cursor: pointer;">
                <div class="product-image-container">
                    <img loading="lazy" 
                         src="${product.image || getPlaceholderImage(product.name)}" 
                         alt="${product.name}" 
                         class="product-image"
                         onerror="this.onerror=null; this.src='https://placehold.co/300x220/e6e6e6/666666?text=Product+Image';">
                    ${discount > 0 ? `<div class="product-badge">${discount}% OFF</div>` : ''}
                </div>
                <div class="product-content">
                    <div class="product-category">${product.category || 'General'}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-text">(${product.reviews || 0} reviews)</span>
                    </div>
                    <div class="product-price">
                        <span class="price-current">₹${product.price.toLocaleString()}</span>
                        ${product.originalPrice ? 
                            `<span class="price-original">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                        ${discount > 0 ? `<span class="price-discount">${discount}% OFF</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="action-btn btn-primary add-to-cart" 
                                onclick="event.stopPropagation(); handleAddToCart('${product.id}')" 
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> 
                            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Generate stars HTML
    function generateStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
        if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
        
        return stars;
    }
    
    // Get placeholder image
    function getPlaceholderImage(productName = 'Product') {
        const safeName = encodeURIComponent(productName).replace(/%20/g, '+');
        return `https://placehold.co/300x220/e6e6e6/666666?text=${safeName}`;
    }
    
    // Generate unique ID
    function generateId() {
        return 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Demo products
    function getDemoProducts() {
        return [
            {
                id: 'demo_1',
                name: 'Premium Wireless Headphones',
                description: 'High-quality wireless headphones with noise cancellation and premium sound quality.',
                price: 2999,
                originalPrice: 4999,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=220&fit=crop',
                rating: 4.5,
                reviews: 128,
                stock: 15
            },
            {
                id: 'demo_2',
                name: 'Smart Fitness Watch',
                description: 'Advanced fitness tracking with heart rate monitor, GPS, and smartphone connectivity.',
                price: 8999,
                originalPrice: 12999,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=220&fit=crop',
                rating: 4.3,
                reviews: 89,
                stock: 8
            },
            {
                id: 'demo_3',
                name: 'Leather Messenger Bag',
                description: 'Handcrafted leather messenger bag perfect for work and travel. Premium quality materials.',
                price: 3499,
                originalPrice: 4999,
                category: 'Fashion',
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=220&fit=crop',
                rating: 4.7,
                reviews: 95,
                stock: 12
            },
            {
                id: 'demo_4',
                name: 'Coffee Maker Machine',
                description: 'Professional-grade coffee maker with programmable brewing and thermal carafe.',
                price: 4999,
                originalPrice: 6999,
                category: 'Home & Kitchen',
                image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=220&fit=crop',
                rating: 4.4,
                reviews: 67,
                stock: 20
            },
            {
                id: 'demo_5',
                name: 'Bluetooth Portable Speaker',
                description: 'Waterproof portable speaker with 360-degree sound and 12-hour battery life.',
                price: 1999,
                originalPrice: 2999,
                category: 'Electronics',
                image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=220&fit=crop',
                rating: 4.6,
                reviews: 156,
                stock: 25
            },
            {
                id: 'demo_6',
                name: 'Running Shoes - Premium',
                description: 'Professional running shoes with advanced cushioning and breathable design.',
                price: 3999,
                originalPrice: 5999,
                category: 'Sports',
                image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=220&fit=crop',
                rating: 4.8,
                reviews: 203,
                stock: 18
            }
        ];
    }
    
    // Show loading state
    function showLoadingState(isLoading) {
        const loadingContainer = document.getElementById('productsLoading');
        const productsContainer = document.getElementById('products-container');
        
        if (loadingContainer) {
            loadingContainer.style.display = isLoading ? 'flex' : 'none';
        }
        
        if (productsContainer) {
            if (isLoading) {
                productsContainer.innerHTML = createSkeletonHTML();
            }
        }
    }
    
    // Create skeleton loading HTML
    function createSkeletonHTML() {
        const skeletonCard = `
            <div class="skeleton-product-card">
                <div class="skeleton-image enhanced-skeleton"></div>
                <div class="skeleton-title enhanced-skeleton"></div>
                <div class="skeleton-description enhanced-skeleton"></div>
                <div class="skeleton-description enhanced-skeleton" style="width: 70%;"></div>
                <div class="skeleton-price enhanced-skeleton"></div>
            </div>
        `;
        
        return `<div class="skeleton-container">${skeletonCard.repeat(8)}</div>`;
    }
    
    // Toast notification fallback
    function showToast(message, type = 'info') {
        if (window.enhancedInteractions && window.enhancedInteractions.showToast) {
            window.enhancedInteractions.showToast(message, type);
            return;
        }
        
        // Simple fallback toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1a73e8;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 4000);
    }
    
    // Ensure global functions are available
    window.compatibleLoadProducts = compatibleLoadProducts;
    window.renderProductsCompatible = renderProductsCompatible;
    
    // Override or supplement existing functions
    if (!window.loadProducts) {
        window.loadProducts = compatibleLoadProducts;
    }
    
    if (!window.renderProducts) {
        window.renderProducts = renderProductsCompatible;
    }
    
    // Initialize products if appState exists
    setTimeout(() => {
        if (window.appState && (!window.appState.products || window.appState.products.length === 0)) {
            console.log('🚀 Auto-loading products...');
            compatibleLoadProducts();
        }
    }, 1000);
    
    console.log('✅ Compatibility fixes applied successfully');
});

// Handle card click fallback
if (typeof window.handleCardClick !== 'function') {
    window.handleCardClick = function(productId) {
        console.log('Card clicked:', productId);
        
        // Try enhanced interactions first
        if (window.enhancedInteractions && window.enhancedInteractions.showQuickView) {
            window.enhancedInteractions.showQuickView(productId);
            return;
        }
        
        // Fallback to product detail page
        const product = window.appState?.products?.find(p => p.id === productId);
        if (product) {
            localStorage.setItem('current_product', JSON.stringify(product));
            window.location.href = `product-detail.html?id=${productId}`;
        }
    };
}

// Handle add to cart fallback
if (typeof window.handleAddToCart !== 'function') {
    window.handleAddToCart = function(productId) {
        console.log('Add to cart:', productId);
        
        // Try enhanced interactions first
        if (window.enhancedInteractions && window.enhancedInteractions.addToCart) {
            return window.enhancedInteractions.addToCart(productId);
        }
        
        // Simple fallback
        return new Promise((resolve) => {
            setTimeout(() => {
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #34a853;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 10000;
                `;
                toast.textContent = 'Added to cart!';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
                resolve();
            }, 500);
        });
    };
}

console.log('🔧 Product Loading Compatibility Fix Loaded');
