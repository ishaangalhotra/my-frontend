// cart.js
let cartUpdateTimeout;

document.addEventListener("DOMContentLoaded", () => {
  renderCartItems();
  setupEventListeners();
  updateCartBadge();
});

function setupEventListeners() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", proceedToCheckout);
  }
  
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", clearCart);
  }
  
  const continueShoppingBtn = document.getElementById("continueShoppingBtn");
  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      window.location.href = "marketplace.html";
    });
  }
}

function renderCartItems() {
  const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  const container = document.getElementById("cartItems");
  const summarySubtotal = document.getElementById("subtotal");
  const summaryShipping = document.getElementById("shipping");
  const summaryTax = document.getElementById("tax");
  const summaryTotal = document.getElementById("total");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartCount = document.getElementById("cartCount");
  
  if (!container) {
    console.error("Cart container not found");
    return;
  }

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <button onclick="window.location.href='marketplace.html'" class="continue-shopping-btn">
          Start Shopping
        </button>
      </div>
    `;
    
    // Update summary safely
    if (summarySubtotal) summarySubtotal.textContent = "₹0.00";
    if (summaryShipping) summaryShipping.textContent = "₹0.00";
    if (summaryTax) summaryTax.textContent = "₹0.00";
    if (summaryTotal) summaryTotal.textContent = "₹0.00";
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Cart is Empty";
    }
    if (cartCount) cartCount.textContent = "0 items";
    
    return;
  }

  let subtotal = 0;
  let totalItems = 0;
  
  // Generate cart items HTML
  container.innerHTML = cart.map(item => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    subtotal += itemTotal;
    totalItems += item.quantity || 1;
    
    return `
      <div class="cart-item" data-product-id="${item._id}">
        <div class="cart-item-image">
          <img src="${item.image || '/placeholder-image.jpg'}" 
               alt="${escapeHtml(item.name || 'Product')}"
               onerror="this.src='/placeholder-image.jpg'">
        </div>
        <div class="cart-item-details">
          <h3>${escapeHtml(item.name || 'Unnamed Product')}</h3>
          <p class="item-price">₹${(item.price || 0).toFixed(2)} each</p>
          <p class="item-category">${escapeHtml(item.category || '')}</p>
          <div class="item-calculation">
            ₹${(item.price || 0).toFixed(2)} × ${item.quantity} = <strong>₹${itemTotal.toFixed(2)}</strong>
          </div>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button 
              onclick="changeQuantity('${item._id}', -1)" 
              class="quantity-btn decrease"
              ${item.quantity <= 1 ? 'disabled' : ''}
              title="Decrease quantity"
            >−</button>
            <input 
              type="number" 
              value="${item.quantity}" 
              min="1" 
              max="99"
              onchange="updateQuantity('${item._id}', this.value)"
              onblur="validateQuantity('${item._id}', this.value)"
              class="quantity-input"
            >
            <button 
              onclick="changeQuantity('${item._id}', 1)" 
              class="quantity-btn increase"
              ${item.quantity >= 99 ? 'disabled' : ''}
              title="Increase quantity"
            >+</button>
          </div>
          <button 
            onclick="confirmRemoveItem('${item._id}', '${escapeHtml(item.name)}')" 
            class="remove-btn"
            title="Remove item from cart"
          >
            <span class="remove-icon">🗑️</span>
            Remove
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Calculate costs
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;
  
  // Update summary elements safely
  if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal.toFixed(2)}`;
  if (summaryShipping) {
    summaryShipping.textContent = shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`;
  }
  if (summaryTax) summaryTax.textContent = `₹${tax.toFixed(2)}`;
  if (summaryTotal) summaryTotal.textContent = `₹${total.toFixed(2)}`;
  if (cartCount) cartCount.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
  
  // Enable checkout button
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = `Proceed to Checkout (₹${total.toFixed(2)})`;
  }
  
  // Update savings display
  updateSavingsDisplay(subtotal);
}

function calculateShipping(subtotal) {
  return subtotal > 500 ? 0 : 50; // Free shipping over ₹500
}

function calculateTax(subtotal) {
  return Math.round(subtotal * 0.18 * 100) / 100; // 18% GST, rounded to 2 decimals
}

function updateSavingsDisplay(subtotal) {
  const savingsElem = document.getElementById("savings");
  if (savingsElem) {
    const freeShippingThreshold = 500;
    const currentShipping = calculateShipping(subtotal);
    
    if (currentShipping > 0) {
      const remaining = freeShippingThreshold - subtotal;
      savingsElem.innerHTML = `
        <div class="savings-notice">
          <span class="savings-icon">🚚</span>
          Add ₹${remaining.toFixed(2)} more for FREE shipping!
        </div>
      `;
    } else {
      savingsElem.innerHTML = `
        <div class="savings-notice success">
          <span class="savings-icon">✅</span>
          You're getting FREE shipping!
        </div>
      `;
    }
  }
}

function changeQuantity(productId, delta) {
  let cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  const index = cart.findIndex(item => item._id === productId);
  
  if (index > -1) {
    const newQuantity = Math.max(1, Math.min(99, cart[index].quantity + delta));
    
    if (newQuantity !== cart[index].quantity) {
      cart[index].quantity = newQuantity;
      saveCartAndUpdate(cart);
      
      // Show feedback for quantity change
      showNotification(
        `Updated ${cart[index].name} quantity to ${newQuantity}`, 
        "info", 
        2000
      );
    }
  }
}

function updateQuantity(productId, newQuantity) {
  const quantity = parseInt(newQuantity);
  if (isNaN(quantity) || quantity < 1) return;
  
  let cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  const index = cart.findIndex(item => item._id === productId);
  
  if (index > -1) {
    cart[index].quantity = Math.min(99, quantity);
    
    // Debounce the update to avoid too many updates while typing
    clearTimeout(cartUpdateTimeout);
    cartUpdateTimeout = setTimeout(() => {
      saveCartAndUpdate(cart);
    }, 500);
  }
}

function validateQuantity(productId, value) {
  const quantity = parseInt(value);
  if (isNaN(quantity) || quantity < 1) {
    changeQuantity(productId, 0); // This will set to 1 due to Math.max
    showNotification("Quantity must be at least 1", "warning");
  } else if (quantity > 99) {
    let cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    const index = cart.findIndex(item => item._id === productId);
    if (index > -1) {
      cart[index].quantity = 99;
      saveCartAndUpdate(cart);
      showNotification("Maximum quantity is 99", "warning");
    }
  }
}

function confirmRemoveItem(productId, productName) {
  // Create custom confirmation modal
  const confirmed = confirm(`Are you sure you want to remove "${productName}" from your cart?`);
  
  if (confirmed) {
    removeItem(productId, productName);
  }
}

function removeItem(productId, productName = null) {
  let cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  const removedItem = cart.find(item => item._id === productId);
  
  cart = cart.filter(item => item._id !== productId);
  saveCartAndUpdate(cart);
  
  // Show removal confirmation
  const itemName = productName || removedItem?.name || "Item";
  showNotification(`${itemName} removed from cart`, "success");
}

function clearCart() {
  const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  
  if (cart.length === 0) {
    showNotification("Cart is already empty", "info");
    return;
  }
  
  const confirmed = confirm("Are you sure you want to clear your entire cart?");
  
  if (confirmed) {
    localStorage.removeItem("quicklocal_cart");
    renderCartItems();
    updateCartBadge();
    showNotification("Cart cleared successfully", "success");
  }
}

function saveCartAndUpdate(cart) {
  localStorage.setItem("quicklocal_cart", JSON.stringify(cart));
  renderCartItems();
  updateCartBadge();
}

function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartBadges = document.querySelectorAll('.cart-badge');
    cartBadges.forEach(badge => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'inline' : 'none';
    });
    
    // Update header cart count if exists
    const headerCartCount = document.querySelector('.header-cart-count');
    if (headerCartCount) {
      headerCartCount.textContent = totalItems;
    }
  } catch (error) {
    console.error("Error updating cart badge:", error);
  }
}

function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  
  if (cart.length === 0) {
    showNotification("Your cart is empty. Add some items first!", "warning");
    return;
  }
  
  const user = JSON.parse(localStorage.getItem("quicklocal_user"));
  if (!user || !user.token) {
    // Store the intention to checkout
    localStorage.setItem("checkout_redirect", "true");
    showNotification("Please login to proceed to checkout", "info");
    setTimeout(() => {
      window.location.href = "login.html?redirect=checkout.html";
    }, 1500);
    return;
  }
  
  // Add loading state to checkout button
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Redirecting...";
    
    setTimeout(() => {
      window.location.href = "checkout.html";
    }, 500);
  }
}

function getCartSummary() {
  const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  return {
    items: cart,
    itemCount: totalItems,
    subtotal: subtotal,
    shipping: calculateShipping(subtotal),
    tax: calculateTax(subtotal),
    total: subtotal + calculateShipping(subtotal) + calculateTax(subtotal)
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info', duration = 3000) {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto remove
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Export utilities for external use
window.cartUtils = {
  getCartSummary,
  updateCartBadge,
  renderCartItems,
  clearCart,
  removeItem
};

// Initialize cart badge on other pages
if (typeof updateCartBadge === 'function') {
  updateCartBadge();
}
// js/cart.js
import { cartService } from "./api/cart-service.js";
import { showError, showSuccess } from "./ui/notifications.js";

const cartContainer = document.querySelector("#cart-container");

async function renderCart() {
  try {
    const cart = await cartService.getCart();
    if (!cart.items?.length) {
      cartContainer.innerHTML = `<p>Your cart is empty</p>`;
      return;
    }

    cartContainer.innerHTML = cart.items
      .map(
        (item) => `
        <div class="cart-item" data-id="${item.product._id}">
          <img src="${item.product.image}" alt="${item.product.name}">
          <div class="details">
            <h4>${item.product.name}</h4>
            <p>Price: ₹${item.product.price}</p>
            <input type="number" min="1" value="${item.quantity}" class="qty-input">
            <button class="remove-btn">Remove</button>
          </div>
        </div>
      `
      )
      .join("");

    attachCartEvents();
  } catch (err) {
    showError(err.message || "Failed to load cart");
  }
}

function attachCartEvents() {
  document.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const productId = e.target.closest(".cart-item").dataset.id;
      const quantity = parseInt(e.target.value, 10);
      try {
        await cartService.updateItem(productId, quantity);
        showSuccess("Quantity updated");
        renderCart();
      } catch (err) {
        showError(err.message);
      }
    });
  });

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.target.closest(".cart-item").dataset.id;
      try {
        await cartService.removeItem(productId);
        showSuccess("Item removed");
        renderCart();
      } catch (err) {
        showError(err.message);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", renderCart);
