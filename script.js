const API_URL = window.APP_CONFIG?.API?.BASE_URL || 'http://localhost:3000';

/**
 * Utility Functions
 */
const Utils = {
  // Display field-specific validation errors
  displayFieldError: (elementId, message) => {
    const errorElement = document.getElementById(elementId);
    const inputElement = document.getElementById(elementId.replace('Error', ''));
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? 'block' : 'none';
    }
    
    if (inputElement) {
      inputElement.parentElement.classList.toggle('error', !!message);
    }
  },

  // Clear all form validation errors
  clearAllFieldErrors: () => {
    document.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    document.querySelectorAll('.form-group.error').forEach(el => {
      el.classList.remove('error');
    });
  },

  // Show toast notification
  showToast: (message, type = 'success', duration = 3000) => {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    const timer = setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
    
    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(timer);
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    });
  },

  // Validate email format
  validateEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Debounce function for performance
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
};

/**
 * Authentication Module
 */
const Auth = {
  // Register new user
  register: async (name, email, password, confirmPassword) => {
    Utils.clearAllFieldErrors();

    // Validation
    let isValid = true;
    if (!name.trim()) {
      Utils.displayFieldError('nameError', 'Name is required');
      isValid = false;
    }
    if (!email.trim()) {
      Utils.displayFieldError('emailError', 'Email is required');
      isValid = false;
    } else if (!Utils.validateEmail(email)) {
      Utils.displayFieldError('emailError', 'Invalid email format');
      isValid = false;
    }
    if (!password) {
      Utils.displayFieldError('passwordError', 'Password is required');
      isValid = false;
    } else if (password.length < 8) {
      Utils.displayFieldError('passwordError', 'Password must be at least 8 characters');
      isValid = false;
    }
    if (password !== confirmPassword) {
      Utils.displayFieldError('confirmPasswordError', 'Passwords do not match');
      isValid = false;
    }

    if (!isValid) {
      Utils.showToast('Please fix the form errors', 'error');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      Utils.showToast('Registration successful! Redirecting to login...', 'success');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      Utils.showToast(error.message || 'Registration failed. Please try again.', 'error');
      return false;
    }
  },

  // User login
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user data and token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data.user));

      Utils.showToast('Login successful!', 'success');
      setTimeout(() => window.location.href = 'index.html', 1000);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      Utils.showToast(error.message || 'Invalid email or password', 'error');
      return false;
    }
  },

  // User logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    Cart.clearCart(); // Clear cart on logout
    Utils.showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.href = 'index.html', 500);
  },

  // Get current user
  getUser: () => {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  }
};

/**
 * Cart Management Module
 */
const Cart = {
  // Get current cart
  getCart: () => {
    try {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error parsing cart:', error);
      return [];
    }
  },

  // Add item to cart
  addToCart: (productId, quantity = 1, productData = null) => {
    const cart = Cart.getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId,
        quantity,
        ...(productData && { 
          name: productData.name,
          price: productData.price,
          image: productData.image 
        })
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    Cart.updateCartCount();
    Utils.showToast('Item added to cart', 'success');
    return cart;
  },

  // Update cart item quantity
  updateItem: (productId, newQuantity) => {
    const cart = Cart.getCart();
    const itemIndex = cart.findIndex(item => item.productId === productId);

    if (itemIndex === -1) return false;

    if (newQuantity <= 0) {
      cart.splice(itemIndex, 1);
      Utils.showToast('Item removed from cart', 'warning');
    } else {
      cart[itemIndex].quantity = newQuantity;
      Utils.showToast('Cart updated', 'success');
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    Cart.updateCartCount();
    return true;
  },

  // Remove item from cart
  removeItem: (productId) => {
    const cart = Cart.getCart().filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    Cart.updateCartCount();
    Utils.showToast('Item removed from cart', 'warning');
    return cart;
  },

  // Clear entire cart
  clearCart: () => {
    localStorage.removeItem('cart');
    Cart.updateCartCount();
    Utils.showToast('Cart cleared', 'info');
  },

  // Get cart item count
  getItemCount: () => {
    return Cart.getCart().reduce((total, item) => total + item.quantity, 0);
  },

  // Get cart total price
  getTotalPrice: () => {
    return Cart.getCart().reduce((total, item) => {
      return total + (item.price || 0) * item.quantity;
    }, 0);
  },

  // Update cart count in UI
  updateCartCount: () => {
    const countElements = document.querySelectorAll('.cart-count');
    const count = Cart.getItemCount();
    
    countElements.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline' : 'none';
    });
  }
};

/**
 * Navigation Management
 */
const Navigation = {
  // Render navigation based on auth state
  render: () => {
    const nav = document.getElementById('nav-links');
    if (!nav) return;

    const user = Auth.getUser();
    const cartCount = Cart.getItemCount();

    nav.innerHTML = user
      ? `
        <a href="profile.html" class="nav-link">
          <i class="fas fa-user"></i>
          <span>${user.name.split(' ')[0]}</span>
        </a>
        <a href="wishlist.html" class="nav-link">
          <i class="fas fa-heart"></i>
          <span>Wishlist</span>
        </a>
        <a href="orders.html" class="nav-link">
          <i class="fas fa-box-open"></i>
          <span>Orders</span>
        </a>
        <a href="cart.html" class="nav-link cart-icon">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count">${cartCount}</span>
        </a>
        <a href="#" onclick="Auth.logout()" class="nav-link">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </a>
      `
      : `
        <a href="register.html" class="nav-link">
          <i class="fas fa-user-plus"></i>
          <span>Register</span>
        </a>
        <a href="login.html" class="nav-link">
          <i class="fas fa-sign-in-alt"></i>
          <span>Login</span>
        </a>
        <a href="cart.html" class="nav-link cart-icon">
          <i class="fas fa-shopping-cart"></i>
          <span class="cart-count">${cartCount}</span>
        </a>
      `;
  }
};

/**
 * Initialize Application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navigation and cart
  Navigation.render();
  Cart.updateCartCount();

  // Register form handler
  document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    Auth.register(
      formData.get('name'),
      formData.get('email'),
      formData.get('password'),
      formData.get('confirmPassword')
    );
  });

  // Login form handler
  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    Auth.login(
      formData.get('email'),
      formData.get('password')
    );
  });

  // Add to cart buttons
  document.querySelectorAll('.btn-add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      const productData = {
        name: button.dataset.productName,
        price: parseFloat(button.dataset.productPrice),
        image: button.dataset.productImage
      };
      Cart.addToCart(productId, 1, productData);
    });
  });
});

// Make modules globally available
window.Auth = Auth;
window.Cart = Cart;
window.Utils = Utils;