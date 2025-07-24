import { ProductList } from './components/product-list';
import { OrderList } from './components/order-list';
import { CartManager } from './managers/cart-manager';
import { showToast } from './utils/ui-helpers';

// Configuration
const API_BASE_URL = 'https://ecommerce-backend-8ykq.onrender.com/api'; // ✅ Updated to production backend
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Check authentication
    const sellerId = localStorage.getItem('sellerId');
    if (!sellerId && window.location.pathname.includes('/seller/')) {
      window.location.href = '/login.html';
      return;
    }

    // Initialize UI components
    await initializeComponents(sellerId);
    setupNavigation();
    
    // Update cart count
    await CartManager.updateCartCount();
    
  } catch (error) {
    console.error('Application initialization failed:', error);
    showToast(DEFAULT_ERROR_MESSAGE, 'error');
  }
});

async function initializeComponents(sellerId) {
  try {
    // Initialize product lists
    const sellerProductList = new ProductList({
      containerId: 'product-list-container',
      apiUrl: `${API_BASE_URL}/products?seller=${sellerId}`,
      isSellerView: true
    });
    
    const customerProductList = new ProductList({
      containerId: 'products-grid',
      apiUrl: `${API_BASE_URL}/products`
    });

    // Initialize order list (for sellers)
    const orderList = new OrderList({
      containerId: 'order-list-container',
      apiUrl: `${API_BASE_URL}/orders?seller=${sellerId}`
    });

    // Load data
    await Promise.all([
      sellerProductList.loadProducts(),
      customerProductList.loadProducts(),
      orderList.loadOrders()
    ]);

  } catch (error) {
    console.error('Component initialization failed:', error);
    throw error;
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Update active state
      navLinks.forEach(l => l.parentElement.classList.remove('active'));
      link.parentElement.classList.add('active');
      
      // Show corresponding section
      const sectionId = link.getAttribute('href').substring(1);
      document.querySelectorAll('main section').forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
      });

      // Lazy load section content if needed
      if (sectionId === 'orders') {
        try {
          await orderList.loadOrders();
        } catch (error) {
          showToast('Failed to load orders', 'error');
        }
      }
    });
  });
}

// Make API base URL available globally (if needed)
window.APP_CONFIG = {
  API_BASE_URL
};