/**
 * Cache Manager
 * Provides centralized caching strategies for API responses and assets
 */

class CacheManager {
  constructor(options = {}) {
    this.options = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes in milliseconds
      storageType: 'sessionStorage', // 'localStorage' or 'sessionStorage'
      cacheKeyPrefix: 'ql_cache_',
      ...options
    };
  }

  /**
   * Set an item in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setItem(key, value, ttl = this.options.defaultTTL) {
    const cacheKey = this.options.cacheKeyPrefix + key;
    const item = {
      value,
      expiry: Date.now() + ttl,
    };

    try {
      window[this.options.storageType].setItem(cacheKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.warn('Cache write failed:', error);
      this.clearOldItems(); // Try to free up space
      return false;
    }
  }

  /**
   * Get an item from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  getItem(key) {
    const cacheKey = this.options.cacheKeyPrefix + key;
    
    try {
      const itemStr = window[this.options.storageType].getItem(cacheKey);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      
      // Check if the item has expired
      if (Date.now() > item.expiry) {
        window[this.options.storageType].removeItem(cacheKey);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.warn('Cache read failed:', error);
      return null;
    }
  }

  /**
   * Remove an item from cache
   * @param {string} key - Cache key
   */
  removeItem(key) {
    const cacheKey = this.options.cacheKeyPrefix + key;
    window[this.options.storageType].removeItem(cacheKey);
  }

  /**
   * Clear all cached items
   */
  clearCache() {
    const keysToRemove = [];
    
    for (let i = 0; i < window[this.options.storageType].length; i++) {
      const key = window[this.options.storageType].key(i);
      if (key.startsWith(this.options.cacheKeyPrefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      window[this.options.storageType].removeItem(key);
    });
  }

  /**
   * Clear expired items to free up storage space
   */
  clearOldItems() {
    const now = Date.now();
    const keysToRemove = [];
    
    for (let i = 0; i < window[this.options.storageType].length; i++) {
      const key = window[this.options.storageType].key(i);
      if (key.startsWith(this.options.cacheKeyPrefix)) {
        try {
          const itemStr = window[this.options.storageType].getItem(key);
          const item = JSON.parse(itemStr);
          if (now > item.expiry) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // If we can't parse it, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      window[this.options.storageType].removeItem(key);
    });
    
    return keysToRemove.length; // Return number of items cleared
  }

  /**
   * Wrap a fetch request with caching
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} ttl - Cache TTL in milliseconds
   * @returns {Promise<any>} - Response data
   */
  async cachedFetch(url, options = {}, ttl = this.options.defaultTTL) {
    // Create a cache key from the URL and options
    const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
    
    // Try to get from cache first
    const cachedResponse = this.getItem(cacheKey);
    if (cachedResponse) {
      return Promise.resolve(cachedResponse);
    }
    
    // If not in cache, make the request
    try {
      // Add cache control headers if not present
      if (!options.headers) options.headers = {};
      if (!options.headers['Cache-Control']) {
        options.headers['Cache-Control'] = 'max-age=300'; // 5 minutes
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Clone the response before consuming it
      const clone = response.clone();
      const data = await response.json();
      
      // Cache the successful response
      this.setItem(cacheKey, data, ttl);
      
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
}

// Create global instance
window.cacheManager = new CacheManager();

// Export for module usage
export default window.cacheManager;