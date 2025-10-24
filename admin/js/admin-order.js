document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://ecommerce-backend-mlik.onrender.com/api/v1/admin/orders';
  const token = localStorage.getItem('qk_token');

  // DOM elements
  const loadingIndicator = document.getElementById('loading-indicator');
  const ordersTableBody = document.getElementById('orders-table-body');
  const totalOrdersEl = document.getElementById('totalOrdersCount');
  const totalRevenueEl = document.getElementById('totalRevenueCount');
  const filterStatusEl = document.getElementById('filter-status');
  const filterDateEl = document.getElementById('filter-date');
  const paginationEl = document.getElementById('pagination');
  const orderModal = document.getElementById('order-modal');
  const modalContent = document.getElementById('order-modal-content');
  const modalClose = document.getElementById('order-modal-close');

  let allOrders = [];
  let filteredOrders = [];
  let currentPage = 1;
  const ordersPerPage = 10;

  // Init
  fetchOrders();

  // -------------------------
  // Fetch Orders (with retry)
  // -------------------------
  async function fetchOrders(retryCount = 0) {
    showLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        allOrders = data.orders || [];
        applyFilters();
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (retryCount < 3) {
        console.log(`Retrying fetch orders... (${retryCount + 1})`);
        setTimeout(() => fetchOrders(retryCount + 1), 1000);
      } else {
        loadMockData();
      }
    } finally {
      showLoading(false);
    }
  }

  // -------------------------
  // Filtering
  // -------------------------
  function applyFilters() {
    const status = filterStatusEl?.value || '';
    const date = filterDateEl?.value || '';

    filteredOrders = allOrders.filter(order => {
      let matchesStatus = !status || order.status === status;
      let matchesDate = !date || (order.createdAt && order.createdAt.startsWith(date));
      return matchesStatus && matchesDate;
    });

    renderSummary();
    renderOrders();
  }

  // -------------------------
  // Render Summary
  // -------------------------
  function renderSummary() {
    const total = filteredOrders.length;
    const revenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    totalOrdersEl.textContent = total;
    totalRevenueEl.textContent = `$${revenue.toFixed(2)}`;
  }

  // -------------------------
  // Render Orders
  // -------------------------
  function renderOrders() {
    const start = (currentPage - 1) * ordersPerPage;
    const end = start + ordersPerPage;
    const paginatedOrders = filteredOrders.slice(start, end);

    if (paginatedOrders.length === 0) {
      ordersTableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-6 text-gray-500">No orders found</td></tr>
      `;
      paginationEl.innerHTML = '';
      return;
    }

    ordersTableBody.innerHTML = paginatedOrders.map(order => `
      <tr>
        <td>${order._id}</td>
        <td>${order.customer?.name || 'Guest'}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>$${order.total?.toFixed(2) || '0.00'}</td>
        <td>
          <span class="px-2 py-1 rounded text-xs font-medium
            ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'}">
            ${order.status}
          </span>
        </td>
        <td>
          <button class="btn-view" data-id="${order._id}">View</button>
          <button class="btn-edit" data-id="${order._id}">Edit</button>
        </td>
      </tr>
    `).join('');

    renderPagination();
    attachOrderActions();
  }

  // -------------------------
  // Pagination
  // -------------------------
  function renderPagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => `
      <button class="px-3 py-1 border rounded ${i + 1 === currentPage ? 'bg-blue-500 text-white' : ''}" data-page="${i + 1}">
        ${i + 1}
      </button>
    `).join('');

    paginationEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderOrders();
      });
    });
  }

  // -------------------------
  // Order Actions
  // -------------------------
  function attachOrderActions() {
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => viewOrder(btn.dataset.id));
    });
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editOrder(btn.dataset.id));
    });
  }

  function viewOrder(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;

    modalContent.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">Order ${order._id}</h3>
      <p><strong>Customer:</strong> ${order.customer?.name || 'Guest'}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Total:</strong> $${order.total?.toFixed(2) || '0.00'}</p>
      <h4 class="mt-4 font-medium">Products</h4>
      <ul class="list-disc list-inside">
        ${order.items?.map(item => `<li>${item.name} x${item.quantity}</li>`).join('') || 'No items'}
      </ul>
    `;
    orderModal.classList.remove('hidden');
  }

  function editOrder(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;

    modalContent.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">Edit Order ${order._id}</h3>
      <label class="block mb-2">Status</label>
      <select id="order-status-select" class="border rounded px-2 py-1 mb-4">
        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
        <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
      <button id="save-order-status" class="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
    `;
    orderModal.classList.remove('hidden');

    document.getElementById('save-order-status').addEventListener('click', async () => {
      const newStatus = document.getElementById('order-status-select').value;
      await updateOrderStatus(orderId, newStatus);
      orderModal.classList.add('hidden');
    });
  }

  async function updateOrderStatus(orderId, newStatus) {
    showLoading(true);
    try {
      const res = await fetch(`${API_URL}/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (res.ok) {
        const order = allOrders.find(o => o._id === orderId);
        if (order) order.status = newStatus;
        applyFilters();
        alert('Order status updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update order');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update order. Please try again.');
    } finally {
      showLoading(false);
    }
  }

  // -------------------------
  // Helpers
  // -------------------------
  if (filterStatusEl) filterStatusEl.addEventListener('change', applyFilters);
  if (filterDateEl) filterDateEl.addEventListener('change', applyFilters);
  if (modalClose) modalClose.addEventListener('click', () => orderModal.classList.add('hidden'));

  function showLoading(show) {
    if (!loadingIndicator) return;
    loadingIndicator.classList.toggle('hidden', !show);
  }

  function loadMockData() {
    allOrders = [
      {
        _id: 'ORD101',
        customer: { name: 'John Doe' },
        createdAt: '2025-08-10T10:00:00Z',
        total: 199.99,
        status: 'Completed',
        items: [{ name: 'Phone', quantity: 1 }]
      },
      {
        _id: 'ORD102',
        customer: { name: 'Jane Smith' },
        createdAt: '2025-08-12T14:30:00Z',
        total: 89.50,
        status: 'Pending',
        items: [{ name: 'Shoes', quantity: 2 }]
      }
    ];
    applyFilters();
    console.log('⚠️ Using mock order data');
  }
});
