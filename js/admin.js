// js/admin.js
import { adminService } from "./api/admin-service.js";
import { showError, showSuccess } from "./ui/notifications.js";

const statsContainer = document.querySelector("#admin-stats");
const usersTableBody = document.querySelector("#admin-users tbody");

async function loadAdminStats() {
  try {
    const { stats } = await adminService.getStats();

    statsContainer.innerHTML = `
      <p>Total Users: ${stats.totalUsers}</p>
      <p>Total Orders: ${stats.totalOrders}</p>
      <p>Total Revenue: ₹${stats.totalRevenue}</p>
    `;
  } catch (err) {
    console.error(err);
    showError("Failed to load admin stats");
  }
}

async function loadUsers() {
  try {
    const { users } = await adminService.getUsers();

    usersTableBody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          ${u.isBlocked
            ? `<button onclick="unblockUser('${u._id}')">Unblock</button>`
            : `<button onclick="blockUser('${u._id}')">Block</button>`}
          <button onclick="deleteUser('${u._id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error(err);
    showError("Failed to load users");
  }
}

async function blockUser(userId) {
  try {
    await adminService.blockUser(userId);
    showSuccess("User blocked successfully");
    loadUsers();
  } catch (err) {
    console.error(err);
    showError("Failed to block user");
  }
}

async function unblockUser(userId) {
  try {
    await adminService.unblockUser(userId);
    showSuccess("User unblocked successfully");
    loadUsers();
  } catch (err) {
    console.error(err);
    showError("Failed to unblock user");
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  
  try {
    await adminService.deleteUser(userId);
    showSuccess("User deleted successfully");
    loadUsers();
  } catch (err) {
    console.error(err);
    showError("Failed to delete user");
  }
}

window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.deleteUser = deleteUser;

document.addEventListener("DOMContentLoaded", () => {
  loadAdminStats();
  loadUsers();
});
