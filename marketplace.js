// marketplace.js
const API_BASE = "https://quicklocal-backend.onrender.com/api/v1";
const productsGrid = document.getElementById("productsGrid");

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  setupFilterTabs();
  updateCartBadge();
});

function fetchProducts() {
  // Show loading state
  productsGrid.innerHTML = `<div class="loading">Loading products...</div>`;
  
  fetch(`${API_BASE}/products`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      const products = data.products || data || [];
      renderProducts(products);
    })
    .catch((err) => {
      productsGrid.innerHTML = `
        <div class="error-message">
          <p>Error loading products. Please try again later.</p>
          <button onclick="fetchProducts()" class="retry-btn">Retry</button>
        </div>
      `;
      console.error("Fetch error:", err);
    });
}

function renderProducts(products) {
  if (products.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-products">
        <p>No products found.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products.map(product => `
    <div class="product-card" data-category="${product.category || 'uncategorized'}">
      <div class="product-image">
        <img src="${product.image || '/placeholder-image.jpg'}" 
             alt="${product.name || 'Product'}"
             onerror="this.src='/placeholder-image.jpg'">
      </div>
      <div class="product-info">
        <h3>${escapeHtml(product.name || 'Unnamed Product')}</h3>
        <p class="price">₹${product.price || '0'}</p>
        <p class="description">${escapeHtml(product.description || '')}</p>
        <button 
          onclick="addToCart('${product._id}')" 
          class="add-to-cart-btn"
          ${!product.inStock ? 'disabled' : ''}
        >
          ${product.inStock !== false ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addToCart(productId) {
  // Find the product in the current products list
  const productCards = document.querySelectorAll('.product-card');
  let product = null;
  
  // Get product data from the DOM or refetch if needed
  // This is a simplified approach - in a real app, you'd store products globally
  const productCard = document.querySelector(`[onclick="addToCart('${productId}')"]`).closest('.product-card');
  const name = productCard.querySelector('h3').textContent;
  const price = productCard.querySelector('.price').textContent.replace('₹', '');
  const image = productCard.querySelector('img').src;
  const category = productCard.dataset.category;
  
  product = {
    _id: productId,
    name: name,
    price: parseFloat(price),
    image: image,
    category: category
  };

  try {
    let cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    const existingItemIndex = cart.findIndex(item => item._id === product._id);
    
    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem("quicklocal_cart", JSON.stringify(cart));
    
    // Show success feedback
    showNotification("Product added to cart!", "success");
    updateCartBadge();
    
  } catch (error) {
    console.error("Error adding to cart:", error);
    showNotification("Error adding product to cart", "error");
  }
}

function setupFilterTabs() {
  const tabs = document.querySelectorAll(".filter-tab");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Update active tab
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const category = tab.dataset.category;
      filterProducts(category);
    });
  });
}

function filterProducts(category) {
  const allCards = document.querySelectorAll(".product-card");
  let visibleCount = 0;
  
  allCards.forEach(card => {
    const cardCategory = card.dataset.category;
    const shouldShow = category === "all" || cardCategory === category;
    
    card.style.display = shouldShow ? "block" : "none";
    if (shouldShow) visibleCount++;
  });
  
  // Show message if no products in category
  if (visibleCount === 0 && category !== "all") {
    const noProductsMsg = document.createElement('div');
    noProductsMsg.className = 'no-products-category';
    noProductsMsg.innerHTML = `<p>No products found in "${category}" category.</p>`;
    productsGrid.appendChild(noProductsMsg);
  } else {
    // Remove any existing no-products message
    const existingMsg = document.querySelector('.no-products-category');
    if (existingMsg) existingMsg.remove();
  }
}

function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
      cartBadge.textContent = totalItems;
      cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }
  } catch (error) {
    console.error("Error updating cart badge:", error);
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Utility function to clear cart (useful for testing/admin)
function clearCart() {
  localStorage.removeItem("quicklocal_cart");
  updateCartBadge();
  showNotification("Cart cleared", "info");
}

// Search functionality (if search input exists)
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const productCards = document.querySelectorAll('.product-card');
      
      productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        const productDescription = card.querySelector('.description')?.textContent.toLowerCase() || '';
        
        const matches = productName.includes(searchTerm) || productDescription.includes(searchTerm);
        card.style.display = matches ? 'block' : 'none';
      });
    });
  }
}

// Initialize search on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
});