document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://quicklocal-backend.onrender.com/api/v1/admin/dashboard';
  const token = localStorage.getItem('qk_token');

  // DOM elements
  const loadingIndicator = document.getElementById('loading-indicator');
  const totalUsersEl = document.getElementById('totalUsers');
  const totalOrdersEl = document.getElementById('totalOrders');
  const totalProductsEl = document.getElementById('totalProducts');
  const totalRevenueEl = document.getElementById('totalRevenue');
  const recentOrdersEl = document.getElementById('recentOrders');

  // Init
  fetchDashboard();

  // -------------------------
  // Fetch Dashboard (with retry)
  // -------------------------
  async function fetchDashboard(retryCount = 0) {
    showLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        renderDashboard(data);
        renderRecentOrders(data.recentOrders || []);
        initCharts(data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (retryCount < 3) {
        console.log(`Retrying dashboard fetch... (${retryCount + 1})`);
        setTimeout(() => fetchDashboard(retryCount + 1), 1000);
      } else {
        loadMockData();
      }
    } finally {
      showLoading(false);
    }
  }

  // -------------------------
  // Render Dashboard Stats
  // -------------------------
  function renderDashboard(data) {
    totalUsersEl.textContent = data.totalUsers || 0;
    totalOrdersEl.textContent = data.totalOrders || 0;
    totalProductsEl.textContent = data.totalProducts || 0;
    totalRevenueEl.textContent = data.totalRevenue
      ? `$${data.totalRevenue.toLocaleString()}`
      : '$0';
  }

  // -------------------------
  // Render Recent Orders
  // -------------------------
  function renderRecentOrders(orders) {
    if (!recentOrdersEl) return;
    if (orders.length === 0) {
      recentOrdersEl.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-6 text-gray-500">No recent orders</td>
        </tr>`;
      return;
    }

    recentOrdersEl.innerHTML = orders.slice(0, 5).map(order => `
      <tr>
        <td class="px-4 py-2 text-sm text-gray-700">${order._id || '—'}</td>
        <td class="px-4 py-2 text-sm text-gray-700">${order.customer?.name || 'Guest'}</td>
        <td class="px-4 py-2 text-sm text-gray-700">$${order.total?.toFixed(2) || '0.00'}</td>
        <td class="px-4 py-2 text-sm">
          <span class="px-2 py-1 rounded text-xs font-medium 
            ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
              order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'}">
            ${order.status || 'Unknown'}
          </span>
        </td>
        <td class="px-4 py-2 text-sm text-gray-700">
          ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
        </td>
      </tr>
    `).join('');
  }

  // -------------------------
  // Initialize Charts (Chart.js)
  // -------------------------
  function initCharts(data) {
    if (typeof Chart !== 'undefined') {
      const ctx = document.getElementById('revenueChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.revenueTimeline?.map(r => r.date) || [],
            datasets: [{
              label: 'Revenue',
              data: data.revenueTimeline?.map(r => r.amount) || [],
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.3
            }]
          },
          options: { responsive: true }
        });
      }
    }
  }

  // -------------------------
  // Helpers
  // -------------------------
  function showLoading(show) {
    if (!loadingIndicator) return;
    loadingIndicator.classList.toggle('hidden', !show);
  }

  function loadMockData() {
    const mock = {
      totalUsers: 250,
      totalOrders: 120,
      totalProducts: 340,
      totalRevenue: 15400,
      recentOrders: [
        { _id: 'ORD1001', customer: { name: 'John Doe' }, total: 299.99, status: 'Completed', createdAt: '2025-08-10' },
        { _id: 'ORD1002', customer: { name: 'Jane Smith' }, total: 159.50, status: 'Pending', createdAt: '2025-08-12' },
        { _id: 'ORD1003', customer: { name: 'Mike Ross' }, total: 89.00, status: 'Cancelled', createdAt: '2025-08-13' },
        { _id: 'ORD1004', customer: { name: 'Rachel Green' }, total: 129.99, status: 'Completed', createdAt: '2025-08-14' },
        { _id: 'ORD1005', customer: { name: 'Harvey Specter' }, total: 499.00, status: 'Completed', createdAt: '2025-08-15' }
      ],
      revenueTimeline: [
        { date: 'Mon', amount: 2000 },
        { date: 'Tue', amount: 2500 },
        { date: 'Wed', amount: 1800 },
        { date: 'Thu', amount: 3200 },
        { date: 'Fri', amount: 3900 },
        { date: 'Sat', amount: 1000 },
        { date: 'Sun', amount: 1000 }
      ]
    };
    renderDashboard(mock);
    renderRecentOrders(mock.recentOrders);
    initCharts(mock);
    console.log('⚠️ Using mock dashboard data');
  }
});
