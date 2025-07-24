const API_BASE_URL = 'https://ecommerce-backend-8ykq.onrender.com';
let products = [];
let editingProductId = null;
let productToDelete = null;
let currentView = 'seller';

document.addEventListener('DOMContentLoaded', () => {
  const addProductBtn = document.getElementById('add-product-btn');
  const productFormSection = document.getElementById('product-form-section');
  const closeFormBtn = document.getElementById('close-form-btn');
  const cancelFormBtn = document.getElementById('cancel-form-btn');
  const productForm = document.getElementById('product-form');
  const productList = document.getElementById('product-list');
  const fileUploadArea = document.getElementById('file-upload-area');
  const productImagesInput = document.getElementById('product-images');
  const imagePreview = document.getElementById('image-preview');
  const deleteModal = document.getElementById('delete-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const customerViewSection = document.getElementById('customer-view');
  const productsGrid = document.getElementById('products-grid');
  const formTitle = document.querySelector('.form-title');

  const sellerId = localStorage.getItem("sellerId") || "seller123"; // Replace with actual login logic

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification show';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function toggleFormSection(show) {
    productFormSection.style.display = show ? 'block' : 'none';
  }

  function resetForm() {
    productForm.reset();
    imagePreview.innerHTML = '';
    editingProductId = null;
    formTitle.textContent = 'Add New Product';
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.innerHTML = `<img src="${e.target.result}" style="max-width: 100px;">`;
        imagePreview.dataset.url = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?seller=${sellerId}`);
      products = await res.json();
      renderProductList();
      renderCustomerView();
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }

  function renderProductList() {
    productList.innerHTML = '';
    if (products.length === 0) {
      productList.innerHTML = '<p>No products added yet.</p>';
      return;
    }
    products.forEach((product) => {
      const row = document.createElement('div');
      row.className = 'product-row';
      row.innerHTML = `
        <img src="${product.image}" class="product-thumbnail">
        <strong>${product.name}</strong> (${product.category}) - ₹${product.price} | Stock: ${product.stock}
        <button class="edit-btn" data-id="${product._id}">Edit</button>
        <button class="delete-btn" data-id="${product._id}">Delete</button>
      `;
      productList.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = () => editProduct(btn.dataset.id);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = () => showDeleteModal(btn.dataset.id);
    });
  }

  function renderCustomerView() {
    productsGrid.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>₹${product.price}</p>
        <p>Stock: ${product.stock}</p>
      `;
      productsGrid.appendChild(card);
    });
  }

  async function saveProduct(e) {
    e.preventDefault();

    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const description = document.getElementById('product-description').value;
    const imageUrl = imagePreview.querySelector('img')?.src || '';

    if (!name || !category || isNaN(price) || isNaN(stock)) {
      showToast('Please fill in all fields correctly.');
      return;
    }

    const productData = {
      name,
      category,
      price,
      stock,
      description,
      image: imageUrl,
      seller: sellerId
    };

    try {
      if (editingProductId) {
        const res = await fetch(`${API_BASE_URL}/api/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        if (res.ok) {
          showToast('✅ Product updated');
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        if (res.ok) {
          showToast('✅ Product added');
        }
      }

      resetForm();
      toggleFormSection(false);
      fetchProducts();
    } catch (error) {
      console.error("Product save error:", error);
      showToast("❌ Backend error occurred");
    }
  }

  function editProduct(id) {
    const product = products.find(p => p._id === id);
    if (product) {
      editingProductId = id;
      formTitle.textContent = 'Edit Product';
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-category').value = product.category;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-stock').value = product.stock;
      document.getElementById('product-description').value = product.description;
      imagePreview.innerHTML = `<img src="${product.image}" style="max-width: 100px;">`;
      toggleFormSection(true);
    }
  }

  function showDeleteModal(id) {
    productToDelete = id;
    const product = products.find(p => p._id === id);
    document.querySelector('.product-name-to-delete').textContent = product?.name || '';
    deleteModal.hidden = false;
  }

  async function deleteProduct() {
    try {
      await fetch(`${API_BASE_URL}/api/products/${productToDelete}`, {
        method: 'DELETE'
      });
      showToast("🗑️ Product deleted");
      deleteModal.hidden = true;
      fetchProducts();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("❌ Failed to delete");
    }
  }

  function updateView() {
    const sellerSection = document.querySelector('.product-management');
    if (currentView === 'seller') {
      sellerSection.style.display = 'block';
      customerViewSection.style.display = 'none';
    } else {
      sellerSection.style.display = 'none';
      customerViewSection.style.display = 'block';
    }
  }

  // INIT
  fetchProducts();
  updateView();

  // Event listeners
  addProductBtn.addEventListener('click', () => {
    resetForm();
    toggleFormSection(true);
  });
  closeFormBtn.addEventListener('click', () => toggleFormSection(false));
  cancelFormBtn.addEventListener('click', () => {
    resetForm();
    toggleFormSection(false);
  });
  productForm.addEventListener('submit', saveProduct);
  productImagesInput.addEventListener('change', handleFileSelect);
  fileUploadArea.addEventListener('click', () => productImagesInput.click());
  confirmDeleteBtn.addEventListener('click', deleteProduct);
  cancelDeleteBtn.addEventListener('click', () => deleteModal.hidden = true);
  closeModalBtn.addEventListener('click', () => deleteModal.hidden = true);

  document.querySelectorAll('.sidebar-nav ul li a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.sidebar-nav ul li').forEach(li => li.classList.remove('active'));
      this.closest('li').classList.add('active');
      currentView = this.getAttribute('href') === '#orders' ? 'customer' : 'seller';
      updateView();
    });
  });
});
