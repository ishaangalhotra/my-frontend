// Determine current environment dynamically or via override
const hostname = window?.location?.hostname || '';
const currentEnv = typeof APP_ENV !== 'undefined'
  ? APP_ENV
  : hostname === 'localhost' || hostname.startsWith('127.')
    ? 'development'
    : 'production';

// Environment-specific configuration
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3000'
  },
  production: {
    API_BASE_URL: 'https://quicklocal-backend.onrender.com'
  }
};

// Ensure no trailing slash in BASE_URL for consistent endpoint joining
const sanitizeUrl = (url) => url.endsWith('/') ? url.slice(0, -1) : url;

// Core configuration
const config = {
  ENV: currentEnv,
  API: {
    BASE_URL: sanitizeUrl(environments[currentEnv].API_BASE_URL),
    ENDPOINTS: {
      LOGIN: '/api/users/login',
      REGISTER: '/api/users/register',
      PROFILE: '/api/users/profile',
      PRODUCTS: '/api/products',
      // Add more endpoints here
    },
    DEFAULT_HEADERS: {
      'Content-Type': 'application/json'
    },
    TIMEOUT: 10000 // milliseconds
  }
};

// For browser global use
window.APP_CONFIG = Object.freeze(config);
window.API_URL = config.API.BASE_URL; // Shortcut if needed

// For Node/CommonJS usage (e.g. during SSR or testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
