/**
 * Product Modal System - Enhanced UX for Product Details
 * Fixes the missing product detail functionality in marketplace.html
 */

const ProductModal = {
    currentProduct: null,
    isOpen: false,

    // Initialize modal system
    init() {
        this.createModal();
        this.attachEventListeners();
        console.log('✅ Product Modal System initialized');
    },

    // Create the modal HTML structure
    createModal() {
        const modalHTML = `
            <div id="productModal" class="product-modal" style="display: none;">
                <div class="modal-overlay" onclick="ProductModal.close()"></div>
                <div class="modal-container">
                    <div class="modal-header">
                        <button class="modal-close" onclick="ProductModal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-content">
                        <div class="product-gallery-section">
                            <div class="main-product-image">
                                <img id="modalProductImage" src="" alt="" />
                            </div>
                        </div>
                        <div class="product-info-section">
                            <div class="product-header">
                                <span class="product-category-badge" id="modalProductCategory"></span>
                                <h2 class="product-title" id="modalProductTitle"></h2>
                                <div class="product-rating-display">
                                    <div class="stars" id="modalProductStars"></div>
                                    <span class="rating-count" id="modalProductReviews"></span>
                                </div>
                            </div>
                            
                            <div class="product-pricing">
                                <div class="price-main" id="modalProductPrice"></div>
                                <div class="price-original" id="modalProductOriginalPrice"></div>
                                <div class="price-savings" id="modalProductSavings"></div>
                            </div>

                            <div class="product-description-section">
                                <h3>Description</h3>
                                <div class="product-full-description" id="modalProductDescription">
                                    <p>Loading product details...</p>
                                </div>
                            </div>

                            <div class="product-details-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Availability:</span>
                                    <span class="detail-value" id="modalProductStock"></span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Category:</span>
                                    <span class="detail-value" id="modalProductCategoryDetail"></span>
                                </div>
                            </div>

                            <div class="reviews-section">
                                <h3>Customer Reviews</h3>
                                <div id="modalProductReviewsList" class="reviews-list">
                                    <!-- Reviews will be loaded here -->
                                </div>
                                <button class="load-more-reviews" onclick="ProductModal.loadMoreReviews()" style="display: none;">
                                    Load More Reviews
                                </button>
                            </div>

                            <div class="modal-actions">
                                <button class="btn-add-to-cart" id="modalAddToCart" onclick="ProductModal.addToCart()">
                                    <i class="fas fa-shopping-cart"></i>
                                    Add to Cart
                                </button>
                                <button class="btn-buy-now" onclick="ProductModal.buyNow()">
                                    <i class="fas fa-bolt"></i>
                                    Buy Now
                                </button>
                                <button class="btn-wishlist" onclick="ProductModal.toggleWishlist()">
                                    <i class="far fa-heart"></i>
                                    Add to Wishlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add modal styles
        this.addModalStyles();
    },

    // Add CSS styles for the modal
    addModalStyles() {
        const styles = `
            <style id="productModalStyles">
                .product-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }

                .product-modal.show {
                    opacity: 1;
                    visibility: visible;
                }

                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(5px);
                }

                .modal-container {
                    position: relative;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    max-width: 1200px;
                    max-height: 90vh;
                    width: 90%;
                    overflow: hidden;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }

                .product-modal.show .modal-container {
                    transform: scale(1);
                }

                .modal-header {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    z-index: 10001;
                }

                .modal-close {
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                .modal-close:hover {
                    background: rgba(0, 0, 0, 0.9);
                    transform: scale(1.1);
                }

                .modal-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    height: 90vh;
                    max-height: 800px;
                    overflow: hidden;
                }

                .product-gallery-section {
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px;
                }

                .main-product-image {
                    width: 100%;
                    max-width: 500px;
                }

                .main-product-image img {
                    width: 100%;
                    height: 400px;
                    object-fit: cover;
                    border-radius: 15px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                }

                .product-info-section {
                    padding: 40px;
                    overflow-y: auto;
                    height: 100%;
                }

                .product-header {
                    margin-bottom: 30px;
                }

                .product-category-badge {
                    background: linear-gradient(135deg, var(--primary, #6366f1), var(--primary-dark, #4338ca));
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .product-title {
                    font-size: 28px;
                    font-weight: 800;
                    color: #1a1a1a;
                    margin: 15px 0 10px 0;
                    line-height: 1.3;
                }

                .product-rating-display {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .stars {
                    color: #fbbf24;
                    font-size: 16px;
                }

                .rating-count {
                    color: #666;
                    font-weight: 500;
                }

                .product-pricing {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 15px;
                    margin-bottom: 30px;
                }

                .price-main {
                    font-size: 32px;
                    font-weight: 900;
                    color: var(--primary, #6366f1);
                    margin-bottom: 8px;
                }

                .price-original {
                    font-size: 18px;
                    color: #999;
                    text-decoration: line-through;
                    margin-bottom: 5px;
                }

                .price-savings {
                    color: var(--success, #22c55e);
                    font-weight: 700;
                    font-size: 16px;
                }

                .product-description-section {
                    margin-bottom: 30px;
                }

                .product-description-section h3 {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 15px;
                    color: #1a1a1a;
                }

                .product-full-description {
                    color: #4a5568;
                    line-height: 1.6;
                    font-size: 16px;
                }

                .product-details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                }

                .detail-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                }

                .detail-label {
                    font-weight: 600;
                    color: #666;
                    display: block;
                    margin-bottom: 5px;
                }

                .detail-value {
                    font-weight: 700;
                    color: #1a1a1a;
                }

                .reviews-section {
                    margin-bottom: 30px;
                }

                .reviews-section h3 {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 15px;
                    color: #1a1a1a;
                }

                .reviews-list {
                    max-height: 200px;
                    overflow-y: auto;
                }

                .review-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 10px;
                }

                .review-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .review-author {
                    font-weight: 600;
                    color: #1a1a1a;
                }

                .review-rating {
                    color: #fbbf24;
                }

                .review-text {
                    color: #4a5568;
                    line-height: 1.5;
                }

                .modal-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    padding-top: 20px;
                    border-top: 2px solid #e2e8f0;
                }

                .modal-actions button {
                    padding: 15px 20px;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-add-to-cart {
                    background: linear-gradient(135deg, var(--primary, #6366f1), var(--primary-dark, #4338ca));
                    color: white;
                    grid-column: 1 / -1;
                }

                .btn-add-to-cart:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
                }

                .btn-buy-now {
                    background: linear-gradient(135deg, var(--secondary, #f59e0b), #d97706);
                    color: white;
                }

                .btn-buy-now:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
                }

                .btn-wishlist {
                    background: #f8f9fa;
                    color: var(--text-secondary, #475569);
                    border: 2px solid #e2e8f0;
                }

                .btn-wishlist:hover {
                    background: var(--bg-tertiary, #f1f5f9);
                    border-color: var(--primary, #6366f1);
                    color: var(--primary, #6366f1);
                }

                .load-more-reviews {
                    width: 100%;
                    background: transparent;
                    border: 2px solid var(--primary, #6366f1);
                    color: var(--primary, #6366f1);
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .load-more-reviews:hover {
                    background: var(--primary, #6366f1);
                    color: white;
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .modal-content {
                        grid-template-columns: 1fr;
                        height: 95vh;
                    }

                    .modal-container {
                        width: 95%;
                        max-height: 95vh;
                    }

                    .product-gallery-section {
                        padding: 20px;
                        min-height: 250px;
                    }

                    .main-product-image img {
                        height: 200px;
                    }

                    .product-info-section {
                        padding: 20px;
                    }

                    .product-title {
                        font-size: 24px;
                    }

                    .price-main {
                        font-size: 28px;
                    }

                    .product-details-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    },

    // Attach event listeners
    attachEventListeners() {
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    // Open modal with product details
    async open(productId) {
        const product = this.findProduct(productId);
        if (!product) {
            console.error('Product not found:', productId);
            if (window.showToast) {
                window.showToast('Product not found!', 'error');
            }
            return;
        }

        this.currentProduct = product;
        this.isOpen = true;

        // Populate modal with product data
        this.populateModal(product);

        // Show modal
        const modal = document.getElementById('productModal');
        modal.style.display = 'flex';
        
        // Trigger animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Load additional data (reviews, etc.)
        this.loadProductDetails(productId);
    },

    // Close modal
    close() {
        const modal = document.getElementById('productModal');
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.isOpen = false;
            this.currentProduct = null;
        }, 300);
    },

    // Find product in app state
    findProduct(productId) {
        if (window.appState && window.appState.products) {
            return window.appState.products.find(p => p.id === productId);
        }
        return null;
    },

    // Populate modal with product data
    populateModal(product) {
        // Basic product info
        document.getElementById('modalProductImage').src = this.getSafeImageUrl(product);
        document.getElementById('modalProductImage').alt = product.name;
        document.getElementById('modalProductCategory').textContent = product.category || '';
        document.getElementById('modalProductTitle').textContent = product.name || '';
        document.getElementById('modalProductDescription').innerHTML = `<p>${product.description || 'No description available.'}</p>`;

        // Pricing
        document.getElementById('modalProductPrice').textContent = `₹${(product.price || 0).toLocaleString()}`;
        
        if (product.originalPrice && product.originalPrice > product.price) {
            const savings = product.originalPrice - product.price;
            const savingsPercent = Math.round((savings / product.originalPrice) * 100);
            
            document.getElementById('modalProductOriginalPrice').textContent = `₹${product.originalPrice.toLocaleString()}`;
            document.getElementById('modalProductOriginalPrice').style.display = 'block';
            document.getElementById('modalProductSavings').textContent = `Save ₹${savings.toLocaleString()} (${savingsPercent}% OFF)`;
            document.getElementById('modalProductSavings').style.display = 'block';
        } else {
            document.getElementById('modalProductOriginalPrice').style.display = 'none';
            document.getElementById('modalProductSavings').style.display = 'none';
        }

        // Rating
        const stars = this.generateStars(product.rating || 0);
        document.getElementById('modalProductStars').innerHTML = stars;
        document.getElementById('modalProductReviews').textContent = `(${product.reviews || 0} reviews)`;

        // Stock status
        const stockElement = document.getElementById('modalProductStock');
        if (product.stock > 0) {
            stockElement.textContent = `${product.stock} in stock`;
            stockElement.style.color = '#22c55e';
            document.getElementById('modalAddToCart').disabled = false;
            document.getElementById('modalAddToCart').textContent = 'Add to Cart';
        } else {
            stockElement.textContent = 'Out of stock';
            stockElement.style.color = '#ef4444';
            document.getElementById('modalAddToCart').disabled = true;
            document.getElementById('modalAddToCart').textContent = 'Out of Stock';
        }

        // Category detail
        document.getElementById('modalProductCategoryDetail').textContent = product.category || 'Uncategorized';
    },

    // Load additional product details (reviews, etc.)
    async loadProductDetails(productId) {
        try {
            // Generate mock reviews for demo
            const reviews = this.generateMockReviews(productId);
            this.displayReviews(reviews);
        } catch (error) {
            console.error('Failed to load product details:', error);
            document.getElementById('modalProductReviewsList').innerHTML = '<p>Reviews temporarily unavailable.</p>';
        }
    },

    // Generate mock reviews for demonstration
    generateMockReviews(productId) {
        const reviewTemplates = [
            { author: 'Sarah K.', rating: 5, text: 'Excellent product! Great quality and fast delivery.' },
            { author: 'Mike R.', rating: 4, text: 'Very satisfied with my purchase. Would recommend!' },
            { author: 'Priya S.', rating: 5, text: 'Amazing quality and perfect packaging. Will order again.' },
            { author: 'John D.', rating: 4, text: 'Good value for money. Exactly as described.' },
            { author: 'Anita M.', rating: 5, text: 'Outstanding! Exceeded my expectations.' }
        ];

        return reviewTemplates.slice(0, Math.floor(Math.random() * 3) + 2);
    },

    // Display reviews in modal
    displayReviews(reviews) {
        const reviewsList = document.getElementById('modalProductReviewsList');
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
            return;
        }

        const reviewsHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${review.author}</span>
                    <div class="review-rating">${this.generateStars(review.rating)}</div>
                </div>
                <div class="review-text">${review.text}</div>
            </div>
        `).join('');

        reviewsList.innerHTML = reviewsHTML;
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

    // Get safe image URL
    getSafeImageUrl(product) {
        if (product.image && product.image.startsWith('http')) {
            return product.image;
        } else if (product.images && product.images.length > 0) {
            if (typeof product.images[0] === 'string') {
                return product.images[0];
            } else if (product.images[0] && product.images[0].url) {
                return product.images[0].url;
            }
        }
        
        const safeName = encodeURIComponent(product.name || 'Product').replace(/%20/g, '+');
        return `https://placehold.co/500x400/e6e6e6/666666?text=${safeName}`;
    },

    // Modal action handlers
    addToCart() {
        if (window.handleAddToCart && this.currentProduct) {
            window.handleAddToCart(this.currentProduct.id);
        }
    },

    buyNow() {
        if (this.currentProduct) {
            // Add to cart first, then redirect to checkout
            if (window.handleAddToCart) {
                window.handleAddToCart(this.currentProduct.id);
            }
            
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 500);
        }
    },

    toggleWishlist() {
        if (this.currentProduct && window.showToast) {
            window.showToast(`Added ${this.currentProduct.name} to wishlist!`, 'success');
        }
    },

    loadMoreReviews() {
        // Implementation for loading more reviews
        if (window.showToast) {
            window.showToast('Loading more reviews...', 'info');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ProductModal.init();
});

// Make it globally accessible
window.ProductModal = ProductModal;

console.log('✅ Product Modal System loaded');
