const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3000'
  },
  production: {
    API_BASE_URL: 'https://ecommerce-backend-8ykq.onrender.com'
  }
};

// Set this globally before this script runs if needed:
// var APP_ENV = 'development'; OR 'production'
const currentEnv = typeof APP_ENV !== 'undefined' ? APP_ENV : 'production';

const config = {
  API: {
    BASE_URL: environments[currentEnv].API_BASE_URL,
    ENDPOINTS: {
      LOGIN: "/api/users/login",
      REGISTER: "/api/users/register",
      PROFILE: "/api/users/profile",
      PRODUCTS: "/api/products"
    },
    DEFAULT_HEADERS: {
      'Content-Type': 'application/json'
    },
    TIMEOUT: 10000 // 10 seconds
  }
};

// Export for Node or build tools
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}

// Make it globally available for browser use
window.APP_CONFIG = Object.freeze(config);
window.API_URL = config.API.BASE_URL; // Optional shortcut
