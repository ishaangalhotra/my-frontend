// Fixed marketplace.js with proper API integration
import './simple-api.js';
import api from "./simple-api.js";


// Global variables
let products = [];
let filteredProducts = [];
let categories = [];
let currentPage = 1;
let productsPerPage = 12;
let isLoading = false;
let isInitialized = false;

// ===============================
// CART API HELPERS
// ===============================
const CART_API_URL = "https://quicklocal-backend.onrender.com/api/v1/cart";
async function addToCart(productId, quantity = 1) {
  try {
    const res = await fetch(CART_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ productId, quantity })
    });

    if (!res.ok) throw new Error("Failed to add item to cart");
    const cart = await res.json();

    // Update cart count in header
    const cartBadge = document.getElementById("cart-count") || document.querySelector('.cart-badge');
    if (cartBadge) {
        cartBadge.textContent = cart.items.length;
    }
    
    alert("✅ Product added to cart!");
    console.log("Cart updated:", cart);
  } catch (err) {
    console.error("❌ Error adding to cart:", err);
    alert("⚠️ Please login to add items to your cart.");
  }
}


// Initialize marketplace
document.addEventListener("DOMContentLoaded", async function() {
    if (isInitialized) {
        console.log("⚠️ App already initialized, skipping...");
        return;
    }
    console.log("🚀 Marketplace initializing...");
    await initializeApp();
});

async function initializeApp() {
    if (isInitialized) return;
    isInitialized = true;
    
    try {
        showLoadingState();
        
        // Initialize API first
        await api.init();
        console.log("✅ API initialized");
        
        // Load products from backend
        await loadProducts();
        
        // Initialize UI components
        setupEventListeners();
        setupSearch();
        setupFilters();
        updateCartBadge();
        setupMobileMenu();
        setupUserDropdown();
        
        console.log("✅ Marketplace initialized successfully!");
        
    } catch (error) {
        console.error("❌ Failed to initialize marketplace:", error);
        showErrorState("Failed to load marketplace. Please refresh the page.");
    } finally {
        hideLoadingState();
    }
}

// ✅ FIXED loadProducts with proper API integration
async function loadProducts() {
    isLoading = true;
    
    try {
        console.log("📦 Loading products from backend API...");
        
        // Get products from your backend
        const data = await api.products.list();
        console.log("📊 Backend API Response:", data);
        
        // Handle the response properly
        if (data && Array.isArray(data) && data.length > 0) {
            products = data.map(product => ({
                _id: product.id || product._id,
                name: product.name,
                price: parseFloat(product.finalPrice || product.price),
                originalPrice: parseFloat(product.price),
                category: product.category?.name || product.category || 'Uncategorized',
                image: product.images?.[0]?.url || 'https://placehold.co/300x200?text=No+Image',
                description: product.description,
                rating: parseFloat(product.rating) || 4.0,
                inStock: product.inStock !== false,
                stock: product.stock || 10,
                brand: product.brand || ''
            }));
            
            filteredProducts = [...products];
            extractCategories();
            renderProducts();
            
            console.log(`✅ Loaded ${products.length} products from backend`);
            showNotification(`Loaded ${products.length} products`, "success");
            
        } else {
            throw new Error("No products received from backend");
        }
        
    } catch (error) {
        console.error("❌ Failed to load products from backend:", error);
        showNotification("Backend unavailable, loading demo products...", "warning");
        
        // Fallback to demo products
        await loadFallbackProducts();
    } finally {
        isLoading = false;
    }
}

// Fallback products when backend is down
async function loadFallbackProducts() {
    console.log("🔄 Loading fallback products...");
    
    products = [
        {
            _id: "demo1",
            name: "Fresh Apples",
            price: 120,
            originalPrice: 150,
            category: "Fruits",
            image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
            description: "Fresh red apples, perfect for snacking",
            rating: 4.5,
            inStock: true,
            stock: 50,
            brand: "FarmFresh"
        },
        {
            _id: "demo2", 
            name: "Organic Bananas",
            price: 60,
            originalPrice: 75,
            category: "Fruits",
            image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
            description: "Organic bananas, rich in potassium",
            rating: 4.3,
            inStock: true,
            stock: 30,
            brand: "Organic Plus"
        },
        {
            _id: "demo3",
            name: "Fresh Milk",
            price: 55,
            category: "Dairy",
            image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400", 
            description: "Fresh cow milk, 1 liter pack",
            rating: 4.8,
            inStock: true,
            stock: 25,
            brand: "Pure Dairy"
        },
        {
            _id: "demo4",
            name: "Whole Wheat Bread",
            price: 35,
            category: "Bakery",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
            description: "Fresh whole wheat bread, baked daily",
            rating: 4.2,
            inStock: true,
            stock: 15,
            brand: "Golden Bakery"
        },
        {
            _id: "demo5",
            name: "Farm Eggs",
            price: 80,
            category: "Dairy",
            image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400",
            description: "Fresh farm eggs, dozen pack",
            rating: 4.6,
            inStock: true,
            stock: 40,
            brand: "Happy Farm"
        }
    ];
    
    filteredProducts = [...products];
    extractCategories();
    renderProducts();
    showNotification("Loaded demo products (offline mode)", "info");
}

// Enhanced renderProducts with better container detection
function renderProducts(productsToRender = null) {
    const possibleContainers = [
        'products-container',
        'products-grid', 
        'product-grid',
        'marketplace-products',
        'products',
        'product-list'
    ];
    
    let container = null;
    for (const id of possibleContainers) {
        container = document.getElementById(id) || document.querySelector(`.${id}`);
        if (container) break;
    }
    
    if (!container) {
        console.error("No suitable products container found. Creating one...");
        const mainContent = document.querySelector('main') || 
                           document.querySelector('.main-content') || 
                           document.body;
        
        container = document.createElement('div');
        container.id = 'products-container';
        container.className = 'products-grid';
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        `;
        
        mainContent.appendChild(container);
        console.log("✅ Created products container");
    }

    let targetProducts = productsToRender || filteredProducts;
    
    if (!targetProducts || !Array.isArray(targetProducts) || targetProducts.length === 0) {
        targetProducts = products || [];
    }

    if (isLoading) {
        container.innerHTML = `
            <div class="loading-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #666;
            ">
                <div class="loading-spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p>Loading amazing products...</p>
            </div>
        `;
        return;
    }

    if (!Array.isArray(targetProducts) || targetProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #666;
            ">
                <div class="empty-icon" style="font-size: 4rem; margin-bottom: 20px;">📦</div>
                <h3 style="margin-bottom: 10px; color: #333;">No products found</h3>
                <p style="margin-bottom: 20px;">Try adjusting your search or filter criteria</p>
                <button onclick="clearAllFilters()" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = targetProducts.slice(startIndex, endIndex);

    try {
        container.innerHTML = paginatedProducts.map(product => createProductCard(product)).join('');
        
        updatePagination(targetProducts.length);
        updateResultsCount(targetProducts.length);
        
        console.log(`✅ Rendered ${paginatedProducts.length} products`);
        
    } catch (error) {
        console.error("Error rendering products:", error);
        container.innerHTML = `
            <div class="error-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #666;
            ">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
                <h3 style="margin-bottom: 10px; color: #333;">Error displaying products</h3>
                <p style="margin-bottom: 20px;">Something went wrong. Please try refreshing the page.</p>
                <button onclick="location.reload()" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    Refresh Page
                </button>
            </div>
        `;
    }
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
    updateCategoryFilter();
}

// ✅ Enhanced product card with better styling
function createProductCard(product) {
    if (!product || typeof product !== 'object') {
        return '<div class="product-card error">Invalid product data</div>';
    }
    
    const {
        _id = 'unknown',
        name = 'Unnamed Product',
        price = 0,
        originalPrice = 0,
        image = 'https://placehold.co/300x200?text=No+Image',
        description = 'No description available',
        rating = 0,
        category = 'Uncategorized',
        inStock = true,
        stock = 0,
        brand = ''
    } = product;

    const safePrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    const safeOriginalPrice = typeof originalPrice === 'number' ? originalPrice : parseFloat(originalPrice) || 0;
    const safeRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    const hasDiscount = safeOriginalPrice > 0 && safeOriginalPrice > safePrice;
    const discountPercent = hasDiscount ? Math.round(((safeOriginalPrice - safePrice) / safeOriginalPrice) * 100) : 0;
    
    return `
        <div class="product-card" data-product-id="${_id}" style="
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e1e8ed;
            position: relative;
        " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'" 
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'">
           
            <div class="product-image" style="
                position: relative;
                height: 200px;
                overflow: hidden;
                background: #f8f9fa;
            ">
                <img src="${image}" 
                     alt="${escapeHtml(name)}" 
                     style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                     "
                     onerror="this.src='https://placehold.co/300x200?text=No+Image'"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'"
                     loading="lazy">
                
                ${hasDiscount ? `<div style="
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: #e74c3c;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                ">${discountPercent}% OFF</div>` : ''}
                
                ${!inStock ? `<div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                ">Out of Stock</div>` : stock < 10 && stock > 0 ? `<div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #f39c12;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                ">Only ${stock} left</div>` : ''}
            </div>
            
            <div class="product-info" style="padding: 16px;">
                ${brand ? `<div class="product-brand" style="
                    color: #666;
                    font-size: 0.8rem;
                    margin-bottom: 4px;
                    font-weight: 500;
                ">${escapeHtml(brand)}</div>` : ''}
                
                <h3 class="product-name" style="
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #333;
                    margin: 0 0 8px 0;
                    line-height: 1.4;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                ">${escapeHtml(name)}</h3>
                
                <p class="product-description" style="
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.4;
                    margin: 0 0 12px 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                ">${escapeHtml(description)}</p>
                
                <div class="product-meta" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                ">
                    <span class="product-category" style="
                        background: #e3f2fd;
                        color: #1976d2;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        font-weight: 500;
                    ">${escapeHtml(category)}</span>
                    
                    <div class="product-rating" style="
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    ">
                        <span style="color: #ffa726; font-size: 0.9rem;">
                            ${'★'.repeat(Math.floor(safeRating))}${'☆'.repeat(5 - Math.floor(safeRating))}
                        </span>
                        <span class="rating-text" style="
                            color: #666;
                            font-size: 0.8rem;
                        ">(${safeRating.toFixed(1)})</span>
                    </div>
                </div>
                
                <div class="product-footer" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div class="product-price" style="display: flex; flex-direction: column; align-items: flex-start;">
                        <span style="
                            font-size: 1.3rem;
                            font-weight: 700;
                            color: #2e7d32;
                        ">₹${safePrice.toFixed(2)}</span>
                        ${hasDiscount ? `<span style="
                            font-size: 0.9rem;
                            color: #999;
                            text-decoration: line-through;
                        ">₹${safeOriginalPrice.toFixed(2)}</span>` : ''}
                    </div>
                    
                    <button class="add-to-cart" 
                            data-id="${_id}"
                            style="
                                background: ${!inStock ? '#bdc3c7' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                                color: white;
                                border: none;
                                padding: 10px 16px;
                                border-radius: 8px;
                                font-size: 0.9rem;
                                font-weight: 600;
                                cursor: ${!inStock ? 'not-allowed' : 'pointer'};
                                transition: all 0.3s ease;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            "
                            ${!inStock ? 'disabled' : ''}
                            onmouseover="if(!this.disabled) { this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'; }"
                            onmouseout="if(!this.disabled) { this.style.transform='translateY(0)'; this.style.boxShadow='none'; }">
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

// Show loading state with CSS animation
function showLoadingState() {
    const possibleContainers = [
        'products-container', 'products-grid', 'product-grid', 
        'marketplace-products', 'products', 'product-list'
    ];
    
    let container = null;
    for (const id of possibleContainers) {
        container = document.getElementById(id) || document.querySelector(`.${id}`);
        if (container) break;
    }
    
    if (!container) return;
    
    if (!document.getElementById('spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-spinner {
                animation: spin 1s linear infinite;
            }
            
            .product-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
        `;
        document.head.appendChild(style);
    }
    
    container.innerHTML = `
        <div class="loading-state" style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 20px;
            color: #666;
        ">
            <div class="loading-spinner" style="
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                margin: 0 auto 20px;
            "></div>
            <p style="font-size: 1.1rem; margin: 0;">Loading amazing products...</p>
        </div>
    `;
}

function hideLoadingState() {
    // Loading state will be replaced by renderProducts()
}

function showErrorState(message) {
    const possibleContainers = [
        'products-container', 'products-grid', 'product-grid', 
        'marketplace-products', 'products', 'product-list'
    ];
    
    let container = null;
    for (const id of possibleContainers) {
        container = document.getElementById(id) || document.querySelector(`.${id}`);
        if (container) break;
    }
    
    if (container) {
        container.innerHTML = `
            <div class="error-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #666;
            ">
                <div class="error-icon" style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
                <h3 style="margin-bottom: 10px; color: #333;">Something went wrong</h3>
                <p style="margin-bottom: 20px;">${escapeHtml(message)}</p>
                <button onclick="location.reload()" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    Try Again
                </button>
            </div>
        `;
    }
}

function clearAllFilters() {
    filteredProducts = [...products];
    currentPage = 1;
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) categorySelect.value = '';
    
    const priceSelect = document.getElementById('price-filter');
    if (priceSelect) priceSelect.value = '';
    
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
    
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''} 
                class="pagination-btn">
            ← Previous
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changePage(${i})" class="pagination-btn">${i}</button>`;
        }
    }
    
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
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Notification function
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
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
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c', 
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.transform = 'translateX(0)';
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
    }, 4000);
}

// Enhanced setup functions
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) {
        categorySelect.addEventListener('change', filterByCategory);
    }
    
    const priceSelect = document.getElementById('price-filter');
    if (priceSelect) {
        priceSelect.addEventListener('change', filterByPrice);
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', applySorting);
    }
}

function setupSearch() {
    console.log("Setting up search...");
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.placeholder = "Search products...";
        searchInput.setAttribute('autocomplete', 'off');
    }
}

function setupFilters() {
    console.log("Setting up filters...");
    updateCategoryFilter();
    updatePriceFilter();
}

function updateCartBadge() {
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

function updatePriceFilter() {
    const priceSelect = document.getElementById('price-filter');
    if (priceSelect && priceSelect.innerHTML.trim() === '') {
        priceSelect.innerHTML = `
            <option value="">All Prices</option>
            <option value="under-50">Under ₹50</option>
            <option value="50-100">₹50 - ₹100</option>
            <option value="100-200">₹100 - ₹200</option>
            <option value="over-200">Over ₹200</option>
        `;
    }
}

// ✅ Enhanced Buy Now functionality using API
async function handleBuyNow(productId) {
    try {
        const product = products.find(p => p._id === productId);
        if (!product) {
            showNotification("Product not found", "error");
            return;
        }
        
        if (!product.inStock || product.stock === 0) {
            showNotification("Product is out of stock", "error");
            return;
        }
        
        showNotification("Processing your order...", "info");
        
        const result = await api.orders.create({
            products: [{
                productId: productId,
                quantity: 1
            }]
        });
        
        if (result && result.success) {
            showNotification(`Order placed for ${product.name}!`, "success");
            
            setTimeout(() => {
                window.location.href = `/orders/${result.orderId}`;
            }, 2000);
        } else {
            showNotification("Order failed. Please try again.", "error");
        }
    } catch (error) {
        console.error("Purchase error:", error);
        showNotification("Order failed. Please try again.", "error");
    }
}

// Search functionality
function performSearch() {
    const searchInput = document.getElementById('search-input') || document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (!query) {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => {
            const name = (product.name || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            const brand = (product.brand || '').toLowerCase();
            
            return name.includes(query) || 
                   description.includes(query) || 
                   category.includes(query) ||
                   brand.includes(query);
        });
    }
    
    currentPage = 1;
    renderProducts();
}

// Filter by category
function filterByCategory() {
    const categorySelect = document.getElementById('category-filter');
    const selectedCategory = categorySelect ? categorySelect.value : '';
    
    if (!selectedCategory) {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.category === selectedCategory
        );
    }
    
    currentPage = 1;
    renderProducts();
}

// Filter by price
function filterByPrice() {
    const priceSelect = document.getElementById('price-filter');
    const selectedRange = priceSelect ? priceSelect.value : '';
    
    if (!selectedRange) {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => {
            const price = parseFloat(product.price) || 0;
            
            switch (selectedRange) {
                case 'under-50':
                    return price < 50;
                case '50-100':
                    return price >= 50 && price <= 100;
                case '100-200':
                    return price >= 100 && price <= 200;
                case 'over-200':
                    return price > 200;
                default:
                    return true;
            }
        });
    }
    
    currentPage = 1;
    renderProducts();
}

// Sort products
function applySorting() {
    const sortSelect = document.getElementById('sort-select');
    const sortValue = sortSelect ? sortSelect.value : '';
    
    if (!Array.isArray(filteredProducts)) {
        return;
    }
    
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
            break;
        case 'name-az':
            filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-za':
            filteredProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'rating':
            filteredProducts.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        default:
            break;
    }
    
    currentPage = 1;
    renderProducts();
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced Mobile Menu Setup
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMobileMenu');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Enhanced User Dropdown Setup
function setupUserDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (profileBtn && userDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = userDropdown.style.opacity === '1';
            
            if (isVisible) {
                userDropdown.style.opacity = '0';
                userDropdown.style.visibility = 'hidden';
                userDropdown.style.transform = 'translateY(-10px)';
            } else {
                userDropdown.style.opacity = '1';
                userDropdown.style.visibility = 'visible';
                userDropdown.style.transform = 'translateY(0)';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.opacity = '0';
                userDropdown.style.visibility = 'hidden';
                userDropdown.style.transform = 'translateY(-10px)';
            }
        });
    }
}

// Hero Search Functions
function searchFromHero() {
    const heroSearch = document.getElementById('heroSearch');
    if (heroSearch && heroSearch.value.trim()) {
        const searchInput = document.getElementById('searchInput') || document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = heroSearch.value;
            performSearch();
        }
        scrollToProducts();
    }
}

function searchProduct(query) {
    const searchInput = document.getElementById('searchInput') || document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = query;
        performSearch();
        scrollToProducts();
    }
}

function scrollToProducts() {
    const productsSection = document.getElementById('products') || 
                           document.getElementById('products-container') ||
                           document.querySelector('.products-grid');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Enhanced Logout Function
async function logout() {
    try {
        showNotification('Logging out...', 'info');
        
        try {
            await api.auth.logout();
        } catch (error) {
            console.warn('API logout failed:', error);
        }
        
        localStorage.removeItem('quicklocal_auth_token');
        localStorage.removeItem('quicklocal_user');
        localStorage.removeItem('quicklocal_cart');
        
        const guestActions = document.getElementById('guestActions');
        const userActions = document.getElementById('userActions');
        
        if (guestActions && userActions) {
            guestActions.style.display = 'flex';
            userActions.style.display = 'none';
        }
        
        showNotification('Successfully logged out!', 'success');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed. Please try again.', 'error');
    }
}

// Enhanced refresh products function
async function refreshProducts() {
    showNotification('Refreshing products...', 'info');
    
    products = [];
    filteredProducts = [];
    categories = [];
    currentPage = 1;
    
    await loadProducts();
}

// Export functions for global access
window.quickLocalMarketplace = {
    loadProducts,
    renderProducts,
    addToCart,
    handleBuyNow,
    performSearch,
    filterByCategory,
    filterByPrice,
    clearAllFilters,
    changePage,
    searchFromHero,
    searchProduct,
    scrollToProducts,
    scrollToFeatures,
    scrollToTop,
    logout,
    showNotification,
    refreshProducts,
    // Debug functions
    getProducts: () => products,
    getFilteredProducts: () => filteredProducts,
    getCategories: () => categories,
    forceReload: () => {
        isInitialized = false;
        products = [];
        filteredProducts = [];
        initializeApp();
    },
    // API access for debugging
    api: api
};

// ===============================
// CART BUTTON HANDLER
// ===============================
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-cart")) {
    const productId = e.target.dataset.id;
    addToCart(productId);
  }
});