// API Configuration
const API_BASE_URL = 'https://quicklocal-backend.onrender.com/api/v1';

// Development mode flag - set to false for production
const DEV_MODE = true;

// Sample product data for development/testing
const sampleProduct = {
    id: 1,
    name: "Premium Organic Cotton T-Shirt",
    brand: "EcoWear",
    price: 999,
    originalPrice: 1499,
    discount: "33% OFF",
    rating: 4.5,
    reviewCount: 127,
    shortDescription: "Ultra-soft, breathable organic cotton t-shirt perfect for everyday wear. Made from 100% certified organic materials with eco-friendly dyes.",
    description: "<p>Experience ultimate comfort with our Premium Organic Cotton T-Shirt. Crafted from 100% GOTS-certified organic cotton, this t-shirt is not only soft on your skin but also gentle on the environment.</p><p>Features include pre-shrunk fabric, reinforced seams for durability, and a timeless fit that works for any occasion. Available in multiple colors and sizes to suit your style.</p><p>Care: Machine wash cold, tumble dry low. Iron on medium heat if needed.</p>",
    images: [
        "https://placehold.co/600x600/4CAF50/ffffff?text=Front+View",
        "https://placehold.co/600x600/2196F3/ffffff?text=Back+View",
        "https://placehold.co/600x600/FF9800/ffffff?text=Side+View",
        "https://placehold.co/600x600/9C27B0/ffffff?text=Detail+View"
    ],
    variants: [
        { type: 'size', options: ['S', 'M', 'L', 'XL'] }
    ],
    stock: 50
};

// Get URL parameters
function getProductIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || '1';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Render stars
function renderStars(rating) {
    const starsContainer = document.getElementById('product-stars');
    starsContainer.innerHTML = '';
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        if (i <= fullStars) {
            star.className = 'fas fa-star';
        } else if (i === fullStars + 1 && hasHalfStar) {
            star.className = 'fas fa-star-half-alt';
        } else {
            star.className = 'far fa-star';
        }
        starsContainer.appendChild(star);
    }
}

// Populate product UI with data
function populateProductUI(product) {
    // Use 'name' or 'title' depending on API response
    const productName = product.name || product.title;
    const productBrand = product.brand || 'Unknown Brand';
    const productRating = product.rating || 0;
    const productReviews = product.reviewCount || product.reviews || 0;
    const productImages = product.images || [];
    const productDescription = product.description || product.longDescription || '';
    const productShortDesc = product.shortDescription || product.short_description || '';
    
    // Populate basic info
    document.getElementById('product-title').textContent = productName;
    document.getElementById('product-brand').textContent = productBrand;
    document.getElementById('product-price').textContent = `₹${product.price}`;
    
    // Handle optional fields
    if (product.originalPrice && product.originalPrice > product.price) {
        document.getElementById('product-original-price').textContent = `₹${product.originalPrice}`;
        const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        document.getElementById('product-discount').textContent = `${discountPercent}% OFF`;
    } else if (product.discount) {
        document.getElementById('product-discount').textContent = product.discount;
    }
    
    document.getElementById('product-review-count').textContent = productReviews;
    document.getElementById('product-short-description').textContent = productShortDesc;
    document.getElementById('product-long-description').innerHTML = productDescription;
    
    renderStars(productRating);
    
    // Handle images
    const mainImage = document.getElementById('main-product-image');
    if (productImages.length > 0) {
        mainImage.src = productImages[0];
        mainImage.alt = productName;
        
        // Create thumbnails
        const thumbnailGallery = document.getElementById('thumbnail-gallery');
        thumbnailGallery.innerHTML = '';
        
        productImages.forEach((img, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${img}" alt="Thumbnail ${index + 1}">`;
            thumb.addEventListener('click', () => {
                mainImage.src = img;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbnailGallery.appendChild(thumb);
        });
    }
    
    // Update page title
    document.title = `${productName} - QuickLocal`;
}

// Load product from API
async function loadProduct() {
    const productId = getProductIdFromURL();
    const loadingEl = document.getElementById('productLoading');
    const contentEl = document.getElementById('productContent');

    try {
        let product;
        
        if (DEV_MODE) {
            // Development mode: use sample data with simulated delay
            await new Promise(resolve => setTimeout(resolve, 800));
            product = sampleProduct;
            console.log('DEV MODE: Using sample product data');
        } else {
            // Production mode: fetch from API
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Product not found');
                }
                throw new Error(`Failed to load product (Status: ${response.status})`);
            }
            
            const result = await response.json();
            
            // Handle different API response structures
            if (result.success && result.data) {
                product = result.data;
            } else if (result.product) {
                product = result.product;
            } else if (result.id) {
                product = result;
            } else {
                throw new Error('Invalid API response format');
            }
        }
        
        // Populate the UI with product data
        populateProductUI(product);
        
        // Hide loading, show content
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

    } catch (error) {
        console.error("Failed to load product:", error);
        // === MODIFIED FOR INTEGRATION ===
        loadingEl.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #e74c3c; margin-bottom: 20px;"></i>
                <h3 style="color: #333; margin-bottom: 10px;">Unable to Load Product</h3>
                <p style="color: #666;">${error.message}</p>
                <button onclick="window.history.back()" 
                        style="margin-top: 20px; padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    ← Back to Marketplace
                </button>
            </div>
        `;
    }
}

// Quantity controls
document.getElementById('decrease-qty').addEventListener('click', () => {
    const input = document.getElementById('quantity-input');
    const currentValue = parseInt(input.value);
    if (currentValue > 1) {
        input.value = currentValue - 1;
    }
});

document.getElementById('increase-qty').addEventListener('click', () => {
    const input = document.getElementById('quantity-input');
    const currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max);
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
    }
});

// Validate quantity input
document.getElementById('quantity-input').addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    const min = parseInt(e.target.min);
    const max = parseInt(e.target.max);
    
    if (isNaN(value) || value < min) {
        e.target.value = min;
    } else if (value > max) {
        e.target.value = max;
    }
});

// Add to cart
document.getElementById('add-to-cart-btn').addEventListener('click', async () => {
    const quantity = parseInt(document.getElementById('quantity-input').value);
    const size = document.getElementById('size-select').value;
    const productId = getProductIdFromURL();
    
    // Disable button during request
    const btn = document.getElementById('add-to-cart-btn');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    try {
        if (!DEV_MODE) {
            // Production: Make API call
            const response = await fetch(`${API_BASE_URL}/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authentication token if needed
                    // 'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity,
                    variant: { size: size }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add item to cart');
            }
            
            const result = await response.json();
            console.log('Cart update result:', result);
        }
        
        // Show success message
        showToast(`Added ${quantity} item(s) to cart (Size: ${size.toUpperCase()})`, 'success');
        
    } catch (error) {
        console.error('Cart error:', error);
        showToast('Failed to add item to cart. Please try again.', 'error');
    } finally {
        // Re-enable button
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
});

// Wishlist
document.getElementById('wishlist-btn').addEventListener('click', async () => {
    const productId = getProductIdFromURL();
    const btn = document.getElementById('wishlist-btn');
    const icon = btn.querySelector('i');
    
    try {
        if (!DEV_MODE) {
            // Production: Make API call
            const response = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authentication token if needed
                    // 'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ productId: productId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update wishlist');
            }
            
            const result = await response.json();
            const isInWishlist = result.inWishlist || result.added;
            
            // Update button state
            if (isInWishlist) {
                icon.className = 'fas fa-heart';
                btn.classList.add('in-wishlist');
                showToast('Added to wishlist!', 'success');
            } else {
                icon.className = 'far fa-heart';
                btn.classList.remove('in-wishlist');
                showToast('Removed from wishlist', 'success');
            }
        } else {
            // Development: Toggle UI only
            if (icon.classList.contains('far')) {
                icon.className = 'fas fa-heart';
                btn.classList.add('in-wishlist');
                showToast('Added to wishlist!', 'success');
            } else {
                icon.className = 'far fa-heart';
                btn.classList.remove('in-wishlist');
                showToast('Removed from wishlist', 'success');
            }
        }
        
    } catch (error) {
        console.error('Wishlist error:', error);
        showToast('Failed to update wishlist. Please try again.', 'error');
    }
});

// Scroll to top
const scrollBtn = document.getElementById('scrollToTop');
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
    } else {
        scrollBtn.classList.remove('visible');
    }
});

scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Initialize the page when DOM is fully loaded
loadProduct();