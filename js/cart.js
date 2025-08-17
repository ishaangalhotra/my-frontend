// ===============================
// Cart Logic - Backend Integrated
// ===============================

// API base URL (adjust if needed)
const API_URL = "https://quicklocal-backend.onrender.com/api/v1/cart";

// Format price like ₹999.00
function formatPrice(amount) {
  return `₹${amount.toFixed(2)}`;
}

// -------------------------------
// Fetch Cart from Backend
// -------------------------------
async function fetchCart() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch cart");
    return await res.json();
  } catch (err) {
    console.error("❌ Error loading cart:", err);
    return { items: [] };
  }
}

// -------------------------------
// Update Cart on Backend
// -------------------------------
async function updateCartItem(itemId, quantity) {
  try {
    const res = await fetch(`${API_URL}/${itemId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ quantity })
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Error updating item:", err);
  }
}

async function removeCartItem(itemId) {
  try {
    const res = await fetch(`${API_URL}/${itemId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Error removing item:", err);
  }
}

// -------------------------------
// Render Cart
// -------------------------------
function renderCart(items) {
  const container = document.getElementById("cart-items");
  const countBadge = document.getElementById("cart-count");

  if (!items || items.length === 0) {
    container.innerHTML = `<p>Your cart is empty. <a href="marketplace.html">Shop now</a></p>`;
    countBadge.textContent = 0;
    updateSummary(0, 0, 0, 0);
    return;
  }

  countBadge.textContent = items.length;

  container.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item._id}">
      <img src="${item.product.image || 'placeholder.jpg'}" alt="${item.product.name}" class="cart-img"/>
      <div class="cart-details">
        <h3>${item.product.name}</h3>
        <p class="seller">Seller: ${item.product.seller?.name || "QuickLocal"}</p>
        <p class="price">${formatPrice(item.product.price)}</p>
        <div class="cart-controls">
          <button class="qty-btn decrease" data-id="${item._id}">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn increase" data-id="${item._id}">+</button>
          <button class="remove-btn" data-id="${item._id}">Remove</button>
        </div>
      </div>
    </div>
  `).join("");

  // Update totals
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discount = 0; // could apply logic later
  const delivery = subtotal > 500 ? 0 : 40;
  const tax = subtotal * 0.1;
  const total = subtotal - discount + delivery + tax;
  updateSummary(subtotal, discount, delivery, tax, total);
}

// -------------------------------
// Update Summary Section
// -------------------------------
function updateSummary(subtotal, discount, delivery, tax, total) {
  document.getElementById("subtotal").textContent = formatPrice(subtotal);
  document.getElementById("discount").textContent = `- ${formatPrice(discount)}`;
  document.getElementById("delivery").textContent = formatPrice(delivery);
  document.getElementById("tax").textContent = formatPrice(tax);
  document.getElementById("total").textContent = formatPrice(total || subtotal - discount + delivery + tax);
}

// -------------------------------
// Event Handlers
// -------------------------------
document.addEventListener("click", async (e) => {
  // Quantity increase
  if (e.target.classList.contains("increase")) {
    const id = e.target.dataset.id;
    const itemEl = e.target.closest(".cart-item");
    const qtyEl = itemEl.querySelector(".quantity");
    let newQty = parseInt(qtyEl.textContent) + 1;
    const updated = await updateCartItem(id, newQty);
    renderCart(updated.items);
  }

  // Quantity decrease
  if (e.target.classList.contains("decrease")) {
    const id = e.target.dataset.id;
    const itemEl = e.target.closest(".cart-item");
    const qtyEl = itemEl.querySelector(".quantity");
    let newQty = parseInt(qtyEl.textContent) - 1;
    if (newQty < 1) return; // prevent 0
    const updated = await updateCartItem(id, newQty);
    renderCart(updated.items);
  }

  // Remove item
  if (e.target.classList.contains("remove-btn")) {
    const id = e.target.dataset.id;
    const updated = await removeCartItem(id);
    renderCart(updated.items);
  }
});

// -------------------------------
// Checkout Button
// -------------------------------
document.getElementById("checkout-btn").addEventListener("click", () => {
  window.location.href = "checkout.html";
});

// -------------------------------
// Init
// -------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const cart = await fetchCart();
  renderCart(cart.items || []);
});
