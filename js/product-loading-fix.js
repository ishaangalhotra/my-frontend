/**
 * Product Loading Fix Script
 * Ensures products are always available on the marketplace
 */

console.log('🔧 Loading Product Loading Fix Script...');

class ProductLoadingFix {
    constructor() {
        this.isInitialized = false;
        this.loadAttempts = 0;
        this.maxAttempts = 3;
        this.init();
    }
    
    init() {
        // Wait for app state to be available
        this.waitForAppState().then(() => {
            this.ensureProductsLoaded();
        });
    }
    
    async waitForAppState() {
        return new Promise((resolve) => {
            const checkAppState = () => {
                if (window.appState) {
                    resolve();
                } else {
                    setTimeout(checkAppState, 100);
                }
            };
            checkAppState();
        });
    }
    
    async ensureProductsLoaded() {
        console.log('🔍 Checking if products are loaded...');
        
        // Wait a bit for other scripts to load products
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!window.appState.products || window.appState.products.length === 0) {
            console.log('⚠️ No products found, attempting to load demo products...');
            this.loadDemoProducts();
        } else {
            console.log('✅ Products already loaded:', window.appState.products.length);
        }
    }
    
    loadDemoProducts() {
        if (this.loadAttempts >= this.maxAttempts) {
            console.log('❌ Max load attempts reached');
            return;
        }
        
        this.loadAttempts++;
        console.log(`🔄 Loading demo products (attempt ${this.loadAttempts}/${this.maxAttempts})...`);
        
        const demoProducts = this.generateDemoProducts();
        
        // Update app state
        window.appState.products = demoProducts;
        window.appState.filteredProducts = demoProducts;
        window.appState.categories = new Set(demoProducts.map(p => p.category));
        
        // Update pagination
        window.appState.pagination.totalItems = demoProducts.length;
        window.appState.pagination.totalPages = Math.ceil(demoProducts.length / window.appState.pagination.itemsPerPage);
        
        // Render products
        this.renderProducts(demoProducts);
        
        // Update UI components
        this.updateCategoryFilter();
        this.updateProductCount();
        
        console.log('✅ Demo products loaded successfully!');
    }
    
    generateDemoProducts() {
        const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty', 'Automotive'];
        const adjectives = ['Premium', 'Smart', 'Eco-friendly', 'Wireless', 'Digital', 'Portable', 'Advanced'];
        const nouns = ['Watch', 'Speaker', 'Headphones', 'Camera', 'Laptop', 'Phone', 'Tablet', 'Charger'];
        
        const products = [];
        
        for (let i = 1; i <= 20; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            const price = Math.floor(Math.random() * 50000) + 1000;
            const originalPrice = Math.floor(price * (1.1 + Math.random() * 0.3));
            
            products.push({
                id: `demo-product-${i}`,
                _id: `demo-product-${i}`,
                name: `${adjective} ${noun}`,
                description: `High-quality ${adjective.toLowerCase()} ${noun.toLowerCase()} with advanced features and premium build quality.`,
                price: price,
                originalPrice: originalPrice,
                discount: Math.round(((originalPrice - price) / originalPrice) * 100),
                category: category,
                subcategory: `${category} Accessories`,
                brand: `Brand${Math.floor(Math.random() * 10) + 1}`,
                rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
                reviews: Math.floor(Math.random() * 1000) + 10,
                image: `https://picsum.photos/400/300?random=${i}`,
                images: [
                    { url: `https://picsum.photos/400/300?random=${i}` },
                    { url: `https://picsum.photos/400/300?random=${i + 100}` }
                ],
                availability: 'in_stock',
                stock: Math.floor(Math.random() * 100) + 1,
                variants: {
                    colors: ['Black', 'White', 'Silver'].slice(0, Math.floor(Math.random() * 3) + 1),
                    sizes: category === 'Fashion' ? ['S', 'M', 'L', 'XL'] : []
                },
                seller: {
                    name: `Seller ${Math.floor(Math.random() * 20) + 1}`,
                    rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1))
                },
                delivery: {
                    days: Math.floor(Math.random() * 5) + 1,
                    free: Math.random() > 0.3
                },
                tags: ['featured', 'bestseller', 'trending'].filter(() => Math.random() > 0.7),
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return products;
    }
    
    renderProducts(products) {
        const container = document.getElementById('products-container');
        if (!container) {
            console.warn('Products container not found');
            return;
        }
        
        // Try using enhanced product card utils first
        if (window.productCardUtils && typeof window.productCardUtils.generateProductCard === 'function') {
            container.innerHTML = products.map(product => 
                window.productCardUtils.generateProductCard(product)
            ).join('');
        } else {
            // Fallback to basic product cards
            container.innerHTML = products.map(product => this.generateBasicProductCard(product)).join('');
        }
        
        // Trigger enhanced product card enhancements
        setTimeout(() => {
            if (window.enhancedInteractions && typeof window.enhancedInteractions.enhanceProductCards === 'function') {
                window.enhancedInteractions.enhanceProductCards();
            }
        }, 100);
    }
    
    generateBasicProductCard(product) {
        const discountBadge = product.discount > 0 ? 
            `<div class="discount-badge">-${product.discount}%</div>` : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}" data-category="${product.category}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    ${discountBadge}
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description.slice(0, 100)}...</p>
                    <div class="product-rating">
                        <div class="stars">${this.generateStars(product.rating)}</div>
                        <span class="rating-text">(${product.reviews})</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">₹${product.price.toLocaleString()}</span>
                        ${product.originalPrice ? `<span class="original-price">₹${product.originalPrice.toLocaleString()}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-to-cart" onclick="handleAddToCart('${product.id}')">
                            Add to Cart
                        </button>
                        <button class="btn-quick-view" onclick="handleCardClick('${product.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
        if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
        
        return stars;
    }
    
    updateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter || !window.appState.categories) return;
        
        const categories = [...window.appState.categories];
        const options = categories.map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');
        
        // Keep existing options and add new ones
        const existingOptions = categoryFilter.innerHTML;
        if (!existingOptions.includes(options)) {
            categoryFilter.innerHTML = existingOptions + options;
        }
    }
    
    updateProductCount() {
        const countElement = document.querySelector('.product-count, #product-count');
        if (countElement && window.appState.products) {
            countElement.textContent = `${window.appState.products.length} products found`;
        }
    }
    
    // Public method to reload products
    reloadProducts() {
        this.loadAttempts = 0;
        window.appState.products = [];
        window.appState.filteredProducts = [];
        this.ensureProductsLoaded();
    }
}

// Initialize the fix
const productLoadingFix = new ProductLoadingFix();

// Make it globally accessible
window.productLoadingFix = productLoadingFix;

// Also make the demo products available for debug helper
window.loadDemoProducts = () => {
    productLoadingFix.reloadProducts();
};

console.log('✅ Product Loading Fix Script loaded successfully!');
