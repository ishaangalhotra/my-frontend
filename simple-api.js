/**
 * Enhanced API Client with improved error handling, caching, and resilience
 * Supports both backend API calls and localStorage fallback for offline functionality
 */

// Configuration with validation
const getConfig = () => {
  const config = {
    API: {
      BASE_URL: window.APP_CONFIG?.API?.BASE_URL || 'http://localhost:3000',
      ENDPOINTS: {
        LOGIN: '/api/users/login',
        REGISTER: '/api/users/register', 
        PROFILE: '/api/users/profile',
        PRODUCTS: '/api/products',
        ORDERS: '/api/orders',
        HEALTH: '/healthcheck',
        ...window.APP_CONFIG?.API?.ENDPOINTS
      },
      DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        ...window.APP_CONFIG?.API?.DEFAULT_HEADERS
      },
      TIMEOUT: window.APP_CONFIG?.API?.TIMEOUT || 10000,
      RETRY_ATTEMPTS: window.APP_CONFIG?.API?.RETRY_ATTEMPTS || 3,
      RETRY_DELAY: window.APP_CONFIG?.API?.RETRY_DELAY || 1000
    }
  };
  
  return config;
};

// Enhanced error classes
class NetworkError extends Error {
  constructor(message, status = null, code = null) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.code = code;
  }
}

class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Utility: Enhanced fetch with timeout, retry, and better error handling
async function fetchWithRetry(resource, options = {}) {
  const config = getConfig();
  const {
    timeout = config.API.TIMEOUT,
    retries = config.API.RETRY_ATTEMPTS,
    retryDelay = config.API.RETRY_DELAY,
    ...fetchOptions
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(resource, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new NetworkError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }
      
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      
      // Don't retry on certain errors
      if (error.name === 'ValidationError' || 
          (error.status && error.status >= 400 && error.status < 500)) {
        throw error;
      }
      
      // Wait before retry (with exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

// Enhanced health check with caching
class HealthChecker {
  constructor() {
    this.lastCheck = 0;
    this.status = null;
    this.cacheDuration = 30000; // 30 seconds
  }
  
  async isBackendAvailable() {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.status !== null && (now - this.lastCheck) < this.cacheDuration) {
      return this.status;
    }
    
    try {
      const config = getConfig();
      const healthEndpoint = `${config.API.BASE_URL}${config.API.ENDPOINTS.HEALTH}`;
      
      const response = await fetchWithRetry(healthEndpoint, {
        method: 'GET',
        timeout: 3000,
        retries: 1
      });
      
      this.status = response.ok;
      this.lastCheck = now;
      return this.status;
      
    } catch (error) {
      console.warn('Health check failed:', error.message);
      this.status = false;
      this.lastCheck = now;
      return false;
    }
  }
  
  invalidateCache() {
    this.status = null;
    this.lastCheck = 0;
  }
}

// Enhanced localStorage manager with validation and compression
class StorageManager {
  constructor(prefix = 'quicklocal_') {
    this.prefix = prefix;
    this.compression = {
      enabled: true,
      threshold: 1024 // Compress if data > 1KB
    };
  }
  
  _getKey(key) {
    return `${this.prefix}${key}`;
  }
  
  _compress(data) {
    // Simple compression placeholder - in production, use a proper compression library
    return JSON.stringify(data);
  }
  
  _decompress(data) {
    return JSON.parse(data);
  }
  
  get(key) {
    try {
      const data = localStorage.getItem(this._getKey(key));
      if (!data) return null;
      
      return this._decompress(data);
    } catch (error) {
      console.warn(`Failed to retrieve ${key} from storage:`, error);
      return null;
    }
  }
  
  set(key, value) {
    try {
      const data = this._compress(value);
      localStorage.setItem(this._getKey(key), data);
      return true;
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      return false;
    }
  }
  
  remove(key) {
    try {
      localStorage.removeItem(this._getKey(key));
      return true;
    } catch (error) {
      console.warn(`Failed to remove ${key}:`, error);
      return false;
    }
  }
  
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }
}

// Sample data generator
class SampleDataGenerator {
  static products = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 5999,
      originalPrice: 7999,
      description: "Active Noise Cancellation, 30-hour battery life, Bluetooth 5.0 connectivity with premium sound quality.",
      category: "Electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      inStock: true,
      rating: 4.5,
      reviews: 156,
      tags: ["wireless", "noise-cancelling", "bluetooth"],
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: 8999,
      originalPrice: 12999,
      description: "Advanced health monitoring with heart rate, GPS tracking, and 7-day battery life.",
      category: "Wearables",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      inStock: true,
      rating: 4.3,
      reviews: 89,
      tags: ["fitness", "smartwatch", "health"],
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Organic Coffee Beans",
      price: 1299,
      originalPrice: 1599,
      description: "Premium single-origin coffee beans, ethically sourced and freshly roasted.",
      category: "Food & Beverages",
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
      inStock: true,
      rating: 4.8,
      reviews: 234,
      tags: ["organic", "coffee", "fair-trade"],
      createdAt: new Date().toISOString()
    }
  ];
  
  static initializeSampleData(storage) {
    if (!storage.get('products')) {
      storage.set('products', this.products);
    }
    
    if (!storage.get('orders')) {
      storage.set('orders', []);
    }
  }
}

// Main API Client with enhanced features
const ApiClient = (function() {
  const config = getConfig();
  const healthChecker = new HealthChecker();
  const storage = new StorageManager();

  // Event system for API status changes
  const eventHandlers = {
    'backend-available': [],
    'backend-unavailable': [],
    'fallback-mode': []
  };

  function emit(event, data) {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Validation helpers
  function validateProduct(product) {
    const required = ['name', 'price', 'description'];
    const missing = required.filter(field => !product[field]);

    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }

    if (typeof product.price !== 'number' || product.price <= 0) {
      throw new ValidationError('Price must be a positive number', 'price');
    }

    return true;
  }

  function validateOrder(order) {
    const required = ['items', 'customerInfo'];
    const missing = required.filter(field => !order[field]);

    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new ValidationError('Order must contain at least one item', 'items');
    }

    return true;
  }

  // Enhanced API methods
  async function makeApiCall(endpoint, options = {}) {
    const url = `${config.API.BASE_URL}${endpoint}`;
    const finalOptions = {
      headers: config.API.DEFAULT_HEADERS,
      ...options
    };

    return await fetchWithRetry(url, finalOptions);
  }

  return {
    // Event system
    on(event, handler) {
      if (eventHandlers[event]) {
        eventHandlers[event].push(handler);
      }
    },

    off(event, handler) {
      if (eventHandlers[event]) {
        const index = eventHandlers[event].indexOf(handler);
        if (index > -1) {
          eventHandlers[event].splice(index, 1);
        }
      }
    },

    // Initialize demo data
    async initDemo() {
      SampleDataGenerator.initializeSampleData(storage);

      // Check backend availability
      const available = await healthChecker.isBackendAvailable();
      emit(available ? 'backend-available' : 'backend-unavailable', { available });
    },

    // Health check
    async checkHealth() {
      healthChecker.invalidateCache();
      return await healthChecker.isBackendAvailable();
    },

    // Products API
    async fetchProducts(options = {}) {
      const { forceRefresh = false, category = null } = options;

      try {
        const backendAvailable = await healthChecker.isBackendAvailable();

        if (backendAvailable && !forceRefresh) {
          const response = await makeApiCall(config.API.ENDPOINTS.PRODUCTS);
          const products = await response.json();

          // Cache the results
          storage.set('products', products);

          return category ? products.filter(p => p.category === category) : products;
        }
      } catch (error) {
        console.warn('Backend fetch failed, using local storage:', error.message);
        emit('fallback-mode', { operation: 'fetchProducts', error: error.message });
      }

      // Fallback to local storage
      const products = storage.get('products') || [];
      return category ? products.filter(p => p.category === category) : products;
    },

    async addProduct(product) {
      validateProduct(product);

      // Enhance product with metadata
      const enhancedProduct = {
        ...product,
        id: product.id || Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const backendAvailable = await healthChecker.isBackendAvailable();

        if (backendAvailable) {
          const response = await makeApiCall(config.API.ENDPOINTS.PRODUCTS, {
            method: 'POST',
            body: JSON.stringify(enhancedProduct)
          });

          const result = await response.json();

          // Update local cache
          const products = storage.get('products') || [];
          products.push(result);
          storage.set('products', products);

          return result;
        }
      } catch (error) {
        console.warn('Backend addProduct failed, using local storage:', error.message);
        emit('fallback-mode', { operation: 'addProduct', error: error.message });
      }

      // Fallback to local storage
      const products = storage.get('products') || [];
      products.push(enhancedProduct);
      storage.set('products', products);

      return enhancedProduct;
    },

    // Orders API
    async submitOrder(order) {
      validateOrder(order);

      const enhancedOrder = {
        ...order,
        id: order.id || Date.now(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };

      try {
        const backendAvailable = await healthChecker.isBackendAvailable();

        if (backendAvailable) {
          const response = await makeApiCall(config.API.ENDPOINTS.ORDERS, {
            method: 'POST',
            body: JSON.stringify(enhancedOrder)
          });

          const result = await response.json();

          // Update local cache
          const orders = storage.get('orders') || [];
          orders.push(result);
          storage.set('orders', orders);

          return result;
        }
      } catch (error) {
        console.warn('Backend submitOrder failed, using local storage:', error.message);
        emit('fallback-mode', { operation: 'submitOrder', error: error.message });
      }

      // Fallback to local storage
      const orders = storage.get('orders') || [];
      orders.push(enhancedOrder);
      storage.set('orders', orders);

      return enhancedOrder;
    },

    async fetchOrders() {
      try {
        const backendAvailable = await healthChecker.isBackendAvailable();

        if (backendAvailable) {
          const response = await makeApiCall(config.API.ENDPOINTS.ORDERS);
          const orders = await response.json();

          storage.set('orders', orders);
          return orders;
        }
      } catch (error) {
        console.warn('Backend fetchOrders failed, using local storage:', error.message);
        emit('fallback-mode', { operation: 'fetchOrders', error: error.message });
      }

      return storage.get('orders') || [];
    },

    // Authentication API (backend only)
    async login(email, password) {
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const backendAvailable = await healthChecker.isBackendAvailable();
      if (!backendAvailable) {
        throw new NetworkError('Authentication requires backend connection');
      }

      const response = await makeApiCall(config.API.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      // Store auth token if provided
      if (result.token) {
        storage.set('auth_token', result.token);
        storage.set('user', result.user);
      }

      return result;
    },

    async register(userData) {
      const required = ['email', 'password', 'name'];
      const missing = required.filter(field => !userData[field]);

      if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
      }

      const backendAvailable = await healthChecker.isBackendAvailable();
      if (!backendAvailable) {
        throw new NetworkError('Registration requires backend
