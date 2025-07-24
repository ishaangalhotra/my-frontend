document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const productsBody = document.getElementById('productsBody');
  const refreshBtn = document.getElementById('refreshBtn');
  
  // State
  let products = [];
  
  // Initialize
  fetchProducts();
  setupEventListeners();
  
  // Functions
  function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchProducts);
  }
  
  async function fetchProducts() {
    try {
      // In a real app, replace with your actual API endpoint
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      
      if (response.ok) {
        products = data.products || [];
        renderProducts();
      } else {
        console.error('Failed to fetch products:', data.message);
        // Fallback to mock data
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data
      loadMockData();
    }
  }
  
  function renderProducts() {
    productsBody.innerHTML = products.map(product => `
      <tr>
        <td class="product-image-cell">
          <img src="${product.image || '/images/product-placeholder.jpg'}" 
               alt="${product.name}" 
               class="product-thumbnail">
          ${product.name}
        </td>
        <td>₹${product.price.toFixed(2)}</td>
        <td class="stock-${getStockLevel(product.stock)}">${product.stock}</td>
        <td>${product.seller?.name || 'System'}</td>
        <td>
          <span class="status-badge status-${product.status}">
            ${product.status.charAt(0).toUpperCase() + product.status.slice(1)}
          </span>
        </td>
        <td class="action-buttons">
          <button class="action-btn btn-view" data-id="${product._id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn btn-edit" data-id="${product._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn btn-delete" data-id="${product._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => viewProductDetails(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
  }
  
  function getStockLevel(stock) {
    if (stock === 0) return 'low';
    if (stock < 10) return 'medium';
    return 'high';
  }
  
  function viewProductDetails(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    alert(`Product Details:\n\nName: ${product.name}\nPrice: ₹${product.price.toFixed(2)}\nStock: ${product.stock}\nStatus: ${product.status}\nSeller: ${product.seller?.name || 'System'}`);
  }
  
  function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // In a real app, you would open a modal or edit page
    alert(`Edit product: ${product.name}`);
  }
  
  async function deleteProduct(productId) {
    const confirmation = confirm('Are you sure you want to delete this product?');
    if (!confirmation) return;
    
    try {
      // In a real app, replace with your API endpoint
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        products = products.filter(p => p._id !== productId);
        renderProducts();
        alert('Product deleted successfully!');
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  }
  
  // Mock data for demonstration (remove in production)
  function loadMockData() {
    products = [
      {
        _id: 'prod1',
        name: 'Premium Headphones',
        price: 2999.99,
        stock: 15,
        status: 'active',
        image: '/images/headphones.jpg',
        seller: { name: 'AudioTech' }
      },
      {
        _id: 'prod2',
        name: 'Wireless Mouse',
        price: 899.50,
        stock: 0,
        status: 'archived',
        image: '/images/mouse.jpg',
        seller: { name: 'TechGadgets' }
      },
      {
        _id: 'prod3',
        name: 'Smart Watch',
        price: 5999.00,
        stock: 5,
        status: 'active',
        image: '/images/watch.jpg'
      },
      {
        _id: 'prod4',
        name: 'Bluetooth Speaker',
        price: 2499.00,
        stock: 25,
        status: 'draft',
        image: '/images/speaker.jpg',
        seller: { name: 'SoundSystems' }
      }
    ];
    
    renderProducts();
    console.log('Using mock product data');
  }
});