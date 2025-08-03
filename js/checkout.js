// checkout.js
const ORDER_API = "https://quicklocal-backend.onrender.com/api/v1/orders";

let orderData = null; // Store order data globally for reuse

document.addEventListener("DOMContentLoaded", () => {
  console.log("Checkout page loaded");
  
  // Check if we're being redirected back from somewhere
  const urlParams = new URLSearchParams(window.location.search);
  const redirectParam = urlParams.get('redirect');
  
  if (redirectParam) {
    console.log("Detected redirect parameter:", redirectParam);
  }
  
  // Check for any stored redirect flags
  const checkoutRedirect = localStorage.getItem("checkout_redirect");
  if (checkoutRedirect) {
    console.log("Found checkout redirect flag, clearing it");
    localStorage.removeItem("checkout_redirect");
  }
  
  renderOrderSummary();
  setupForm();
  loadSavedAddress();
});

function setupForm() {
  const form = document.getElementById("checkout-form");
  const checkoutBtn = document.getElementById("checkout-btn");
  
  if (form) {
    // Prevent default form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      placeOrder(e);
    });
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', validateField);
      input.addEventListener('input', clearFieldError);
    });
    
    // Add pincode validation
    const pincodeInput = document.getElementById("pincode");
    if (pincodeInput) {
      pincodeInput.addEventListener('input', validatePincode);
    }
    
    // Add phone validation
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
      phoneInput.addEventListener('input', validatePhone);
    }
    
    // Add email validation
    const emailInput = document.getElementById("email");
    if (emailInput) {
      emailInput.addEventListener('input', validateEmail);
    }
  }
  
  // Handle checkout button click (this is the main fix)
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      placeOrder(e);
    });
  }
}

function renderOrderSummary() {
  const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  const container = document.getElementById("cart-items");
  const subtotalElem = document.getElementById("subtotal");
  const shippingElem = document.getElementById("shipping");
  const taxElem = document.getElementById("tax");
  const totalElem = document.getElementById("total");
  
  // Check if required elements exist
  if (!container) {
    console.error("Cart items container not found");
    return;
  }

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <p>Your cart is empty.</p>
        <a href="marketplace.html" class="continue-shopping-btn">Continue Shopping</a>
      </div>
    `;
    
    // Disable checkout button if cart is empty
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Cart is Empty";
    }
    return;
  }

  let subtotal = 0;
  
  // Render cart items with better formatting
  container.innerHTML = cart.map(item => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    subtotal += itemTotal;
    
    return `
      <div class="cart-item" data-product-id="${item._id}">
        <div class="item-info">
          <h4>${escapeHtml(item.name || 'Unnamed Product')}</h4>
          <p class="item-details">
            <span class="quantity">Qty: ${item.quantity}</span>
            <span class="unit-price">₹${item.price || 0} each</span>
          </p>
          <button onclick="removeFromCart('${item._id}')" class="remove-item-btn" title="Remove item">
            ×
          </button>
        </div>
        <div class="item-price">₹${itemTotal.toFixed(2)}</div>
      </div>
    `;
  }).join('');

  // Calculate costs
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;
  
  // Update price elements safely
  if (subtotalElem) subtotalElem.textContent = `₹${subtotal.toFixed(2)}`;
  if (shippingElem) shippingElem.textContent = shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`;
  if (taxElem) taxElem.textContent = `₹${tax.toFixed(2)}`;
  if (totalElem) totalElem.textContent = `₹${total.toFixed(2)}`;
  
  // Store calculated total for order processing
  window.orderTotal = total;
}

function calculateShipping(subtotal) {
  // Free shipping over ₹500, otherwise ₹50
  return subtotal > 500 ? 0 : 50;
}

function calculateTax(subtotal) {
  // 18% GST
  return Math.round(subtotal * 0.18 * 100) / 100; // Round to 2 decimal places
}

function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
  cart = cart.filter(item => item._id !== productId);
  localStorage.setItem("quicklocal_cart", JSON.stringify(cart));
  
  showNotification("Item removed from cart", "info");
  renderOrderSummary();
  
  // Update cart badge if function exists
  if (typeof updateCartBadge === 'function') {
    updateCartBadge();
  }
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  clearFieldError(field);
  
  if (field.hasAttribute('required') && !value) {
    showFieldError(field, 'This field is required');
    return false;
  }
  
  return true;
}

function validateEmail(e) {
  const email = e.target.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (email && !emailRegex.test(email)) {
    showFieldError(e.target, 'Please enter a valid email address');
    return false;
  }
  
  clearFieldError(e.target);
  return true;
}

function validatePhone(e) {
  const phone = e.target.value.trim();
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
  
  if (phone && !phoneRegex.test(phone)) {
    showFieldError(e.target, 'Please enter a valid 10-digit mobile number');
    return false;
  }
  
  clearFieldError(e.target);
  return true;
}

function validatePincode(e) {
  const pincode = e.target.value.trim();
  const pincodeRegex = /^[1-9][0-9]{5}$/; // Indian pincode format
  
  if (pincode && !pincodeRegex.test(pincode)) {
    showFieldError(e.target, 'Please enter a valid 6-digit pincode');
    return false;
  }
  
  clearFieldError(e.target);
  return true;
}

function showFieldError(field, message) {
  clearFieldError(field);
  
  field.classList.add('error');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  
  field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
  if (typeof field === 'object' && field.target) {
    field = field.target;
  }
  
  field.classList.remove('error');
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

function validateForm() {
  const form = document.getElementById("checkout-form");
  if (!form) {
    console.error("Checkout form not found");
    return false;
  }
  
  const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!validateField({ target: field })) {
      isValid = false;
    }
  });
  
  // Validate payment method selection
  const paymentMethod = document.querySelector("input[name='payment']:checked");
  if (!paymentMethod) {
    showNotification("Please select a payment method", "error");
    isValid = false;
  }
  
  return isValid;
}

function loadSavedAddress() {
  const user = JSON.parse(localStorage.getItem("quicklocal_user"));
  if (user && user.address) {
    const fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'country'];
    fields.forEach(field => {
      const input = document.getElementById(field);
      if (input && user.address[field]) {
        input.value = user.address[field];
      }
    });
  }
}

function saveAddress() {
  const user = JSON.parse(localStorage.getItem("quicklocal_user"));
  if (user) {
    const address = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      pincode: document.getElementById("pincode").value,
      country: document.getElementById("country").value
    };
    
    user.address = address;
    localStorage.setItem("quicklocal_user", JSON.stringify(user));
  }
}

async function placeOrder(e) {
  e.preventDefault();
  e.stopPropagation(); // Prevent event bubbling
  
  // Get the checkout button
  const checkoutBtn = document.getElementById("checkout-btn");
  const originalBtnText = checkoutBtn ? checkoutBtn.textContent : "Place Order";
  
  // Prevent multiple submissions
  if (checkoutBtn && checkoutBtn.disabled) {
    console.log("Order already being processed...");
    return;
  }
  
  try {
    console.log("Starting order placement process...");
    
    // Validate form first
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    if (!cart.length) {
      showNotification("Your cart is empty!", "error");
      return;
    }

    const user = JSON.parse(localStorage.getItem("quicklocal_user"));
    if (!user || !user.token) {
      console.log("User not authenticated, redirecting to login...");
      localStorage.setItem("checkout_redirect", "true");
      window.location.href = "login.html?redirect=checkout.html";
      return;
    }

    // Disable submit button and show loading
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = "Placing Order...";
    }

    console.log("Preparing order data...");

    // Prepare order data
    orderData = {
      items: cart.map(product => ({
        product: product._id,
        quantity: product.quantity,
        price: product.price
      })),
      shippingAddress: {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        pincode: document.getElementById("pincode").value.trim(),
        country: document.getElementById("country").value.trim()
      },
      paymentMethod: document.querySelector("input[name='payment']:checked").value,
      orderTotal: window.orderTotal || 0,
      orderDate: new Date().toISOString()
    };

    console.log("Order data prepared:", orderData);

    // Save address for future use
    saveAddress();

    console.log("Sending order to API...");

    const response = await fetch(ORDER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.token}`
      },
      body: JSON.stringify(orderData)
    });

    console.log("Response status:", response.status);
    const result = await response.json();
    console.log("API Response:", result);

    if (!response.ok) {
      throw new Error(result.message || `Server error: ${response.status}`);
    }

    // Success - Clear cart immediately
    console.log("Order placed successfully!");
    localStorage.removeItem("quicklocal_cart");
    
    // Store order details for success page
    const orderDetails = {
      orderId: result.orderId || result._id || Date.now().toString(),
      status: 'success',
      ...orderData,
      timestamp: Date.now()
    };
    
    localStorage.setItem("recent_order", JSON.stringify(orderDetails));
    console.log("Order details stored:", orderDetails);
    
    // Show success notification
    showNotification("🎉 Order placed successfully! Redirecting...", "success");
    
    // Immediate redirect to prevent any issues
    console.log("Redirecting to order-success.html...");
    window.location.replace("order-success.html"); // Use replace instead of href

  } catch (error) {
    console.error("Order placement error:", error);
    
    // Check if it's a network error vs API error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showNotification("❌ Network error. Please check your connection and try again.", "error");
    } else {
      showNotification(`❌ Failed to place order: ${error.message}`, "error");
    }
    
    // Re-enable submit button
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = originalBtnText;
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  console.log(`Notification: ${message} (${type})`);
  
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.transform = 'translateX(0)'; // Ensure it's visible
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Utility functions for external use
window.checkoutUtils = {
  validateForm,
  renderOrderSummary,
  removeFromCart,
  loadSavedAddress
};