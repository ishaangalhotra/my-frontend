document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const totalUsersEl = document.getElementById('totalUsers');
  const totalOrdersEl = document.getElementById('totalOrders');
  const totalProductsEl = document.getElementById('totalProducts');
  const totalRevenueEl = document.getElementById('totalRevenue');

  // Initialize
  loadDashboardData();
  
  // Functions
  async function loadDashboardData() {
    try {
      // In a real app, replace with your actual API endpoint
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        updateDashboard(data);
      } else {
        console.error('Failed to fetch dashboard data:', data.message);
        // Fallback to mock data
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data
      loadMockData();
    }
  }

  function updateDashboard(data) {
    totalUsersEl.textContent = data.totalUsers || 0;
    totalOrdersEl.textContent = data.totalOrders || 0;
    totalProductsEl.textContent = data.totalProducts || 0;
    totalRevenueEl.textContent = `₹${(data.totalRevenue || 0).toFixed(2)}`;
    
    // In a complete implementation, you would also:
    // - Render charts
    // - Show recent orders
    // - Display other analytics
  }

  // Mock data for demonstration (remove in production)
  function loadMockData() {
    const mockData = {
      totalUsers: 1243,
      totalOrders: 568,
      totalProducts: 89,
      totalRevenue: 1256400.50,
      recentOrders: [],
      monthlyData: []
    };
    
    updateDashboard(mockData);
    console.log('Using mock dashboard data');
  }

  // Chart initialization would go here
  function initCharts() {
    // You would typically use a library like Chart.js
    // Example:
    // const ctx = document.getElementById('revenueChart').getContext('2d');
    // new Chart(ctx, { ... });
  }
});