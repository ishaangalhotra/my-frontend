// js/orders.js
import { ordersService } from "./api/orders-service.js";
import { showError } from "./ui/notifications.js";

const ordersContainer = document.querySelector("#orders-container");

async function loadOrders() {
  try {
    const { orders } = await ordersService.getOrders();

    if (!orders.length) {
      ordersContainer.innerHTML = `<p class="empty-msg">You have no past orders.</p>`;
      return;
    }

    ordersContainer.innerHTML = orders.map(order => `
      <div class="order-card">
        <h3>Order #${order._id}</h3>
        <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p>Status: <strong>${order.status}</strong></p>
        <p>Total: ₹${order.totalPrice}</p>
        <button class="view-order-btn" data-id="${order._id}">View Details</button>
      </div>
    `).join("");
  } catch (err) {
    showError("Failed to load orders");
  }
}

ordersContainer.addEventListener("click", async (e) => {
  const btn = e.target;
  if (btn.classList.contains("view-order-btn")) {
    const orderId = btn.dataset.id;
    try {
      const { order } = await ordersService.getOrderById(orderId);
      alert(JSON.stringify(order, null, 2)); // Replace with modal/HTML render
    } catch (err) {
      showError("Failed to load order details");
    }
  }
});

document.addEventListener("DOMContentLoaded", loadOrders);
// js/orders.js
import { ordersService } from "./api/orders-service.js";
import { showError } from "./ui/notifications.js";

const ordersContainer = document.querySelector("#orders-container");

async function loadOrders() {
  try {
    const { orders } = await ordersService.getMyOrders();

    if (!orders.length) {
      ordersContainer.innerHTML = `<p>No orders found.</p>`;
      return;
    }

    ordersContainer.innerHTML = orders.map(order => `
      <div class="order-card">
        <h4>Order #${order._id}</h4>
        <p>Status: ${order.status}</p>
        <p>Total: ₹${order.totalAmount}</p>
        <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        <a href="order-details.html?id=${order._id}" class="btn">View Details</a>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    showError("Failed to load orders");
  }
}

document.addEventListener("DOMContentLoaded", loadOrders);

