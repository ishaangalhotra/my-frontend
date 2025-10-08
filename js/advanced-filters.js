/**
 * Advanced Product Filtering System
 * Implements multi-criteria filtering like Flipkart/Amazon
 */

class AdvancedProductFilter {
    constructor(containerId) {
        this.containerId = containerId;
        this.filters = {
            priceRange: { min: 0, max: Infinity },
            brands: new Set(),
            ratings: 0,
            categories: new Set(),
            availability: 'all',
            discount: 0,
            features: new Set()
        };
        this.originalProducts = [];
        this.filteredProducts = [];
        this.sortOption = 'relevance';
        
        this.init();
    }

    init() {
        this.createFilterUI();
        this.bindEvents();
    }

    createFilterUI() {
        const filterHTML = `
            <div class="advanced-filters">
                <div class="filter-header">
                    <h3>Filters</h3>
                    <button class="clear-all-filters">Clear All</button>
                </div>
                
                <!-- Price Filter -->
                <div class="filter-section">
                    <h4>Price Range</h4>
                    <div class="price-slider">
                        <input type="range" id="minPrice" min="0" max="100000" value="0">
                        <input type="range" id="maxPrice" min="0" max="100000" value="100000">
                        <div class="price-values">
                            <span id="minPriceValue">₹0</span> - 
                            <span id="maxPriceValue">₹100000+</span>
                        </div>
                    </div>
                </div>

                <!-- Brand Filter -->
                <div class="filter-section">
                    <h4>Brands</h4>
                    <div class="brand-search">
                        <input type="text" placeholder="Search brands..." id="brandSearch">
                    </div>
                    <div class="checkbox-list" id="brandList">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- Rating Filter -->
                <div class="filter-section">
                    <h4>Customer Ratings</h4>
                    <div class="rating-filter">
                        <label><input type="radio" name="rating" value="4"> 4⭐ & above</label>
                        <label><input type="radio" name="rating" value="3"> 3⭐ & above</label>
                        <label><input type="radio" name="rating" value="2"> 2⭐ & above</label>
                        <label><input type="radio" name="rating" value="1"> 1⭐ & above</label>
                    </div>
                </div>

                <!-- Discount Filter -->
                <div class="filter-section">
                    <h4>Discount</h4>
                    <div class="discount-filter">
                        <label><input type="checkbox" value="10"> 10% or more</label>
                        <label><input type="checkbox" value="25"> 25% or more</label>
                        <label><input type="checkbox" value="50"> 50% or more</label>
                        <label><input type="checkbox" value="70"> 70% or more</label>
                    </div>
                </div>

                <!-- Availability Filter -->
                <div class="filter-section">
                    <h4>Availability</h4>
                    <div class="availability-filter">
                        <label><input type="radio" name="availability" value="all" checked> All</label>
                        <label><input type="radio" name="availability" value="instock"> In Stock</label>
                        <label><input type="radio" name="availability" value="outofstock"> Out of Stock</label>
                    </div>
                </div>
            </div>
        `;

        // Insert filter UI into container
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = filterHTML + container.innerHTML;
        }
    }

    bindEvents() {
        // Price range sliders
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        
        if (minPrice && maxPrice) {
            minPrice.addEventListener('input', () => this.updatePriceFilter());
            maxPrice.addEventListener('input', () => this.updatePriceFilter());
        }

        // Brand checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.closest('.brand-checkbox')) {
                this.updateBrandFilter();
            }
        });

        // Rating filter
        document.addEventListener('change', (e) => {
            if (e.target.name === 'rating') {
                this.updateRatingFilter(parseFloat(e.target.value));
            }
        });

        // Clear all filters
        const clearBtn = document.querySelector('.clear-all-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    updatePriceFilter() {
        const minPrice = document.getElementById('minPrice').value;
        const maxPrice = document.getElementById('maxPrice').value;
        
        this.filters.priceRange = {
            min: parseInt(minPrice),
            max: parseInt(maxPrice)
        };
        
        // Update display
        document.getElementById('minPriceValue').textContent = `₹${minPrice}`;
        document.getElementById('maxPriceValue').textContent = `₹${maxPrice}`;
        
        this.applyFilters();
    }

    updateBrandFilter() {
        const brandCheckboxes = document.querySelectorAll('.brand-checkbox:checked');
        this.filters.brands = new Set(Array.from(brandCheckboxes).map(cb => cb.value));
        this.applyFilters();
    }

    updateRatingFilter(rating) {
        this.filters.ratings = rating;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredProducts = this.originalProducts.filter(product => {
            return this.matchesPriceRange(product) &&
                   this.matchesBrands(product) &&
                   this.matchesRating(product) &&
                   this.matchesAvailability(product) &&
                   this.matchesDiscount(product);
        });

        this.renderProducts();
        this.updateFilterCount();
    }

    matchesPriceRange(product) {
        const price = parseFloat(product.price) || 0;
        return price >= this.filters.priceRange.min && 
               price <= this.filters.priceRange.max;
    }

    matchesBrands(product) {
        if (this.filters.brands.size === 0) return true;
        return this.filters.brands.has(product.brand);
    }

    matchesRating(product) {
        if (this.filters.ratings === 0) return true;
        return (parseFloat(product.rating) || 0) >= this.filters.ratings;
    }

    matchesAvailability(product) {
        if (this.filters.availability === 'all') return true;
        if (this.filters.availability === 'instock') return product.inStock;
        if (this.filters.availability === 'outofstock') return !product.inStock;
        return true;
    }

    matchesDiscount(product) {
        if (this.filters.discount === 0) return true;
        const discount = this.calculateDiscount(product);
        return discount >= this.filters.discount;
    }

    calculateDiscount(product) {
        if (!product.originalPrice || !product.price) return 0;
        return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }

    populateBrands(products) {
        const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
        const brandList = document.getElementById('brandList');
        
        if (brandList) {
            brandList.innerHTML = brands.map(brand => `
                <label>
                    <input type="checkbox" class="brand-checkbox" value="${brand}">
                    ${brand}
                </label>
            `).join('');
        }
    }

    setProducts(products) {
        this.originalProducts = products;
        this.filteredProducts = [...products];
        this.populateBrands(products);
        this.renderProducts();
    }

    renderProducts() {
        // This method should be implemented based on your product display logic
        if (window.quickLocalMarketplace && window.quickLocalMarketplace.renderProducts) {
            window.quickLocalMarketplace.renderProducts(this.filteredProducts);
        }
        
        // Update result count
        this.updateResultCount();
    }

    updateResultCount() {
        const countElement = document.querySelector('.results-count');
        if (countElement) {
            countElement.textContent = `${this.filteredProducts.length} of ${this.originalProducts.length} products`;
        }
    }

    updateFilterCount() {
        const activeFilters = this.getActiveFilterCount();
        const filterBadge = document.querySelector('.filter-badge');
        
        if (filterBadge) {
            if (activeFilters > 0) {
                filterBadge.textContent = activeFilters;
                filterBadge.style.display = 'inline-block';
            } else {
                filterBadge.style.display = 'none';
            }
        }
    }

    getActiveFilterCount() {
        let count = 0;
        
        if (this.filters.priceRange.min > 0 || this.filters.priceRange.max < 100000) count++;
        if (this.filters.brands.size > 0) count++;
        if (this.filters.ratings > 0) count++;
        if (this.filters.availability !== 'all') count++;
        if (this.filters.discount > 0) count++;
        
        return count;
    }

    clearAllFilters() {
        // Reset all filters
        this.filters = {
            priceRange: { min: 0, max: Infinity },
            brands: new Set(),
            ratings: 0,
            categories: new Set(),
            availability: 'all',
            discount: 0,
            features: new Set()
        };

        // Reset UI
        document.getElementById('minPrice').value = 0;
        document.getElementById('maxPrice').value = 100000;
        document.querySelectorAll('.brand-checkbox:checked').forEach(cb => cb.checked = false);
        document.querySelectorAll('input[name="rating"]:checked').forEach(r => r.checked = false);
        document.querySelector('input[name="availability"][value="all"]').checked = true;

        this.applyFilters();
    }

    // Sort functionality
    sortProducts(option) {
        this.sortOption = option;
        
        switch (option) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
                break;
            case 'discount':
                this.filteredProducts.sort((a, b) => {
                    const discountA = this.calculateDiscount(a);
                    const discountB = this.calculateDiscount(b);
                    return discountB - discountA;
                });
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            default:
                // Keep original relevance order
                break;
        }
        
        this.renderProducts();
    }
}

// CSS for styling
const filterStyles = `
    .advanced-filters {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }

    .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }

    .filter-section {
        margin-bottom: 24px;
    }

    .filter-section h4 {
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: #333;
    }

    .price-slider {
        position: relative;
    }

    .price-slider input[type="range"] {
        width: 100%;
        margin: 8px 0;
    }

    .price-values {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
    }

    .checkbox-list {
        max-height: 200px;
        overflow-y: auto;
    }

    .checkbox-list label {
        display: block;
        padding: 6px 0;
        font-size: 14px;
        cursor: pointer;
    }

    .checkbox-list input[type="checkbox"] {
        margin-right: 8px;
    }

    .rating-filter label,
    .discount-filter label,
    .availability-filter label {
        display: block;
        padding: 4px 0;
        font-size: 14px;
        cursor: pointer;
    }

    .clear-all-filters {
        background: none;
        border: none;
        color: #2874f0;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
    }

    .clear-all-filters:hover {
        text-decoration: underline;
    }

    .results-count {
        margin: 10px 0;
        font-size: 14px;
        color: #666;
    }

    .filter-badge {
        background: #ff6b6b;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 10px;
        margin-left: 4px;
    }

    @media (max-width: 768px) {
        .advanced-filters {
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .checkbox-list {
            max-height: 150px;
        }
    }
`;

// Add styles to page
if (!document.querySelector('#advanced-filter-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'advanced-filter-styles';
    styleSheet.textContent = filterStyles;
    document.head.appendChild(styleSheet);
}

// Export for use
window.AdvancedProductFilter = AdvancedProductFilter;
