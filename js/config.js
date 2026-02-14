// Frontend-Optimized Configuration for QuickLocal
// Streamlined for browser environments and frontend frameworks

// Environment detection for frontend
const detectEnvironment = () => {
  if (typeof window === 'undefined') return 'development';
  
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Development indicators
  if (protocol === 'file:' ||
      hostname === '' ||
      hostname === 'localhost' || 
      hostname.startsWith('127.') || 
      hostname.startsWith('192.168.') ||
      port === '3000' || port === '5173' || port === '8080' || port === '8000') {
    return 'development';
  }
  
  // Staging indicators
  if (hostname.includes('staging') || hostname.includes('dev') || hostname.includes('test')) {
    return 'staging';
  }
  
  return 'production';
};

// Feature flags for frontend features
const featureFlags = {
  // UI Features
  DARK_MODE: { development: true, staging: true, production: true },
  NEW_DASHBOARD: { development: true, staging: true, production: false },
  ADVANCED_SEARCH: { development: true, staging: true, production: true },
  REAL_TIME_CHAT: { development: true, staging: true, production: true },
  
  // Authentication Features  
  BIOMETRIC_LOGIN: { development: true, staging: true, production: false },
  SOCIAL_LOGIN: { development: true, staging: true, production: true },
  TWO_FACTOR_AUTH: { development: true, staging: true, production: true },
  
  // Shopping Features
  WISHLIST: { development: true, staging: true, production: true },
  QUICK_CHECKOUT: { development: true, staging: true, production: true },
  PRODUCT_REVIEWS: { development: true, staging: true, production: true },
  LIVE_TRACKING: { development: true, staging: true, production: true },
  
  // Performance Features
  IMAGE_LAZY_LOADING: { development: true, staging: true, production: true },
  SERVICE_WORKER: { development: false, staging: true, production: true },
  OFFLINE_MODE: { development: false, staging: true, production: true }
};

// Environment configurations
const environments = {
  development: {
    API_BASE_URL: 'http://127.0.0.1:10000/api/v1',
    SOCKET_URL: 'http://127.0.0.1:10000',
    DEBUG: true,
    MOCK_API: false,
    API_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3
  },
  staging: {
    API_BASE_URL: '/api/v1',
    SOCKET_URL: 'https://ecommerce-backend-mlik.onrender.com',
    DEBUG: false,
    MOCK_API: false,
    API_TIMEOUT: 20000,
    RETRY_ATTEMPTS: 3
  },
  production: {
    API_BASE_URL: '/api/v1',
    SOCKET_URL: 'https://ecommerce-backend-mlik.onrender.com',
    DEBUG: false,
    MOCK_API: false,
    API_TIMEOUT: 15000,
    RETRY_ATTEMPTS: 2
  }
};

// Common configuration for all environments
const commonConfig = {
  // App Info
  APP_NAME: 'QuickLocal',
  APP_VERSION: '2.0.0',
  
  // Storage Keys
  STORAGE: {
    TOKEN_KEY: '', 
    REFRESH_TOKEN_KEY: '', 
    USER_KEY: 'quicklocal_user_data',
    CART_KEY: 'quicklocal_cart',
    PREFERENCES_KEY: 'quicklocal_preferences',
    THEME_KEY: 'quicklocal_theme',
    LANGUAGE_KEY: 'quicklocal_language',
    PREFIX: 'quicklocal_'
  },
  
  // Authentication
  AUTH: {
    TOKEN_EXPIRY: 3600, // 1 hour
    REFRESH_TOKEN_EXPIRY: 2592000, // 30 days
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900000, // 15 minutes
    PASSWORD_MIN_LENGTH: 8,
    SOCIAL_PROVIDERS: ['google', 'facebook']
  },
  
  // API Endpoints (relative to base URL)
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    
    // Users
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    
    // Products
    PRODUCTS: '/products',
    CATEGORIES: '/products/categories',
    SEARCH: '/products/search',
    
    // Orders
    ORDERS: '/orders',
    ORDER_STATUS: '/orders/status',
    
    // Cart
    CART: '/cart',
    CHECKOUT: '/cart/checkout',
    
    // Other
    NOTIFICATIONS: '/notifications',
    UPLOAD: '/upload'
  },
  
  // UI Settings
  UI: {
    THEME: {
      DEFAULT: 'light',
      AVAILABLE: ['light', 'dark', 'auto']
    },
    LANGUAGE: {
      DEFAULT: 'en',
      AVAILABLE: ['en', 'hi', 'ta', 'te']
    },
    CURRENCY: {
      SYMBOL: '₹',
      CODE: 'INR',
      DECIMAL_PLACES: 2
    },
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 20,
      MAX_PAGE_SIZE: 100
    }
  },
  
  // Business Rules
  BUSINESS: {
    MIN_ORDER_VALUE: 100,
    DELIVERY_FEE: 40,
    FREE_DELIVERY_THRESHOLD: 500,
    TAX_RATE: 0.18, // 18% GST
    DELIVERY_RADIUS: 25000, // 25km
    MAX_CART_ITEMS: 50
  },
  
  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 5242880, // 5MB
    ALLOWED_TYPES: ['jpg', 'jpeg', 'png', 'webp'],
    IMAGE_QUALITY: 0.8
  },
  
  // Validation Rules
  VALIDATION: {
    EMAIL_REGEX: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    PHONE_REGEX: /^[6-9]\d{9}$/,
    PINCODE_REGEX: /^[1-9][0-9]{5}$/
  },
  
  // Default Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Utility functions
const utils = {
  // Check if feature is enabled for current environment
  isFeatureEnabled: (featureName) => {
    const feature = featureFlags[featureName];
    if (!feature) return false;
    return feature[currentEnv] || false;
  },
  
  // Build full API URL
  getApiUrl: (endpoint = '') => {
    return `${config.API_BASE_URL}${endpoint}`;
  },
  
  // Get storage key with prefix
  getStorageKey: (key) => {
    return `${config.STORAGE.PREFIX}${key}`;
  },
  
  // Environment checks
  isDevelopment: () => currentEnv === 'development',
  isStaging: () => currentEnv === 'staging', 
  isProduction: () => currentEnv === 'production',
  
  // Format currency
  formatCurrency: (amount) => {
    return `${config.UI.CURRENCY.SYMBOL}${amount.toFixed(config.UI.CURRENCY.DECIMAL_PLACES)}`;
  },
  
  // Validate email
  validateEmail: (email) => {
    return config.VALIDATION.EMAIL_REGEX.test(email);
  },
  
  // Validate phone
  validatePhone: (phone) => {
    return config.VALIDATION.PHONE_REGEX.test(phone);
  },
  
  // Deep merge objects
  deepMerge: (target, source) => {
    const output = Object.assign({}, target);
    if (utils.isObject(target) && utils.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (utils.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = utils.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  },
  
  // Check if value is object
  isObject: (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
};

// Build configuration
const currentEnv = detectEnvironment();
const envConfig = environments[currentEnv];

// Merge common config with environment-specific config
const config = utils.deepMerge(commonConfig, envConfig);

// Add computed properties
config.ENV = currentEnv;
config.IS_DEVELOPMENT = currentEnv === 'development';
config.IS_STAGING = currentEnv === 'staging';
config.IS_PRODUCTION = currentEnv === 'production';

// Add enabled features
config.FEATURES = {};
Object.keys(featureFlags).forEach(feature => {
  config.FEATURES[feature] = utils.isFeatureEnabled(feature);
});

// Add utility methods
config.utils = utils;

// Configuration manager for runtime updates
class ConfigManager {
  constructor() {
    this.listeners = [];
  }
  
  // Get configuration value
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }
  
  // Set configuration value
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = config;
    
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    const oldValue = current[lastKey];
    current[lastKey] = value;
    
    // Notify listeners
    this.listeners.forEach(callback => {
      try {
        callback({ path, oldValue, newValue: value });
      } catch (error) {
        console.error('Config update listener error:', error);
      }
    });
    
    return true;
  }
  
  // Listen for configuration changes
  onChange(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  // Get debug info
  getDebugInfo() {
    return {
      environment: currentEnv,
      features: config.FEATURES,
      apiUrl: config.API_BASE_URL,
      debug: config.DEBUG
    };
  }
}

// Create config manager instance
const configManager = new ConfigManager();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = {
    default: config,
    APP_CONFIG: config,
    CONFIG_MANAGER: configManager,
    ...config
  };
}

// ES Module exports  
export default config;
export const APP_CONFIG = config;
export const CONFIG_MANAGER = configManager;

// Named exports for specific sections
export const {
  STORAGE: STORAGE_CONFIG,
  AUTH: AUTH_CONFIG, 
  ENDPOINTS: API_ENDPOINTS,
  UI: UI_CONFIG,
  BUSINESS: BUSINESS_CONFIG,
  FEATURES: FEATURE_FLAGS,
  utils: CONFIG_UTILS
} = config;

// Framework hooks (for React, Vue, etc.)
export const useConfig = () => config;
export const useFeature = (feature) => config.FEATURES[feature] || false;
export const useApiUrl = (endpoint) => config.utils.getApiUrl(endpoint);
export const useEnvironment = () => ({
  current: config.ENV,
  isDevelopment: config.IS_DEVELOPMENT,
  isStaging: config.IS_STAGING, 
  isProduction: config.IS_PRODUCTION
});

// Global browser exports
if (typeof window !== 'undefined') {
  window.APP_CONFIG = config;
  window.CONFIG_MANAGER = configManager;
  
  // Backward compatibility
  window.API_URL = config.API_BASE_URL;
  
  // Development helpers
  if (config.IS_DEVELOPMENT) {
    window.CONFIG_DEBUG = {
      config,
      manager: configManager,
      features: config.FEATURES,
      utils: config.utils,
      environment: currentEnv
    };
    
    console.log('🚀 QuickLocal Frontend Config Loaded');
    console.log(`📊 Environment: ${config.ENV}`);
    console.log(`🎛️ Features: ${Object.keys(config.FEATURES).filter(f => config.FEATURES[f]).length}/${Object.keys(config.FEATURES).length} enabled`);
    console.log('🔧 Debug tools: window.CONFIG_DEBUG');
  }
}

// Simple usage examples in comments:
/*
// Basic usage:
const apiUrl = APP_CONFIG.API_BASE_URL;
const isNewDashboard = APP_CONFIG.FEATURES.NEW_DASHBOARD;

// Using utilities:
const loginUrl = APP_CONFIG.utils.getApiUrl('/auth/login');
const formattedPrice = APP_CONFIG.utils.formatCurrency(299);
const isValidEmail = APP_CONFIG.utils.validateEmail('user@example.com');

// Environment checks:
if (APP_CONFIG.IS_DEVELOPMENT) {
  console.log('Development mode');
}

// Using config manager:
const unsubscribe = CONFIG_MANAGER.onChange((change) => {
  console.log('Config changed:', change);
});

// Getting nested values:
const maxFileSize = CONFIG_MANAGER.get('UPLOAD.MAX_FILE_SIZE', 5242880);

// Feature flags:
if (useFeature('DARK_MODE')) {
  // Enable dark mode
}
*/
