import { ProductList } from './components/product-list';
import { OrderList } from './components/order-list';
import { CartManager } from './managers/cart-manager';
import { showToast } from './utils/ui-helpers';

// Configuration
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || window.QUICKLOCAL_API_BASE || '/api/v1';
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

let orderListInstance = null;

async function resolveSellerId() {
  try {
    if (window.HybridAuthClient && typeof window.HybridAuthClient.getCurrentUser === 'function') {
      const user = window.HybridAuthClient.getCurrentUser();
      if (user && (user.id || user._id)) {
        return user.id || user._id;
      }
    }
  } catch (_) {}

  try {
    if (typeof window.quickLocalGetSessionUser === 'function') {
      const user = await window.quickLocalGetSessionUser({ ttlMs: 8000 });
      if (user && (user.id || user._id)) {
        return user.id || user._id;
      }
    }
  } catch (_) {}

  return null;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const sellerId = await resolveSellerId();

    if (!sellerId && window.location.pathname.includes('/seller/')) {
      window.location.href = '/seller-login.html';
      return;
    }

    await initializeComponents(sellerId);
    setupNavigation();

    await CartManager.updateCartCount();
  } catch (error) {
    console.error('Application initialization failed:', error);
    showToast(DEFAULT_ERROR_MESSAGE, 'error');
  }
});

async function initializeComponents(sellerId) {
  try {
    const sellerProductList = new ProductList({
      containerId: 'product-list-container',
      apiUrl: `${API_BASE_URL}/products?seller=${sellerId}`,
      isSellerView: true
    });

    const customerProductList = new ProductList({
      containerId: 'products-grid',
      apiUrl: `${API_BASE_URL}/products`
    });

    orderListInstance = new OrderList({
      containerId: 'order-list-container',
      apiUrl: `${API_BASE_URL}/orders?seller=${sellerId}`
    });

    await Promise.all([
      sellerProductList.loadProducts(),
      customerProductList.loadProducts(),
      orderListInstance.loadOrders()
    ]);
  } catch (error) {
    console.error('Component initialization failed:', error);
    throw error;
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.sidebar-nav a');

  navLinks.forEach((link) => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      navLinks.forEach((l) => l.parentElement.classList.remove('active'));
      link.parentElement.classList.add('active');

      const sectionId = link.getAttribute('href').substring(1);
      document.querySelectorAll('main section').forEach((section) => {
        section.classList.toggle('active', section.id === sectionId);
      });

      if (sectionId === 'orders' && orderListInstance) {
        try {
          await orderListInstance.loadOrders();
        } catch (error) {
          showToast('Failed to load orders', 'error');
        }
      }
    });
  });
}

window.APP_CONFIG = {
  API_BASE_URL
};
