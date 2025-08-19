// API and State Configuration
const API_BASE_URL = 'https://quicklocal-backend.onrender.com';
let products = [];
let editingProductId = null;

// DOM Element References
const productForm = document.getElementById('product-form');
const productListContainer = document.getElementById('product-list');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const toastContainer = document.getElementById('toast-container');
const productImageInput = document.getElementById('product-image');
const imagePreview = document.getElementById('image-preview');

// --- Toast Notifications ---
function showToast(message, isError = false) {
  const toast = document.createElement('div');
  // Simple toast styling (can be enhanced in CSS)
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.padding = '15px';
  toast.style.background = isError ? '#ef4444' : '#10b981';
  toast.style.color = 'white';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '1000';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


// --- Save Product (Create/Update) ---
async function saveProduct(e) {
  e.preventDefault();
  const sellerId = localStorage.getItem("sellerId");
  if (!sellerId) {
    showToast("❌ Cannot save product. Please log in again.", true);
    return;
  }

  const isUpdating = !!editingProductId;
  let imageUrl;

  // Use the pre-uploaded URL from the HTML's data attribute.
  const uploadedUrl = productImageInput.dataset.uploadedUrl;

  if (uploadedUrl) {
    // A new image was uploaded.
    imageUrl = uploadedUrl;
  } else if (isUpdating) {
    // Editing, but no new image was selected. Keep the existing one.
    const existingProduct = products.find(p => p._id === editingProductId);
    imageUrl = existingProduct.images?.[0]?.url || "https://via.placeholder.com/400x400";
  } else {
    // Creating a new product without an image.
    imageUrl = "https://via.placeholder.com/400x400";
  }

  const productData = {
    name: document.getElementById('product-name').value.trim(),
    category: document.getElementById('product-category').value.trim(),
    price: parseFloat(document.getElementById('product-price').value),
    stock: parseInt(document.getElementById('product-stock').value),
    description: document.getElementById('product-description').value.trim(),
    // Correctly reference the checkbox for discount.
    discountPercentage: document.getElementById('product-discount').checked ? 10 : 0, // Example discount
    images: [{ url: imageUrl }],
    seller: sellerId
  };

  const url = isUpdating ? `${API_BASE_URL}/api/v1/products/${editingProductId}` : `${API_BASE_URL}/api/v1/products`;
  const method = isUpdating ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (!res.ok) throw new Error(`Server returned status ${res.status}`);
    await res.json();

    showToast(isUpdating ? "✅ Product updated!" : "✅ Product added!");
    resetForm();
    await fetchProducts();
  } catch (error) {
    console.error("Product save error:", error);
    showToast("❌ Failed to save product.", true);
  }
}


// --- Fetch Products for Seller ---
async function fetchProducts() {
  const sellerId = localStorage.getItem("sellerId");
  if (!sellerId) {
    showToast("Seller ID not found. Please log in.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/products?seller=${sellerId}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    products = json.data?.products || [];
    renderProductList();
  } catch (err) {
    console.error("Failed to fetch products:", err);
    showToast("❌ Failed to load products.", true);
  }
}


// --- Reset Form ---
function resetForm() {
  productForm.reset();
  editingProductId = null;
  
  // Clear the stored image URL and the preview.
  productImageInput.dataset.uploadedUrl = '';
  imagePreview.innerHTML = '';
  
  cancelEditBtn.style.display = 'none';
  document.getElementById('modalTitle').textContent = 'Add New Product';
}


// --- Render Product List ---
function renderProductList() {
  productListContainer.innerHTML = '';
  if (products.length === 0) {
    productListContainer.innerHTML = '<p class="text-center text-gray-500">You have not added any products yet.</p>';
    return;
  }
  
  // Using a more robust grid layout for the product cards
  const productGrid = document.createElement('div');
  productGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300';
    card.innerHTML = `
      <img src="${product.images?.[0]?.url}?tr=w-400,h-400" alt="${product.name}" class="w-full h-48 object-cover" />
      <div class="p-4">
        <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
        <p class="text-xl font-bold text-blue-600 mt-1">₹${product.price}</p>
        <p class="text-sm text-gray-600 mt-1">Stock: ${product.stock}</p>
        <div class="flex justify-end space-x-2 mt-4">
          <button onclick="editProduct('${product._id}')" class="text-blue-500 hover:text-blue-700 font-semibold">Edit</button>
          <button class="text-red-500 hover:text-red-700 font-semibold" onclick="confirmDeleteProduct('${product._id}')">Delete</button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });
  productListContainer.appendChild(productGrid);
}


// --- Edit Product ---
window.editProduct = (productId) => {
  const product = products.find(p => p._id === productId);
  if (!product) return;
  
  editingProductId = productId;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-category').value = product.category;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-discount').checked = (product.discountPercentage || 0) > 0;
  document.getElementById('product-description').value = product.description;
  
  // Show existing image in preview
  imagePreview.innerHTML = `<img src="${product.images?.[0]?.url}" style="max-width: 150px;" alt="Current image" />`;
  
  document.getElementById('modalTitle').textContent = 'Edit Product';
  cancelEditBtn.style.display = 'inline-block';

  // Assuming the form is in a modal, show the modal.
  document.getElementById('productModal').classList.remove('hidden');
};


// --- Confirm and Delete Product ---
window.confirmDeleteProduct = (productId) => {
  if (confirm('Are you sure you want to delete this product?')) {
    deleteProduct(productId);
  }
};

async function deleteProduct(productId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/products/${productId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    showToast('✅ Product deleted successfully.');
    await fetchProducts();
  } catch (err) {
    console.error('Failed to delete product:', err);
    showToast('❌ Failed to delete product.', true);
  }
}


// --- Modal Controls (assuming you have them in your HTML) ---
const addProductBtn = document.getElementById('addProductBtn');
const closeModalBtn = document.getElementById('closeModal');
const productModal = document.getElementById('productModal');

addProductBtn?.addEventListener('click', () => {
    resetForm(); // Ensure form is fresh
    productModal?.classList.remove('hidden');
});

closeModalBtn?.addEventListener('click', () => {
    productModal?.classList.add('hidden');
    resetForm();
});


// --- Event Listeners and Initial Load ---
productForm.addEventListener("submit", saveProduct);
cancelEditBtn.addEventListener("click", () => {
    productModal?.classList.add('hidden');
    resetForm();
});

document.addEventListener('DOMContentLoaded', () => {
  // Demo sellerId. Replace with your actual authentication logic.
  if (!localStorage.getItem('sellerId')) {
    localStorage.setItem('sellerId', '668eb03859052b12d7c62c2f'); 
  }
  fetchProducts();
});