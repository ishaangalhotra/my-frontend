// Fixed marketplace.js with proper error handling and API response parsing

// Global variables
let products = []; // Initialize as empty array
let filteredProducts = [];
let categories = [];
let currentPage = 1;
let productsPerPage = 12;
let isLoading = false;
let isInitialized = false; // Prevent duplicate initialization

// API Configuration
const API_BASE = "http://localhost:10000/api/v1";
const PRODUCTS_API = `${API_BASE}/products`;

// Initialize marketplace - prevent duplicate calls
document.addEventListener("DOMContentLoaded", function() {
    if (isInitialized) {
        console.log("⚠️ App already initialized, skipping...");
        return;
    }
    console.log("🚀 Marketplace initializing...");
    initializeApp();
    
    // Enhanced initialization with additional features
    setupMobileMenu();
    setupUserDropdown();
    setupSearchSuggestions();
    setupPriceRangeSlider();
    setupViewToggle();
    setupNewsletter();
    setupToastNotifications();
});

async function initializeApp() {
    if (isInitialized) {
        console.log("⚠️ App already initialized, skipping...");
        return;
    }
    
    isInitialized = true;
    
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

// Enhanced loadProducts with proper API response structure handling
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
        console.log("📊 API Response:", data);
        
        // FIXED: Enhanced API response structure detection
        let extractedProducts = [];
        
        // Handle the specific API response structure from your logs
        if (data.success && data.data) {
            console.log("🔍 API Response structure analysis:");
            console.log("- data.success:", data.success);
            console.log("- data.data type:", typeof data.data);
            console.log("- data.data keys:", data.data ? Object.keys(data.data) : 'null');
            
            // Check if data.data has nested structure
            if (data.data.products && Array.isArray(data.data.products)) {
                extractedProducts = data.data.products;
                console.log("✅ Found products in data.data.products");
            } else if (data.data.items && Array.isArray(data.data.items)) {
                extractedProducts = data.data.items;
                console.log("✅ Found products in data.data.items");
            } else if (Array.isArray(data.data)) {
                extractedProducts = data.data;
                console.log("✅ Found products in data.data array");
            } else {
                // Search for any array in data.data
                const nestedArrays = Object.entries(data.data)
                    .filter(([key, value]) => Array.isArray(value))
                    .map(([key, value]) => ({ key, value, length: value.length }));
                
                console.log("🔍 Found arrays in data.data:", nestedArrays);
                
                if (nestedArrays.length > 0) {
                    // Use the largest array found
                    const bestMatch = nestedArrays.reduce((max, current) => 
                        current.length > max.length ? current : max
                    );
                    extractedProducts = bestMatch.value;
                    console.log(`✅ Using array from data.data.${bestMatch.key} (${bestMatch.length} items)`);
                }
            }
        } 
        // Fallback patterns
        else if (Array.isArray(data)) {
            extractedProducts = data;
            console.log("✅ Found products as root array");
        } else if (data.products && Array.isArray(data.products)) {
            extractedProducts = data.products;
            console.log("✅ Found products in root.products");
        } else if (data.result && Array.isArray(data.result)) {
            extractedProducts = data.result;
            console.log("✅ Found products in root.result");
        } else if (data.items && Array.isArray(data.items)) {
            extractedProducts = data.items;
            console.log("✅ Found products in root.items");
        }
        
        // If still no products found, try to find any array in the response
        if (extractedProducts.length === 0) {
            console.log("🔍 Searching for any arrays in the entire response...");
            const allArrays = findArraysInObject(data);
            console.log("Found arrays:", allArrays);
            
            if (allArrays.length > 0) {
                extractedProducts = allArrays[0].value;
                console.log(`✅ Using first array found at path: ${allArrays[0].path}`);
            }
        }

        if (extractedProducts.length === 0) {
            console.error("❌ No valid products array found in API response");
            console.error("Full API response structure:", JSON.stringify(data, null, 2));
            throw new Error("No valid products array found in API response");
        }

        // Validate and clean products data
        products = extractedProducts
            .filter(product => product && typeof product === 'object')
            .map(product => ({
                _id: product._id || product.id || `temp_${Date.now()}_${Math.random()}`,
                name: product.name || product.title || 'Unnamed Product',
                price: parseFloat(product.price) || 0,
                category: product.category || product.type || 'Uncategorized',
                image: product.image || product.imageUrl || product.photo || 'https://via.placeholder.com/300x200?text=No+Image',
                description: product.description || product.desc || 'No description available',
                rating: parseFloat(product.rating) || 0,
                inStock: product.inStock !== false && product.stock !== 0,
                ...product // Keep all original properties
            }));
        
        if (products.length === 0) {
            throw new Error("No valid products found after processing API response");
        }

        // Initialize filtered products
        filteredProducts = [...products];
        
        // Extract categories
        extractCategories();
        
        // Cache products for offline use
        cacheProducts();
        
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

// Helper function to recursively find arrays in an object
function findArraysInObject(obj, path = 'root', maxDepth = 3, currentDepth = 0) {
    const arrays = [];
    
    if (currentDepth >= maxDepth) return arrays;
    
    if (Array.isArray(obj)) {
        arrays.push({ path, value: obj, length: obj.length });
        return arrays;
    }
    
    if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            const newPath = path === 'root' ? key : `${path}.${key}`;
            arrays.push(...findArraysInObject(value, newPath, maxDepth, currentDepth + 1));
        }
    }
    
    return arrays.sort((a, b) => b.length - a.length); // Sort by length descending
}

// Fallback products for offline/error scenarios
async function loadFallbackProducts() {
    console.log("🔄 Loading fallback products...");
    
    try {
        // Check if we have cached products
        const cachedProducts = localStorage.getItem('quicklocal_cached_products');
        if (cachedProducts && isCacheValid()) {
            const parsed = JSON.parse(cachedProducts);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
                filteredProducts = [...products];
                extractCategories();
                renderProducts();
                showNotification("Loaded cached products (offline mode)", "info");
                console.log("✅ Loaded cached products");
                return;
            }
        }
        
        // Use demo products as last resort
        products = getDemoProducts();
        filteredProducts = [...products];
        extractCategories();
        renderProducts();
        showNotification("Loaded demo products", "warning");
        console.log("WARNING: Loaded demo products");
        
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

// Enhanced renderProducts with better container detection
function renderProducts(productsToRender = null) {
    // Try multiple possible container IDs/classes
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
    
    // If no container found, try to find any container with product-related class
    if (!container) {
        container = document.querySelector('[class*="product"]') || 
                   document.querySelector('[id*="product"]') ||
                   document.querySelector('.grid') ||
                   document.querySelector('.container');
    }
    
    if (!container) {
        console.error("No suitable products container found. Creating one...");
        // Create a container if none exists
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

    // Use provided products or fall back to global products/filteredProducts
    let targetProducts = productsToRender || filteredProducts;
    
    // If filteredProducts is empty/undefined, use products
    if (!targetProducts || !Array.isArray(targetProducts) || targetProducts.length === 0) {
        targetProducts = products || [];
    }

    // Show loading state if products are still loading
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

    // Handle empty state
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
    
    // Update category filter UI
    updateCategoryFilter();
}

// Create product card with error handling and inline styles
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
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'"
                     loading="lazy">
                ${!inStock ? `<div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #e74c3c;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                ">Out of Stock</div>` : ''}
            </div>
            
            <div class="product-info" style="padding: 16px;">
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
                    <span class="product-price" style="
                        font-size: 1.3rem;
                        font-weight: 700;
                        color: #2e7d32;
                    ">₹${safePrice.toFixed(2)}</span>
                    
                    <button onclick="addToCart('${_id}')" 
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
    // Try to find container with multiple fallbacks
    const possibleContainers = [
        'products-container', 'products-grid', 'product-grid', 
        'marketplace-products', 'products', 'product-list'
    ];
    
    let container = null;
    for (const id of possibleContainers) {
        container = document.getElementById(id) || document.querySelector(`.${id}`);
        if (container) break;
    }
    
    if (!container) {
        console.warn("No container found for loading state");
        return;
    }
    
    // Add CSS animation keyframes if not already added
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

// Enhanced setup functions
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Category filter
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) {
        categorySelect.addEventListener('change', filterByCategory);
    }
    
    // Price filter
    const priceSelect = document.getElementById('price-filter');
    if (priceSelect) {
        priceSelect.addEventListener('change', filterByPrice);
    }
    
    // Sort functionality
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
        showNotification(`${product.name} quantity updated in cart!`, "success");
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
        showNotification(`${product.name} added to cart!`, "success");
    }
    
    // Save cart
    localStorage.setItem("quicklocal_cart", JSON.stringify(cart));
    
    // Update UI
    updateCartBadge();
    
    // Update quickLocal global cart if it exists
    if (typeof window.quickLocal !== 'undefined') {
        window.quickLocal.cart = cart;
    }
}

// Search functionality
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    if (!query) {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => {
            const name = (product.name || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            
            return name.includes(query) || 
                   description.includes(query) || 
                   category.includes(query);
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
        default:
            // Default order (as loaded from API)
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

// Cache products for offline use
function cacheProducts() {
    if (Array.isArray(products) && products.length > 0) {
        try {
            localStorage.setItem('quicklocal_cached_products', JSON.stringify(products));
            localStorage.setItem('quicklocal_cache_timestamp', Date.now().toString());
            console.log(`✅ Cached ${products.length} products for offline use`);
        } catch (error) {
            console.warn("Failed to cache products:", error);
        }
    }
}

// Check if cached products are still valid (24 hours)
function isCacheValid() {
    const timestamp = localStorage.getItem('quicklocal_cache_timestamp');
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return cacheAge < maxAge;
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
        
        // Close menu when clicking outside
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
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.opacity = '0';
                userDropdown.style.visibility = 'hidden';
                userDropdown.style.transform = 'translateY(-10px)';
            }
        });
    }
}

// Enhanced Search Suggestions
function setupSearchSuggestions() {
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (searchInput && searchSuggestions) {
        const debouncedSearch = debounce(async (query) => {
            if (query.length < 2) {
                searchSuggestions.classList.remove('active');
                return;
            }
            
            // Generate suggestions based on products
            const suggestions = generateSearchSuggestions(query);
            displaySearchSuggestions(suggestions);
        }, 300);
        
        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.classList.remove('active');
            }
        });
    }
}

function generateSearchSuggestions(query) {
    if (!Array.isArray(products)) return [];
    
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Search in product names
    products.forEach(product => {
        if (product.name && product.name.toLowerCase().includes(queryLower)) {
            suggestions.push({
                text: product.name,
                type: 'product',
                id: product._id
            });
        }
    });
    
    // Search in categories
    categories.forEach(category => {
        if (category.name && category.name.toLowerCase().includes(queryLower)) {
            suggestions.push({
                text: category.name,
                type: 'category',
                id: category._id
            });
        }
    });
    
    // Remove duplicates
    return suggestions.filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
    ).slice(0, 5);
}

function displaySearchSuggestions(suggestions) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;
    
    if (suggestions.length === 0) {
        searchSuggestions.classList.remove('active');
        return;
    }
    
    searchSuggestions.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="selectSuggestion('${suggestion.text}', '${suggestion.type}')">
            <i class="fas fa-${suggestion.type === 'product' ? 'box' : 'tag'}"></i>
            <span>${escapeHtml(suggestion.text)}</span>
        </div>
    `).join('');
    
    searchSuggestions.classList.add('active');
}

function selectSuggestion(text, type) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = text;
        performSearch();
    }
    
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
        searchSuggestions.classList.remove('active');
    }
}

// Enhanced Price Range Slider
function setupPriceRangeSlider() {
    const priceRange = document.getElementById('priceRange');
    const priceRangeValue = document.getElementById('priceRangeValue');
    
    if (priceRange && priceRangeValue) {
        priceRange.addEventListener('input', (e) => {
            const value = e.target.value;
            priceRangeValue.textContent = `₹${parseInt(value).toLocaleString()}`;
        });
        
        // Apply price filter when slider changes
        priceRange.addEventListener('change', () => {
            filterByPrice();
        });
    }
}

// Enhanced View Toggle
function setupViewToggle() {
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    const productsGrid = document.getElementById('productsGrid');
    
    if (gridView && listView && productsGrid) {
        gridView.addEventListener('click', () => {
            productsGrid.className = 'products-grid';
            gridView.classList.add('active');
            listView.classList.remove('active');
        });
        
        listView.addEventListener('click', () => {
            productsGrid.className = 'products-list';
            listView.classList.add('active');
            gridView.classList.remove('active');
        });
    }
}

// Enhanced Newsletter Setup
function setupNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    const newsletterInput = document.querySelector('.newsletter-input');
    const newsletterBtn = document.querySelector('.newsletter-btn');
    
    if (newsletterForm && newsletterInput && newsletterBtn) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterInput.value.trim();
            
            if (email && isValidEmail(email)) {
                subscribeToNewsletter(email);
                newsletterInput.value = '';
                showToast('Successfully subscribed to newsletter!', 'success');
            } else {
                showToast('Please enter a valid email address.', 'error');
            }
        });
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function subscribeToNewsletter(email) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Newsletter subscription:', email);
    } catch (error) {
        console.error('Newsletter subscription failed:', error);
    }
}

// Enhanced Toast Notifications
function setupToastNotifications() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toastContainer')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Enhanced Hero Search
function searchFromHero() {
    const heroSearch = document.getElementById('heroSearch');
    if (heroSearch && heroSearch.value.trim()) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = heroSearch.value;
            performSearch();
        }
        scrollToProducts();
    }
}

function searchProduct(query) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
        performSearch();
        scrollToProducts();
    }
}

function scrollToProducts() {
    const productsSection = document.getElementById('products');
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
                await authService.logout();
                
                // Update UI
                const guestActions = document.getElementById('guestActions');
                const userActions = document.getElementById('userActions');
                
                if (guestActions && userActions) {
                    guestActions.style.display = 'flex';
                    userActions.style.display = 'none';
                }
                
                showToast('Successfully logged out!', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } catch (error) {
                console.error('Logout error:', error);
                showToast('Logout failed. Please try again.', 'error');
            }
        }

// Export functions for global access
window.quickLocalMarketplace = {
    loadProducts,
    renderProducts,
    addToCart,
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
    showToast,
    // Debug functions
    getProducts: () => products,
    getFilteredProducts: () => filteredProducts,
    forceReload: () => {
        isInitialized = false;
        products = [];
        filteredProducts = [];
        initializeApp();
    }
};