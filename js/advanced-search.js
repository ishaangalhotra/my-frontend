/**
 * Advanced Search System - Amazon/Flipkart Style
 * * This script is the "brain" for all searching and filtering.
 * It fetches results directly from the backend API and then
 * dispatches an event ('searchResults') with the new product list.
 * The main 'marketplace.html' script must listen for this event.
 */

class AdvancedSearchSystem {
  constructor() {
    this.searchInput = null; // Will be set in init
    this.searchContainer = null; // Will be set in init
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
    
    // Find the main container
    this.searchContainer = document.querySelector('.search-container') || existingWrapper;

    if (!existingWrapper && this.searchContainer) {
      // Only create interface if it doesn't exist AND we have a place to put it
      this.createSearchInterface();
    } else {
      console.log('🔍 Advanced search interface already exists, using existing structure');
    }
    
    // Update references to use existing elements
    // This is the most critical selector
    this.searchInput = document.querySelector('.search-input') || document.getElementById('globalSearchInput');
  }

  createSearchInterface() {
    // This method is only called if the interface doesn't already exist
    // and a .search-container was found.
    const searchHTML = `
      <div class="advanced-search-wrapper">
        <div class="search-input-container">
          <input type="text" class="search-input" id="globalSearchInput" placeholder="Search for products, brands, and more..." autocomplete="off">
          <button class="voice-search-btn" aria-label="Voice Search">
            <i class="fas fa-microphone"></i>
          </button>
          <button class="search-btn" id="globalSearchBtn" aria-label="Search">
            <i class="fas fa-search"></i>
          </button>
          <div class="search-loader hidden">
            <div class="spinner"></div>
          </div>
        </div>
        
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
        
        <div class="filters-panel hidden">
          <div class="filters-header">
            <h3><i class="fas fa-filter"></i> Advanced Filters</h3>
            <button class="close-filters">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="filters-content">
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

            <div class="filter-group">
              <h4>Customer Rating</h4>
              <div class="rating-filters">
                <label><input type="radio" name="rating" value="4"> <span class="stars">★★★★☆</span> 4 & above</label>
                <label><input type="radio" name="rating" value="3"> <span class="stars">★★★☆☆</span> 3 & above</label>
                <label><input type="radio" name="rating" value="2"> <span class="stars">★★☆☆☆</span> 2 & above</label>
                <label><input type="radio" name="rating" value="0" checked> <span>All Ratings</span></label>
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
    // Re-select elements after potential creation
    this.searchInput = document.querySelector('.search-input') || document.getElementById('globalSearchInput');
    const voiceBtn = document.querySelector('.voice-search-btn');
    const searchBtn = document.querySelector('.search-btn') || document.getElementById('globalSearchBtn');
    const autocompleteDropdown = document.querySelector('.autocomplete-dropdown');
    this.searchContainer = document.querySelector('.search-container') || document.querySelector('.advanced-search-wrapper');
    
    // **Robustness Check**
    if (!this.searchInput) {
      console.error('❌ AdvancedSearch: Could not find search input (#globalSearchInput). Search will not work.');
      return;
    }
    
    console.log('✅ AdvancedSearch: Binding events to:', this.searchInput.id || this.searchInput.className);

    // Input event with debouncing for suggestions
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleSearchInput(e.target.value);
      }, 300);
    });

    // Focus and blur events for suggestion dropdown
    this.searchInput.addEventListener('focus', () => {
      this.showAutocomplete();
    });

    document.addEventListener('click', (e) => {
      if (this.searchContainer && !this.searchContainer.contains(e.target)) {
        this.hideAutocomplete();
      }
    });

    // Voice search
    voiceBtn?.addEventListener('click', () => {
      this.startVoiceSearch();
    });

    // Search button click
    searchBtn?.addEventListener('click', () => {
      this.performSearch(this.searchInput.value);
    });

    // Enter key search
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.performSearch(e.target.value);
      }
      // Note: Suggestion navigation (ArrowUp/Down) can be added here
    });

    // Filter events
    this.bindFilterEvents();
  }

  bindFilterEvents() {
    // This function binds to the filter panel, if it exists
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

  // --- AUTOCOMPLETE SUGGESTIONS ---

  async handleSearchInput(query) {
    if (!query.trim()) {
      this.showDefaultSuggestions();
      return;
    }

    this.showSearchLoader();
    
    try {
      // Get autocomplete suggestions (fast, small payload)
      const suggestions = await this.getAutocompleteSuggestions(query);
      this.displaySuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      this.displaySuggestions([]); // Show no suggestions on error
    } finally {
      this.hideSearchLoader();
    }
  }

  async getAutocompleteSuggestions(query) {
    try {
      const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || window.appState?.apiBaseUrl || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
      
      // Use a dedicated suggestion endpoint if available, otherwise fallback to product search
      // Using /products?search=... is fine for this
      const suggestionUrl = `${apiBaseUrl}/products?search=${encodeURIComponent(query)}&limit=5&fields=name,brand,category`;
      
      const response = await fetch(suggestionUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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
      const added = new Set();

      data.data.products.forEach(product => {
        // Add product name suggestion
        if (product.name && !added.has(product.name)) {
          suggestions.push({ text: product.name, category: 'Products' });
          added.add(product.name);
        }
        // Add brand suggestion
        if (product.brand && !added.has(product.brand)) {
          suggestions.push({ text: product.brand, category: 'Brands' });
          added.add(product.brand);
        }
        // Add category suggestion
        if (product.category?.name && !added.has(product.category.name)) {
          suggestions.push({ text: product.category.name, category: 'Categories' });
          added.add(product.category.name);
        }
      });
      
      return suggestions.slice(0, 8);
      
    } catch (error) {
      console.error('🚫 Autocomplete Error:', error);
      return this.getFallbackSuggestions(query);
    }
  }
  
  getFallbackSuggestions(query) {
    // Fallback suggestions when API fails
    const fallback = [
      { text: query, category: 'Search' },
      { text: `${query} in Electronics`, category: 'Search' },
      { text: `Best ${query}`, category: 'Search' }
    ];
    return fallback;
  }

  displaySuggestions(suggestions) {
    const suggestionsContainer = document.querySelector('.suggestion-results');
    if (!suggestionsContainer) return;

    if (suggestions.length === 0) {
      suggestionsContainer.innerHTML = `<div class="suggestion-item" data-query="${this.searchInput.value}">
        <i class="fas fa-search suggestion-icon"></i>
        <span class="suggestion-text">Search for "${this.highlightMatch(this.searchInput.value, this.searchInput.value)}"</span>
      </div>`;
    } else {
        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" data-query="${suggestion.text}">
          <div class="suggestion-content">
            <i class="fas ${suggestion.category === 'Products' ? 'fa-box' : suggestion.category === 'Brands' ? 'fa-star' : 'fa-tag'} suggestion-icon"></i>
            <span class="suggestion-text">${this.highlightMatch(suggestion.text, this.searchInput.value)}</span>
          </div>
          <div class="suggestion-meta">
            <span class="suggestion-category">${suggestion.category}</span>
          </div>
        </div>
      `).join('');
    }

    // Bind click events to new suggestions
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const query = item.dataset.query;
        this.performSearch(query);
      });
    });
  }

  showDefaultSuggestions() {
    // Shows Recent & Popular Searches
    const recentContainer = document.querySelector('.recent-searches');
    const popularContainer = document.querySelector('.popular-searches');

    if (recentContainer) {
      const recentHTML = this.recentSearches.slice(0, 5).map(search => `
        <div class="suggestion-item recent-item" data-query="${search}">
          <i class="fas fa-clock-rotate-left"></i>
          <span>${search}</span>
          <button class="remove-recent" data-query="${search}"><i class="fas fa-times"></i></button>
        </div>
      `).join('');
      recentContainer.innerHTML = recentHTML || '<div class="no-suggestions">No recent searches</div>';
    }

    if (popularContainer) {
      const popularHTML = this.popularSearches.map(search => `
        <div class="suggestion-item popular-item" data-query="${search}">
          <i class="fas fa-fire"></i>
          <span>${search}</span>
        </div>
      `).join('');
      popularContainer.innerHTML = popularHTML;
    }

    // Bind events for these items
    document.querySelectorAll('.recent-item, .popular-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.remove-recent')) return; // Don't search if removing
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
    const regex = new RegExp(`(${query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  // --- ACTUAL SEARCH (PERFORMED ON CLICK/ENTER) ---

  async performSearch(query) {
    if (!query.trim()) {
      // If search is cleared, perform an empty search to show all products
      console.log('Performing empty search...');
    }

    this.addToSearchHistory(query);
    this.hideAutocomplete();
    
    // Update search input
    if (this.searchInput) {
        this.searchInput.value = query;
    }

    // Show loading state
    this.showSearchResults({ loading: true, query: query });

    try {
      // Perform the actual backend search
      const results = await this.searchProducts(query);
      
      // Hand off the results to the main page
      this.showSearchResults({ results, query });
      
      // Track search analytics
      this.trackSearch(query, results.total);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showSearchResults({ error: 'Search failed. Please try again.', query: query });
    }
  }

  async searchProducts(query) {
    try {
      const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL || window.appState?.apiBaseUrl || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
      
      // Build search parameters
      const searchParams = new URLSearchParams();
      
      // Add the search query
      if (query) {
        searchParams.append('search', query);
      }
      
      // **CRITICAL: Add all active filters**
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
      if (this.filters.rating > 0) {
        searchParams.append('minRating', this.filters.rating);
      }
      
      // Add pagination
      searchParams.append('page', '1'); // Always fetch page 1 for a new search
      searchParams.append('limit', '50'); // Fetch a larger set; main page will handle pagination
      
      const searchUrl = `${apiBaseUrl}/products?${searchParams.toString()}`;
      console.log('🚀 AdvancedSearch: Performing backend search:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Search failed');
      }
      
      console.log('✅ AdvancedSearch: Results received:', data.data);
      
      // Transform the results to the format expected by the 'searchResults' event
      return {
        products: data.data.products || [],
        total: data.data.pagination?.totalProducts || 0,
        totalPages: data.data.pagination?.totalPages || 1,
        currentPage: data.data.pagination?.currentPage || 1,
        filters: this.filters // Pass back the filters that were used
      };
      
    } catch (error) {
      console.error('🚫 AdvancedSearch: searchProducts Error:', error);
      
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
    // **THIS IS THE MOST IMPORTANT PART**
    // This script does not render products itself.
    // It dispatches a custom event that 'marketplace.html' (or any other page)
    // must listen for to receive the search results.
    
    console.log('📢 AdvancedSearch: Dispatching "searchResults" event', data);
    document.dispatchEvent(new CustomEvent('searchResults', {
      detail: data
    }));
  }

  // --- UI & HISTORY HELPERS ---

  addToSearchHistory(query) {
    if (!query) return;
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(search => search.toLowerCase() !== query.toLowerCase());
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
  
  // --- VOICE SEARCH ---
  
  initializeVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const voiceBtn = document.querySelector('.voice-search-btn');
      if (voiceBtn) voiceBtn.style.display = 'none';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.searchInput.value = transcript;
      this.performSearch(transcript);
      this.stopVoiceSearch();
    };

    this.recognition.onerror = () => this.stopVoiceSearch();
    this.recognition.onend = () => this.stopVoiceSearch();
  }

  startVoiceSearch() {
    if (!this.recognition) return;
    const voiceBtn = document.querySelector('.voice-search-btn');
    if (!voiceBtn) return;

    if (this.isVoiceSearchActive) {
      this.stopVoiceSearch();
      return;
    }

    this.isVoiceSearchActive = true;
    voiceBtn.classList.add('listening');
    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
    this.recognition.start();
  }

  stopVoiceSearch() {
    this.isVoiceSearchActive = false;
    const voiceBtn = document.querySelector('.voice-search-btn');
    if (voiceBtn) {
      voiceBtn.classList.remove('listening');
      voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // --- ADVANCED FILTERS PANEL ---
  
  showFilters() {
    const filtersPanel = document.querySelector('.filters-panel');
    if (filtersPanel) {
      filtersPanel.classList.remove('hidden');
      filtersPanel.style.display = 'block';
    }
  }

  hideFilters() {
    const filtersPanel = document.querySelector('.filters-panel');
    if (filtersPanel) {
      filtersPanel.classList.add('hidden');
      filtersPanel.style.display = 'none';
    }
  }

  applyFilters() {
    // 1. Collect all filter values from the panel
    this.collectFilterValues();
    
    // 2. Re-run the current search query with the new filters
    this.performSearch(this.searchInput.value);
    
    // 3. Hide filters panel
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

    // Availability filters
    this.filters.inStock = document.querySelector('.in-stock-filter')?.checked || false;
    this.filters.discount = document.querySelector('.discount-filter')?.checked || false;
    
    console.log('New filters collected:', this.filters);
  }

  clearAllFilters() {
    // Reset filters object
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
    document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(input => input.checked = false);
    document.querySelectorAll('.filters-panel input[type="radio"]').forEach(input => {
      input.checked = (input.value === 'all' || input.value === '0');
    });

    // Reset price inputs
    const priceMin = document.querySelector('.price-min');
    const priceMax = document.querySelector('.price-max');
    const rangeMin = document.querySelector('.range-min');
    const rangeMax = document.querySelector('.range-max');
    
    if(priceMin) priceMin.value = 0;
    if(priceMax) priceMax.value = 10000;
    if(rangeMin) rangeMin.value = 0;
    if(rangeMax) rangeMax.value = 10000;

    // Refresh search results (perform an empty search with no filters)
    this.performSearch(this.searchInput.value);
  }

  trackSearch(query, resultCount) {
    // Analytics tracking (e.g., Google Analytics)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'search', {
        search_term: query,
        result_count: resultCount
      });
    }
    console.log(`Analytics: Search for "${query}" returned ${resultCount} results.`);
  }

  // --- PUBLIC API (for other scripts) ---
  
  setSearchQuery(query) {
    if (this.searchInput) {
      this.searchInput.value = query;
    }
  }

  getActiveFilters() {
    return this.filters;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.advancedSearch = new AdvancedSearchSystem();
});