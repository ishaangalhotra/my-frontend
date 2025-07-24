const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const checkoutForm = document.getElementById('checkout-form');
  
  if (!checkoutForm) return;

  renderCartSummary(cart);
  setupFormValidation(checkoutForm);

  checkoutForm.addEventListener('submit', handleCheckoutSubmit);
});

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'warning');
    return;
  }

  const formData = getFormData();
  if (!formData) return;

  const orderData = prepareOrderData(cart, formData);
  
  try {
    const response = await placeOrder(orderData);
    
    if (response.success) {
      handleSuccessfulCheckout(response.orderId);
    } else {
      handleCheckoutError(response.message);
    }
  } catch (error) {
    handleCheckoutError(error.message);
  }
}

function getFormData() {
  const shippingAddress = document.getElementById('shipping-address').value.trim();
  const shippingCity = document.getElementById('shipping-city').value.trim();
  const shippingZip = document.getElementById('shipping-zip').value.trim();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

  // Basic validation
  if (!shippingAddress || !shippingCity || !shippingZip) {
    showToast('Please fill in all shipping details', 'warning');
    return null;
  }

  if (!paymentMethod) {
    showToast('Please select a payment method', 'warning');
    return null;
  }

  return {
    shipping: {
      address: shippingAddress,
      city: shippingCity,
      zip: shippingZip
    },
    paymentMethod
  };
}

function prepareOrderData(cart, formData) {
  const products = cart.map(item => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    qty: item.quantity,
    image: item.image // Include image for order confirmation
  }));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = calculateShippingFee(cart);
  const tax = calculateTax(subtotal);
  const total = subtotal + shippingFee + tax;

  return {
    products,
    shipping: formData.shipping,
    paymentMethod: formData.paymentMethod,
    subtotal,
    shippingFee,
    tax,
    total
  };
}

function calculateShippingFee(cart) {
  // Implement your shipping logic
  return cart.length > 2 ? 50 : 30; // Example: ₹30-50 based on item count
}

function calculateTax(subtotal) {
  // Example: 5% tax
  return parseFloat((subtotal * 0.05).toFixed(2));
}

async function placeOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(orderData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to place order');
  }

  return data;
}

function handleSuccessfulCheckout(orderId) {
  // Clear cart and show success message
  localStorage.removeItem('cart');
  
  // Show order confirmation
  document.getElementById('checkout-form').style.display = 'none';
  document.getElementById('order-confirmation').innerHTML = `
    <div class="confirmation-message">
      <h2>🎉 Order Placed Successfully!</h2>
      <p>Your order ID: <strong>${orderId}</strong></p>
      <p>We've sent a confirmation to your email.</p>
      <a href="/orders/${orderId}" class="btn btn-primary">View Order Details</a>
    </div>
  `;
  
  // Track conversion (optional)
  if (window.gtag) {
    gtag('event', 'purchase', {
      transaction_id: orderId,
      value: orderData.total,
      currency: 'INR',
      items: orderData.products.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.qty
      }))
    });
  }
}

function handleCheckoutError(errorMessage) {
  console.error('Checkout error:', errorMessage);
  showToast(errorMessage || 'Something went wrong. Please try again.', 'error');
  
  // Re-enable checkout button if disabled
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'Place Order';
  }
}

function renderCartSummary(cart) {
  const summaryContainer = document.getElementById('cart-summary');
  if (!summaryContainer) return;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = calculateShippingFee(cart);
  const tax = calculateTax(subtotal);
  const total = subtotal + shippingFee + tax;

  if (!cart.length) {
    summaryContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    return;
  }

  summaryContainer.innerHTML = `
    <div class="cart-items">
      <h3>Your Order</h3>
      <ul>
        ${cart.map(item => `
          <li class="cart-item">
            <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}">
            <div class="item-details">
              <span class="item-name">${item.name}</span>
              <span class="item-price">₹${item.price.toFixed(2)} × ${item.quantity}</span>
            </div>
            <span class="item-total">₹${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    <div class="order-summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>₹${shippingFee.toFixed(2)}</span>
      </div>
      <div class="summary-row">
        <span>Tax (5%)</span>
        <span>₹${tax.toFixed(2)}</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span>₹${total.toFixed(2)}</span>
      </div>
    </div>
  `;
}

function setupFormValidation(form) {
  // Add real-time validation feedback
  const fields = ['shipping-address', 'shipping-city', 'shipping-zip'];
  
  fields.forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', () => {
        field.classList.toggle('is-invalid', !field.value.trim());
      });
    }
  });
}

function showToast(message, type = 'success') {
  // Implement your toast notification system
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}