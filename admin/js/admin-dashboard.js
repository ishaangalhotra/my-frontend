// =================================================================================
// QUICKLOCAL ADMIN DASHBOARD SCRIPT
// =================================================================================
const AppState = {
  apiBase: 'https://ecommerce-backend-mlik.onrender.com',
  authToken: null,
  currentSection: 'dashboard',
  isApiConnected: false,
  charts: {},
  data: { products: [], categories: [], orders: [] },
  currentEditingId: null,
};

// =================================================================================
// INITIALIZATION
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
  AppState.authToken = localStorage.getItem('qk_admin_token');

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  if (AppState.authToken) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-layout').classList.remove('hidden');
    initializeDashboard();
  }
});

function initializeDashboard() {
  setupEventListeners();
  testApiConnection();
  showSection('dashboard');
}

function setupEventListeners() {
  document.querySelectorAll('.sidebar-link').forEach(link =>
    link.addEventListener('click', handleNavClick)
  );
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('refresh-btn').addEventListener('click', () =>
    loadSectionData(AppState.currentSection)
  );
  document.getElementById('add-product-btn').addEventListener('click', () =>
    openProductModal()
  );
  document.getElementById('add-category-btn')?.addEventListener('click', () =>
    openCategoryModal()
  );
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document
    .getElementById('modal')
    .addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
}

// =================================================================================
// AUTHENTICATION
// =================================================================================
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  showLoading(true);
  try {
    const response = await fetch(`${AppState.apiBase}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'admin' }),
    });
    const data = await response.json();

    if (!response.ok || !data.token || data.user.role !== 'admin') {
      throw new Error(data.message || 'Login failed or not an admin account.');
    }

    AppState.authToken = data.token;
    localStorage.setItem('qk_admin_token', data.token);

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard-layout').classList.remove('hidden');

    showNotification('Login successful!', 'success');
    initializeDashboard();
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    AppState.authToken = null;
    localStorage.removeItem('qk_admin_token');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('dashboard-layout').classList.add('hidden');
    showNotification('You have been logged out.', 'info');
  }
}

// =================================================================================
// API & DATA HANDLING
// =================================================================================
async function apiRequest(endpoint, options = {}) {
  showLoading(true);
  try {
    const response = await fetch(`${AppState.apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AppState.authToken}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  } catch (error) {
    showNotification(error.message, 'error');
    throw error;
  } finally {
    showLoading(false);
  }
}

async function testApiConnection() {
  try {
    await fetch(`${AppState.apiBase}/`, { method: 'HEAD' });
    AppState.isApiConnected = true;
  } catch (error) {
    AppState.isApiConnected = false;
  }
  updateApiStatus();
}

function updateApiStatus() {
  const statusEl = document.getElementById('api-status');
  statusEl.className = `api-status ${AppState.isApiConnected ? 'connected' : 'disconnected'} hidden md:flex`;
  statusEl.innerHTML = `<i class="fas fa-circle mr-2"></i><span>API ${AppState.isApiConnected ? 'Connected' : 'Disconnected'}</span>`;
}

// =================================================================================
// NAVIGATION & UI
// =================================================================================
function handleNavClick(e) {
  e.preventDefault();
  const section = e.currentTarget.dataset.section;
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  e.currentTarget.classList.add('active');
  showSection(section);
}

function showSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`${sectionName}-section`).classList.remove('hidden');

  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your store' },
    products: { title: 'Products', subtitle: 'Manage your product catalog' },
    categories: { title: 'Categories', subtitle: 'Organize your products' },
    orders: { title: 'Orders', subtitle: 'Track and manage customer orders' },
  };
  document.getElementById('page-title').textContent = titles[sectionName]?.title || 'Dashboard';
  document.getElementById('page-subtitle').textContent = titles[sectionName]?.subtitle || 'Welcome!';

  AppState.currentSection = sectionName;
  loadSectionData(sectionName);
}

function loadSectionData(sectionName) {
  switch (sectionName) {
    case 'dashboard': loadDashboardData(); break;
    case 'products': loadProductsData(); break;
    case 'categories': loadCategoriesData(); break;
    case 'orders': loadOrdersData(); break;
  }
}

// =================================================================================
// DASHBOARD SECTION
// =================================================================================
async function loadDashboardData() {
  try {
    const data = await apiRequest('/api/v1/admin/dashboard');
    AppState.data.products = data.products || [];
    AppState.data.categories = data.categories || [];
    AppState.data.orders = data.orders || [];

    document.getElementById('stat-revenue')?.textContent = `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`;
    document.getElementById('stat-orders')?.textContent = data.totalOrders || 0;
    document.getElementById('stat-products')?.textContent = data.totalProducts || 0;
    document.getElementById('stat-categories')?.textContent = data.totalCategories || 0;
    document.getElementById('pending-orders-count')?.textContent = data.pendingOrders || 0;

    renderCharts(data);
  } catch (error) {
    console.error("Failed to load dashboard data", error);
  }
}

function renderCharts(data) {
  const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
  if (!revenueCtx) return;

  if (AppState.charts.revenueChart) AppState.charts.revenueChart.destroy();
  AppState.charts.revenueChart = new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: data.revenueTimeline?.map(d =>
        new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      ) || [],
      datasets: [{
        label: 'Revenue',
        data: data.revenueTimeline?.map(d => d.amount) || [],
        borderColor: '#667eea',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(102, 126, 234, 0.1)'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  });
}

// =================================================================================
// PRODUCTS SECTION
// =================================================================================
async function loadProductsData() {
  const response = await apiRequest('/api/v1/products');
  AppState.data.products = response.data || [];
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  if (AppState.data.products.length === 0) {
    grid.innerHTML = `<p class="text-gray-500 col-span-full text-center">No products found.</p>`;
    return;
  }
  grid.innerHTML = AppState.data.products.map(p => `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <img src="${p.images?.[0]?.url || 'https://via.placeholder.com/300'}" alt="${p.name}" class="w-full h-48 object-cover">
      <div class="p-4">
        <h3 class="font-bold text-lg line-clamp-2">${p.name}</h3>
        <p class="text-gray-600">₹${p.price.toLocaleString('en-IN')}</p>
        <p class="text-sm text-gray-500">${p.category?.name || 'Uncategorized'}</p>
        <div class="mt-4 flex gap-2">
          <button class="w-full btn py-2 text-sm bg-blue-600 text-white rounded" onclick="openProductModal('${p._id}')">Edit</button>
          <button class="w-full btn py-2 text-sm bg-red-600 text-white rounded" onclick="deleteItem('products','${p._id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openProductModal(id = null) {
  AppState.currentEditingId = id;
  const isEditing = id !== null;
  const product = isEditing ? AppState.data.products.find(p => p._id === id) : {};

  const categoriesOptions = AppState.data.categories.map(c =>
    `<option value="${c._id}" ${product?.category?._id === c._id ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  document.getElementById('modal-title').textContent = isEditing ? 'Edit Product' : 'Add Product';
  document.getElementById('modal-body').innerHTML = `
    <form id="modal-form" class="space-y-4">
      <input type="text" name="name" placeholder="Product Name" class="w-full p-3 border rounded-lg" required value="${product?.name || ''}">
      <textarea name="description" placeholder="Description" class="w-full p-3 border rounded-lg">${product?.description || ''}</textarea>
      <input type="number" name="price" placeholder="Price" class="w-full p-3 border rounded-lg" required value="${product?.price || ''}">
      <input type="number" name="stockQuantity" placeholder="Stock Quantity" class="w-full p-3 border rounded-lg" value="${product?.stockQuantity || 0}">
      <select name="category" class="w-full p-3 border rounded-lg" required>${categoriesOptions}</select>
      <input type="text" name="images" placeholder="Image URL" class="w-full p-3 border rounded-lg" value="${product?.images?.[0]?.url || ''}">
      <div class="text-right"><button type="submit" class="btn bg-blue-600 text-white px-4 py-2 rounded">Save</button></div>
    </form>
  `;
  document.getElementById('modal').classList.add('flex');
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modal-form').addEventListener('submit', handleProductSubmit);
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: Number(formData.get('price')),
    stockQuantity: Number(formData.get('stockQuantity')),
    category: formData.get('category'),
    images: formData.get('images') ? [{ url: formData.get('images') }] : []
  };

  const method = AppState.currentEditingId ? 'PUT' : 'POST';
  const endpoint = AppState.currentEditingId ? `/api/v1/products/${AppState.currentEditingId}` : '/api/v1/products';

  try {
    await apiRequest(endpoint, { method, body: JSON.stringify(data) });
    showNotification(`Product ${AppState.currentEditingId ? 'updated' : 'created'}!`, 'success');
    closeModal();
    loadProductsData();
    loadDashboardData();
  } catch (error) {
    console.error('Failed to save product', error);
  }
}

// =================================================================================
// CATEGORIES SECTION
// =================================================================================
async function loadCategoriesData() {
  const response = await apiRequest('/api/v1/categories');
  AppState.data.categories = response.data || [];
  renderCategories();
}

function renderCategories() {
  const container = document.getElementById('categories-table-container');
  if (!container) return;
  container.innerHTML = `
    <table class="w-full bg-white shadow-md rounded-lg">
      <thead class="bg-gray-100"><tr>
        <th class="p-4 text-left">Name</th>
        <th class="p-4 text-left">Slug</th>
        <th class="p-4 text-left">Actions</th>
      </tr></thead>
      <tbody>
        ${AppState.data.categories.map(c => `
          <tr class="border-b">
            <td class="p-4">${c.name}</td>
            <td class="p-4">${c.slug}</td>
            <td class="p-4 flex gap-2">
              <button class="btn py-1 px-3 text-sm bg-blue-600 text-white rounded" onclick="openCategoryModal('${c._id}')">Edit</button>
              <button class="btn py-1 px-3 text-sm bg-red-600 text-white rounded" onclick="deleteItem('categories','${c._id}')">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function openCategoryModal(id = null) {
  AppState.currentEditingId = id;
  const isEditing = id !== null;
  const category = isEditing ? AppState.data.categories.find(c => c._id === id) : {};

  document.getElementById('modal-title').textContent = isEditing ? 'Edit Category' : 'Add Category';
  document.getElementById('modal-body').innerHTML = `
    <form id="modal-form" class="space-y-4">
      <input type="text" name="name" placeholder="Category Name" class="w-full p-3 border rounded-lg" required value="${category?.name || ''}">
      <input type="text" name="slug" placeholder="Slug (e.g., electronics)" class="w-full p-3 border rounded-lg" value="${category?.slug || ''}">
      <textarea name="description" placeholder="Description" class="w-full p-3 border rounded-lg">${category?.description || ''}</textarea>
      <div class="text-right"><button type="submit" class="btn bg-blue-600 text-white px-4 py-2 rounded">Save</button></div>
    </form>
  `;
  document.getElementById('modal').classList.add('flex');
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modal-form').addEventListener('submit', handleCategorySubmit);
}

async function handleCategorySubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
  };

  const method = AppState.currentEditingId ? 'PUT' : 'POST';
  const endpoint = AppState.currentEditingId ? `/api/v1/categories/${AppState.currentEditingId}` : '/api/v1/categories';

  try {
    await apiRequest(endpoint, { method, body: JSON.stringify(data) });
    showNotification(`Category ${AppState.currentEditingId ? 'updated' : 'created'}!`, 'success');
    closeModal();
    loadCategoriesData();
    loadDashboardData();
  } catch (error) {
    console.error('Failed to save category', error);
  }
}

// =================================================================================
// ORDERS SECTION
// =================================================================================
async function loadOrdersData() {
  const response = await apiRequest('/api/v1/orders');
  AppState.data.orders = response.data || [];
  renderOrders();
}

function renderOrders() {
  const container = document.getElementById('orders-table-container');
  if (!container) return;
  container.innerHTML = `
    <table class="w-full bg-white shadow-md rounded-lg">
      <thead class="bg-gray-100"><tr>
        <th class="p-4 text-left">Order ID</th>
        <th class="p-4 text-left">Customer</th>
        <th class="p-4 text-left">Total</th>
        <th class="p-4 text-left">Status</th>
        <th class="p-4 text-left">Date</th>
      </tr></thead>
      <tbody>
        ${AppState.data.orders.map(o => `
          <tr class="border-b">
            <td class="p-4 font-mono text-sm">${o._id.slice(-8)}</td>
            <td class="p-4">${o.user?.name || 'N/A'}</td>
            <td class="p-4 font-bold">₹${o.totalAmount.toLocaleString('en-IN')}</td>
            <td class="p-4">${o.status}</td>
            <td class="p-4">${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// =================================================================================
// GENERIC & HELPER FUNCTIONS
// =================================================================================
function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.getElementById('modal-body').innerHTML = '';
}

async function deleteItem(type, id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
    await apiRequest(`/api/v1/${type}/${id}`, { method: 'DELETE' });
    showNotification('Item deleted', 'success');
    loadSectionData(type);
    loadDashboardData();
  } catch (error) {
    console.error(`Failed to delete ${type}`, error);
  }
}

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (show) overlay.classList.remove('hidden');
  else overlay.classList.add('hidden');
}

function showNotification(message, type = 'info') {
  const toast = document.getElementById('notification-toast');
  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
  toast.innerHTML = `
    <div class="${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg">
      ${message}
    </div>`;
  toast.classList.remove('opacity-0', 'translate-x-[110%]');
  setTimeout(() => toast.classList.add('opacity-0', 'translate-x-[110%]'), 3000);
}
