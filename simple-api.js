/**
 * QuickLocal API Client - ERROR-FREE WORKING VERSION
 * Simple, reliable, works immediately without backend dependency
 */

class QuickLocalAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.isInitialized = true; // ✅ Always ready immediately
        this.backendAvailable = false;
        
        console.log('🚀 QuickLocal API Client initialized and ready');
        
        // Initialize sample data if localStorage is empty
        this.initSampleData();
        
        // Try backend connection in background (don't block)
        setTimeout(() => this.tryBackendConnection(), 100);
    }

    /**
     * Try to connect to backend (non-blocking)
     */
    async tryBackendConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.backendAvailable = true;
                console.log('✅ Backend connected');
            }
        } catch (error) {
            console.log('📱 Using localStorage only (backend not available)');
            this.backendAvailable = false;
        }
    }

    /**
     * Get all products from localStorage
     */
    async getProducts() {
        try {
            console.log('🔍 Loading products...');
            
            const products = JSON.parse(localStorage.getItem('ql_products') || '[]');
            console.log(`📦 Found ${products.length} products`);
            
            return { 
                success: true, 
                data: products, 
                source: 'localStorage', 
                message: `Loaded ${products.length} products` 
            };
        } catch (error) {
            console.error('❌ Error loading products:', error);
            return { 
                success: false, 
                data: [], 
                source: 'error', 
                message: error.message 
            };
        }
    }

    /**
     * Add a new product
     */
    async addProduct(productData) {
        try {
            console.log(`➕ Adding product: ${productData.name}`);

            // Validation
            if (!productData.name || !productData.category) {
                throw new Error('Product name and category are required');
            }

            if (!productData.price || parseFloat(productData.price) <= 0) {
                throw new Error('Valid price is required');
            }

            // Create product object
            const product = {
                id: 'ql_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: productData.name,
                description: productData.description || '',
                price: parseFloat(productData.price),
                category: productData.category,
                stock: parseInt(productData.stock) || 0,
                image: productData.image || this.getDefaultImage(productData.category),
                images: productData.images || [productData.image || this.getDefaultImage(productData.category)],
                status: 'active',
                sellerId: 'local_seller',
                sellerName: 'Local Seller',
                rating: 4.0,
                reviews: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('📦 Prepared product:', product);

            // Get existing products
            const existingProducts = JSON.parse(localStorage.getItem('ql_products') || '[]');
            console.log(`📋 Current products in storage: ${existingProducts.length}`);
            
            // Add new product
            existingProducts.push(product);
            localStorage.setItem('ql_products', JSON.stringify(existingProducts));
            
            console.log('✅ Product added successfully');
            console.log(`📊 Total products now: ${existingProducts.length}`);
            
            return { 
                success: true, 
                data: product, 
                source: 'localStorage',
                message: 'Product added successfully'
            };
        } catch (error) {
            console.error(`❌ Add product error: ${error.message}`);
            return { 
                success: false, 
                message: error.message, 
                error: error 
            };
        }
    }

    /**
     * Update a product
     */
    async updateProduct(productId, updateData) {
        try {
            console.log(`📝 Updating product: ${productId}`);

            const products = JSON.parse(localStorage.getItem('ql_products') || '[]');
            const index = products.findIndex(p => p.id === productId);
            
            if (index === -1) {
                throw new Error('Product not found');
            }

            // Update product
            products[index] = { 
                ...products[index], 
                ...updateData,
                id: productId,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('ql_products', JSON.stringify(products));
            
            console.log('✅ Product updated successfully');
            return { 
                success: true, 
                data: products[index], 
                source: 'localStorage',
                message: 'Product updated successfully'
            };
        } catch (error) {
            console.error(`❌ Update product error: ${error.message}`);
            return { 
                success: false, 
                message: error.message 
            };
        }
    }

    /**
     * Delete a product
     */
    async deleteProduct(productId) {
        try {
            console.log(`🗑️ Deleting product: ${productId}`);

            const products = JSON.parse(localStorage.getItem('ql_products') || '[]');
            const filteredProducts = products.filter(p => p.id !== productId);
            
            if (filteredProducts.length === products.length) {
                throw new Error('Product not found');
            }
            
            localStorage.setItem('ql_products', JSON.stringify(filteredProducts));
            
            console.log('✅ Product deleted successfully');
            return { 
                success: true, 
                source: 'localStorage',
                message: 'Product deleted successfully'
            };
        } catch (error) {
            console.error(`❌ Delete product error: ${error.message}`);
            return { 
                success: false, 
                message: error.message 
            };
        }
    }

    /**
     * Submit an order
     */
    async submitOrder(orderData) {
        try {
            console.log('💳 Submitting order...');
            
            // Generate order ID
            const orderId = 'QL' + Date.now().toString().substr(-8);
            
            // Create order object
            const order = {
                id: orderId,
                ...orderData,
                createdAt: new Date().toISOString(),
                status: orderData.paymentMethod === 'cod' ? 'pending' : 'processing'
            };
            
            // Store order
            const orders = JSON.parse(localStorage.getItem('ql_orders') || '[]');
            orders.push(order);
            localStorage.setItem('ql_orders', JSON.stringify(orders));
            
            console.log(`✅ Order created: ${orderId}`);
            
            return {
                success: true,
                orderId: orderId,
                message: 'Order placed successfully'
            };
        } catch (error) {
            console.error(`❌ Order submission error: ${error.message}`);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Get default image for category
     */
    getDefaultImage(category) {
        const defaultImages = {
            fruits: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23ff6b6b'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🍎 Fruits%3C/text%3E%3C/svg%3E",
            vegetables: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%2348bb78'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🥕 Vegetables%3C/text%3E%3C/svg%3E",
            grocery: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%234fc3f7'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🛒 Grocery%3C/text%3E%3C/svg%3E",
            electronics: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23348fe2'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E📱 Electronics%3C/text%3E%3C/svg%3E",
            clothing: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f939a2'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E👕 Clothing%3C/text%3E%3C/svg%3E",
            handicrafts: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23ff9a9e'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🎨 Handicrafts%3C/text%3E%3C/svg%3E",
            home: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%2348bb78'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🏠 Home%3C/text%3E%3C/svg%3E",
            food: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23ff6b35'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🍽️ Food%3C/text%3E%3C/svg%3E",
            books: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23795548'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E📚 Books%3C/text%3E%3C/svg%3E",
            toys: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e91e63'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🧸 Toys%3C/text%3E%3C/svg%3E",
            sports: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23ff5722'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E⚽ Sports%3C/text%3E%3C/svg%3E",
            beauty: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e91e63'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E💄 Beauty%3C/text%3E%3C/svg%3E",
            automotive: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23607d8b'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🚗 Auto%3C/text%3E%3C/svg%3E",
            health: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%234caf50'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E🏥 Health%3C/text%3E%3C/svg%3E",
            other: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%236c757d'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-family='Arial' font-size='16' font-weight='bold'%3E📦 Other%3C/text%3E%3C/svg%3E",
            default: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23e5e7eb'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='16'%3EProduct Image%3C/text%3E%3C/svg%3E"
        };
        return defaultImages[category.toLowerCase()] || defaultImages.default;
    }

    /**
     * Initialize sample data if localStorage is empty
     */
    initSampleData() {
        const existingProducts = JSON.parse(localStorage.getItem('ql_products') || '[]');
        
        if (existingProducts.length === 0) {
            console.log('📦 Initializing sample data...');
            
            const sampleProducts = [
                {
                    id: 'sample_1',
                    name: 'Fresh Organic Apples',
                    description: 'Crisp and sweet local apples, perfect for snacking',
                    price: 150,
                    category: 'fruits',
                    stock: 50,
                    image: this.getDefaultImage('fruits'),
                    images: [this.getDefaultImage('fruits')],
                    status: 'active',
                    sellerId: 'sample_seller',
                    sellerName: 'Local Farm',
                    rating: 4.5,
                    reviews: 12,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'sample_2',
                    name: 'Wireless Bluetooth Headphones',
                    description: 'High-quality wireless headphones with noise cancellation',
                    price: 2999,
                    category: 'electronics',
                    stock: 15,
                    image: this.getDefaultImage('electronics'),
                    images: [this.getDefaultImage('electronics')],
                    status: 'active',
                    sellerId: 'sample_seller',
                    sellerName: 'Tech Store',
                    rating: 4.2,
                    reviews: 8,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'sample_3',
                    name: 'Handmade Clay Pottery Set',
                    description: 'Beautiful handcrafted pottery items for home decoration',
                    price: 800,
                    category: 'handicrafts',
                    stock: 5,
                    image: this.getDefaultImage('handicrafts'),
                    images: [this.getDefaultImage('handicrafts')],
                    status: 'active',
                    sellerId: 'sample_seller',
                    sellerName: 'Artisan Shop',
                    rating: 4.8,
                    reviews: 15,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('ql_products', JSON.stringify(sampleProducts));
            console.log('✅ Sample data initialized with 3 products');
        } else {
            console.log(`📦 Found ${existingProducts.length} existing products`);
        }
    }

    // Alias methods for compatibility
    async getSellerProducts() {
        return await this.getProducts();
    }

    async getAllProducts() {
        const result = await this.getProducts();
        return {
            success: result.success,
            products: result.data,
            count: result.data.length,
            source: result.source
        };
    }
}

// Initialize immediately
console.log('🔄 Auto-initializing QuickLocal API...');
window.QuickLocalAPI = new QuickLocalAPI();

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickLocalAPI;
}