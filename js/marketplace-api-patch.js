// 🔧 MARKETPLACE API FIX PATCH
// Add this script to your marketplace.html to fix the API endpoint issues

console.log('🔧 Loading marketplace API patch...');

// Enhanced API utilities with better error handling and fallbacks
window.enhancedAPI = {
    baseURL: window.APP_CONFIG.API_BASE_URL,
    
    async request(endpoint, options = {}) {
        console.log(`📡 API Request: ${endpoint}`, options);
        
        // Ensure endpoint starts with /
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        const url = this.baseURL + endpoint;
        console.log(`🌐 Full URL: ${url}`);
        
        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add auth header if available
        if (window.HybridAuthClient && typeof window.HybridAuthClient.getAuthHeader === 'function') {
            const authHeader = window.HybridAuthClient.getAuthHeader();
            if (authHeader) {
                headers['Authorization'] = authHeader;
            }
        }
        
        const config = {
            method: 'GET',
            headers,
            ...options
        };
        
        try {
            console.log(`📤 Making request with config:`, config);
            const response = await fetch(url, config);
            
            console.log(`📥 Response status: ${response.status} ${response.statusText}`);
            console.log(`📥 Response headers:`, [...response.headers.entries()]);
            
            if (!response.ok) {
                // Try to get error details from response
                let errorData = null;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: response.statusText };
                }
                
                throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Response received:`, data);
            
            return data;
        } catch (error) {
            console.error(`❌ API Error [${endpoint}]:`, error);
            
            // Enhanced error reporting
            if (error.message.includes('Failed to fetch')) {
                console.error('🚫 Possible causes: CORS, network, or server down');
                console.error('💡 Check: 1) Server running 2) CORS configured 3) Network connectivity');
            }
            
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
    }
};

// Enhanced product loading function with better error handling
window.enhancedLoadProducts = async function() {
    console.log('🔄 Enhanced loadProducts started...');
    
    if (window.appState && window.appState.isLoading) {
        console.log('⏳ Already loading, skipping...');
        return;
    }
    
    // Set loading state
    if (window.appState) {
        window.appState.isLoading = true;
    }
    
    if (typeof window.showLoading === 'function') {
        window.showLoading(true);
    }
    
    try {
        console.log('📡 Attempting to load products from API...');
        
        // Try multiple approaches in order of preference
        let data = null;
        const attempts = [
            // Attempt 1: Use hybrid auth client if available
            async () => {
                if (window.HybridAuthClient && typeof window.HybridAuthClient.apiCall === 'function') {
                    console.log('🔐 Trying HybridAuthClient.apiCall...');
                    const response = await window.HybridAuthClient.apiCall('/api/v1/products');
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return await response.json();
                }
                throw new Error('HybridAuthClient not available');
            },
            
            // Attempt 2: Use enhanced API helper
            async () => {
                console.log('🚀 Trying enhancedAPI...');
                return await window.enhancedAPI.get('/api/v1/products');
            },
            
            // Attempt 3: Direct fetch with manual auth
            async () => {
                console.log('📡 Trying direct fetch...');
                const headers = { 'Content-Type': 'application/json' };
                
                // Add auth if available
                if (window.HybridAuthClient && typeof window.HybridAuthClient.getAuthHeader === 'function') {
                    const authHeader = window.HybridAuthClient.getAuthHeader();
                    if (authHeader) headers['Authorization'] = authHeader;
                }
                
                const response = await fetch(window.APP_CONFIG.API_BASE_URL + '/products', { headers });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            }
        ];
        
        // Try each attempt
        for (let i = 0; i < attempts.length; i++) {
            try {
                console.log(`🎯 Attempt ${i + 1}/${attempts.length}...`);
                data = await attempts[i]();
                console.log(`✅ Attempt ${i + 1} succeeded!`);
                break;
            } catch (error) {
                console.warn(`⚠️ Attempt ${i + 1} failed:`, error.message);
                if (i === attempts.length - 1) {
                    throw error; // Last attempt failed, throw the error
                }
            }
        }
        
        if (!data) {
            throw new Error('All API attempts failed');
        }
        
        console.log('✅ Raw API response:', data);
        
        // Parse products from response
        let products = [];
        
        if (data.success && data.data && data.data.products && Array.isArray(data.data.products)) {
            products = data.data.products;
            console.log(`✅ Found ${products.length} products in data.data.products`);
        } else if (data.success && Array.isArray(data.data)) {
            products = data.data;
            console.log(`✅ Found ${products.length} products in data.data`);
        } else if (Array.isArray(data)) {
            products = data;
            console.log(`✅ Found ${products.length} products in direct array`);
        } else if (data.products && Array.isArray(data.products)) {
            products = data.products;
            console.log(`✅ Found ${products.length} products in data.products`);
        } else {
            console.warn('⚠️ Unexpected API response format:', data);
            console.warn('📝 Available keys:', Object.keys(data));
            products = [];
        }
        
        // Process products for display
        if (window.appState) {
            const processedProducts = products.map(product => ({
                ...product,
                id: product._id || product.id,
                rating: product.averageRating || product.rating || (3.5 + Math.random() * 1.5),
                reviews: product.totalReviews || product.reviews || Math.floor(Math.random() * 500) + 10,
                originalPrice: product.originalPrice || (product.finalPrice && product.finalPrice < product.price ? product.price : product.price * 1.2),
                stock: product.stock !== undefined ? product.stock : Math.floor(Math.random() * 50) + 5,
                // Fix image URL handling
                image: product.image || (product.images && product.images.length > 0 ? 
                    (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : null)
            }));
            
            console.log('🎨 Processed products:', processedProducts);
            
            window.appState.products = processedProducts;
            window.appState.allProducts = [...processedProducts];
            window.appState.filteredProducts = [...processedProducts];
            
            // Update categories
            processedProducts.forEach(product => {
                if (product.category) {
                    if (typeof product.category === 'object' && product.category.name) {
                        window.appState.categories.add(product.category.name);
                    } else if (typeof product.category === 'string') {
                        window.appState.categories.add(product.category);
                    }
                }
            });
            
            // Update pagination
            window.appState.pagination.totalItems = processedProducts.length;
            window.appState.pagination.totalPages = Math.ceil(processedProducts.length / window.appState.pagination.itemsPerPage);
            
            console.log('📊 Updated app state:', window.appState);
        }
        
        // Render products if functions are available
        if (typeof window.renderAll === 'function') {
            console.log('🎨 Calling renderAll...');
            window.renderAll();
        }
        
        if (typeof window.updatePagination === 'function') {
            console.log('📄 Updating pagination...');
            window.updatePagination();
        }
        
        if (typeof window.updateProductCount === 'function') {
            console.log('🔢 Updating product count...');
            window.updateProductCount(products.length);
        }
        
        if (typeof window.showToast === 'function') {
            window.showToast(`✅ Loaded ${products.length} products`, 'success');
        }
        
        console.log('🎉 Enhanced loadProducts completed successfully!');
        
    } catch (error) {
        console.error('❌ Enhanced loadProducts failed:', error);
        
        // Show user-friendly error
        if (typeof window.showToast === 'function') {
            let errorMessage = 'Could not load products from server.';
            if (error.message.includes('500')) {
                errorMessage = 'Server error - please try again later.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error - check your connection.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Products endpoint not found.';
            }
            
            window.showToast(errorMessage + ' Using demo data.', 'warning');
        }
        
        // Load demo products as fallback
        if (typeof window.generateDemoProducts === 'function' && window.appState) {
            console.log('🎭 Loading demo products as fallback...');
            window.appState.products = window.generateDemoProducts();
            window.appState.allProducts = [...window.appState.products];
            window.appState.filteredProducts = [...window.appState.products];
            
            if (typeof window.renderAll === 'function') {
                window.renderAll();
            }
        }
        
    } finally {
        // Clear loading state
        if (window.appState) {
            window.appState.isLoading = false;
        }
        
        if (typeof window.showLoading === 'function') {
            window.showLoading(false);
        }
    }
};

// Replace the original loadProducts function
if (typeof window.loadProducts === 'function') {
    console.log('🔄 Replacing original loadProducts with enhanced version');
    window.originalLoadProducts = window.loadProducts;
    window.loadProducts = window.enhancedLoadProducts;
} else {
    console.log('🆕 Adding enhanced loadProducts function');
    window.loadProducts = window.enhancedLoadProducts;
}

// Auto-trigger when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🚀 Auto-triggering enhanced loadProducts...');
            window.loadProducts();
        }, 3000); // Wait a bit for hybrid auth to initialize
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        console.log('🚀 Auto-triggering enhanced loadProducts (DOM ready)...');
        window.loadProducts();
    }, 3000);
}

console.log('✅ Marketplace API patch loaded successfully!');
