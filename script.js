// config.js should be loaded before this script to define BACKEND_URL
// const BACKEND_URL = "https://ecommerce-backend-8ykq.onrender.com"; // This comes from config.js

// DOM Elements
const elements = {
  productList: document.getElementById('product-list'),
  cartItems: document.getElementById('cart-items'),
  totalElement: document.getElementById('total'),
  messageElement: document.getElementById('message'),
  uploadStatusElement: document.getElementById('uploadStatus'),
  uploadForm: document.getElementById('uploadForm')
};

// Utility Functions
const utils = {
  showToast: (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }, 100);
  },

  formatPrice: (price) => `₹${parseFloat(price).toFixed(2)}`,

  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePassword: (password) => password.length >= 6
};

// Product Functions
const productFunctions = {
  loadProducts: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      
      const data = await res.json();
      if (!elements.productList) return;

      elements.productList.innerHTML = data.length === 0 
        ? "<p class='no-products'>No products available yet.</p>"
        : data.map(product => `
            <div class="product-card">
              <img src="${product.imageUrl || 'https://placehold.co/180x180/cccccc/333333?text=No+Image'}" 
                   alt="${product.name}" 
                   loading="lazy" />
              <h3>${product.name}</h3>
              <p>${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
              <div class="price-container">
                ${product.originalPrice ? `<span class="original-price">${utils.formatPrice(product.originalPrice)}</span>` : ''}
                <strong>${utils.formatPrice(product.price)}</strong>
              </div>
              <button onclick='cartFunctions.addToCart(${JSON.stringify(product)})'>
                Add to Cart
              </button>
            </div>
          `).join('');
    } catch (err) {
      console.error("Failed to load products:", err);
      if (elements.productList) {
        elements.productList.innerHTML = "<p class='error-message'>Failed to load products. Please try again later.</p>";
      }
    }
  },

  uploadProduct: async (formData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      utils.showToast('Please login to upload products', 'error');
      window.location.href = 'login.html';
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      utils.showToast('Product uploaded successfully!', 'success');
      return true;
    } catch (err) {
      console.error("Error during product upload:", err);
      utils.showToast(err.message || 'Failed to upload product', 'error');
      return false;
    }
  }
};

// Cart Functions
const cartFunctions = {
  getCart: () => JSON.parse(localStorage.getItem('cart')) || [],

  saveCart: (cart) => localStorage.setItem('cart', JSON.stringify(cart)),

  addToCart: (product) => {
    const cart = cartFunctions.getCart();
    const existingItem = cart.find(item => item._id === product._id);

    if (existingItem) {
      existingItem.qty = (existingItem.qty || 1) + 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    cartFunctions.saveCart(cart);
    utils.showToast(`${product.name} added to cart!`, 'success');
    
    if (elements.cartItems) {
      cartFunctions.renderCart();
    }
  },

  renderCart: () => {
    const cart = cartFunctions.getCart();
    if (!elements.cartItems || !elements.totalElement) return;

    elements.cartItems.innerHTML = cart.length === 0
      ? "<p class='empty-cart'>Your cart is empty.</p>"
      : cart.map((item, index) => `
          <div class="cart-item">
            <img src="${item.imageUrl || 'https://placehold.co/80x80/cccccc/333333?text=No+Image'}" 
                 alt="${item.name}" 
                 loading="lazy" />
            <div class="cart-item-details">
              <h3>${item.name}</h3>
              <p>${utils.formatPrice(item.price)} each</p>
              <p>Subtotal: ${utils.formatPrice(item.price * item.qty)}</p>
            </div>
            <div class="cart-item-actions">
              <button onclick="cartFunctions.updateQuantity(${index}, -1)">−</button>
              <span>${item.qty}</span>
              <button onclick="cartFunctions.updateQuantity(${index}, 1)">+</button>
              <button class="remove-btn" onclick="cartFunctions.removeFromCart(${index})">
                Remove
              </button>
            </div>
          </div>
        `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    elements.totalElement.textContent = `Total: ${utils.formatPrice(total)}`;
  },

  updateQuantity: (index, change) => {
    const cart = cartFunctions.getCart();
    if (!cart[index]) return;

    cart[index].qty += change;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }

    cartFunctions.saveCart(cart);
    cartFunctions.renderCart();
  },

  removeFromCart: (index) => {
    const cart = cartFunctions.getCart();
    if (!cart[index]) return;

    const removedItem = cart.splice(index, 1)[0];
    cartFunctions.saveCart(cart);
    utils.showToast(`${removedItem.name} removed from cart`, 'info');
    cartFunctions.renderCart();
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    if (elements.cartItems) elements.cartItems.innerHTML = "<p class='empty-cart'>Your cart is empty.</p>";
    if (elements.totalElement) elements.totalElement.textContent = 'Total: ₹0.00';
  }
};

// Order Functions
const orderFunctions = {
  createOrder: async (orderData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      utils.showToast('Please login to place order', 'error');
      window.location.href = 'login.html';
      return null;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Order failed');

      return data;
    } catch (err) {
      console.error("Error placing order:", err);
      utils.showToast(err.message || 'Failed to place order', 'error');
      return null;
    }
  },

  goToCheckout: async () => {
    const cart = cartFunctions.getCart();
    if (cart.length === 0) {
      utils.showToast('Your cart is empty!', 'error');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!user || !token) {
      utils.showToast('Please login to proceed to checkout', 'error');
      window.location.href = 'login.html';
      return;
    }

    // Calculate order totals
    const itemsPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxPrice = itemsPrice * 0.05; // 5% tax
    const shippingPrice = itemsPrice > 1000 ? 0 : 50;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const orderData = {
      orderItems: cart.map(item => ({
        product: item._id,
        name: item.name,
        qty: item.qty,
        imageUrl: item.imageUrl,
        price: item.price
      })),
      shippingAddress: user.shippingAddress || {
        address: '',
        city: '',
        postalCode: '',
        country: ''
      },
      paymentMethod: 'Cash On Delivery',
      itemsPrice: itemsPrice.toFixed(2),
      taxPrice: taxPrice.toFixed(2),
      shippingPrice: shippingPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    };

    const order = await orderFunctions.createOrder(orderData);
    if (order) {
      cartFunctions.clearCart();
      window.location.href = 'order-success.html?id=' + order._id;
    }
  }
};

// Auth Functions
const authFunctions = {
  login: async (email, password) => {
    if (!email || !password) {
      utils.showToast('Please enter all fields', 'error');
      return false;
    }

    if (!utils.validateEmail(email)) {
      utils.showToast('Please enter a valid email', 'error');
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      utils.showToast('Login successful!', 'success');
      window.location.href = data.user.role === 'seller' ? 'seller.html' : 'index.html';
      return true;
    } catch (err) {
      console.error("Error during login:", err);
      utils.showToast(err.message || 'Login failed', 'error');
      return false;
    }
  },

  register: async (username, email, password) => {
    if (!username || !email || !password) {
      utils.showToast('Please enter all fields', 'error');
      return false;
    }

    if (!utils.validateEmail(email)) {
      utils.showToast('Please enter a valid email', 'error');
      return false;
    }

    if (!utils.validatePassword(password)) {
      utils.showToast('Password must be at least 6 characters', 'error');
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      utils.showToast('Registration successful! Please login.', 'success');
      window.location.href = 'login.html';
      return true;
    } catch (err) {
      console.error("Error during registration:", err);
      utils.showToast(err.message || 'Registration failed', 'error');
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    utils.showToast('Logged out successfully', 'info');
    window.location.href = 'login.html';
  },

  checkAuth: (requiredRole = 'user') => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) {
      if (window.location.pathname !== '/login.html') {
        window.location.href = 'login.html';
      }
      return false;
    }

    if (requiredRole === 'seller' && user.role !== 'seller' && user.role !== 'admin') {
      window.location.href = 'index.html';
      return false;
    }

    return true;
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Load products if on the main page
  if (elements.productList) {
    productFunctions.loadProducts();
  }

  // Render cart if on the cart page
  if (elements.cartItems) {
    cartFunctions.renderCart();
  }

  // Check authentication for protected pages
  if (window.location.pathname.includes('seller.html')) {
    authFunctions.checkAuth('seller');
  }

  // Handle product upload form
  if (elements.uploadForm) {
    elements.uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData();
      formData.append('name', document.getElementById('name').value.trim());
      formData.append('description', document.getElementById('description').value.trim());
      formData.append('price', document.getElementById('price').value);
      formData.append('image', document.getElementById('imageFile').files[0]);
      formData.append('countInStock', document.getElementById('quantity').value);

      const success = await productFunctions.uploadProduct(formData);
      if (success) {
        elements.uploadForm.reset();
        document.getElementById('imagePreview').style.display = 'none';
      }
    });
  }
});

// Make functions available globally for HTML onclick attributes
window.cartFunctions = cartFunctions;
window.orderFunctions = orderFunctions;
window.authFunctions = authFunctions;