/* =========================================================================
   QUICKLOCAL — SELLER DASHBOARD (merged best version)
   - Modern UI elements (stats, wallet, icons, drag & drop multi-image)
   - Fully wired backend (auth, forgot/resend, categories, seller CRUD)
   - Robust image handling (existing + new files; images[] + image)
   Backend: https://quicklocal-backend.onrender.com
   ========================================================================= */

(() => {
  // ------------------ Config ------------------
  const API_ORIGIN = 'https://quicklocal-backend.onrender.com';
  const API_BASE = `${API_ORIGIN}/api/v1`;

  const ROUTES = {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resendVerification: '/auth/resend-verification',
    categories: '/categories',
    sellerProducts: '/seller/products',
    publicProducts: '/products'
  };

  // ------------------ State -------------------
  let currentUser = null;
  let products = [];
  let categories = [];
  // edit modal state
  let editingProduct = null;         // full object when editing
  let uploadedFiles = [];            // File objects added this session
  let existingImageUrls = [];        // URLs kept from the product when editing

  // ------------------ DOM ---------------------
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));

  // Sections
  const viewAuth = q('#auth-section');
  const viewDashboard = q('#dashboard-section');

  // Tabs & forms
  const tabLogin = q('#login-tab');
  const tabRegister = q('#register-tab');
  const formLogin = q('#login-form');
  const formRegister = q('#register-form');

  // Login fields
  const inLoginEmail = q('#login-email');
  const inLoginPassword = q('#login-password');

  // Auth buttons
  const btnForgotPassword = q('#forgot-password-btn');
  const btnResendVerification = q('#resend-verification-btn');

  // Register fields
  const inRegName = q('#reg-name');
  const inRegEmail = q('#reg-email');
  const inRegPhone = q('#reg-phone');
  const inRegPassword = q('#reg-password');
  const inRegPasswordConfirm = q('#reg-confirm-password');
  const inRegBusiness = q('#reg-business');

  // Dashboard elements
  const btnLogout = q('#logout-btn');
  const productsLoading = q('#products-loading');
  const productsEmpty = q('#products-empty');
  const productsGrid = q('#products-grid');
  const btnAddProduct = q('#add-product-btn');
  const btnAddFirstProduct = q('#add-first-product-btn');
  const statProducts = q('#stat-products');
  const statSales = q('#stat-sales');     // placeholder dynamic wiring
  const statOrders = q('#stat-orders');   // placeholder dynamic wiring
  const statRating = q('#stat-rating');   // placeholder static for now

  // Modal + form
  const productModal = q('#product-modal');
  const modalTitle = q('#modal-title');
  const productForm = q('#product-form');
  const btnCloseModal = q('#close-modal-btn');
  const btnCancel = q('#cancel-btn');

  // Fields
  const inProdName = q('#product-name');
  const inProdCategory = q('#product-category');
  const inProdPrice = q('#product-price');
  const inProdStock = q('#product-stock');
  const inProdDescription = q('#product-description');

  // Upload widgets
  const uploadArea = q('#upload-area');
  const fileInput = q('#file-input');
  const uploadText = q('#upload-text');
  const imagePreview = q('#image-preview');

  // UI text bits
  const sellerNameEl = q('#seller-name');
  const walletEl = q('#wallet-balance');

  // Toast
  const toastContainer = q('#toast-container');

  // ------------------ Utils -------------------
  function showView(name) {
    if (name === 'auth') {
      viewAuth?.classList.remove('hidden');
      viewDashboard?.classList.add('hidden');
    } else {
      viewDashboard?.classList.remove('hidden');
      viewAuth?.classList.add('hidden');
    }
  }

  function showToast(message, type = 'info', timeout = 3000) {
    if (!toastContainer) return alert(message);
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, timeout);
  }

  function moneyINR(n) {
    try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0); }
    catch { return `₹${(n || 0).toLocaleString('en-IN')}`; }
  }

  // Token helpers
  function saveToken(token) { try { localStorage.setItem('accessToken', token); } catch {} }
  function getSavedToken() { try { return localStorage.getItem('accessToken'); } catch { return null; } }
  function clearToken() {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('sellerId');
      localStorage.removeItem('sellerInfo');
    } catch {}
  }

  // Fetch helpers
  async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json', ...(opts.headers || {}) }, ...opts });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || data.error || (data.errors && data.errors[0]?.msg) || `Request failed (${res.status})`;
      const err = new Error(msg); err.status = res.status; err.data = data; throw err;
    }
    return data;
  }
  async function api(pathOrUrl, opts = {}) {
    const token = getSavedToken();
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
    return fetchJSON(url, { ...opts, headers: { ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  }

  // ------------------ Auth -------------------
  function toggleAuth(tab = 'login') {
    const onLogin = tab === 'login';
    formLogin?.classList.toggle('hidden', !onLogin);
    formRegister?.classList.toggle('hidden', onLogin);

    // visual state
    if (tabLogin) tabLogin.className = onLogin ? 'flex-1 py-2 px-4 rounded-md font-semibold transition-all bg-white text-purple-600 shadow-sm' : 'flex-1 py-2 px-4 rounded-md font-medium transition-all text-gray-600';
    if (tabRegister) tabRegister.className = !onLogin ? 'flex-1 py-2 px-4 rounded-md font-semibold transition-all bg-white text-purple-600 shadow-sm' : 'flex-1 py-2 px-4 rounded-md font-medium transition-all text-gray-600';
  }

  async function handleRegister(e) {
    e.preventDefault();
    const payload = {
      name: inRegName?.value?.trim(),
      email: inRegEmail?.value?.trim().toLowerCase(),
      phone: inRegPhone?.value?.trim(),
      password: inRegPassword?.value || '',
      role: 'seller',
      businessName: inRegBusiness?.value?.trim()
    };
    if (inRegPassword?.value !== inRegPasswordConfirm?.value) {
      showToast("Passwords don't match", 'error');
      return;
    }
    try {
      const data = await api(ROUTES.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showToast(data.message || 'Registration successful! Please verify your email, then log in.', 'success');
      toggleAuth('login');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const payload = {
      email: inLoginEmail?.value?.trim().toLowerCase(),
      password: inLoginPassword?.value || '',
      remember: true
    };
    try {
      const data = await api(ROUTES.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const token = data.accessToken || data.token;
      if (!token) throw new Error('Login succeeded but no token received');

      saveToken(token);
      currentUser = data.user || data.data?.user || null;

      const sellerId = currentUser?.id || currentUser?._id;
      if (sellerId) {
        localStorage.setItem('sellerId', sellerId);
        localStorage.setItem('sellerInfo', JSON.stringify(currentUser));
      }

      if (sellerNameEl && currentUser?.name) sellerNameEl.textContent = currentUser.name;
      if (walletEl) walletEl.textContent = (currentUser?.walletBalance ?? '0.00');

      showToast('Welcome back!', 'success');
      showView('dashboard');
      await initDashboard();
    } catch (err) {
      if (err.status === 403 && (err.data?.needsVerification || /verify/i.test(err.message))) {
        showToast('Please verify your email before logging in.', 'info');
      } else {
        showToast(err.message || 'Login failed', 'error');
      }
    }
  }

  async function handleForgotPassword() {
    const email = inLoginEmail?.value?.trim().toLowerCase();
    if (!email) { showToast('Please enter your email address first', 'error'); return; }
    try {
      const data = await api(ROUTES.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      showToast(data.message || 'Password reset link sent to your email!', 'success');
    } catch (err) { showToast(err.message || 'Failed to send password reset email', 'error'); }
  }

  async function handleResendVerification() {
    const email = inLoginEmail?.value?.trim().toLowerCase();
    if (!email) { showToast('Please enter your email address first', 'error'); return; }
    try {
      const data = await api(ROUTES.resendVerification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      showToast(data.message || 'Verification email sent!', 'success');
    } catch (err) { showToast(err.message || 'Failed to resend verification email', 'error'); }
  }

  async function handleLogout() {
    try { await api(ROUTES.logout, { method: 'POST' }); } catch {}
    clearToken();
    currentUser = null;
    showView('auth');
    toggleAuth('login');
    showToast('Logged out.', 'success');
  }

  // ------------------ Categories ----------------
  async function fetchCategories() {
    try {
      const data = await api(ROUTES.categories);
      categories = data.data?.categories || data.categories || data.data || [];
      renderCategoryOptions();
    } catch (err) {
      categories = [];
      renderCategoryOptions();
      console.warn('Categories failed:', err);
    }
  }
  function renderCategoryOptions() {
    if (!inProdCategory) return;
    inProdCategory.innerHTML = '<option value="">Select Category</option>';
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c._id || c.id || '';
      opt.textContent = c.name || 'Category';
      inProdCategory.appendChild(opt);
    });
  }

  // ------------------ Products (Seller CRUD) ----
  function primaryImageOf(p) {
    const arr = Array.isArray(p.images) ? p.images : [];
    const firstFromArray = arr.length ? (typeof arr[0] === 'string' ? arr[0] : (arr[0]?.url || arr[0]?.secure_url)) : null;
    return firstFromArray || p.image || p.thumbnail || 'https://via.placeholder.com/600x400?text=Product';
    // If your backend returns {images:[{url:"..."}]} or strings, both work.
  }

  async function fetchProducts() {
    try {
      productsLoading?.classList.remove('hidden');

      // Prefer seller namespace
      let data = await api(ROUTES.sellerProducts + '?limit=100');
      let list = data?.data?.products || data?.products || data?.data || [];

      // Fallback: public with seller filter
      if (!Array.isArray(list) || !list.length) {
        const sellerId = localStorage.getItem('sellerId');
        const pub = await api(`${ROUTES.publicProducts}?seller=${encodeURIComponent(sellerId || '')}&limit=100`);
        list = pub?.data?.products || pub?.products || pub?.data || [];
      }

      const sellerId = localStorage.getItem('sellerId');
      if (sellerId && Array.isArray(list)) {
        list = list.filter((p) => {
          const sid = p.seller?._id || p.seller;
          return !sid || sid === sellerId;
        });
      }

      products = list;
      renderProductList();
    } catch (err) {
      products = [];
      renderProductList();
      console.error('Fetch products failed:', err);
      showToast('Failed to load products', 'error');
    } finally {
      productsLoading?.classList.add('hidden');
    }
  }

  function renderProductList() {
    if (!productsGrid || !productsEmpty) return;

    productsGrid.innerHTML = '';
    const hasItems = Array.isArray(products) && products.length > 0;

    productsGrid.classList.toggle('hidden', !hasItems);
    productsEmpty.classList.toggle('hidden', hasItems);

    if (!hasItems) {
      if (statProducts) statProducts.textContent = '0';
      return;
    }

    products.forEach((p) => {
      const img = primaryImageOf(p);
      const categoryName = p.category?.name || p.categoryName || 'General';
      const price = moneyINR(p.price || 0);
      const stock = p.stock ?? 0;
      const isActive = p.isActive ? 'bg-green-500' : 'bg-gray-400';
      const pid = p._id || p.id;

      const card = document.createElement('div');
      card.className = 'product-card bg-white rounded-lg shadow overflow-hidden';
      card.innerHTML = `
        <img src="${img}" alt="${p.name || ''}" class="w-full h-48 object-cover">
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">${categoryName}</span>
            <div class="w-2 h-2 rounded-full ${isActive}"></div>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1 truncate">${p.name || 'Untitled Product'}</h3>
          ${p.description ? `<p class="text-sm text-gray-500 mb-2 line-clamp-2">${p.description}</p>` : ''}
          <div class="flex items-center justify-between mb-3">
            <span class="text-lg font-bold text-gray-900">${price}</span>
            <span class="text-sm text-gray-500">Stock: ${stock}</span>
          </div>
          <div class="flex gap-2">
            <button class="flex-1 border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50 transition-colors" data-edit="${pid}">
              <i data-lucide="edit" class="w-3 h-3 mr-1 inline"></i>Edit
            </button>
            <button class="flex-1 bg-red-600 text-white rounded px-3 py-1 text-sm hover:bg-red-700 transition-colors" data-del="${pid}">
              <i data-lucide="trash-2" class="w-3 h-3 mr-1 inline"></i>Delete
            </button>
          </div>
        </div>
      `;
      productsGrid.appendChild(card);
    });

    // bind edit/delete
    productsGrid.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
      const id = b.getAttribute('data-edit');
      const p = products.find((x) => (x._id || x.id) === id);
      if (p) openProductModal(p);
    }));
    productsGrid.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const id = b.getAttribute('data-del');
      if (!confirm('Delete this product?')) return;
      try {
        await api(`${ROUTES.sellerProducts}/${id}`, { method: 'DELETE' });
        showToast('Product deleted', 'success');
        await fetchProducts();
      } catch (err) {
        showToast(err.message || 'Failed to delete product', 'error');
      }
    }));

    if (statProducts) statProducts.textContent = products.length;
    // Optional placeholders for other stats (hook to real endpoints if available)
    if (statOrders) statOrders.textContent = String(products.reduce((n, _p) => n, 0));
    if (statSales)  statSales.textContent  = moneyINR(0);

    // Refresh icons for newly injected elements
    if (window.lucide) window.lucide.createIcons();
  }

  // ------------------ Product Modal / Save ----------------
  function openProductModal(product = null) {
    editingProduct = product;
    uploadedFiles = [];
    existingImageUrls = [];

    modalTitle.innerHTML = `
      <i data-lucide="info" class="w-5 h-5 text-purple-600"></i>
      ${product ? 'Edit Product' : 'Add New Product'}
    `;

    inProdName.value = product?.name || '';
    inProdCategory.value = (product?.category?._id || product?.category || '');
    inProdPrice.value = product?.price ?? '';
    inProdStock.value = product?.stock ?? '';
    inProdDescription.value = product?.description || '';

    if (product) {
      const arr = Array.isArray(product.images) ? product.images : [];
      existingImageUrls = arr.map(x => (typeof x === 'string' ? x : (x?.url || x?.secure_url))).filter(Boolean);
    }
    updateImagePreview();

    productModal?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeProductModal() {
    productModal?.classList.add('hidden');
    editingProduct = null;
    uploadedFiles = [];
    existingImageUrls = [];
    if (imagePreview) { imagePreview.innerHTML = ''; imagePreview.classList.add('hidden'); }
  }

  function updateImagePreview() {
    if (!imagePreview) return;
    const items = [
      ...existingImageUrls.map((url, idx) => ({ type: 'existing', url, idx })),
      ...uploadedFiles.map((file, idx) => ({ type: 'file', file, idx }))
    ];
    if (!items.length) { imagePreview.classList.add('hidden'); imagePreview.innerHTML = ''; return; }

    imagePreview.classList.remove('hidden');
    imagePreview.innerHTML = items.map(it => {
      const src = it.type === 'existing' ? it.url : URL.createObjectURL(it.file);
      const remAttr = it.type === 'existing' ? `data-remove-existing="${it.idx}"` : `data-remove-file="${it.idx}"`;
      return `
        <div class="relative group">
          <img src="${src}" alt="Preview" class="w-full h-24 object-cover rounded">
          <button type="button" ${remAttr}
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
            ×
          </button>
        </div>
      `;
    }).join('');

    imagePreview.querySelectorAll('[data-remove-existing]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.getAttribute('data-remove-existing');
        existingImageUrls.splice(i, 1);
        updateImagePreview();
      });
    });
    imagePreview.querySelectorAll('[data-remove-file]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.getAttribute('data-remove-file');
        uploadedFiles.splice(i, 1);
        updateImagePreview();
      });
    });
  }

  async function saveProduct(e) {
    e.preventDefault();

    const form = new FormData();
    const name = inProdName?.value?.trim();
    const category = inProdCategory?.value || '';
    const price = inProdPrice?.value ?? '';
    const stock = inProdStock?.value ?? '';
    const description = inProdDescription?.value?.trim();

    if (name) form.append('name', name);
    if (category) form.append('category', category);
    if (price !== '') form.append('price', price);
    if (stock !== '') form.append('stock', stock);
    if (description) form.append('description', description);

    // Keep existing images (if backend supports)
    existingImageUrls.forEach(u => form.append('existingImages[]', u));

    // Append newly selected files
    uploadedFiles.forEach(f => form.append('images', f));
    if (uploadedFiles[0]) form.append('image', uploadedFiles[0]); // backward compatibility

    const sellerId = localStorage.getItem('sellerId');
    if (sellerId) form.append('seller', sellerId);

    try {
      const isEdit = !!editingProduct;
      const id = editingProduct?._id || editingProduct?.id;
      const path = isEdit ? `${ROUTES.sellerProducts}/${id}` : ROUTES.sellerProducts;
      const method = isEdit ? 'PATCH' : 'POST';

      await api(path, { method, body: form });

      showToast(isEdit ? 'Product updated' : 'Product created', 'success');
      closeProductModal();
      await fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  }

  // ------------------ Wiring -------------------
  function wireAuth() {
    tabLogin?.addEventListener('click', () => toggleAuth('login'));
    tabRegister?.addEventListener('click', () => toggleAuth('register'));
    formLogin?.addEventListener('submit', handleLogin);
    formRegister?.addEventListener('submit', handleRegister);

    btnForgotPassword?.addEventListener('click', handleForgotPassword);
    btnResendVerification?.addEventListener('click', handleResendVerification);
  }

  function wireDashboard() {
    btnLogout?.addEventListener('click', handleLogout);
    btnAddProduct?.addEventListener('click', () => openProductModal());
    btnAddFirstProduct?.addEventListener('click', () => openProductModal());
    btnCloseModal?.addEventListener('click', closeProductModal);
    btnCancel?.addEventListener('click', closeProductModal);
    productForm?.addEventListener('submit', saveProduct);

    // Drag & drop handlers
    uploadArea?.addEventListener('click', () => fileInput?.click());
    uploadArea?.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      handleFileList(e.dataTransfer.files);
    });
    fileInput?.addEventListener('change', (e) => handleFileList(e.target.files));
  }

  function handleFileList(files) {
    if (!files || !files.length) return;
    if (uploadText) uploadText.textContent = 'Adding...';
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    uploadedFiles.push(...list);
    updateImagePreview();
    if (uploadText) uploadText.textContent = 'Drop images here or click to upload';
  }

  async function initDashboard() {
    await fetchCategories();
    await fetchProducts();
    if (window.lucide) window.lucide.createIcons();
  }

  async function bootstrap() {
    wireAuth();
    wireDashboard();
    if (window.lucide) window.lucide.createIcons();

    // Auto-login if token present and valid
    const token = getSavedToken();
    if (token) {
      try {
        const me = await api(ROUTES.me);
        currentUser = me.user || me.data?.user || null;
        if (currentUser?.role === 'seller') {
          const sellerId = currentUser.id || currentUser._id;
          if (sellerId) {
            localStorage.setItem('sellerId', sellerId);
            localStorage.setItem('sellerInfo', JSON.stringify(currentUser));
          }
          if (sellerNameEl && currentUser?.name) sellerNameEl.textContent = currentUser.name;
          if (walletEl) walletEl.textContent = (currentUser?.walletBalance ?? '0.00');

          showView('dashboard');
          await initDashboard();
          return;
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      }
    }

    // Default: show auth
    showView('auth');
    toggleAuth('login');
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
