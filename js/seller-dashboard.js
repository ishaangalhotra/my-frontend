/* =========================================================================
   SELLER DASHBOARD – Amazon/Flipkart-style flow
   Works with quicklocal-backend.onrender.com (Express + MongoDB)
   ========================================================================= */

(() => {
  // ==========================
  // Config
  // ==========================
  const API_ORIGIN = 'https://quicklocal-backend.onrender.com';
  const API_BASE = `${API_ORIGIN}/api/v1`;

  // Back-end routes
  const ROUTES = {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    categories: '/categories',
    // Seller CRUD should use seller namespace; public list uses /products
    sellerProducts: '/seller/products',
    publicProducts: '/products'
  };

  // ==========================
  // State
  // ==========================
  let currentUser = null;
  let products = [];
  let categories = [];
  let editingProductId = null;

  // ==========================
  // DOM
  // ==========================
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));

  // Auth views
  const viewAuth = q('#view-auth');
  const viewDashboard = q('#view-dashboard');

  // Tabs & forms
  const tabLogin = q('#tab-login');
  const tabRegister = q('#tab-register');
  const formLogin = q('#form-login');
  const formRegister = q('#form-register');

  // Login fields
  const inLoginEmail = q('#login-email');
  const inLoginPassword = q('#login-password');

  // Register fields
  const inRegName = q('#reg-name');
  const inRegEmail = q('#reg-email');
  const inRegPhone = q('#reg-phone');
  const inRegPassword = q('#reg-password');
  const inRegBusiness = q('#reg-business');

  // Dashboard elements
  const btnLogout = q('#btn-logout');
  const btnAddProduct = q('#btn-add-product');
  const productsWrap = q('#seller-products');
  const emptyState = q('#empty-products');

  // Modal + form
  const productModal = q('#product-modal');
  const productForm = q('#product-form');
  const productTitle = q('#product-modal-title');

  const inProdName = q('#product-name');
  const inProdCategory = q('#product-category');
  const inProdPrice = q('#product-price');
  const inProdStock = q('#product-stock');
  const inProdDescription = q('#product-description');
  const inProdImage = q('#product-image');
  const imagePreview = q('#image-preview');
  const btnCloseModal = q('#close-product-modal');

  // Toast
  const toastContainer = q('#toast-container');

  // ==========================
  // Utils
  // ==========================
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
    setTimeout(() => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 300);
    }, timeout);
  }

  function moneyINR(n) {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
    } catch {
      return `₹${(n || 0).toLocaleString('en-IN')}`;
    }
  }

  // Token helpers
  function saveToken(token) {
    try { localStorage.setItem('accessToken', token); } catch {}
  }
  function getSavedToken() {
    try { return localStorage.getItem('accessToken'); } catch { return null; }
  }
  function clearToken() {
    try { localStorage.removeItem('accessToken'); } catch {}
  }

  // Fetch wrappers
  async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        ...(opts.headers || {})
      },
      credentials: 'include'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || data.error || (data.errors && data.errors[0]?.msg) || `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function authenticatedFetch(pathOrUrl, opts = {}) {
    const token = getSavedToken();
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
    return fetchJSON(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  }

  // ==========================
  // Auth
  // ==========================
  function toggleAuth(tab = 'login') {
    if (tab === 'login') {
      tabLogin?.classList.add('active');
      tabRegister?.classList.remove('active');
      formLogin?.classList.remove('hidden');
      formRegister?.classList.add('hidden');
    } else {
      tabRegister?.classList.add('active');
      tabLogin?.classList.remove('active');
      formRegister?.classList.remove('hidden');
      formLogin?.classList.add('hidden');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const payload = {
      name: inRegName?.value?.trim(),
      email: inRegEmail?.value?.trim(),
      phone: inRegPhone?.value?.trim(),
      password: inRegPassword?.value || '',
      role: 'seller',
      businessName: inRegBusiness?.value?.trim()
    };

    try {
      const data = await fetchJSON(`${API_BASE}${ROUTES.register}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // Backend asks for email verification first (no token here)
      showToast(data.message || 'Registration successful! Please verify your email, then log in.', 'success');
      toggleAuth('login');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const payload = {
      email: inLoginEmail?.value?.trim(),
      password: inLoginPassword?.value || '',
      remember: true
    };

    try {
      const data = await fetchJSON(`${API_BASE}${ROUTES.login}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const token = data.accessToken || data.token;
      if (!token) throw new Error('Login succeeded but no token received');

      saveToken(token);
      currentUser = data.user || data.data?.user || null;

      // Keep for seller-scoped filtering if needed
      const sellerId = currentUser?.id || currentUser?._id;
      if (sellerId) {
        localStorage.setItem('sellerId', sellerId);
        localStorage.setItem('sellerInfo', JSON.stringify(currentUser));
      }

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

  async function handleLogout() {
    try {
      await fetchJSON(`${API_BASE}${ROUTES.logout}`, { method: 'POST' }).catch(() => ({}));
    } finally {
      clearToken();
      localStorage.removeItem('sellerId');
      localStorage.removeItem('sellerInfo');
      currentUser = null;
      showView('auth');
      toggleAuth('login');
      showToast('Logged out.', 'success');
    }
  }

  // ==========================
  // Categories
  // ==========================
  async function fetchCategories() {
    try {
      const data = await authenticatedFetch(ROUTES.categories);
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
    inProdCategory.innerHTML = '<option value="">Select category</option>';
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c._id || c.id || '';
      opt.textContent = c.name || 'Category';
      inProdCategory.appendChild(opt);
    });
  }

  // ==========================
  // Products (Seller CRUD)
  // ==========================
  async function fetchProducts() {
    // Prefer seller-scoped endpoint; back-end should infer seller from token
    try {
      const data = await authenticatedFetch(ROUTES.sellerProducts + '?limit=100');
      let list = data?.data?.products || data?.products || data?.data || [];
      // Fallback to public endpoint if seller endpoint not available
      if (!Array.isArray(list) || !list.length) {
        const sellerId = localStorage.getItem('sellerId');
        const pub = await authenticatedFetch(`${ROUTES.publicProducts}?seller=${encodeURIComponent(sellerId || '')}&limit=100`);
        list = pub?.data?.products || pub?.products || pub?.data || [];
      }
      // Final safety filter by seller
      const sellerId = localStorage.getItem('sellerId');
      if (sellerId && Array.isArray(list)) {
        list = list.filter((p) => {
          const s = p.seller?._id || p.seller;
          return !s || s === sellerId; // if API already scoped, many items may not include seller
        });
      }
      products = list;
      renderProductList();
    } catch (err) {
      products = [];
      renderProductList();
      console.error('Fetch products failed:', err);
      showToast('Failed to load products', 'error');
    }
  }

  function renderProductList() {
    if (!productsWrap) return;
    productsWrap.innerHTML = '';
    const hasItems = Array.isArray(products) && products.length > 0;
    if (emptyState) emptyState.classList.toggle('hidden', hasItems);
    if (!hasItems) return;

    products.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'seller-product';
      const img = (p.images?.[0]?.url) || p.image || p.thumbnail || 'https://via.placeholder.com/600x400?text=Product';
      const categoryName = p.category?.name || p.categoryName || '—';
      const price = moneyINR(p.price || 0);
      const stock = p.stock ?? 0;

      el.innerHTML = `
        <div class="sp-card">
          <div class="sp-left">
            <img class="sp-img" src="${img}" alt="${p.name || ''}">
          </div>
          <div class="sp-mid">
            <div class="sp-name">${p.name || 'Untitled Product'}</div>
            <div class="sp-cat">Category: ${categoryName}</div>
            <div class="sp-desc">${(p.description || '').slice(0, 160)}</div>
          </div>
          <div class="sp-right">
            <div class="sp-price">${price}</div>
            <div class="sp-stock">Stock: ${stock}</div>
            <div class="sp-actions">
              <button class="btn btn-light" data-edit="${p._id || p.id}">Edit</button>
              <button class="btn btn-danger" data-del="${p._id || p.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
      productsWrap.appendChild(el);
    });

    // Wire actions
    qa('[data-edit]').forEach((b) => b.addEventListener('click', () => openEditProduct(b.getAttribute('data-edit'))));
    qa('[data-del]').forEach((b) => b.addEventListener('click', () => deleteProduct(b.getAttribute('data-del'))));
  }

  function openCreateProduct() {
    editingProductId = null;
    productTitle && (productTitle.textContent = 'Add Product');
    productForm?.reset();
    if (imagePreview) imagePreview.innerHTML = '';
    productModal?.classList.remove('hidden');
  }

  function openEditProduct(id) {
    const p = products.find((x) => (x._id || x.id) === id);
    if (!p) return;
    editingProductId = id;
    productTitle && (productTitle.textContent = 'Edit Product');

    if (inProdName) inProdName.value = p.name || '';
    if (inProdCategory) inProdCategory.value = p.category?._id || p.category || '';
    if (inProdPrice) inProdPrice.value = p.price ?? '';
    if (inProdStock) inProdStock.value = p.stock ?? '';
    if (inProdDescription) inProdDescription.value = p.description || '';
    if (imagePreview) {
      const img = (p.images?.[0]?.url) || p.image || p.thumbnail;
      imagePreview.innerHTML = img ? `<img src="${img}" alt="preview" style="max-height:140px;border-radius:12px;object-fit:cover">` : '';
    }
    productModal?.classList.remove('hidden');
  }

  function closeProductModal() {
    productModal?.classList.add('hidden');
    productForm?.reset();
    editingProductId = null;
    if (imagePreview) imagePreview.innerHTML = '';
  }

  async function createOrUpdateProduct(e) {
    e.preventDefault();

    const name = inProdName?.value?.trim();
    const category = inProdCategory?.value || '';
    const price = parseFloat(inProdPrice?.value || '0');
    const stock = parseInt(inProdStock?.value || '0', 10);
    const description = inProdDescription?.value?.trim();
    const file = inProdImage?.files?.[0];

    const form = new FormData();
    if (name) form.append('name', name);
    if (category) form.append('category', category);
    if (!Number.isNaN(price)) form.append('price', price);
    if (!Number.isNaN(stock)) form.append('stock', stock);
    if (description) form.append('description', description);
    if (file) form.append('image', file);

    // Optional: ensure seller id available (often inferred server-side)
    const sellerId = localStorage.getItem('sellerId');
    if (sellerId) form.append('seller', sellerId);

    try {
      let path = ROUTES.sellerProducts;
      let method = 'POST';
      if (editingProductId) {
        path = `${ROUTES.sellerProducts}/${editingProductId}`;
        method = 'PATCH';
      }

      await authenticatedFetch(path, {
        method,
        body: form // headers set automatically by browser for multipart
      });

      showToast(editingProductId ? 'Product updated' : 'Product created', 'success');
      closeProductModal();
      await fetchProducts();
    } catch (err) {
      console.error('Save product error:', err);
      showToast(err.message || 'Failed to save product', 'error');
    }
  }

  async function deleteProduct(id) {
    if (!id) return;
    if (!confirm('Delete this product?')) return;
    try {
      await authenticatedFetch(`${ROUTES.sellerProducts}/${id}`, { method: 'DELETE' });
      showToast('Product deleted', 'success');
      await fetchProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  }

  // ==========================
  // Wiring
  // ==========================
  function wireAuth() {
    tabLogin?.addEventListener('click', () => toggleAuth('login'));
    tabRegister?.addEventListener('click', () => toggleAuth('register'));
    formLogin?.addEventListener('submit', handleLogin);
    formRegister?.addEventListener('submit', handleRegister);
  }

  function wireDashboard() {
    btnLogout?.addEventListener('click', handleLogout);
    btnAddProduct?.addEventListener('click', openCreateProduct);
    btnCloseModal?.addEventListener('click', closeProductModal);
    productForm?.addEventListener('submit', createOrUpdateProduct);

    inProdImage?.addEventListener('change', () => {
      const file = inProdImage.files && inProdImage.files[0];
      if (!imagePreview) return;
      imagePreview.innerHTML = file
        ? `<img src="${URL.createObjectURL(file)}" alt="preview" style="max-height:140px;border-radius:12px;object-fit:cover">`
        : '';
    });
  }

  async function initDashboard() {
    await fetchCategories();
    await fetchProducts();
  }

  async function bootstrap() {
    wireAuth();
    wireDashboard();

    // Auto-login if token present and valid
    const token = getSavedToken();
    if (token) {
      try {
        const me = await authenticatedFetch(ROUTES.me);
        currentUser = me.user || me.data?.user || null;
        if (currentUser) {
          const sellerId = currentUser.id || currentUser._id;
          if (sellerId) {
            localStorage.setItem('sellerId', sellerId);
            localStorage.setItem('sellerInfo', JSON.stringify(currentUser));
          }
          showView('dashboard');
          await initDashboard();
          return;
        }
      } catch {
        // token invalid, fall through to auth view
        clearToken();
      }
    }

    // Default: show auth
    showView('auth');
    toggleAuth('login');
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
