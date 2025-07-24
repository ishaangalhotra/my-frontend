document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const ordersBody = document.getElementById('ordersBody');
  const statusFilter = document.getElementById('statusFilter');
  const dateFilter = document.getElementById('dateFilter');
  const refreshBtn = document.getElementById('refreshBtn');
  const totalOrdersEl = document.getElementById('totalOrders');
  const revenueEl = document.getElementById('revenue');
  const paginationContainer = document.getElementById('paginationContainer');
  const orderModal = document.getElementById('orderModal');
  const closeBtn = document.querySelector('.close-btn');
  const modalOrderId = document.getElementById('modalOrderId');
  const modalOrderDetails = document.getElementById('modalOrderDetails');

  // State
  let currentPage = 1;
  const ordersPerPage = 10;
  let allOrders = [];
  let filteredOrders = [];

  // Initialize
  fetchOrders();
  setupEventListeners();

  // Functions
  function setupEventListeners() {
    statusFilter.addEventListener('change', filterOrders);
    dateFilter.addEventListener('change', filterOrders);
    refreshBtn.addEventListener('click', () => {
      currentPage = 1;
      fetchOrders();
    });
    closeBtn.addEventListener('click', () => orderModal.style.display = 'none');
    window.addEventListener('click', (e) => {
      if (e.target === orderModal) orderModal.style.display = 'none';
    });
  }

  async function fetchOrders() {
    try {
      // In a real app, replace with your actual API endpoint
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      
      if (response.ok) {
        allOrders = data.orders || [];
        updateStats(allOrders);
        filterOrders();
      } else {
        console.error('Failed to fetch orders:', data.message);
        alert('Failed to load orders. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Network error. Please check your connection.');
    }
  }

  function updateStats(orders) {
    totalOrdersEl.textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    revenueEl.textContent = `₹${totalRevenue.toFixed(2)}`;
  }

  function filterOrders() {
    const status = statusFilter.value;
    const date = dateFilter.value;

    filteredOrders = allOrders.filter(order => {
      const matchesStatus = !status || order.status === status;
      const matchesDate = !date || new Date(order.createdAt).toISOString().split('T')[0] === date;
      return matchesStatus && matchesDate;
    });

    renderOrders();
    renderPagination();
  }

  function renderOrders() {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);

    ordersBody.innerHTML = ordersToShow.map(order => `
      <tr>
        <td>#${order._id.slice(-6).toUpperCase()}</td>
        <td>${order.user?.name || 'Guest'}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>
          <span class="status-badge status-${order.status}">${order.status}</span>
        </td>
        <td>₹${order.total.toFixed(2)}</td>
        <td>
          <button class="action-btn btn-view" data-id="${order._id}">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="action-btn btn-edit" data-id="${order._id}">
            <i class="fas fa-edit"></i> Edit
          </button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to action buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => showOrderDetails(btn.dataset.id));
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editOrderStatus(btn.dataset.id));
    });
  }

  function renderPagination() {
    const pageCount = Math.ceil(filteredOrders.length / ordersPerPage);
    paginationContainer.innerHTML = '';

    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderOrders();
      });
      paginationContainer.appendChild(pageBtn);
    }
  }

  function showOrderDetails(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;

    modalOrderId.textContent = `Order #${order._id.slice(-6).toUpperCase()}`;
    
    modalOrderDetails.innerHTML = `
      <div class="order-detail-row">
        <div class="order-detail-label">Customer</div>
        <div class="order-detail-value">
          ${order.user?.name || 'Guest'} (${order.user?.email || 'No email'})
        </div>
      </div>
      <div class="order-detail-row">
        <div class="order-detail-label">Date</div>
        <div class="order-detail-value">
          ${new Date(order.createdAt).toLocaleString()}
        </div>
      </div>
      <div class="order-detail-row">
        <div class="order-detail-label">Status</div>
        <div class="order-detail-value">
          <span class="status-badge status-${order.status}">${order.status}</span>
        </div>
      </div>
      <div class="order-detail-row">
        <div class="order-detail-label">Payment</div>
        <div class="order-detail-value">
          ${order.paymentMethod} - ₹${order.total.toFixed(2)}
        </div>
      </div>
      <div class="order-detail-row">
        <div class="order-detail-label">Shipping Address</div>
        <div class="order-detail-value">
          ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.zip}
        </div>
      </div>
      
      <div class="order-products">
        <h3>Products (${order.products.length})</h3>
        ${order.products.map(product => `
          <div class="product-item">
            <img src="${product.image || '/images/placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-image">
            <div class="product-info">
              <div class="product-name">${product.name}</div>
              <div class="product-price">
                ₹${product.price.toFixed(2)} × ${product.qty} = ₹${(product.price * product.qty).toFixed(2)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    orderModal.style.display = 'flex';
  }

  async function editOrderStatus(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;

    const newStatus = prompt('Enter new status (pending, processing, shipped, delivered, cancelled):', order.status);
    
    if (newStatus && newStatus !== order.status && 
        ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
      try {
        // In a real app, replace with your API endpoint
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          order.status = newStatus;
          renderOrders();
          alert('Order status updated successfully!');
        } else {
          throw new Error('Failed to update status');
        }
      } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order status. Please try again.');
      }
    }
  }

  // Mock data for demonstration (remove in production)
  function loadMockData() {
    allOrders = Array.from({ length: 25 }, (_, i) => ({
      _id: `order${1000 + i}`,
      user: { name: `Customer ${i + 1}`, email: `customer${i + 1}@example.com` },
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i % 5],
      total: 1000 + (i * 100),
      paymentMethod: ['COD', 'Card', 'UPI', 'Wallet'][i % 4],
      shipping: {
        address: `${i + 1} Main St`,
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad'][i % 4],
        zip: `4000${i}`
      },
      products: Array.from({ length: 1 + (i % 3) }, (_, j) => ({
        productId: `prod${100 + j}`,
        name: `Product ${j + 1}`,
        price: 200 + (j * 50),
        qty: 1 + (j % 2),
        image: '/images/product.jpg'
      }))
    }));

    updateStats(allOrders);
    filterOrders();
  }

  // For demo purposes only - remove in production
  loadMockData();
});