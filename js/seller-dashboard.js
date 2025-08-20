// Complete seller-dashboard.js - Handles AUTH + DASHBOARD

// ====== Config ======
const API_BASE = 'https://quicklocal-backend.onrender.com';
const API_PREFIX = '/api/v1';
const ROUTES = {
  login: `${API_PREFIX}/auth/login`,
  register: `${API_PREFIX}/auth/register`,
  refresh: `${API_PREFIX}/auth/refresh-token`,
  meUsers: `${API_PREFIX}/users/me`,
  meAuth: `${API_PREFIX}/auth/me`,
  uploadImage: `${API_PREFIX}/upload-image`,
  products: `${API_PREFIX}/products`,
  categories: `${API_PREFIX}/categories`,
};

let products = [];
let editingProductId = null;
let currentUser = null;
let uploadedImageUrl = "";

// ====== DOM Elements ======
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const productForm = document.getElementById('product-form');
const productListContainer = document.getElementById('product-list');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const toastContainer = document.getElementById('toast-container');
const productImageInput = document.getElementById('product-image');
const imagePreview = document.getElementById('image-preview');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const cancelBtn = document.getElementById('cancel-btn');
const logoutBtn = document.getElementById('logout-btn');

// ====== Utility Functions ======
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showView(view) {
  authSection.classList.toggle('hidden', view !== 'auth');
  dashboardSection.classList.toggle('hidden', view !== 'dashboard');
}

function getSavedToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('token');
}

function saveToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  }
}

// ====== Authentication Functions ======
async function authenticatedFetch(pathOrUrl, options = {}) {
  const token = getSavedToken();
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let data = null;
  try { 
    data = await res.json(); 
  } catch { 
    data = null; 
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

async function verifyToken() {
  const token = getSavedToken();
  if (!token) return showView('auth');

  try {
    let data;
    try { 
      data = await authenticatedFetch(ROUTES.meUsers); 
    } catch { 
      data = await authenticatedFetch(ROUTES.meAuth); 
    }
    
    currentUser = data.user || data.data || data;
    localStorage.setItem('sellerInfo', JSON.stringify(currentUser));
    localStorage.setItem('sellerId', currentUser._id);
    
    showView('dashboard');
    await initDashboard();
  } catch (error) {
    console.error('Token verification failed:', error);
    localStorage.clear();
    showView('auth');
  }
}

// ====== Auth Event Handlers ======
function toggleAuth(mode) {
  loginForm.classList.toggle('hidden', mode !== 'login');
  registerForm.classList.toggle('hidden', mode !== 'register');
  
  loginTab.className = mode === 'login' 
    ? 'flex-1 py-2 bg-white text-indigo-600 font-semibold'
    : 'flex-1 py-2 text-gray-600';
    
  registerTab.className = mode === 'register' 
    ? 'flex-1 py-2 bg-white text-indigo-600 font-semibold'
    : 'flex-1 py-2 text-gray-600';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}${ROUTES.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include', // <-- important for refresh cookies
      body: JSON.stringify({ email, password, role: 'seller' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `Login failed (${res.status})`);

    const token = data.token || data.accessToken;
    if (!token) throw new Error('No token received');

    saveToken(token);
    currentUser = data.user;
    localStorage.setItem('sellerInfo', JSON.stringify(currentUser));
    localStorage.setItem('sellerId', currentUser._id);

    showToast('Welcome back!', 'success');
    showView('dashboard');
    await initDashboard();
  } catch (error) {
    console.error('Login failed:', error);
    showToast(error.message || 'Login failed', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const businessName = document.getElementById('reg-business').value.trim();

  try {
    const res = await fetch(`${API_BASE}${ROUTES.register}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include', // <-- important for refresh cookies
      body: JSON.stringify({ name, email, phone, password, businessName, role: 'seller' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `Registration failed (${res.status})`);

    const token = data.token || data.accessToken;
    if (!token) throw new Error('No token received');

    saveToken(token);
    currentUser = data.user;
    localStorage.setItem('sellerInfo', JSON.stringify(currentUser));
    localStorage.setItem('sellerId', currentUser._id);

    showToast('Account created successfully!', 'success');
    showView('dashboard');
    await initDashboard();
  } catch (error) {
    console.error('Registration failed:', error);
    showToast(error.message || 'Registration failed', 'error');
  }
}

// ====== Dashboard Functions ======
async function initDashboard() {
  if (currentUser) {
    document.getElementById('sellerName').textContent = currentUser.name || 'Seller';
  }
  
  await fetchCategories();
  await fetchProducts();
}

async function fetchCategories() {
  try {
    const data = await authenticatedFetch(ROUTES.categories);
    const categorySelect = document.getElementById('product-category');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    const categories = data.data?.categories || data.categories || [];
    categories.forEach(category => {
      categorySelect.innerHTML += `<option value="${category._id}">${category.name}</option>`;
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    showToast('Failed to load categories', 'error');
  }
}

async function fetchProducts() {
  const sellerId = localStorage.getItem('sellerId');
  if (!sellerId) {
    showToast('Seller ID not found. Please log in again.', 'error');
    return;
  }
  try {
    const data = await authenticatedFetch(`${ROUTES.products}?seller=${encodeURIComponent(sellerId)}`);
    products = data?.data?.products || data?.products || data?.data || [];
    renderProductList();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    showToast('Failed to load products', 'error');
  }
}

function renderProductList() {
  if (!products || products.length === 0) {
    productListContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No products yet. Add your first product!</p>';
    return;
  }

  productListContainer.innerHTML = '';
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-shadow';
    
    const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/150';
    productCard.innerHTML = `
      <img src="${imageUrl}" alt="${product.name}" class="h-32 w-full object-cover rounded mb-3" />
      <h4 class="font-bold text-lg mb-2">${product.name}</h4>
      <p class="text-gray-600 text-sm mb-2">${product.description || 'No description'}</p>
      <p class="text-xl font-semibold text-green-600 mb-3">₹${product.price}</p>
      <p class="text-sm text-gray-500 mb-3">Stock: ${product.stock}</p>
      <div class="flex space-x-2">
        <button onclick="editProduct('${product._id}')" class="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600">
          Edit
        </button>
        <button onclick="confirmDeleteProduct('${product._id}')" class="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600">
          Delete
        </button>
      </div>
    `;
    
    productListContainer.appendChild(productCard);
  });
}

// ====== Product Management ======
async function uploadImageFile(file) {
  if (!file) throw new Error('No file selected');
  
  const formData = new FormData();
  formData.append('image', file);

  const data = await authenticatedFetch(ROUTES.uploadImage, {
    method: 'POST',
    body: formData,
  });

  const url = data?.image?.url || data?.url;
  if (!url) throw new Error('Upload failed - no URL returned');
  
  return url;
}

async function saveProduct(e) {
  e.preventDefault();
  
  const sellerId = localStorage.getItem('sellerId');
  if (!sellerId) {
    showToast('Cannot save product. Please log in again.', 'error');
    return;
  }

  const isUpdating = !!editingProductId;

  // Handle image upload
  let imageUrl = uploadedImageUrl;
  if (productImageInput?.files?.length) {
    try {
      imageUrl = await uploadImageFile(productImageInput.files[0]);
    } catch (error) {
      console.error('Image upload failed:', error);
      showToast('Image upload failed', 'error');
      return;
    }
  }

  const productData = {
    name: document.getElementById('product-name').value.trim(),
    category: document.getElementById('product-category').value.trim(),
    price: parseFloat(document.getElementById('product-price').value),
    stock: parseInt(document.getElementById('product-stock').value, 10),
    description: document.getElementById('product-description')?.value?.trim() || '',
    images: imageUrl ? [{ url: imageUrl }] : [],
    seller: sellerId,
  };

  const url = `${ROUTES.products}${isUpdating ? `/${editingProductId}` : ''}`;
  const method = isUpdating ? 'PUT' : 'POST';

  try {
    await authenticatedFetch(url, {
      method,
      body: JSON.stringify(productData),
    });
    
    showToast(isUpdating ? 'Product updated!' : 'Product added!', 'success');
    resetForm();
    closeModal();
    await fetchProducts();
  } catch (error) {
    console.error('Product save error:', error);
    showToast(`Failed to save product: ${error.message}`, 'error');
  }
}

function resetForm() {
  productForm.reset();
  editingProductId = null;
  uploadedImageUrl = "";
  imagePreview.innerHTML = '';
  document.getElementById('modalTitle').textContent = 'Add Product';
  if (cancelEditBtn) cancelEditBtn.style.display = 'none'; // <-- guard
}

function openModal() {
  resetForm();
  productModal.classList.remove('hidden');
}

function closeModal() {
  productModal.classList.add('hidden');
  resetForm();
}

function editProduct(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;

  editingProductId = productId;
  document.getElementById('product-name').value = product.name || '';
  document.getElementById('product-category').value = (product.category?._id || product.category) || '';
  document.getElementById('product-price').value = product.price || '';
  document.getElementById('product-stock').value = product.stock || '';
  
  if (document.getElementById('product-description')) {
    document.getElementById('product-description').value = product.description || '';
  }

  const existingImage = product.images?.[0]?.url;
  if (existingImage) {
    uploadedImageUrl = existingImage;
    imagePreview.innerHTML = `<img src="${existingImage}" style="max-width: 150px; border-radius: 8px;" alt="Current image" />`;
  } else {
    uploadedImageUrl = "";
    imagePreview.innerHTML = '';
  }

  document.getElementById('modalTitle').textContent = 'Edit Product';
  if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block'; // <-- guard
  productModal.classList.remove('hidden');
}

async function deleteProduct(productId) {
  try {
    await authenticatedFetch(`${ROUTES.products}/${productId}`, { 
      method: 'DELETE' 
    });
    
    showToast('Product deleted successfully', 'success');
    await fetchProducts();
  } catch (error) {
    console.error('Failed to delete product:', error);
    showToast('Failed to delete product', 'error');
  }
}

function confirmDeleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    deleteProduct(productId);
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

// ====== Event Listeners ======
document.addEventListener('DOMContentLoaded', async () => {
  // Auth event listeners
  loginTab?.addEventListener('click', () => toggleAuth('login'));
  registerTab?.addEventListener('click', () => toggleAuth('register'));
  loginForm?.addEventListener('submit', handleLogin);
  registerForm?.addEventListener('submit', handleRegister);
  
  // Dashboard event listeners
  logoutBtn?.addEventListener('click', logout);
  addProductBtn?.addEventListener('click', openModal);
  cancelBtn?.addEventListener('click', closeModal);
  cancelEditBtn?.addEventListener('click', closeModal);
  productForm?.addEventListener('submit', saveProduct);
  
  // Image upload preview
  productImageInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      uploadedImageUrl = await uploadImageFile(file);
      imagePreview.innerHTML = `<img src="${uploadedImageUrl}" style="max-width: 150px; border-radius: 8px;" alt="Preview" />`;
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Image upload failed:', error);
      showToast('Image upload failed', 'error');
      uploadedImageUrl = "";
      imagePreview.innerHTML = '';
    }
  });

  // Initialize app
  await verifyToken();
});

// Make functions global so they can be called from HTML onclick attributes
window.editProduct = editProduct;
window.confirmDeleteProduct = confirmDeleteProduct;