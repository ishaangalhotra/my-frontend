/**
 * Application Configuration
 * 
 * This file contains all the configuration settings for the e-commerce application.
 * Update these values according to your deployment environment.
 */

const config = {
  // Backend API Configuration
  API: {
    BASE_URL: "https://ecommerce-backend-8ykq.onrender.com",
    ENDPOINTS: {
      PRODUCTS: "/api/products",
      ORDERS: "/api/orders",
      USERS: "/api/users",
      LOGIN: "/api/users/login",
      REGISTER: "/api/users/register",
      MY_ORDERS: "/api/orders/myorders"
    },
    TIMEOUT: 10000, // 10 seconds
    RETRIES: 3
  },

  // Frontend Configuration
  FRONTEND: {
    DEFAULT_PAGE_SIZE: 12, // Number of products to show per page
    CART_MAX_ITEMS: 100,
    SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutes in milliseconds
  },

  // Feature Flags
  FEATURES: {
    WISHLIST: true,
    PRODUCT_REVIEWS: true,
    COUPONS: false
  },

  // Analytics Configuration
  ANALYTICS: {
    ENABLED: true,
    TRACKING_ID: null // Add your analytics tracking ID here
  },

  // Error Handling Configuration
  ERROR_HANDLING: {
    SHOW_DETAILED_ERRORS: process.env.NODE_ENV === 'development',
    REPORT_TO_SENTRY: false,
    SENTRY_DSN: null // Add your Sentry DSN here if using Sentry
  }
};

// Make the configuration available globally
window.APP_CONFIG = config;

// Backward compatibility
const BACKEND_URL = config.API.BASE_URL;

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}