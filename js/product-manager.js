// ✅ BACKEND-CONNECTED VERSION using APP_CONFIG from global config.js
class ProductManager {
  constructor(sellerId) {
    this.sellerId = sellerId;
    this.products = [];
    this.initElements();
    this.initEventListeners();
    this.fetchProducts();
  }

  initElements() {
    this.elements = {
      productForm: document.getElementById('product-form'),
      productList: document.getElementById('product-list'),
      addProductBtn: document.getElementById('add-product-btn'),
      searchInput: document.getElementById('search-products'),
      modal: document.getElementById('modal-container'),
    };
  }

  initEventListeners() {
    this.elements.addProductBtn.addEventListener('click', () => this.showProductForm());
    this.elements.searchInput.addEventListener('input', (e) => this.searchProducts(e.target.value));
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-product')) this.editProduct(e.target.dataset.id);
      if (e.target.classList.contains('delete-product')) this.confirmDeleteProduct(e.target.dataset.id);
    });
  }

  async fetchProducts() {
    try {
      const res = await fetch(`${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.PRODUCTS}?seller=${this.sellerId}`);
      this.products = await res.json();
      this.renderProductList();
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('Failed to load products', 'error');
    }
  }

  showProductForm(product = null) {
    const formHTML = `
      <form id="product-form-modal">
        <h3>${product ? 'Edit' : 'Add'} Product</h3>
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="product-name" value="${product?.name || ''}" required>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input type="text" id="product-category" value="${product?.category || ''}" required>
        </div>
        <div class="form-group">
          <label>Price</label>
          <input type="number" id="product-price" value="${product?.price || ''}" required>
        </div>
        <div class="form-group">
          <label>Stock</label>
          <input type="number" id="product-stock" value="${product?.stock || ''}" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="product-description">${product?.description || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary cancel-form">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>`;

    showModal(formHTML);

    document.getElementById('product-form-modal').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProduct(product?._id);
    });

    document.querySelector('.cancel-form').addEventListener('click', hideModal);
  }

  async saveProduct(productId) {
    const productData = {
      name: document.getElementById('product-name').value,
      category: document.getElementById('product-category').value,
      price: parseFloat(document.getElementById('product-price').value),
      stock: parseInt(document.getElementById('product-stock').value),
      description: document.getElementById('product-description').value,
      seller: this.sellerId
    };

    const url = productId
      ? `${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.PRODUCTS}/${productId}`
      : `${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.PRODUCTS}`;
    const method = productId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: APP_CONFIG.API.DEFAULT_HEADERS,
        body: JSON.stringify(productData)
      });
      if (!res.ok) throw new Error('Save failed');
      hideModal();
      showToast(`Product ${productId ? 'updated' : 'added'} successfully`);
      this.fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('Error saving product', 'error');
    }
  }

  async confirmDeleteProduct(productId) {
    const confirmed = confirm('Are you sure you want to delete this product?');
    if (confirmed) this.deleteProduct(productId);
  }

  async deleteProduct(productId) {
    try {
      const res = await fetch(`${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.PRODUCTS}/${productId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Product deleted');
      this.fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    }
  }

  renderProductList() {
    const html = this.products.length
      ? this.products.map(product => `
        <div class="product-item">
          <span>${product.name} (₹${product.price})</span>
          <div class="product-actions">
            <button class="btn btn-sm edit-product" data-id="${product._id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-product" data-id="${product._id}">Delete</button>
          </div>
        </div>
      `).join('')
      : '<div class="empty-state">No products found</div>';

    this.elements.productList.innerHTML = html;
  }

  searchProducts(query) {
    // 💡 A client-side search is fine for small datasets. For larger inventories,
    // consider changing this to an API call for a server-side search.
    const filtered = this.products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    this.elements.productList.innerHTML = filtered.map(product => `
      <div class="product-item">
        <span>${product.name} (₹${product.price})</span>
        <div class="product-actions">
          <button class="btn btn-sm edit-product" data-id="${product._id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-product" data-id="${product._id}">Delete</button>
        </div>
      </div>
    `).join('');
  }
}

async function resolveSellerId() {
  try {
    if (window.HybridAuthClient && typeof window.HybridAuthClient.getCurrentUser === 'function') {
      const user = window.HybridAuthClient.getCurrentUser();
      if (user && (user.id || user._id)) {
        return user.id || user._id;
      }
    }
  } catch (_) {}

  try {
    const base = window.QUICKLOCAL_API_BASE || 'https://ecommerce-backend-mlik.onrender.com/api/v1';
    const response = await fetch(`${base}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) return null;

    const payload = await response.json().catch(() => ({}));
    const user = payload?.user || payload?.data?.user || payload?.data || null;
    return user?.id || user?._id || null;
  } catch (_) {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const sellerId = await resolveSellerId();
  if (!sellerId) {
    window.location.href = 'seller-login.html';
    return;
  }

  new ProductManager(sellerId);
});