document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://quicklocal-backend.onrender.com/api/v1/admin/products';
  const token = localStorage.getItem('qk_token');

  // DOM Elements
  const loadingIndicator = document.getElementById('loading-indicator');
  const productsTableBody = document.getElementById('products-table-body');
  const refreshBtn = document.getElementById('refresh-products');
  const addProductBtn = document.getElementById('add-product-btn');
  const productModal = document.getElementById('product-modal');
  const modalContent = document.getElementById('product-modal-content');
  const modalClose = document.getElementById('product-modal-close');

  let allProducts = [];

  // Init
  fetchProducts();

  // -------------------------
  // Fetch Products (with retry)
  // -------------------------
  async function fetchProducts(retryCount = 0) {
    showLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        allProducts = data.products || [];
        renderProducts();
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (retryCount < 3) {
        console.log(`Retrying fetch products... (${retryCount + 1})`);
        setTimeout(() => fetchProducts(retryCount + 1), 1000);
      } else {
        loadMockData();
      }
    } finally {
      showLoading(false);
    }
  }

  // -------------------------
  // Render Products
  // -------------------------
  function renderProducts() {
    if (allProducts.length === 0) {
      productsTableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-6 text-gray-500">No products found</td></tr>
      `;
      return;
    }

    productsTableBody.innerHTML = allProducts.map(product => `
      <tr>
        <td><img src="${product.image}" alt="${product.name}" class="h-12 w-12 object-cover rounded"></td>
        <td class="font-medium">${product.name}</td>
        <td>$${product.price?.toFixed(2) || '0.00'}</td>
        <td>
          <span class="px-2 py-1 rounded text-xs font-medium
            ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 
              product.stock <= 20 ? 'bg-yellow-100 text-yellow-700' : 
              'bg-green-100 text-green-700'}">
            ${product.stock}
          </span>
        </td>
        <td>${product.seller?.name || 'Admin'}</td>
        <td>
          <span class="px-2 py-1 rounded text-xs font-medium
            ${product.status === 'Active' ? 'bg-green-100 text-green-700' :
              product.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'}">
            ${product.status}
          </span>
        </td>
        <td>
          <button class="btn-view" data-id="${product._id}">View</button>
          <button class="btn-edit" data-id="${product._id}">Edit</button>
          <button class="btn-delete text-red-600" data-id="${product._id}">Delete</button>
        </td>
      </tr>
    `).join('');

    attachProductActions();
  }

  // -------------------------
  // Product Actions
  // -------------------------
  function attachProductActions() {
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => viewProduct(btn.dataset.id));
    });
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }

  function viewProduct(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    modalContent.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${product.name}</h3>
      <img src="${product.image}" class="w-32 h-32 object-cover rounded mb-4">
      <p><strong>Price:</strong> $${product.price?.toFixed(2)}</p>
      <p><strong>Stock:</strong> ${product.stock}</p>
      <p><strong>Status:</strong> ${product.status}</p>
      <p><strong>Seller:</strong> ${product.seller?.name || 'Admin'}</p>
      <p><strong>Description:</strong> ${product.description || '—'}</p>
    `;
    productModal.classList.remove('hidden');
  }

  function editProduct(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    modalContent.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">Edit ${product.name}</h3>
      <label class="block mb-2">Name</label>
      <input id="edit-name" class="border rounded px-2 py-1 w-full mb-2" value="${product.name}">
      
      <label class="block mb-2">Price</label>
      <input id="edit-price" type="number" step="0.01" class="border rounded px-2 py-1 w-full mb-2" value="${product.price}">
      
      <label class="block mb-2">Stock</label>
      <input id="edit-stock" type="number" class="border rounded px-2 py-1 w-full mb-2" value="${product.stock}">
      
      <label class="block mb-2">Status</label>
      <select id="edit-status" class="border rounded px-2 py-1 w-full mb-4">
        <option value="Active" ${product.status === 'Active' ? 'selected' : ''}>Active</option>
        <option value="Draft" ${product.status === 'Draft' ? 'selected' : ''}>Draft</option>
        <option value="Archived" ${product.status === 'Archived' ? 'selected' : ''}>Archived</option>
      </select>
      
      <button id="save-product" class="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
    `;
    productModal.classList.remove('hidden');

    document.getElementById('save-product').addEventListener('click', async () => {
      const updatedProduct = {
        name: document.getElementById('edit-name').value,
        price: parseFloat(document.getElementById('edit-price').value),
        stock: parseInt(document.getElementById('edit-stock').value),
        status: document.getElementById('edit-status').value
      };
      await updateProduct(productId, updatedProduct);
      productModal.classList.add('hidden');
    });
  }

  async function updateProduct(productId, updatedProduct) {
    showLoading(true);
    try {
      const res = await fetch(`${API_URL}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProduct)
      });
      const data = await res.json();

      if (res.ok) {
        const index = allProducts.findIndex(p => p._id === productId);
        if (index !== -1) allProducts[index] = { ...allProducts[index], ...updatedProduct };
        renderProducts();
        alert('✅ Product updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Update product error:', err);
      alert('❌ Failed to update product');
    } finally {
      showLoading(false);
    }
  }

  async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    showLoading(true);
    try {
      const res = await fetch(`${API_URL}/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        allProducts = allProducts.filter(p => p._id !== productId);
        renderProducts();
        alert('🗑️ Product deleted');
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      alert('❌ Failed to delete product');
    } finally {
      showLoading(false);
    }
  }

  // -------------------------
  // Helpers
  // -------------------------
  if (refreshBtn) refreshBtn.addEventListener('click', fetchProducts);
  if (addProductBtn) addProductBtn.addEventListener('click', () => {
    alert('⚠️ Add product modal not implemented yet');
  });
  if (modalClose) modalClose.addEventListener('click', () => productModal.classList.add('hidden'));

  function showLoading(show) {
    if (!loadingIndicator) return;
    loadingIndicator.classList.toggle('hidden', !show);
  }

  function loadMockData() {
    allProducts = [
      {
        _id: 'P101',
        name: 'Smartphone',
        price: 699.99,
        stock: 12,
        status: 'Active',
        image: 'https://via.placeholder.com/80',
        description: 'A high-end smartphone',
        seller: { name: 'John Doe' }
      },
      {
        _id: 'P102',
        name: 'Shoes',
        price: 89.50,
        stock: 5,
        status: 'Draft',
        image: 'https://via.placeholder.com/80',
        description: 'Comfortable running shoes',
        seller: { name: 'Jane Smith' }
      }
    ];
    renderProducts();
    console.log('⚠️ Using mock product data');
  }
});
