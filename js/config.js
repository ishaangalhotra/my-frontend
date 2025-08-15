// Environment detection
const hostname = window?.location?.hostname || '';

const currentEnv = typeof APP_ENV !== 'undefined'
  ? APP_ENV
  : (hostname === 'localhost' || hostname.startsWith('127.'))
  ? 'development'
  : 'production';

// Environment-specific configurations
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
    API_VERSION: '/api/v1',
    SOCKET_URL: 'http://localhost:3000',
    DEBUG: true
  },
  staging: {
    API_BASE_URL: 'https://staging-quicklocal-backend.onrender.com',
    API_VERSION: '/api/v1',
    SOCKET_URL: 'https://staging-quicklocal-backend.onrender.com',
    DEBUG: false
  },
  production: {
    API_BASE_URL: 'https://quicklocal-backend.onrender.com',
    API_VERSION: '/api/v1',
    SOCKET_URL: 'https://quicklocal-backend.onrender.com',
    DEBUG: false
  }
};

// URL sanitization utility
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Validate environment configuration
const validateConfig = (env) => {
  const requiredFields = ['API_BASE_URL'];
  const config = environments[env];
  
  if (!config) {
    console.error(`Environment '${env}' not found in configuration`);
    return false;
  }
  
  for (const field of requiredFields) {
    if (!config[field]) {
      console.error(`Missing required field '${field}' in ${env} environment`);
      return false;
    }
  }
  
  return true;
};

// Build configuration object
const buildConfig = () => {
  if (!validateConfig(currentEnv)) {
    throw new Error(`Invalid configuration for environment: ${currentEnv}`);
  }
  
  const envConfig = environments[currentEnv];
  
  return {
    ENV: currentEnv,
    DEBUG: envConfig.DEBUG || false,
    API: {
      BASE_URL: sanitizeUrl(envConfig.API_BASE_URL) + (envConfig.API_VERSION || ''),
      RAW_BASE_URL: sanitizeUrl(envConfig.API_BASE_URL),
      VERSION: envConfig.API_VERSION || '/api/v1',
      ENDPOINTS: {
        LOGIN: '/users/login',
        REGISTER: '/users/register',
        PROFILE: '/users/profile',
        PRODUCTS: '/products',
        REFRESH_TOKEN: '/auth/refresh',
        LOGOUT: '/auth/logout'
      },
      DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      TIMEOUT: envConfig.DEBUG ? 30000 : 10000,
      RETRY_ATTEMPTS: 3
    },
    SOCKET: {
      URL: sanitizeUrl(envConfig.SOCKET_URL),
      OPTIONS: {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      }
    },
    STORAGE: {
      TOKEN_KEY: 'quicklocal_access_token',
      REFRESH_TOKEN_KEY: 'quicklocal_refresh_token',
      USER_KEY: 'quicklocal_user_data',
      CART_KEY: 'quicklocal_cart',
      PREFIX: 'quicklocal_'
    },
    PAYMENT: {
      GATEWAY_KEY: currentEnv === 'production' ? 'rzp_live_XXXXX' : 'rzp_test_XXXXX',
      CURRENCY: 'INR',
      TIMEOUT: 300000 // 5 minutes
    },
    ASSETS: {
      BASE_URL: '/assets',
      IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
      MAX_FILE_SIZE: 5 * 1024 * 1024 // 5MB
    },
    FEATURES: {
      ENABLE_ANALYTICS: currentEnv === 'production',
      ENABLE_ERROR_REPORTING: currentEnv !== 'development',
      ENABLE_SERVICE_WORKER: currentEnv === 'production'
    }
  };
};

// Create and freeze configuration
const config = buildConfig();

// Global exports for browser
if (typeof window !== 'undefined') {
  window.APP_CONFIG = Object.freeze(config);
  window.API_URL = config.API.BASE_URL; // Backward compatibility
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}

// ES Module export
export default config;
export const APP_CONFIG = config;

// Named exports for specific sections
export const {
  API: API_CONFIG,
  STORAGE: STORAGE_CONFIG,
  PAYMENT: PAYMENT_CONFIG,
  SOCKET: SOCKET_CONFIG
} = config;
