/**
 * Advanced Search System - Amazon/Flipkart Style
 * Features: Autocomplete, Smart Filters, AI Suggestions, Voice Search
 */

class AdvancedSearchSystem {
  constructor() {
    this.searchInput = document.querySelector('.search-input');
    this.searchContainer = document.querySelector('.search-container');
    this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    this.recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    this.popularSearches = [
      'Fresh Vegetables', 'Groceries', 'Electronics', 'Milk & Dairy', 'Fruits',
      'Mobile Phones', 'Cleaning Supplies', 'Snacks', 'Personal Care', 'Beverages'
    ];
    
    this.filters = {
      category: [],
      priceRange: { min: 0, max: 10000 },
      rating: 0,
      deliveryTime: 'all',
      brand: [],
      inStock: false,
      discount: 0
    };
    
    this.isVoiceSearchActive = false;
    this.debounceTimer = null;
    
    this.init();
  }

  init() {
    this.checkExistingInterface();
    this.bindEvents();
    this.initializeVoiceSearch();
  }

  checkExistingInterface() {
    // Check if the advanced search structure already exists
    const existingWrapper = document.querySelector('.advanced-search-wrapper');
    
    if (!existingWrapper && this.searchContainer) {
      // Only create interface if it doesn't exist
      this.createSearchInterface();
    } else {
      console.log('🔍 Advanced search interface already exists, using existing structure');
      // Update references to use existing elements
      this.searchInput = document.querySelector('.search-input') || document.getElementById('globalSearchInput');
    }
  }

  createSearchInterface() {
    // This method is only called if the interface doesn't already exist
    const searchHTML = `
      <div class="advanced-search-wrapper">
        <div class="search-input-container">
          <input type="text" class="search-input" placeholder="Search for products, brands, and more..." autocomplete="off">
          <button class="voice-search-btn" aria-label="Voice Search">
            <i class="fas fa-microphone"></i>
          </button>
          <button class="search-btn" aria-label="Search">
            <i class="fas fa-search"></i>
          </button>
          <div class="search-loader hidden">
            <div class="spinner"></div>
          </div>
        </div>
        
        <!-- Autocomplete Dropdown -->
        <div class="autocomplete-dropdown hidden">
          <div class="search-suggestions">
            <div class="suggestion-section">
              <h4><i class="fas fa-clock"></i> Recent Searches</h4>
              <div class="recent-searches"></div>
            </div>
            <div class="suggestion-section">
              <h4><i class="fas fa-fire"></i> Popular Searches</h4>
              <div class="popular-searches"></div>
            </div>
            <div class="suggestion-section auto-suggestions">
              <h4><i class="fas fa-search"></i> Suggestions</h4>
              <div class="suggestion-results"></div>
            </div>
          </div>
        </div>
        
        <!-- Advanced Filters Panel -->
        <div class="filters-panel hidden">
          <div class="filters-header">
            <h3><i class="fas fa-filter"></i> Advanced Filters</h3>
            <button class="close-filters">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="filters-content">
            <!-- Category Filter -->
            <div class="filter-group">
              <h4>Category</h4>
              <div class="category-filters">
                <label><input type="checkbox" value="groceries"> <span>Groceries</span></label>
                <label><input type="checkbox" value="electronics"> <span>Electronics</span></label>
                <label><input type="checkbox" value="personal-care"> <span>Personal Care</span></label>
                <label><input type="checkbox" value="home-kitchen"> <span>Home & Kitchen</span></label>
                <label><input type="checkbox" value="fashion"> <span>Fashion</span></label>
                <label><input type="checkbox" value="health"> <span>Health & Wellness</span></label>
              </div>
            </div>

            <!-- Price Range Filter -->
            <div class="filter-group">
              <h4>Price Range</h4>
              <div class="price-range-container">
                <div class="price-inputs">
                  <input type="number" class="price-min" placeholder="Min" value="0">
                  <span>to</span>
                  <input type="number" class="price-max" placeholder="Max" value="10000">
                </div>
                <div class="price-slider">
                  <input type="range" class="range-min" min="0" max="10000" value="0">
                  <input type="range" class="range-max" min="0" max="10000" value="10000">
                </div>
              </div>
            </div>

            <!-- Rating Filter -->
            <div class="filter-group">
              <h4>Customer Rating</h4>
              <div class="rating-filters">
                <label><input type="radio" name="rating" value="4"> <span class="stars">★★★★☆</span> 4 & above</label>
                <label><input type="radio" name="rating" value="3"> <span class="stars">★★★☆☆</span> 3 & above</label>
                <label><input type="radio" name="rating" value="2"> <span class="stars">★★☆☆☆</span> 2 & above</label>
                <label><input type="radio" name="rating" value="0" checked> <span>All Ratings</span></label>
              </div>
            </div>

            <!-- Delivery Time Filter -->
            <div class="filter-group">
              <h4>Delivery Time</h4>
              <div class="delivery-filters">
                <label><input type="radio" name="delivery" value="20min"> <span>20 minutes</span></label>
                <label><input type="radio" name="delivery" value="1hour"> <span>Within 1 hour</span></label>
                <label><input type="radio" name="delivery" value="sameday"> <span>Same day</span></label>
                <label><input type="radio" name="delivery" value="all" checked> <span>All delivery times</span></label>
              </div>
            </div>

            <!-- Availability Filter -->
            <div class="filter-group">
              <h4>Availability</h4>
              <div class="availability-filters">
                <label><input type="checkbox" class="in-stock-filter"> <span>In Stock Only</span></label>
                <label><input type="checkbox" class="discount-filter"> <span>On Sale</span></label>
                <label><input type="checkbox" class="new-arrivals-filter"> <span>New Arrivals</span></label>
              </div>
            </div>
          </div>
          
          <div class="filters-actions">
            <button class="apply-filters-btn">Apply Filters</button>
            <button class="clear-filters-btn">Clear All</button>
          </div>
        </div>
      </div>
    `;

    // Replace existing search container
    if (this.searchContainer) {
      this.searchContainer.innerHTML = searchHTML;
    }
  }

  bindEvents() {
    // Search input events - try multiple selectors to find the right input
    this.searchInput = document.querySelector('.search-input') || document.getElementById('globalSearchInput');
    const voiceBtn = document.querySelector('.voice-search-btn');
    const searchBtn = document.querySelector('.search-btn') || document.getElementById('globalSearchBtn');
    const autocompleteDropdown = document.querySelector('.autocomplete-dropdown');
    
    // Update search container reference
    this.searchContainer = document.querySelector('.search-container') || document.querySelector('.advanced-search-wrapper');
    
    console.log('🔍 Binding events to:', {
      searchInput: this.searchInput?.id || this.searchInput?.className,
      voiceBtn: !!voiceBtn,
      searchBtn: searchBtn?.id || searchBtn?.className,
      autocompleteDropdown: !!autocompleteDropdown
    });

    // Input event with debouncing
    this.searchInput?.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleSearchInput(e.target.value);
      }, 300);
    });

    // Focus and blur events
    this.searchInput?.addEventListener('focus', () => {
      this.showAutocomplete();
    });

    document.addEventListener('click', (e) => {
      if (!this.searchContainer?.contains(e.target)) {
        this.hideAutocomplete();
      }
    });

    // Voice search
    voiceBtn?.addEventListener('click', () => {
      this.startVoiceSearch();
    });

    // Search button
    searchBtn?.addEventListener('click', () => {
      this.performSearch(this.searchInput.value);
    });

    // Enter key search
    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.performSearch(e.target.value);
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this.navigateSuggestions(e.key);
      }
    });

    // Filter events
    this.bindFilterEvents();
  }

  bindFilterEvents() {
    const filtersPanel = document.querySelector('.filters-panel');
    const applyBtn = document.querySelector('.apply-filters-btn');
    const clearBtn = document.querySelector('.clear-filters-btn');
    const closeBtn = document.querySelector('.close-filters');

    // Apply filters
    applyBtn?.addEventListener('click', () => {
      this.applyFilters();
    });

    // Clear filters
    clearBtn?.addEventListener('click', () => {
      this.clearAllFilters();
    });

    // Close filters panel
    closeBtn?.addEventListener('click', () => {
      this.hideFilters();
    });

    // Price range sliders
    const rangeMin = document.querySelector('.range-min');
    const rangeMax = document.querySelector('.range-max');
    const priceMin = document.querySelector('.price-min');
    const priceMax = document.querySelector('.price-max');

    rangeMin?.addEventListener('input', (e) => {
      priceMin.value = e.target.value;
      this.filters.priceRange.min = parseInt(e.target.value);
    });

    rangeMax?.addEventListener('input', (e) => {
      priceMax.value = e.target.value;
      this.filters.priceRange.max = parseInt(e.target.value);
    });

    priceMin?.addEventListener('input', (e) => {
      rangeMin.value = e.target.value;
      this.filters.priceRange.min = parseInt(e.target.value);
    });

    priceMax?.addEventListener('input', (e) => {
      rangeMax.value = e.target.value;
      this.filters.priceRange.max = parseInt(e.target.value);
    });
  }

  async handleSearchInput(query) {
    if (!query.trim()) {
      this.showDefaultSuggestions();
      return;
    }

    this.showSearchLoader();
    
    try {
      // Simulate API call for autocomplete suggestions
      const suggestions = await this.getAutocompleteSuggestions(query);
      this.displaySuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      this.hideSearchLoader();
    }
  }

  async getAutocompleteSuggestions(query) {
    try {
      // Get API base URL from app config
      const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || window.appState?.apiBaseUrl || 'https://quicklocal-backend.onrender.com/api/v1';
      
      // Create search URL for quick product suggestions
      const suggestionUrl = `${apiBaseUrl}/products?search=${encodeURIComponent(query)}&limit=5`;
      
      const response = await fetch(suggestionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data?.products) {
        return this.getFallbackSuggestions(query);
      }
      
      // Transform product data to suggestions format
      const suggestions = [];
      
      // Add product name suggestions
      data.data.products.forEach(product => {
        if (product.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            text: product.name,
            category: 'Products',
            count: 1
          });
        }
        
        // Add brand suggestions if available
        if (product.brand && product.brand.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            text: product.brand,
            category: 'Brands',
            count: 1
          });
        }
        
        // Add category suggestions if available
        if (product.category?.name && product.category.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            text: product.category.name,
            category: 'Categories',
            count: 1
          });
        }
      });
      
      // Remove duplicates and limit results
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text && s.category === suggestion.category)
      ).slice(0, 8);
      
      console.log('🔍 Autocomplete suggestions:', uniqueSuggestions);
      return uniqueSuggestions;
      
    } catch (error) {
      console.error('🚫 Autocomplete Error:', error);
      return this.getFallbackSuggestions(query);
    }
  }
  
  getFallbackSuggestions(query) {
    // Fallback suggestions when API fails
    const fallbackSuggestions = [
      { text: `${query} fresh`, category: 'Suggested', count: '?' },
      { text: `${query} organic`, category: 'Suggested', count: '?' },
      { text: `${query} premium`, category: 'Suggested', count: '?' },
      { text: `Best ${query}`, category: 'Suggested', count: '?' }
    ];

    return fallbackSuggestions.filter(item => 
      item.text.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }

  displaySuggestions(suggestions) {
    const suggestionsContainer = document.querySelector('.suggestion-results');
    
    if (suggestions.length === 0) {
      suggestionsContainer.innerHTML = '<div class="no-suggestions">No suggestions found</div>';
      return;
    }

    const suggestionsHTML = suggestions.map(suggestion => `
      <div class="suggestion-item" data-query="${suggestion.text}">
        <div class="suggestion-content">
          <i class="fas fa-search suggestion-icon"></i>
          <span class="suggestion-text">${this.highlightMatch(suggestion.text, this.searchInput.value)}</span>
        </div>
        <div class="suggestion-meta">
          <span class="suggestion-category">${suggestion.category}</span>
          <span class="suggestion-count">(${suggestion.count})</span>
        </div>
      </div>
    `).join('');

    suggestionsContainer.innerHTML = suggestionsHTML;

    // Bind click events to suggestions
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const query = item.dataset.query;
        this.performSearch(query);
      });
    });
  }

  showDefaultSuggestions() {
    const recentContainer = document.querySelector('.recent-searches');
    const popularContainer = document.querySelector('.popular-searches');

    // Show recent searches
    const recentHTML = this.recentSearches.slice(0, 5).map(search => `
      <div class="suggestion-item recent-item" data-query="${search}">
        <i class="fas fa-clock-rotate-left"></i>
        <span>${search}</span>
        <button class="remove-recent" data-query="${search}">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');

    recentContainer.innerHTML = recentHTML || '<div class="no-suggestions">No recent searches</div>';

    // Show popular searches
    const popularHTML = this.popularSearches.map(search => `
      <div class="suggestion-item popular-item" data-query="${search}">
        <i class="fas fa-fire"></i>
        <span>${search}</span>
      </div>
    `).join('');

    popularContainer.innerHTML = popularHTML;

    // Bind events
    document.querySelectorAll('.recent-item, .popular-item').forEach(item => {
      item.addEventListener('click', () => {
        this.performSearch(item.dataset.query);
      });
    });

    document.querySelectorAll('.remove-recent').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeRecentSearch(btn.dataset.query);
      });
    });
  }

  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  showAutocomplete() {
    const dropdown = document.querySelector('.autocomplete-dropdown');
    dropdown?.classList.remove('hidden');
    this.showDefaultSuggestions();
  }

  hideAutocomplete() {
    const dropdown = document.querySelector('.autocomplete-dropdown');
    dropdown?.classList.add('hidden');
  }

  showSearchLoader() {
    const loader = document.querySelector('.search-loader');
    loader?.classList.remove('hidden');
  }

  hideSearchLoader() {
    const loader = document.querySelector('.search-loader');
    loader?.classList.add('hidden');
  }

  async performSearch(query) {
    if (!query.trim()) return;

    // Add to search history
    this.addToSearchHistory(query);
    this.hideAutocomplete();
    
    // Update search input
    this.searchInput.value = query;

    // Show loading state
    this.showSearchResults({ loading: true });

    try {
      // Perform the actual search (replace with your API call)
      const results = await this.searchProducts(query);
      this.showSearchResults({ results, query });
      
      // Track search analytics
      this.trackSearch(query, results.length);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showSearchResults({ error: 'Search failed. Please try again.' });
    }
  }

  async searchProducts(query) {
    try {
      // Get API base URL from app config
      const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || window.appState?.apiBaseUrl || 'https://quicklocal-backend.onrender.com/api/v1';
      
      // Build search parameters
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('search', query);
      
      // Add filters if they exist
      if (this.filters.category && this.filters.category.length > 0) {
        searchParams.append('category', this.filters.category.join(','));
      }
      
      if (this.filters.priceRange.min > 0) {
        searchParams.append('minPrice', this.filters.priceRange.min);
      }
      
      if (this.filters.priceRange.max < 10000) {
        searchParams.append('maxPrice', this.filters.priceRange.max);
      }
      
      if (this.filters.inStock) {
        searchParams.append('inStock', 'true');
      }
      
      // Sort mapping
      const sortMapping = {
        'name': 'newest',
        'price_low': 'price_low',
        'price_high': 'price_high',
        'rating': 'rating',
        'popularity': 'popular'
      };
      
      const sortBy = sortMapping[this.filters.sortBy] || 'newest';
      searchParams.append('sort', sortBy);
      
      // Add pagination
      searchParams.append('page', '1');
      searchParams.append('limit', '20');
      
      const searchUrl = `${apiBaseUrl}/products?${searchParams.toString()}`;
      console.log('🔍 Advanced Search API URL:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Search failed');
      }
      
      console.log('🔍 Advanced Search Results:', data);
      
      // Transform the results to match expected format
      return {
        products: data.data.products || [],
        total: data.data.pagination?.totalProducts || 0,
        totalPages: data.data.pagination?.totalPages || 1,
        currentPage: data.data.pagination?.currentPage || 1,
        filters: this.filters
      };
      
    } catch (error) {
      console.error('🚫 Advanced Search Error:', error);
      
      // Return fallback empty results
      return {
        products: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        filters: this.filters,
        error: error.message
      };
    }
  }

  showSearchResults(data) {
    // This would integrate with your existing product display system
    // For now, we'll dispatch a custom event
    document.dispatchEvent(new CustomEvent('searchResults', {
      detail: data
    }));
  }

  addToSearchHistory(query) {
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(search => search !== query);
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Keep only last 10 searches
    this.recentSearches = this.recentSearches.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  removeRecentSearch(query) {
    this.recentSearches = this.recentSearches.filter(search => search !== query);
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    this.showDefaultSuggestions(); // Refresh the display
  }

  // Voice Search Implementation
  initializeVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Hide voice search button if not supported
      const voiceBtn = document.querySelector('.voice-search-btn');
      if (voiceBtn) voiceBtn.style.display = 'none';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
  }

  startVoiceSearch() {
    if (!this.recognition) return;

    const voiceBtn = document.querySelector('.voice-search-btn');
    
    if (this.isVoiceSearchActive) {
      this.stopVoiceSearch();
      return;
    }

    this.isVoiceSearchActive = true;
    voiceBtn.classList.add('listening');
    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';

    this.recognition.start();

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.searchInput.value = transcript;
      this.performSearch(transcript);
      this.stopVoiceSearch();
    };

    this.recognition.onerror = () => {
      this.stopVoiceSearch();
    };

    this.recognition.onend = () => {
      this.stopVoiceSearch();
    };
  }

  stopVoiceSearch() {
    this.isVoiceSearchActive = false;
    const voiceBtn = document.querySelector('.voice-search-btn');
    voiceBtn.classList.remove('listening');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // Advanced Filters
  showFilters() {
    const filtersPanel = document.querySelector('.filters-panel');
    if (filtersPanel) {
      filtersPanel.classList.remove('hidden');
      filtersPanel.style.display = 'block';
      console.log('🔍 Showing filters panel');
    }
  }

  hideFilters() {
    const filtersPanel = document.querySelector('.filters-panel');
    if (filtersPanel) {
      filtersPanel.classList.add('hidden');
      filtersPanel.style.display = 'none';
      console.log('🔍 Hiding filters panel');
    }
  }

  applyFilters() {
    // Collect all filter values
    this.collectFilterValues();
    
    // Perform filtered search
    this.performSearch(this.searchInput.value);
    
    // Hide filters panel
    this.hideFilters();
  }

  collectFilterValues() {
    // Category filters
    this.filters.category = Array.from(document.querySelectorAll('.category-filters input:checked'))
      .map(input => input.value);

    // Price range
    this.filters.priceRange = {
      min: parseInt(document.querySelector('.price-min').value) || 0,
      max: parseInt(document.querySelector('.price-max').value) || 10000
    };

    // Rating filter
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    this.filters.rating = ratingInput ? parseInt(ratingInput.value) : 0;

    // Delivery time
    const deliveryInput = document.querySelector('input[name="delivery"]:checked');
    this.filters.deliveryTime = deliveryInput ? deliveryInput.value : 'all';

    // Availability filters
    this.filters.inStock = document.querySelector('.in-stock-filter').checked;
    this.filters.discount = document.querySelector('.discount-filter').checked;
  }

  clearAllFilters() {
    // Reset all filters
    this.filters = {
      category: [],
      priceRange: { min: 0, max: 10000 },
      rating: 0,
      deliveryTime: 'all',
      brand: [],
      inStock: false,
      discount: 0
    };

    // Reset form elements
    document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(input => {
      input.checked = false;
    });

    document.querySelectorAll('.filters-panel input[type="radio"]').forEach(input => {
      if (input.value === 'all' || input.value === '0') {
        input.checked = true;
      } else {
        input.checked = false;
      }
    });

    // Reset price inputs
    document.querySelector('.price-min').value = 0;
    document.querySelector('.price-max').value = 10000;
    document.querySelector('.range-min').value = 0;
    document.querySelector('.range-max').value = 10000;

    // Refresh search results
    this.performSearch(this.searchInput.value);
  }

  trackSearch(query, resultCount) {
    // Analytics tracking (replace with your analytics service)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'search', {
        search_term: query,
        result_count: resultCount
      });
    }
  }

  // Public methods for external integration
  setSearchQuery(query) {
    if (this.searchInput) {
      this.searchInput.value = query;
    }
  }

  getActiveFilters() {
    return this.filters;
  }

  clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.hideAutocomplete();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.advancedSearch = new AdvancedSearchSystem();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedSearchSystem;
}
