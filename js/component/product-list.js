import { ProductService } from '../api/product-service';
import { CartManager } from '../managers/cart-manager';
import { showModal, hideModal, showToast } from '../utils/ui-helpers';
import { ProductForm } from './product-form'; // New component for editing

export class ProductList {
  constructor(config) {
    this.container = document.getElementById(config.containerId);
    this.apiUrl = config.apiUrl;
    this.isSellerView = config.isSellerView || false;
    this.products = [];
    this.productForm = this.isSellerView ? new ProductForm() : null;
  }

  async init() {
    if (!this.container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    this.container.innerHTML = '<div class="loading-spinner"></div>';
    await this.loadProducts();
    this.render();
    this.setupEventListeners();
  }

  async loadProducts() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error('Failed to fetch products');
      this.products = await response.json();
    } catch (error) {
      console.error('Product loading error:', error);
      this.products = [];
      showToast('Failed to load products', 'error');
    }
  }

  render() {
    if (this.products.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open"></i>
          <p>No products found</p>
          ${this.isSellerView ? '<button class="btn btn-primary" id="add-first-product">Add Your First Product</button>' : ''}
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.isSellerView 
      ? this.renderSellerView() 
      : this.renderCustomerView();
  }

  renderSellerView() {
    return `
      <div class="table-responsive">
        <table class="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.products.map(product => `
              <tr data-id="${product._id}">
                <td>
                  <div class="product-info">
                    <img src="${product.images?.[0]?.url || '/images/placeholder.png'}" 
                         alt="${product.name}" 
                         class="product-thumbnail">
                    <div>
                      <h4>${this.escapeHtml(product.name)}</h4>
                      <small>${product.category || 'Uncategorized'}</small>
                    </div>
                  </div>
                </td>
                <td>₹${product.price.toFixed(2)}</td>
                <td class="${product.stock <= 5 ? 'low-stock' : ''}">
                  ${product.stock}
                </td>
                <td>
                  <span class="badge ${product.status === 'active' ? 'active' : 'inactive'}">
                    ${product.status}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-edit" data-id="${product._id}" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-delete" data-id="${product._id}" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${this.isSellerView ? '<button class="btn btn-primary" id="add-product">Add New Product</button>' : ''}
    `;
  }

  renderCustomerView() {
    return `
      <div class="products-grid">
        ${this.products.map(product => `
          <div class="product-card" data-id="${product._id}">
            <div class="product-badge ${product.stock === 0 ? 'out-of-stock' : ''}">
              ${product.stock === 0 ? 'Sold Out' : ''}
            </div>
            <img src="${product.images?.[0]?.url || '/images/placeholder.png'}" 
                 alt="${product.name}"
                 class="product-image">
            <div class="product-body">
              <h3>${this.escapeHtml(product.name)}</h3>
              <div class="product-meta">
                <span class="category">${product.category || 'General'}</span>
                <span class="rating">${this.renderRating(product.rating)}</span>
              </div>
              <div class="product-footer">
                <span class="price">₹${product.price.toFixed(2)}</span>
                <button class="btn btn-primary add-to-cart" 
                        data-id="${product._id}"
                        ${product.stock === 0 ? 'disabled' : ''}>
                  <i class="fas fa-shopping-cart"></i>
                  ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  setupEventListeners() {
    this.container.addEventListener('click', async (e) => {
      const card = e.target.closest('.product-card, .product-table tbody tr');
      if (!card) return;

      const productId = card.dataset.id;
      const product = this.products.find(p => p._id === productId);
      
      if (e.target.closest('.add-to-cart')) {
        await this.handleAddToCart(product);
      } 
      else if (e.target.closest('.btn-edit')) {
        this.handleEditProduct(product);
      }
      else if (e.target.closest('.btn-delete')) {
        this.handleDeleteProduct(product);
      }
      else if (e.target.closest('#add-product, #add-first-product')) {
        this.handleAddProduct();
      }
    });
  }

  async handleAddToCart(product) {
    if (product.stock === 0) {
      showToast('This product is out of stock', 'warning');
      return;
    }

    try {
      await CartManager.addToCart(product._id, 1);
      showToast(`${product.name} added to cart`, 'success');
      this.updateProductStock(product._id, -1);
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    }
  }

  handleEditProduct(product) {
    if (!this.productForm) return;
    this.productForm.open(product, async (updatedProduct) => {
      try {
        await ProductService.updateProduct(updatedProduct);
        showToast('Product updated', 'success');
        this.refreshProducts();
      } catch (error) {
        showToast('Update failed', 'error');
      }
    });
  }

  async handleDeleteProduct(product) {
    const confirmed = await showModal(
      'Confirm Deletion',
      `Are you sure you want to delete "${product.name}"?`,
      ['Cancel', 'Delete']
    );

    if (confirmed === 'Delete') {
      try {
        await ProductService.deleteProduct(product._id);
        showToast('Product deleted', 'success');
        this.refreshProducts();
      } catch (error) {
        showToast('Deletion failed', 'error');
      }
    }
  }

  handleAddProduct() {
    this.productForm.open(null, async (newProduct) => {
      try {
        await ProductService.createProduct(newProduct);
        showToast('Product created', 'success');
        this.refreshProducts();
      } catch (error) {
        showToast('Creation failed', 'error');
      }
    });
  }

  async refreshProducts() {
    await this.loadProducts();
    this.render();
  }

  updateProductStock(productId, quantityChange) {
    const product = this.products.find(p => p._id === productId);
    if (product) {
      product.stock += quantityChange;
      this.render();
    }
  }

  renderRating(rating) {
    if (!rating) return 'No ratings';
    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    return `${stars} (${rating.toFixed(1)})`;
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}