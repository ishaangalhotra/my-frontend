// Fixed marketplace.js with proper error handling

// Global variables
let products = []; // Initialize as empty array
let filteredProducts = [];
let categories = [];
let currentPage = 1;
let productsPerPage = 12;
let isLoading = false;

// API Configuration
const API_BASE = "https://quicklocal-backend.onrender.com/api/v1";
const PRODUCTS_API = `${API_BASE}/products`;

// Initialize marketplace
document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 Marketplace initializing...");
    initializeApp();
});

async function initializeApp() {
    try {
        showLoadingState();
        
        // Load products first
        await loadProducts();
        
        // Then initialize other components
        setupEventListeners();
        setupSearch();
        setupFilters();
        updateCartBadge();
        
        console.log("✅ Marketplace initialized successfully!");
        
    } catch (error) {
        console.error("❌ Failed to initialize marketplace:", error);
        showErrorState("Failed to load marketplace. Please refresh the page.");
    } finally {
        hideLoadingState();
    }
}

// Enhanced renderProducts with error handling
function renderProducts(productsToRender = null) {
    const container = document.getElementById("products-container");
    
    if (!container) {
        console.error("Products container not found");
        return;
    }

    // Use provided products or fall back to global products/filteredProducts
    let targetProducts = productsToRender || filteredProducts;
    
    // If filteredProducts is empty/undefined, use products
    if (!targetProducts || !Array.isArray(targetProducts) || targetProducts.length === 0) {
        targetProducts = products || [];
    }

    // Show loading state if products are still loading
    if (isLoading) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading amazing products...</p>
            </div>
        `;
        return;
    }

    // Handle empty state
    if (!Array.isArray(targetProducts) || targetProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button onclick="clearAllFilters()" class="btn btn-primary">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = targetProducts.slice(startIndex, endIndex);

    // Render products
    try {
        container.innerHTML = paginatedProducts.map(product => createProductCard(product)).join('');
        
        // Update pagination
        updatePagination(targetProducts.length);
        
        // Update results count
        updateResultsCount(targetProducts.length);
        
    } catch (error) {
        console.error("Error rendering products:", error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error displaying products</h3>
                <p>Something went wrong. Please try refreshing the page.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

// Enhanced loadProducts with better error handling
async function loadProducts() {
    isLoading = true;
    
    try {
        console.log("📦 Loading products from API...");
        
        const response = await fetch(PRODUCTS_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle different API response structures
        if (data.success && Array.isArray(data.products)) {
            products = data.products;
        } else if (Array.isArray(data)) {
            products = data;
        } else if (data.data && Array.isArray(data.data)) {
            products = data.data;
        } else {
            throw new Error("Invalid API response format");
        }

        // Validate products data
        products = products.filter(product => product && typeof product === 'object');
        
        if (products.length === 0) {
            console.warn("⚠️ No valid products received from API");
        }

        // Initialize filtered products
        filteredProducts = [...products];
        
        // Extract categories
        extractCategories();
        
        // Render products
        renderProducts();
        
        console.log(`✅ Loaded ${products.length} products successfully`);
        
    } catch (error) {
        console.error("❌ Failed to load products:", error);
        
        // Try to load fallback data
        await loadFallbackProducts();
        
    } finally {
        isLoading = false;
    }
}

// Fallback products for offline/error scenarios
async function loadFallbackProducts() {
    console.log("🔄 Loading fallback products...");
    
    try {
        // Check if we have cached products
        const cachedProducts = localStorage.getItem('quicklocal_cached_products');
        if (cachedProducts) {
            const parsed = JSON.parse(cachedProducts);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
                filteredProducts = [...products];
                extractCategories();
                renderProducts();
                showNotification("Loaded cached products (offline mode)", "info");
                return;
            }
        }
        
        // Use demo products as last resort
        products = getDemoProducts();
        filteredProducts = [...products];
        extractCategories();
        renderProducts();
        showNotification("Loaded demo products", "warning");
        
    } catch (error) {
        console.error("❌ Failed to load fallback products:", error);
        showErrorState("Unable to load products. Please check your connection and refresh.");
    }
}

// Demo products for fallback
function getDemoProducts() {
    return [
        {
            _id: "demo1",
            name: "Fresh Apples",
            price: 120,
            category: "Fruits",
            image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
            description: "Fresh red apples, perfect for snacking",
            rating: 4.5,
            inStock: true
        },
        {
            _id: "demo2", 
            name: "Organic Bananas",
            price: 60,
            category: "Fruits",
            image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
            description: "Organic bananas, rich in potassium",
            rating: 4.3,
            inStock: true
        },
        {
            _id: "demo3",
            name: "Fresh Milk",
            price: 55,
            category: "Dairy",
            image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400", 
            description: "Fresh cow milk, 1 liter pack",
            rating: 4.8,
            inStock: true
        }
    ];
}

// Extract categories from products
function extractCategories() {
    if (!Array.isArray(products)) {
        categories = [];
        return;
    }
    
    const categorySet = new Set();
    products.forEach(product => {
        if (product && product.category) {
            categorySet.add(product.category);
        }
    });
    
    categories = Array.from(categorySet).sort();
    
    // Update category filter UI
    updateCategoryFilter();
}

// Create product card with error handling
function createProductCard(product) {
    if (!product || typeof product !== 'object') {
        return '<div class="product-card error">Invalid product data</div>';
    }
    
    const {
        _id = 'unknown',
        name = 'Unnamed Product',
        price = 0,
        image = 'https://via.placeholder.com/300x200?text=No+Image',
        description = 'No description available',
        rating = 0,
        category = 'Uncategorized',
        inStock = true
    } = product;

    const safePrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    const safeRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    
    return `
        <div class="product-card" data-product-id="${_id}">
            <div class="product-image">
                <img src="${image}" 
                     alt="${escapeHtml(name)}" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'"
                     loading="lazy">
                ${!inStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${escapeHtml(name)}</h3>
                <p class="product-description">${escapeHtml(description)}</p>
                <div class="product-meta">
                    <span class="product-category">${escapeHtml(category)}</span>
                    <div class="product-rating">
                        ${'★'.repeat(Math.floor(safeRating))}${'☆'.repeat(5 - Math.floor(safeRating))}
                        <span class="rating-text">(${safeRating.toFixed(1)})</span>
                    </div>
                </div>
                <div class="product-footer">
                    <span class="product-price">₹${safePrice.toFixed(2)}</span>
                    <button onclick="addToCart('${_id}')" 
                            class="add-to-cart-btn ${!inStock ? 'disabled' : ''}"
                            ${!inStock ? 'disabled' : ''}>
                        ${!inStock ? '❌ Out of Stock' : '🛒 Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function showLoadingState() {
    const container = document.getElementById("products-container");
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading amazing products...</p>
            </div>
        `;
    }
}

function hideLoadingState() {
    // Loading state will be replaced by renderProducts()
}

function showErrorState(message) {
    const container = document.getElementById("products-container");
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>${escapeHtml(message)}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Try Again
                </button>
            </div>
        `;
    }
}

function clearAllFilters() {
    // Reset all filters
    filteredProducts = [...products];
    currentPage = 1;
    
    // Clear search
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // Clear category filter
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) categorySelect.value = '';
    
    // Clear price filter
    const priceSelect = document.getElementById('price-filter');
    if (priceSelect) priceSelect.value = '';
    
    // Re-render
    renderProducts();
    
    showNotification("Filters cleared", "info");
}

function updateResultsCount(totalCount) {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        const startIndex = (currentPage - 1) * productsPerPage + 1;
        const endIndex = Math.min(currentPage * productsPerPage, totalCount);
        
        if (totalCount === 0) {
            countElement.textContent = "No products found";
        } else {
            countElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalCount} products`;
        }
    }
}

function updatePagination(totalProducts) {
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''} 
                class="pagination-btn">
            ← Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changePage(${i})" class="pagination-btn">${i}</button>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                class="pagination-btn">
            Next →
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Notification function
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            min-width: 300px;
        `;
        document.body.appendChild(notification);
    }
    
    // Set notification style based on type
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c', 
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.transform = 'translateX(0)';
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
    }, 4000);
}

// Additional helper functions (add these if they don't exist)
function setupEventListeners() {
    // Add your event listeners here
    console.log("Setting up event listeners...");
}

function setupSearch() {
    // Add your search functionality here
    console.log("Setting up search...");
}

function setupFilters() {
    // Add your filter functionality here
    console.log("Setting up filters...");
}

function updateCartBadge() {
    // Update cart badge count
    const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        badge.textContent = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    }
}

function updateCategoryFilter() {
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect && Array.isArray(categories)) {
        const currentValue = categorySelect.value;
        categorySelect.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
        categorySelect.value = currentValue;
    }
}

function addToCart(productId) {
    // Find the product
    const product = products.find(p => p._id === productId);
    if (!product) {
        showNotification("Product not found", "error");
        return;
    }
    
    // Get current cart
    let cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    
    // Check if product already in cart
    const existingItem = cart.find(item => item._id === productId);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    // Save cart
    localStorage.setItem("quicklocal_cart", JSON.stringify(cart));
    
    // Update UI
    updateCartBadge();
    showNotification(`${product