// 🔧 MARKETPLACE API FIX PATCH
// Add this script to your marketplace.html to fix the API endpoint issues

console.log('🔧 Loading marketplace API patch...');

// Enhanced API utilities with better error handling and fallbacks
window.enhancedAPI = {
    baseURL: window.APP_CONFIG.API_BASE_URL,
    
    async request(endpoint, options = {}) {
        console.log(`📡 API Request: ${endpoint}`, options);
        
        // Clean up endpoint to avoid duplication
        let cleanEndpoint = endpoint;
        
        // Remove /api/v1 prefix if it exists in endpoint since baseURL already has it
        if (cleanEndpoint.startsWith('/api/v1/')) {
            cleanEndpoint = cleanEndpoint.replace('/api/v1', '');
        }
        
        // Ensure endpoint starts with /
        if (!cleanEndpoint.startsWith('/')) {
            cleanEndpoint = '/' + cleanEndpoint;
        }
        
        const url = this.baseURL + cleanEndpoint;
        console.log(`🌐 Full URL: ${url}`);
        
        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        // Cookie-first auth: rely on credentials include, not Authorization headers.

        const config = {
            method: 'GET',
            credentials: 'include',
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

// Enhanced product loading function with better error handling and caching
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
        // Check cache first
        const cachedProducts = sessionStorage.getItem('cached_products');
        const cacheTimestamp = parseInt(sessionStorage.getItem('products_cache_timestamp') || '0');
        const cacheAge = Date.now() - cacheTimestamp;
        
        // ==========================================================
        // == START FIX: Reduced cache time from 5 minutes to 5 seconds
        // ==========================================================
        const CACHE_MAX_AGE = 5 * 1000; // 5 seconds
        // ==========================================================
        // == END FIX
        // ==========================================================
        
        // Use cache if available and not expired
        if (cachedProducts && cacheAge < CACHE_MAX_AGE) {
            console.log('📦 Using cached products data, age:', Math.round(cacheAge/1000), 'seconds');
            // We still need to process and render the data, so parse it and continue
            const data = JSON.parse(cachedProducts);
            
            if (!data) {
                throw new Error("Cached data is invalid");
            }
            
            console.log('✅ Raw API response (from cache):', data);
            
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
                console.warn('⚠️ Unexpected API response format (from cache):', data);
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
                    image: product.image || (product.images && product.images.length > 0 ? 
                        (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : null),
                    category: typeof product.category === 'object' && product.category && product.category.name ? 
                        product.category.name : (typeof product.category === 'string' ? product.category : 'Uncategorized')
                }));
                
                window.appState.products = processedProducts;
                window.appState.allProducts = [...processedProducts];
                window.appState.filteredProducts = [...processedProducts];
                
                processedProducts.forEach(product => {
                    if (product.category && typeof product.category === 'string') {
                        window.appState.categories.add(product.category);
                    }
                });
                
                window.appState.pagination.totalItems = processedProducts.length;
                window.appState.pagination.totalPages = Math.ceil(processedProducts.length / window.appState.pagination.itemsPerPage);
            }
            
            // Render products if functions are available
            if (typeof window.renderAll === 'function') window.renderAll();
            if (typeof window.updatePagination === 'function') window.updatePagination();
            if (typeof window.updateProductCount === 'function') window.updateProductCount(products.length);

            console.log('🎉 Enhanced loadProducts (from cache) completed successfully!');
            return; // Exit function since we loaded from cache
        }
        
        console.log('📡 Cache expired or not available, fetching from API...');
        
        // Single optimized API call approach
        let response;
        let data;

        // ==========================================================
        // == START FIX: Force public fetch for /products
        // ==========================================================
        
        // The /products endpoint should ALWAYS be public and not use the auth client.
        // This ensures logged-out users can see products.
        
        console.log('📡 Using direct, public fetch for /products...');
        const headers = { 
            'Content-Type': 'application/json'
            // 'Cache-Control' line removed to prevent CORS error
        };
        
        // DO NOT add an Authorization header here. This request must be public.
        
        try {
            response = await fetch(window.APP_CONFIG.API_BASE_URL + '/products', { headers });
            if (!response.ok) {
                let errorText = response.statusText;
                try {
                    // Try to get a more specific error message from the server
                    const errorData = await response.json();
                    errorText = errorData.message || errorText;
                } catch(e) {
                    // Ignore if response is not JSON
                }
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            data = await response.json();
        } catch (fetchError) {
            console.error('❌ Direct fetch for /products failed:', fetchError);
            throw new Error(`Failed to fetch products. ${fetchError.message}`);
        }

        // ==========================================================
        // == END FIX
        // ==========================================================
        
        if (!data) {
            throw new Error('Product loading failed: No data returned from API');
        }
        
        // Cache the successful response
        try {
            sessionStorage.setItem('cached_products', JSON.stringify(data));
            sessionStorage.setItem('products_cache_timestamp', Date.now().toString());
            console.log('✅ Products cached successfully');
        } catch (e) {
            console.warn('Failed to cache products:', e);
        }
        
        console.log('✅ Raw API response (from fetch):', data);
        
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
            console.log('📋 Debug - window.appState found:', !!window.appState);
            console.log('📋 Debug - window.appState.categories type:', typeof window.appState.categories);
            const processedProducts = products.map(product => ({
                ...product,
                id: product._id || product.id,
                rating: product.averageRating || product.rating || (3.5 + Math.random() * 1.5),
                reviews: product.totalReviews || product.reviews || Math.floor(Math.random() * 500) + 10,
                originalPrice: product.originalPrice || (product.finalPrice && product.finalPrice < product.price ? product.price : product.price * 1.2),
                stock: product.stock !== undefined ? product.stock : Math.floor(Math.random() * 50) + 5,
                // Fix image URL handling
                image: product.image || (product.images && product.images.length > 0 ? 
                    (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : null),
                // Normalize category to string for consistent rendering
                category: typeof product.category === 'object' && product.category && product.category.name ? 
                    product.category.name : (typeof product.category === 'string' ? product.category : 'Uncategorized')
            }));
            
            console.log('🎨 Processed products:', processedProducts);
            
            window.appState.products = processedProducts;
            window.appState.allProducts = [...processedProducts];
            window.appState.filteredProducts = [...processedProducts];
            
            // Update categories
            processedProducts.forEach(product => {
                if (product.category && typeof product.category === 'string') {
                    window.appState.categories.add(product.category);
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
            console.log('📋 Debug - appState.filteredProducts:', window.appState.filteredProducts);
            console.log('📋 Debug - appState.products length:', window.appState.products.length);
            window.renderAll();
        } else {
            console.error('❌ renderAll function not found!');
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
        
        console.log('🎉 Enhanced loadProducts (from fetch) completed successfully!');
        
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

// Auto-trigger disabled to prevent conflicts with marketplace.html
// The marketplace.html file will call loadProducts() when ready
console.log('🔧 Auto-trigger disabled, waiting for marketplace.html to initialize...');

console.log('✅ Marketplace API patch loaded successfully!');