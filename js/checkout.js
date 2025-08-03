// checkout.js
const ORDER_API = "https://quicklocal-backend.onrender.com/api/v1/orders";

let orderData = null; // Store order data globally for reuse

document.addEventListener("DOMContentLoaded", () => {
  renderOrderSummary();
  setupForm();
  loadSavedAddress();
});

function setupForm() {
  const form = document.getElementById("checkout-form");
  if (form) {
    form.addEventListener("submit", placeOrder);
    
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
    
    // Disable checkout form if cart is empty
    const form = document.getElementById("checkout-form");
    if (form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Cart is Empty";
      }
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
        <div class="item-image">
          <img src="${item.image || '/placeholder-image.jpg'}" 
               alt="${escapeHtml(item.name || 'Product')}"
               onerror="this.src='/placeholder-image.jpg'">
        </div>
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
  const requiredFields = form.querySelectorAll('input[required]');
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
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  
  try {
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    const cart = JSON.parse(localStorage.getItem("quicklocal_cart")) || [];
    if (!cart.length) {
      showNotification("Your cart is empty!", "error");
      return;
    }

    const user = JSON.parse(localStorage.getItem("quicklocal_user"));
    if (!user || !user.token) {
      localStorage.setItem("checkout_redirect", "true");
      window.location.href = "login.html?redirect=checkout.html";
      return;
    }

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing Order...";

    // Prepare order data
    orderData = {
      items: cart.map(product => ({
        product: product._id,
        quantity: product.quantity,
        price: product.price // Include price for order history
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

    // Save address for future use
    saveAddress();

    const response = await fetch(ORDER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.token}`
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Server error: ${response.status}`);
    }

    // Success
    showNotification("🎉 Order placed successfully!", "success");
    
    // Clear cart
    localStorage.removeItem("quicklocal_cart");
    
    // Store order details for success page
    localStorage.setItem("recent_order", JSON.stringify({
      orderId: result.orderId || result._id,
      ...orderData
    }));
    
    // Redirect to success page
    setTimeout(() => {
      window.location.href = "order-success.html";
    }, 1500);

  } catch (error) {
    console.error("Order placement error:", error);
    showNotification(`❌ Failed to place order: ${error.message}`, "error");
    
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
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