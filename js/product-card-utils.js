/**
 * Product Card Utilities - Fallback implementation
 * Minimal utilities to avoid 404 errors and provide basic functionality
 */

const productCardUtils = {
    // Generate a basic product card
    generateProductCard(product) {
        const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        const stars = this.generateStars(product.averageRating || product.rating || 0);
        const finalPrice = product.finalPrice || product.price;
        const originalPrice = product.originalPrice;
        
        return `
            <div class="product-card enhanced-card" data-product-id="${product.id}" 
                 onclick="productCardUtils.viewProduct('${product.id}')" 
                 style="cursor: pointer;">
                <div class="product-image-container">
                    <img loading="lazy" 
                         src="${product.primaryImage?.url || product.image || 'https://placehold.co/300x200?text=' + encodeURIComponent(product.name)}"
                         alt="${this.escapeHtml(product.name)}" 
                         class="product-image"
                         onerror="this.src='https://placehold.co/300x200?text=No+Image';"
                    ${discount > 0 ? `<div class="product-badge">${discount}% OFF</div>` : ''}
                    ${product.isNewArrival ? '<div class="product-badge new">NEW</div>' : ''}
                    ${product.isFeatured ? '<div class="product-badge featured">FEATURED</div>' : ''}
                </div>
                <div class="product-content">
                    <div class="product-category">${this.escapeHtml(product.category?.name || product.category || '')}</div>
                    <h3 class="product-name" title="${this.escapeHtml(product.name)}">${this.escapeHtml(product.name)}</h3>
                    <p class="product-description">${this.escapeHtml(product.description || '')}</p>
                    
                    <div class="product-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-text">(${product.totalReviews || product.reviews || 0})</span>
                    </div>
                    
                    <div class="product-price">
                        <span class="price-current">₹${finalPrice?.toLocaleString() || 0}</span>
                        ${originalPrice && originalPrice > finalPrice ? 
                            `<span class="price-original">₹${originalPrice.toLocaleString()}</span>` : ''}
                        ${discount > 0 ? `<span class="price-discount">${discount}% OFF</span>` : ''}
                    </div>
                    
                    ${product.deliveryConfig?.isLocalDeliveryEnabled ? `
                        <div class="delivery-info">
                            <small>🚚 Free delivery ${product.deliveryConfig.freeDeliveryThreshold ? 'above ₹' + product.deliveryConfig.freeDeliveryThreshold : ''}</small>
                        </div>
                    ` : ''}
                    
                    <div class="product-actions">
                        <button class="action-btn btn-primary add-to-cart" 
                                onclick="event.stopPropagation(); productCardUtils.addToCart('${product.id}')" 
                                ${!product.isInStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> 
                            ${!product.isInStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        
                        <button class="action-btn btn-secondary quick-view" 
                                onclick="event.stopPropagation(); productCardUtils.quickView('${product.id}')"
                                title="Quick view">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <button class="action-btn btn-secondary wishlist-btn" 
                                onclick="event.stopPropagation(); productCardUtils.toggleWishlist('${product.id}')"
                                title="Add to wishlist">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Generate star rating HTML
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
        if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
        
        return stars;
    },
    
    // ✅ CORRECTED FUNCTION: Escape HTML to prevent XSS and handle all data types
    escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') {
            return '';
        }
        
        const str = String(unsafe);
        
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    // Attach event listeners for variant selection and card navigation
    attachVariantListeners() {
        // Variant selection listeners
        document.querySelectorAll('.variant-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                const productId = productCard?.dataset.productId;
                const variant = e.target.dataset.variant;
                
                if (productId && variant) {
                    this.selectVariant(productId, variant);
                }
            });
        });
        
        // Enhanced product card click listeners (fallback for missing onclick handlers)
        document.querySelectorAll('.product-card.enhanced-card:not(.clickable-attached)').forEach(card => {
            card.classList.add('clickable-attached');
            
            // Only attach if no onclick handler exists
            if (!card.onclick) {
                card.addEventListener('click', (e) => {
                    // Don't trigger if clicking on buttons or interactive elements
                    if (e.target.closest('.product-actions, .action-btn, button')) {
                        return;
                    }
                    
                    const productId = card.dataset.productId;
                    if (productId) {
                        this.viewProduct(productId);
                    }
                });
                
                card.style.cursor = 'pointer';
            }
        });
        
        console.log('✅ Product card variant listeners attached');
    },
    
    // Select product variant
    selectVariant(productId, variant) {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        // Update active variant
        productCard.querySelectorAll('.variant-option').forEach(opt => {
            opt.classList.remove('active');
        });
        
        productCard.querySelector(`[data-variant="${variant}"]`)?.classList.add('active');
        
        console.log(`Variant selected: ${variant} for product ${productId}`);
    },
    
    // Add to cart functionality
    addToCart(productId) {
        if (window.handleAddToCart) {
            window.handleAddToCart(productId);
        } else {
            console.log(`Add to cart: ${productId}`);
            // Fallback notification
            if (window.showToast) {
                window.showToast(`Added product ${productId} to cart`, 'success');
            }
        }
    },
    
    // Quick view functionality
    quickView(productId) {
        if (window.handleCardClick) {
            window.handleCardClick(productId);
        } else {
            console.log(`Quick view: ${productId}`);
            // Fallback notification
            if (window.showToast) {
                window.showToast(`Opening quick view for ${productId}`, 'info');
            }
        }
    },
    
    // View full product details
    viewProduct(productId) {
        if (window.handleCardClick) {
            window.handleCardClick(productId);
        } else {
            // Navigate to product detail page
            window.location.href = `product-detail.html?id=${productId}`;
        }
    },
    
    // Toggle wishlist
    toggleWishlist(productId) {
        const button = document.querySelector(`[data-product-id="${productId}"] .wishlist-btn i`);
        
        if (button) {
            const isActive = button.classList.contains('fas');
            
            if (isActive) {
                button.classList.remove('fas');
                button.classList.add('far');
                if (window.showToast) {
                    window.showToast('Removed from wishlist', 'info');
                }
            } else {
                button.classList.remove('far');
                button.classList.add('fas');
                if (window.showToast) {
                    window.showToast('Added to wishlist', 'success');
                }
            }
        }
        
        console.log(`Toggle wishlist: ${productId}`);
    },
    
    // Apply loading state to product card
    setLoadingState(productId, loading = true) {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        if (loading) {
            productCard.classList.add('loading');
            productCard.style.pointerEvents = 'none';
        } else {
            productCard.classList.remove('loading');
            productCard.style.pointerEvents = 'auto';
        }
    },
    
    // Update product card data
    updateProductCard(productId, newData) {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        // Update price if provided
        if (newData.price) {
            const priceElement = productCard.querySelector('.price-current');
            if (priceElement) {
                priceElement.textContent = `₹${newData.price.toLocaleString()}`;
            }
        }
        
        // Update stock status
        if (newData.hasOwnProperty('isInStock')) {
            const addToCartBtn = productCard.querySelector('.add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.disabled = !newData.isInStock;
                addToCartBtn.innerHTML = newData.isInStock ? 
                    '<i class="fas fa-shopping-cart"></i> Add to Cart' : 
                    'Out of Stock';
            }
        }
        
        console.log(`Updated product card: ${productId}`, newData);
    }
};

// Make globally available
window.productCardUtils = productCardUtils;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Product Card Utils (Fallback) loaded');
    
    // Auto-attach listeners after a short delay
    setTimeout(() => {
        productCardUtils.attachVariantListeners();
    }, 1000);
});