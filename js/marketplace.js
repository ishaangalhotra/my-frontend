// Import required modules
import { APP_CONFIG } from './config.js';
import { showToast, renderStars } from './utils.js';

// Enhanced Application State with Authentication
const appState = {
    products: [],
    filteredProducts: [],
    categories: new Set(),
    cart: [],
    // Set apiBaseUrl correctly from the imported APP_CONFIG
    apiBaseUrl: APP_CONFIG.API_BASE_URL,
    isLoading: false,
    user: null,
    hybridAuth: null, // Will hold hybrid auth instance
    
    // Enhanced pagination and filtering
    pagination: {
        currentPage: 1,
        itemsPerPage: 20,
        totalItems: 0,
        totalPages: 0
    },
    currentFilters: {
        search: '',
        category: '',
        priceRange: '',
        sortBy: 'name',
        page: 1
    }
};

// Make appState globally accessible for external scripts like marketplace-api-patch.js
window.appState = appState;

console.log('🌐 Using API Base URL:', appState.apiBaseUrl);

// ENHANCED AUTH UTILITIES
const auth = {
    // More reliable login check
    isLoggedIn: () => {
        // Check multiple indicators
        const indicators = [
            () => appState.user !== null,
            () => window.HybridAuthClient && window.HybridAuthClient.getCurrentUser() !== null,
            () => localStorage.getItem('quicklocal_user') !== null,
            () => localStorage.getItem('supabase_access_token') !== null,
            () => localStorage.getItem('token') !== null
        ];
        
        return indicators.some(indicator => {
            try {
                return indicator();
            } catch (error) {
                return false;
            }
        });
    },
    
    // More robust user retrieval
    getUser: () => {
        // Priority 1: App state
        if (appState.user) return appState.user;
        
        // Priority 2: HybridAuthClient
        if (window.HybridAuthClient && typeof window.HybridAuthClient.getCurrentUser === 'function') {
            const user = window.HybridAuthClient.getCurrentUser();
            if (user) return user;
        }
        
        // Priority 3: Local storage
        try {
            const storedUser = localStorage.getItem('quicklocal_user');
            if (storedUser) {
                return JSON.parse(storedUser);
            }
        } catch (error) {
            console.warn('Failed to parse stored user:', error);
        }
        
        return null;
    },
    
    // Enhanced logout with better cleanup
    logout: async () => {
        try {
            // Try HybridAuthClient logout first
            if (window.HybridAuthClient && typeof window.HybridAuthClient.logout === 'function') {
                const result = await window.HybridAuthClient.logout();
                if (!result.success) {
                    console.warn('HybridAuthClient logout failed, forcing cleanup');
                }
            }
            
            // Force cleanup regardless
            auth.clearStoredData();
            appState.user = null;
            appState.cart = [];
            updateAuthUI();
            showToast('Logged out successfully', 'info');
            
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Force cleanup on error too
            auth.clearStoredData();
            appState.user = null;
            appState.cart = [];
            updateAuthUI();
            showToast('Logged out', 'info');
            return { success: false, message: error.message };
        }
    },
    
    // Clear all stored authentication data
    clearStoredData: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('quicklocal_access_token');
        localStorage.removeItem('quicklocal_refresh_token');
        localStorage.removeItem('quicklocal_user');
        
        // Also clear Supabase's own storage keys
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.includes('-auth-token')) {
                localStorage.removeItem(key);
            }
        });
    },
    
    // FIX 6: Improved getAuthHeader function
    getAuthHeader: () => {
        // Try multiple token sources
        const tokenSources = [
            () => window.HybridAuthClient?.getAuthHeader?.(), // Try client first
            () => localStorage.getItem('supabase_access_token'),
            () => localStorage.getItem('quicklocal_access_token'),
            () => localStorage.getItem('token'),
            () => {
                // Check for Supabase auth token in localStorage
                const keys = Object.keys(localStorage);
                const authKey = keys.find(key => key.includes('auth-token'));
                if (authKey) {
                    const authData = JSON.parse(localStorage.getItem(authKey));
                    return authData?.access_token;
                }
                return null;
            }
        ];
        
        for (const getToken of tokenSources) {
            try {
                const token = getToken();
                if (token && typeof token === 'string' && token.length > 10) {
                    // If it's already a full header, return it. Otherwise, format it.
                    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
                }
            } catch (error) {
                continue;
            }
        }
        
        return '';
    },
    
    // Get headers for API calls
    getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': auth.getAuthHeader()
    })
};

// API utilities using hybrid auth
const api = {
    // FIX 2: Fixed API Request Function
    async request(endpoint, options = {}) {
        try {
            // Use hybrid auth API call method if available
            if (window.HybridAuthClient && typeof window.HybridAuthClient.apiCall === 'function') {
                // The hybrid client should prepend the base URL itself, so we pass only the endpoint
                const response = await window.HybridAuthClient.apiCall(endpoint, options);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.json();
            }
            
            // Fallback to direct fetch WITH the full URL
            const fullUrl = endpoint.startsWith('http') ? endpoint : `${appState.apiBaseUrl}${endpoint}`;
            const response = await fetch(fullUrl, {
                headers: auth.getHeaders(),
                ...options
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error Response Text: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },
    
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
     
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// ===== START: FIX - ADDED loadCart FUNCTION =====
// This function is essential for the marketplace page to get the cart count
// without causing a ReferenceError.
async function loadCart() {
    if (!auth.isLoggedIn()) {
        updateCartCount(0); // Ensure cart count is 0 if not logged in
        return;
    }

    try {
        // Use clean cart endpoint without /api/v1 prefix
        const response = await api.get('/cart');
        
        if (response.success && response.data) {
            // We only need the total item count for the marketplace page
            const itemCount = response.data.itemCount || (response.data.items ? response.data.items.length : 0);
            appState.cart = response.data.items || [];
            updateCartCount(itemCount);
        } else if (response.cart) {
            // Handle different response format
            const itemCount = response.cart.items ? response.cart.items.length : 0;
            appState.cart = response.cart.items || [];
            updateCartCount(itemCount);
        } else {
            // Handle empty cart or minor errors gracefully
            appState.cart = [];
            updateCartCount(0);
        }
    } catch (error) {
        console.warn('Could not load cart data for header:', error.message);
        
        // Handle 404 errors gracefully (cart requires authentication)
        if (error.message.includes('404')) {
            console.log('🔒 Cart endpoint requires authentication - showing empty cart');
            appState.cart = [];
            updateCartCount(0);
            return;
        }
        
        // For other errors, also fail gracefully
        appState.cart = [];
        updateCartCount(0);
    }
}
// ===== END: FIX - ADDED loadCart FUNCTION =====

// FIX 7: Add Request Retry Logic
async function apiCallWithRetry(endpoint, options = {}, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                console.log(`Retry attempt ${attempt} for ${endpoint}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
            return await api.request(endpoint, options);
        } catch (error) {
            lastError = error;
            console.warn(`API call attempt ${attempt + 1} failed:`, error.message);
            
            // Don't retry on 4xx client errors (except 429 - too many requests)
            if (error.message.includes('40') && !error.message.includes('429')) {
                break;
            }
        }
    }
    
    throw lastError;
}

// Helper function for safe image URL handling
function getSafeImageUrl(product, size = '300x220') {
    // Try to get image URL from various possible formats
    let imageUrl = null;
    
    // Check new API format with 'image' field
    if (product.image && typeof product.image === 'string' && product.image.startsWith('http')) {
        imageUrl = product.image;
    }
    // Check images array format
    else if (product.images && product.images.length > 0) {
        if (typeof product.images[0] === 'string' && product.images[0].startsWith('http')) {
            imageUrl = product.images[0];
        } else if (product.images[0] && product.images[0].url && product.images[0].url.startsWith('http')) {
            imageUrl = product.images[0].url;
        }
    }
    // Check legacy primaryImage format
    else if (product.primaryImage && product.primaryImage.url && product.primaryImage.url.startsWith('http')) {
        imageUrl = product.primaryImage.url;
    }
    
    // Return valid URL or placeholder
    if (imageUrl && imageUrl.startsWith('http')) {
        return imageUrl;
    } else {
        // Create a safe placeholder with product name
        const safeName = encodeURIComponent(product.name || 'Product').replace(/%20/g, '+');
        return `https://placehold.co/${size}/e6e6e6/666666?text=${safeName}`;
    }
}

// CORRECTED AUTHENTICATION DETECTION IN MARKETPLACE
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Enhanced QuickLocal Marketplace...');
    
    // Initialize components that don't need auth state
    initializeEventListeners();
    initializeScrollEffects();
    initializeFromURL();

    // Enhanced auth initialization with better state detection
    await initializeAuthState();
    
    // Load public data immediately
    await loadProducts();
    await populateCarousels();
    
    console.log('✅ QuickLocal Marketplace initialized');
});

// NEW: Enhanced auth initialization function
async function initializeAuthState() {
    let authClientLoaded = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    // Wait for HybridAuthClient to load
    while (!authClientLoaded && attempts < maxAttempts) {
        if (window.HybridAuthClient && typeof window.HybridAuthClient.isAuthenticated === 'function') {
            authClientLoaded = true;
            console.log('✅ HybridAuthClient detected');
            
            // Set up auth state listener FIRST
            if (typeof window.HybridAuthClient.onAuthStateChange === 'function') {
                window.HybridAuthClient.onAuthStateChange((user) => {
                    console.log('🔄 Auth state changed:', user ? `Logged in as ${user.name}` : 'Logged out');
                    appState.user = user;
                    updateAuthUI();
                    
                    if (user) {
                        localStorage.setItem('quicklocal_user', JSON.stringify(user));
                        // Show welcome message if redirected from login
                        const urlParams = new URLSearchParams(window.location.search);
                        if (urlParams.get('login') === 'success') {
                            showToast(`Welcome back, ${user.name}!`, 'success');
                            // Clean URL
                            window.history.replaceState({}, '', window.location.pathname);
                        }
                        loadCart(); // CRITICAL: This now calls the defined function
                    } else {
                        localStorage.removeItem('quicklocal_user');
                        appState.cart = [];
                        updateCartUI();
                    }
                });
            }
            
            // Force check current auth state immediately
            try {
                const isAuthenticated = await window.HybridAuthClient.isAuthenticated();
                if (isAuthenticated) {
                    const user = window.HybridAuthClient.getCurrentUser();
                    if (user) {
                        console.log('✅ User already authenticated:', user.name);
                        appState.user = user;
                        updateAuthUI();
                        loadCart(); // CRITICAL: This now calls the defined function
                    }
                }
            } catch (error) {
                console.warn('Auth check failed:', error);
            }
            break;
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }
    
    if (!authClientLoaded) {
        console.warn('⚠️ HybridAuthClient not loaded. Checking local storage...');
        // Fallback: Check localStorage for user data
        try {
            const storedUser = localStorage.getItem('quicklocal_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                appState.user = user;
                updateAuthUI();
                console.log('✅ User restored from localStorage:', user.name);
            }
        } catch (error) {
            console.warn('Failed to restore user from storage:', error);
        }
    }
    
    updateAuthUI(); // Ensure UI is updated regardless
}

// ENHANCED UI UPDATE FUNCTION
function updateAuthUI() {
    const loginBtn = document.querySelector('a[href="login.html"]');
    const user = auth.getUser();
    const isLoggedIn = auth.isLoggedIn();
    
    console.log('🔄 Updating auth UI:', { 
        isLoggedIn, 
        user: user?.name,
        authMethod: window.HybridAuthClient?.getAuthMethod?.() 
    });
    
    if (isLoggedIn && user) {
        // User is logged in
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name}`;
            loginBtn.href = '#';
            loginBtn.classList.remove('btn-secondary');
            loginBtn.classList.add('btn-primary');
            loginBtn.onclick = (e) => {
                e.preventDefault();
                showUserMenu();
            };
        }
        
        // Show auth-dependent elements
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = 'flex';
        });
        
    } else {
        // User is not logged in
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginBtn.href = 'login.html';
            loginBtn.classList.remove('btn-primary');
            loginBtn.classList.add('btn-secondary');
            loginBtn.onclick = null;
        }
        
        // Hide auth-dependent elements
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Update footer login link
    const footerLoginBtn = document.getElementById('login-btn');
    if (footerLoginBtn) {
        if (isLoggedIn && user) {
            footerLoginBtn.textContent = 'My Account';
            footerLoginBtn.href = '#';
            footerLoginBtn.onclick = (e) => {
                e.preventDefault();
                showUserMenu();
            };
        } else {
            footerLoginBtn.textContent = 'Login';
            footerLoginBtn.href = 'login.html';
            footerLoginBtn.onclick = null;
        }
    }
}

// Show user menu (dropdown)
function showUserMenu() {
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <div class="user-menu-content">
            <div class="user-info">
                <i class="fas fa-user-circle"></i>
                <div>
                    <div class="user-name">${auth.getUser().name}</div>
                    <div class="user-email">${auth.getUser().email}</div>
                </div>
            </div>
            <div class="user-menu-divider"></div>
            <a href="#" onclick="window.location.href='profile.html'"><i class="fas fa-user"></i> My Profile</a>
            <a href="#" onclick="window.location.href='orders.html'"><i class="fas fa-box"></i> My Orders</a>
            <a href="#" onclick="window.location.href='cart.html'"><i class="fas fa-shopping-cart"></i> My Cart</a>
            <div class="user-menu-divider"></div>
            <a href="#" onclick="auth.logout(); closeUserMenu();"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    `;
    
    // Add styles for user menu
    if (!document.getElementById('userMenuStyles')) {
        const styles = document.createElement('style');
        styles.id = 'userMenuStyles';
        styles.textContent = `
            .user-menu {
                position: fixed;
                top: 80px;
                right: 2rem;
                background: white;
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-xl);
                border: 1px solid var(--border);
                z-index: 10000;
                min-width: 250px;
                animation: userMenuSlide 0.3s ease-out;
            }
            .user-menu-content {
                padding: 1rem;
            }
            .user-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            .user-info i {
                font-size: 2rem;
                color: var(--primary);
            }
            .user-name {
                font-weight: 700;
                color: var(--text-primary);
            }
            .user-email {
                font-size: 0.85rem;
                color: var(--text-light);
            }
            .user-menu-divider {
                height: 1px;
                background: var(--border);
                margin: 0.75rem 0;
            }
            .user-menu a {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                color: var(--text-secondary);
                text-decoration: none;
                border-radius: var(--radius);
                transition: var(--transition);
                font-weight: 500;
            }
            .user-menu a:hover {
                background: var(--bg-tertiary);
                color: var(--primary);
            }
            @keyframes userMenuSlide {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Close menu on click outside
    setTimeout(() => {
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                closeUserMenu();
            }
        }, { once: true });
    }, 100);
    
    document.body.appendChild(userMenu);
}

function closeUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.style.opacity = '0';
        userMenu.style.transform = 'translateY(-10px)';
        setTimeout(() => userMenu.remove(), 200);
    }
}

// Enhanced Event Listeners
function initializeEventListeners() {
    // Filter events
    document.getElementById('applyFilters')?.addEventListener('click', applyAllFilters);
    document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
    document.getElementById('categoryList')?.addEventListener('click', handleCategoryPillClick);
    
    // Search events with debouncing for better performance
    const searchInput = document.getElementById('search-input');
    const globalSearchInput = document.getElementById('globalSearchInput');
    
    searchInput?.addEventListener('input', debounce(handleSearchInput, 300));
    globalSearchInput?.addEventListener('input', debounce(handleGlobalSearch, 300));
    
    // Pagination events
    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
        if (appState.pagination.currentPage > 1) {
            goToPage(appState.pagination.currentPage - 1);
        }
    });
    
    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
        if (appState.pagination.currentPage < appState.pagination.totalPages) {
            goToPage(appState.pagination.currentPage + 1);
        }
    });
    
    document.getElementById('itemsPerPage')?.addEventListener('change', (e) => {
        changeItemsPerPage(e.target.value);
    });
    
    // Filter change events with URL updates
    document.getElementById('category-filter')?.addEventListener('change', () => {
        appState.pagination.currentPage = 1;
        appState.currentFilters.page = 1;
        applyAllFilters();
    });
    
    document.getElementById('price-filter')?.addEventListener('change', () => {
        appState.pagination.currentPage = 1;
        appState.currentFilters.page = 1;
        applyAllFilters();
    });
    
    document.getElementById('sort-select')?.addEventListener('change', () => {
        applyAllFilters();
    });
    
    // Carousel events
    document.querySelectorAll('.carousel-container').forEach(initializeCarousel);
    
    // Header scroll effect
    window.addEventListener('scroll', handleScroll);
    
    // Scroll to top button
    document.getElementById('scrollToTop')?.addEventListener('click', scrollToTop);
    
    console.log('✅ Event listeners initialized with pagination support');
}

// Enhanced scroll effects
function initializeScrollEffects() {
    const header = document.getElementById('header');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Header effect
        if (scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Scroll to top button
        if (scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
}

// Enhanced product loading with better error handling
async function loadProducts() {
    if (appState.isLoading) return;
    
    appState.isLoading = true;
    showLoading(true);
    
    try {
        // FIX 3: Products endpoint does not include /api/v1/ prefix
        const data = await apiCallWithRetry('/products');
        
        // FIX 5: Better error handling for API responses
        console.log('✅ API response received:', data);
        
        // Handle different response formats more robustly
        let products = [];
        if (data && data.success !== undefined) {
            // Backend returns { success: true, data: [...] }
            if (data.data && Array.isArray(data.data)) {
                products = data.data;
            } else if (data.data && data.data.products && Array.isArray(data.data.products)) {
                products = data.data.products;
            }
        } else if (Array.isArray(data)) {
            // Backend returns direct array
            products = data;
        } else {
            console.warn('Unexpected API response format:', data);
            products = [];
        }
        
        // Enhanced product processing
        appState.products = products.map(product => ({
            ...product,
            id: product._id || product.id,
            rating: product.rating || (3.5 + Math.random() * 1.5), // Mock rating if not provided
            reviews: product.reviews || Math.floor(Math.random() * 500) + 10,
            originalPrice: product.originalPrice || (product.price * (1 + Math.random() * 0.5)),
            stock: product.stock !== undefined ? product.stock : Math.floor(Math.random() * 50) + 5
        }));
        
        // Extract categories
        appState.products.forEach(product => {
            if (product.category) {
                appState.categories.add(product.category);
            }
        });
        
        // Store all products for pagination
        appState.allProducts = [...appState.products];
        appState.filteredProducts = [...appState.products];
        
        // Apply initial filters from URL if any
        if (Object.values(appState.currentFilters).some(v => v && v !== '' && v !== 'name' && v !== 1)) {
            applyAllFilters();
        } else {
            // Update pagination for initial load
            appState.pagination.totalItems = appState.products.length;
            appState.pagination.totalPages = Math.ceil(appState.products.length / appState.pagination.itemsPerPage);
            
            // Render first page
            const firstPageProducts = appState.products.slice(0, appState.pagination.itemsPerPage);
            renderAll();
            updatePagination();
            updateProductCount(appState.products.length);
        }
        
    } catch (error) {
        console.error('❌ Failed to load products:', error);
        
        let errorMessage = 'Could not load products from server.';
        if (error.message.includes('500')) {
            errorMessage = 'Server error (500) - Backend is having issues. Check server logs.';
        }
        
        showToast(errorMessage + ' Using demo data instead.', 'warning');
        
        // Fallback to demo data
        appState.products = generateDemoProducts();
        appState.allProducts = [...appState.products];
        appState.filteredProducts = [...appState.products];
        appState.products.forEach(p => appState.categories.add(p.category));
        
        // Setup pagination for demo data
        appState.pagination.totalItems = appState.products.length;
        appState.pagination.totalPages = Math.ceil(appState.products.length / appState.pagination.itemsPerPage);
        renderAll();
        updatePagination();
        updateProductCount(appState.products.length);
        
    } finally {
        appState.isLoading = false;
        showLoading(false);
    }
}

// Generate demo products for fallback
function generateDemoProducts() {
    const demoProducts = [
        {
            id: '1',
            name: 'Leather Messenger Bag',
            description: 'Handcrafted leather messenger bag perfect for work and travel.',
            price: 3499,
            originalPrice: 4999,
            category: 'Fashion',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop',
            rating: 4.4,
            reviews: 78,
            stock: 12
        }
    ];
    
    return demoProducts;
}

// Enhanced rendering functions
function renderAll() {
    renderCategories();
    renderProducts();
    updateCartUI();
}

function renderProducts(productsToRender = null) {
    const container = document.getElementById('products-container');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;

    // Use provided products or fallback to filtered products
    const products = productsToRender || appState.filteredProducts || [];

    if (products.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';

    // Check if enhanced product card utilities are available
    if (typeof productCardUtils !== 'undefined') {
        // Use enhanced product cards system
        const enhancedProducts = products.map(product => ({
            ...product,
            // Map existing fields to enhanced card format
            finalPrice: product.price,
            discountPercentage: product.originalPrice ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
            savings: product.originalPrice ? (product.originalPrice - product.price) : 0,
            isOnSale: product.originalPrice && product.originalPrice > product.price,
            images: product.images || [{ url: product.image }],
            primaryImage: { url: product.images?.[0]?.url || product.image },
            isInStock: product.stock > 0,
            isLowStock: product.stock > 0 && product.stock <= 10,
            stockStatus: product.stock === 0 ? 'out_of_stock' : 
                         product.stock <= 10 ? 'low_stock' : 'in_stock',
            unit: 'piece',
            averageRating: product.rating,
            totalReviews: product.reviews,
            category: { name: product.category },
            seller: { name: 'Local Seller' },
            tags: [],
            features: [],
            colors: [],
            sizes: [],
            deliveryConfig: {
                isLocalDeliveryEnabled: true,
                preparationTime: Math.floor(Math.random() * 30) + 10,
                deliveryFee: product.price > 500 ? 0 : 50,
                freeDeliveryThreshold: 500,
                expressDeliveryAvailable: true,
                codAvailable: true
            },
            sellerLocation: {
                city: 'Local',
                locality: 'Nearby'
            },
            isFeatured: product.rating >= 4.5,
            isNewArrival: Math.random() > 0.8,
            isBestSeller: product.rating >= 4.0 && product.reviews >= 100
        }));

        // Use the enhanced product card utilities to render
        const cardsHtml = enhancedProducts.map(product => {
            return productCardUtils.generateProductCard(product);
        }).join('');
        
        container.innerHTML = `<div class="products-grid">${cardsHtml}</div>`;
        
        // Attach event listeners for enhanced functionality
        setTimeout(() => {
            productCardUtils.attachVariantListeners();
        }, 100);
    } else {
        // Fallback to original card rendering
        console.warn('Enhanced product card utilities not loaded, using fallback rendering');
        
        container.innerHTML = products.map(product => {
            const discount = product.originalPrice ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
            
            const stars = generateStars(product.rating);
            
            return `
                <div class="product-card" data-product-id="${product.id}" onclick="handleCardClick('${product.id}')">
                    <div class="product-image-container">
                        <img loading="lazy" src="${getSafeImageUrl(product)}" 
                             alt="${product.name}" class="product-image"
                             onerror="this.onerror=null; this.src='https://placehold.co/300x220/e6e6e6/666666?text=Image+Error';">
                        ${discount > 0 ? `<div class="product-badge">${discount}% OFF</div>` : ''}
                    </div>
                    <div class="product-content">
                        <div class="product-category">${product.category}</div>
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
        }).join('');
    }
}

function updateProductCount(count) {
    const elements = document.querySelectorAll('.product-count, #totalProductsCount');
    elements.forEach(el => {
        if (el) {
            el.textContent = `${count.toLocaleString()} products found`;
        }
    });
    
    // Update page title with count
    const titleSuffix = count > 0 ? ` (${count} products)` : ' (No products found)';
    if (document.title && !document.title.includes('(')) {
        document.title += titleSuffix;
    }
}

function renderCategories() {
    const catListContainer = document.getElementById('categoryList');
    const catFilterSelect = document.getElementById('category-filter');

    if (!catListContainer || !catFilterSelect) return;

    const allPill = `<div class="category-item active" data-category="">🏪 All Products</div>`;
    const categoryIcons = {
        'Electronics': '📱',
        'Clothing': '👕',
        'Food & Beverages': '🍵',
        'Fashion': '👜',
        'Home & Garden': '🏠',
        'Sports': '⚽',
        'Books': '📚'
    };
    
    const categoryPills = [...appState.categories].map(cat => 
        `<div class="category-item" data-category="${cat}">
            ${categoryIcons[cat] || '🏷️'} ${cat}
        </div>`).join('');
    
    catListContainer.innerHTML = allPill + categoryPills;

    catFilterSelect.innerHTML = '<option value="">All Categories</option>' + 
        [...appState.categories].map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Enhanced carousel functionality
async function populateCarousels() {
    await populateCarousel('trending-list', getTrendingProducts());
    await populateCarousel('recommended-list', getRecommendedProducts());
}

function getTrendingProducts() {
    return appState.products
        .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
        .slice(0, 8);
}

function getRecommendedProducts() {
    return appState.products
        .filter(p => p.rating >= 4.0)
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);
}

async function populateCarousel(elementId, products) {
    const list = document.getElementById(elementId);
    if (!list || !products.length) return;

    list.innerHTML = products.map(product => createCarouselCard(product)).join('');
}

function createCarouselCard(product) {
    const discount = product.originalPrice ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    return `
        <div class="carousel-card" onclick="handleCardClick('${product.id}')">
            <img class="p-image" loading="lazy" 
                 src="${getSafeImageUrl(product, '280x160')}" 
                 alt="${product.name}"
                 onerror="this.onerror=null; this.src='https://placehold.co/280x160/e6e6e6/666666?text=Image+Error';">
            <div class="p-name">${product.name}</div>
            <div class="price-row">
                <div class="p-price">₹${product.price.toLocaleString()}</div>
                ${product.originalPrice ? 
                    `<div class="p-original">₹${product.originalPrice.toLocaleString()}</div>` : ""}
                ${discount > 0 ? `<div class="p-discount">${discount}% OFF</div>` : ""}
            </div>
            <div class="rating">${product.rating.toFixed(1)} ⭐</div>
        </div>
    `;
}

function initializeCarousel(container) {
    const track = container.querySelector('.carousel-track');
    const leftBtn = container.querySelector('.carousel-btn.left');
    const rightBtn = container.querySelector('.carousel-btn.right');
    
    leftBtn?.addEventListener('click', () => scrollCarousel(track, -1));
    rightBtn?.addEventListener('click', () => scrollCarousel(track, 1));
}

function scrollCarousel(track, direction) {
    if (!track) return;
    
    const cardWidth = track.querySelector('.carousel-card')?.offsetWidth || 280;
    const scrollAmount = (cardWidth + 24) * 2; // Scroll 2 cards at a time
    
    track.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// ===== START: FIX - MODIFIED handleAddToCart FUNCTION =====
async function handleAddToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found!', 'error');
        return;
    }

    if (!auth.isLoggedIn()) {
        showToast('Please login to add items to cart', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }
    
    // Additional check for valid auth token
    if (window.HybridAuthClient && typeof window.HybridAuthClient.isAuthenticated === 'function') {
        try {
            const isAuthenticated = await window.HybridAuthClient.isAuthenticated();
            if (!isAuthenticated) {
                showToast('Your session has expired. Please login again.', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
                }, 1500);
                return;
            }
        } catch (error) {
            console.warn('Could not verify authentication:', error.message);
            showToast('Please login to add items to cart', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            }, 1500);
            return;
        }
    }

    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    const addButton = productCard?.querySelector('.add-to-cart');
    
    if (addButton) {
        addButton.disabled = true;
        addButton.classList.add('btn-loading');
    }

    try {
        console.log('🛒 Adding to cart:', { productId, productName: product.name });

        // Use the hybrid auth client's addToCart method if available
        let response;
        if (window.quickLocalAuth && typeof window.quickLocalAuth.addToCart === 'function') {
            response = await window.quickLocalAuth.addToCart(productId, 1);
        } else if (window.HybridAuthClient && typeof window.HybridAuthClient.apiCall === 'function') {
            // Fallback to hybrid client API call - USE CORRECT ENDPOINT
            const apiResponse = await window.HybridAuthClient.apiCall('/cart/items', {
                method: 'POST',
                body: JSON.stringify({ productId: productId, quantity: 1 })
            });
            if (apiResponse.ok) {
                const data = await apiResponse.json();
                response = { success: true, data: data.data };
            } else {
                const data = await apiResponse.json();
                response = { success: false, message: data.message };
            }
        } else {
            // Final fallback to direct API call - USE CORRECT ENDPOINT
            response = await api.post('/cart/items', {
                productId: productId,
                quantity: 1
            });
        }

        if (response.success) {
            showToast(`${product.name} added to cart!`, 'success');
            
            // RELIABLE UPDATE: Simply reload the cart state
            await loadCart();
            
            productCard?.classList.add('adding');
            setTimeout(() => productCard?.classList.remove('adding'), 300);
        
        } else {
            throw new Error(response.message || 'Failed to add item to cart');
        }
    } catch (error) {
        console.error('🛍️ Add to cart error:', error);
        let errorMessage = `Failed to add ${product.name} to cart.`;
        
        if (error.message.includes('401')) {
            errorMessage = 'Your session has expired. Please log in again.';
            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            }, 2000);
        } else if (error.message.includes('404')) {
            errorMessage = 'Cart service unavailable. Please try again later.';
        } else {
            errorMessage = error.message || 'Unknown error occurred';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        if (addButton) {
            addButton.disabled = false;
            addButton.classList.remove('btn-loading');
        }
    }
}
// ===== END: FIX - MODIFIED handleAddToCart FUNCTION =====

// ===== START: CORRECTED CODE BLOCK =====
function updateCartCount(count) {
  const cartBadge = document.getElementById('cart-count');
  if (cartBadge) {
    if (count > 0) {
      cartBadge.textContent = count > 99 ? '99+' : count;
      cartBadge.style.display = 'flex';
    } else {
      cartBadge.style.display = 'none';
    }
  }
}

// FIX: Added the missing async function and corrected the API endpoint
async function removeFromCart(productId) {
    if (!auth.isLoggedIn()) {
        showToast('Please login to manage your cart', 'warning');
        return;
    }
    try {
        // CORRECTED ENDPOINT: Use '/cart/items/:productId'
        const response = await api.delete(`/cart/items/${productId}`);

        if (response.success) {
            showToast('Item removed from cart', 'success');
            await loadCart(); // Assumes loadCart() exists and reloads cart state
        } else {
            throw new Error(response.message || 'Failed to remove item');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        showToast(`Failed to remove item: ${error.message}`, 'error');
    }
}

// FIX: Corrected the API endpoint
async function updateCartItemQuantity(productId, newQuantity) {
    if (!auth.isLoggedIn()) {
        showToast('Please login to manage cart', 'warning');
        return;
    }
    try {
        // CORRECTED ENDPOINT: Use '/cart/items/:productId'
        const response = await api.patch(`/cart/items/${productId}`, {
            quantity: newQuantity
        });
        
        if (response.success) {
            await loadCart(); // Assumes loadCart() exists
        } else {
            throw new Error(response.message || 'Failed to update quantity');
        }
    } catch (error) {
        console.error('Update cart quantity error:', error);
        showToast(`Failed to update quantity: ${error.message}`, 'error');
    }
}

// FIX: Corrected the API endpoint
async function clearCart() {
    if (!auth.isLoggedIn()) {
        appState.cart = [];
        updateCartUI();
        return;
    }
    try {
        // CORRECTED ENDPOINT: Use '/cart/clear'
        const response = await api.delete('/cart/clear');

        if (response.success) {
            appState.cart = [];
            updateCartUI();
            showToast('Cart cleared!', 'success');
        } else {
            throw new Error(response.message || 'Failed to clear cart');
        }
    } catch (error) {
        console.error('Clear cart error:', error);
        showToast(`Failed to clear cart: ${error.message}`, 'error');
    }
}
// ===== END: CORRECTED CODE BLOCK =====


function handleCategoryPillClick(e) {
    const pill = e.target.closest('.category-item');
    if (!pill) return;

    document.querySelectorAll('#categoryList .category-item').forEach(p => 
        p.classList.remove('active'));
    pill.classList.add('active');
    
    document.getElementById('category-filter').value = pill.dataset.category;
    appState.currentFilters.category = pill.dataset.category;
    
    applyAllFilters();
}

// === MODIFIED FOR INTEGRATION ===
function handleCardClick(productId) {
    // Navigate to product detail page with product ID
    window.location.href = `product.html?id=${productId}`;
}

function handleSearchInput(e) {
    appState.currentFilters.search = e.target.value.toLowerCase();
    applyAllFilters();
}

function handleGlobalSearch(e) {
    const searchTerm = e.target.value;
    document.getElementById('search-input').value = searchTerm;
    handleSearchInput(e);
    
    if (searchTerm) {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }
}

function handleScroll() {
    const scrollY = window.scrollY;
    
    // Parallax effect for hero section
    const hero = document.getElementById('hero');
    if (hero) {
        hero.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Enhanced filtering with better performance, pagination, and security
function applyAllFilters() {
    // Show loading skeleton while filtering
    showSkeletonLoading(appState.pagination.itemsPerPage);
    
    // Small delay to show loading state
    setTimeout(() => {
        const filters = {
            search: validateInput(document.getElementById('search-input')?.value || '').toLowerCase(),
            category: document.getElementById('category-filter')?.value || '',
            priceRange: document.getElementById('price-filter')?.value || '',
            sortBy: document.getElementById('sort-select')?.value || 'name'
        };

        let filtered = [...(appState.allProducts || appState.products || [])];

        // Apply search filter with sanitization
        if (filters.search) {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(filters.search) ||
                (product.description && product.description.toLowerCase().includes(filters.search)) ||
                product.category.toLowerCase().includes(filters.search)
            );
        }

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(product => product.category === filters.category);
        }

        // Apply price range filter
        if (filters.priceRange) {
            if (filters.priceRange === '5000+') {
                filtered = filtered.filter(product => validateInput(product.price, 'price') >= 5000);
            } else {
                const [min, max] = filters.priceRange.split('-').map(Number);
                filtered = filtered.filter(product => {
                    const price = validateInput(product.price, 'price');
                    return price >= min && price <= max;
                });
            }
        }

        // Apply sorting
        switch (filters.sortBy) {
            case 'price-low':
                filtered.sort((a, b) => validateInput(a.price, 'price') - validateInput(b.price, 'price'));
                break;
            case 'price-high':
                filtered.sort((a, b) => validateInput(b.price, 'price') - validateInput(a.price, 'price'));
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'name':
            default:
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        // Update pagination state
        appState.pagination.totalItems = filtered.length;
        appState.pagination.totalPages = Math.ceil(filtered.length / appState.pagination.itemsPerPage);
        
        // Ensure current page is valid
        if (appState.pagination.currentPage > appState.pagination.totalPages && appState.pagination.totalPages > 0) {
            appState.pagination.currentPage = appState.pagination.totalPages;
            appState.currentFilters.page = appState.pagination.currentPage;
        }

        // Get paginated results
        const startIndex = (appState.pagination.currentPage - 1) * appState.pagination.itemsPerPage;
        const endIndex = startIndex + appState.pagination.itemsPerPage;
        const paginatedProducts = filtered.slice(startIndex, endIndex);

        // Update state
        appState.filteredProducts = filtered;
        appState.currentFilters = { ...filters, page: appState.pagination.currentPage };
        
        // Render products and update UI
        renderProducts(paginatedProducts);
        updateProductCount(filtered.length);
        updatePagination();
        
        // Update URL with current state
        updateURL();

        // Show filter results message
        const resultCount = filtered.length;
        const totalCount = (appState.allProducts || appState.products || []).length;
        
        if (resultCount < totalCount) {
            showToast(`Found ${resultCount} products matching your criteria`, 'info');
        }
        
        console.log('🔍 Applied filters:', appState.currentFilters, 'Total Results:', filtered.length, 'Page Results:', paginatedProducts.length);
    }, 100);
}

function clearAllFilters() {
    // Reset form inputs
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('price-filter').value = '';
    document.getElementById('sort-select').value = 'name';
    document.getElementById('itemsPerPage').value = '20';
    
    // Reset global search
    document.getElementById('globalSearchInput').value = '';
    
    // Reset category pills
    document.querySelectorAll('#categoryList .category-item').forEach(p => 
        p.classList.remove('active'));
    document.querySelector('#categoryList .category-item[data-category=""]')?.classList.add('active');
    
    // Reset state and pagination
    appState.filteredProducts = [...(appState.allProducts || appState.products || [])];
    appState.currentFilters = { search: '', category: '', priceRange: '', sortBy: 'name', page: 1 };
    appState.pagination.currentPage = 1;
    appState.pagination.itemsPerPage = 20;
    
    // Update URL to clear all parameters
    updateURL(true);
    
    applyAllFilters();
    
    showToast('All filters cleared!', 'success');
}

// Enhanced UI functions
function showLoading(isLoading) {
    const loadingContainer = document.getElementById('productsLoading');
    const productsContainer = document.getElementById('products-container');
    
    if (loadingContainer && productsContainer) {
        loadingContainer.style.display = isLoading ? 'flex' : 'none';
        productsContainer.style.display = isLoading ? 'none' : 'grid';
    }
}

function updateCartUI() {
    const cartBadge = document.getElementById('cart-count');
    const totalItems = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        cartBadge.textContent = totalItems > 99 ? '99+' : totalItems;
        cartBadge.style.display = 'flex';
    } else {
        cartBadge.style.display = 'none';
    }
}

// Note: generateStars and showToast are now imported from utils.js
function generateStars(rating) {
    return renderStars(rating);
}

// ===== URL STATE MANAGEMENT =====
// FIX 8: Fixed URL State Management
function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Restore filters from URL with validation
    appState.currentFilters = {
        search: validateInput(urlParams.get('search') || ''),
        category: validateInput(urlParams.get('category') || ''),
        priceRange: validateInput(urlParams.get('price') || ''),
        sortBy: ['name', 'price-low', 'price-high', 'rating'].includes(urlParams.get('sort')) 
                ? urlParams.get('sort') : 'name',
        page: Math.max(1, parseInt(urlParams.get('page')) || 1)
    };
    
    // Restore pagination state
    appState.pagination.currentPage = appState.currentFilters.page;
    appState.pagination.itemsPerPage = parseInt(urlParams.get('limit')) || 20;
    
    // Update form inputs
    if (appState.currentFilters.search) {
        document.getElementById('search-input').value = appState.currentFilters.search;
        document.getElementById('globalSearchInput').value = appState.currentFilters.search;
    }
    if (appState.currentFilters.category) {
        document.getElementById('category-filter').value = appState.currentFilters.category;
    }
    if (appState.currentFilters.priceRange) {
        document.getElementById('price-filter').value = appState.currentFilters.priceRange;
    }
    if (appState.currentFilters.sortBy) {
        document.getElementById('sort-select').value = appState.currentFilters.sortBy;
    }
    if (appState.pagination.itemsPerPage) {
        document.getElementById('itemsPerPage').value = appState.pagination.itemsPerPage;
    }
    
    console.log('🔗 Filters restored from URL:', appState.currentFilters);
}

function updateURL(replaceState = false) {
    const params = new URLSearchParams();
    
    // Add non-empty filter parameters
    Object.keys(appState.currentFilters).forEach(key => {
        const value = appState.currentFilters[key];
        if (value && value !== '' && value !== 'name' && !(key === 'page' && value === 1)) {
            params.set(key === 'sortBy' ? 'sort' : key === 'priceRange' ? 'price' : key, value);
        }
    });
    
    // Add pagination parameters
    if (appState.pagination.currentPage > 1) {
        params.set('page', appState.pagination.currentPage);
    }
    if (appState.pagination.itemsPerPage !== 20) {
        params.set('limit', appState.pagination.itemsPerPage);
    }
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    
    if (replaceState) {
        history.replaceState({}, '', newURL);
    } else {
        history.pushState({}, '', newURL);
    }
}

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    initializeFromURL();
    applyAllFilters();
});

// ===== PAGINATION FUNCTIONS =====
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    const info = document.getElementById('paginationInfo');
    const numbers = document.getElementById('paginationNumbers');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (!container || appState.pagination.totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    
    // Update pagination info
    const start = (appState.pagination.currentPage - 1) * appState.pagination.itemsPerPage + 1;
    const end = Math.min(start + appState.pagination.itemsPerPage - 1, appState.pagination.totalItems);
    info.textContent = `Showing ${start}-${end} of ${appState.pagination.totalItems} products`;
    
    // Update navigation buttons
    prevBtn.disabled = appState.pagination.currentPage <= 1;
    nextBtn.disabled = appState.pagination.currentPage >= appState.pagination.totalPages;
    
    // Generate page numbers
    numbers.innerHTML = generatePageNumbers();
}

function generatePageNumbers() {
    const current = appState.pagination.currentPage;
    const total = appState.pagination.totalPages;
    const delta = 2; // Number of pages to show on each side of current
    
    let pages = [];
    
    // Always include first page
    pages.push(1);
    
    // Add ellipsis after first page if needed
    if (current - delta > 2) {
        pages.push('...');
    }
    
    // Add pages around current page
    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);
    
    for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
            pages.push(i);
        }
    }
    
    // Add ellipsis before last page if needed
    if (current + delta < total - 1) {
        pages.push('...');
    }
    
    // Always include last page if there's more than one page
    if (total > 1 && !pages.includes(total)) {
        pages.push(total);
    }
    
    return pages.map(page => {
        if (page === '...') {
            return '<button class="page-number ellipsis" disabled>...</button>';
        }
        
        const isActive = page === current;
        return `<button class="page-number ${isActive ? 'active' : ''}" 
                       onclick="goToPage(${page})">${page}</button>`;
    }).join('');
}

function goToPage(page) {
    if (page < 1 || page > appState.pagination.totalPages) return;
    
    appState.pagination.currentPage = page;
    appState.currentFilters.page = page;
    
    applyAllFilters();
    updateURL();
    
    // Smooth scroll to top of products
    document.getElementById('products').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

function changeItemsPerPage(newLimit) {
    appState.pagination.itemsPerPage = parseInt(newLimit);
    appState.pagination.currentPage = 1; // Reset to first page
    appState.currentFilters.page = 1;
    
    applyAllFilters();
    updateURL();
}

// ===== XSS PROTECTION & SECURITY =====
function sanitizeHTML(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeHTML(str) {
    if (!str) return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return str.replace(/[&<>"']/g, m => map[m]);
}

function validateInput(input, type = 'text') {
    if (!input) return '';
    
    switch (type) {
        case 'number':
            return parseFloat(input) || 0;
        case 'integer':
            return parseInt(input) || 0;
        case 'price':
            const price = parseFloat(input);
            return isNaN(price) || price < 0 ? 0 : Math.round(price * 100) / 100;
        case 'text':
        default:
            // Only escape for rendering, don't change the value for filtering
            return input.toString().trim();
    }
}

// ===== LOADING SKELETONS =====
function showSkeletonLoading(count = 8) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    const skeletons = Array.from({ length: count }, () => `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-text title"></div>
            <div class="skeleton-text description"></div>
            <div class="skeleton-text price"></div>
            <div class="skeleton-text"></div>
        </div>
    `).join('');
    
    container.innerHTML = `<div class="skeleton-container">${skeletons}</div>`;
}

// Utility functions
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

// Enhanced product card integration
window.addEventListener('load', () => {
    // Override enhanced product card utilities to integrate with existing functionality
    if (typeof productCardUtils !== 'undefined') {
        // Override add to cart function
        productCardUtils.addToCart = function(productId) {
            handleAddToCart(productId);
        };
        
        // Override view product function
        productCardUtils.viewProduct = function(productId) {
            handleCardClick(productId);
        };
        
        // Override quick view function
        productCardUtils.quickView = function(productId) {
            const product = appState.products.find(p => p.id === productId);
            if (product) {
                showToast(`Quick view: ${product.name}`, 'info');
                // Future: Show quick view modal
            }
        };
        
        console.log('✅ Enhanced product cards integrated with marketplace functionality');
    } else {
        console.warn('⚠️ Enhanced product card utilities not available, using fallback rendering');
    }
});

// Add error handling for external scripts
let productCardUtilsLoaded = false;
setTimeout(() => {
    if (typeof productCardUtils !== 'undefined') {
        productCardUtilsLoaded = true;
        console.log('✅ Enhanced product cards loaded successfully');
    } else {
        console.warn('⚠️ Enhanced product cards failed to load - falling back to standard cards');
        showToast('Loading enhanced product features...', 'info');
    }
}, 2000);

// Make functions globally accessible
window.handleAddToCart = handleAddToCart;
window.handleCardClick = handleCardClick;

// Add some keyboard shortcuts for better UX
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearchInput').focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput === document.activeElement) {
            searchInput.blur();
            clearAllFilters();
        }
    }
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe product cards for animation
setTimeout(() => {
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}, 100);

// FIX 9: Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        setTimeout(() => { // Use timeout to ensure all metrics are available
            const navTiming = performance.getEntriesByType('navigation')[0];
            const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0];
            console.log('🚀 Page Load Performance:', {
                domContentLoaded: (navTiming.domContentLoadedEventEnd - navTiming.navigationStart).toFixed(2) + 'ms',
                fullLoad: (navTiming.loadEventEnd - navTiming.navigationStart).toFixed(2) + 'ms',
                firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime.toFixed(2) + 'ms' : 'N/A'
            });
        }, 1000);
    }
});