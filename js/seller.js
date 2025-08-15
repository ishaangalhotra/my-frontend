/* ==================== */
/* ==== Seller Dashboard Styles ==== */
/* ==================== */

:root {
  /* Enhanced color palette */
  --primary: #4f46e5;
  --primary-light: #6366f1;
  --primary-dark: #4338ca;
  --primary-extra-light: #e0e7ff;
  
  --secondary: #10b981;
  --secondary-light: #34d399;
  --secondary-dark: #059669;
  
  --error: #ef4444;
  --error-light: #fee2e2;
  --error-dark: #dc2626;
  
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --warning-dark: #d97706;
  
  --success: #10b981;
  --success-light: #d1fae5;
  --success-dark: #059669;
  
  --info: #3b82f6;
  --info-light: #dbeafe;
  --info-dark: #2563eb;
  
  /* Text colors */
  --text-dark: #1f2937;
  --text-medium: #4b5563;
  --text-light: #9ca3af;
  --text-white: #ffffff;
  
  /* Background colors */
  --bg-body: #f9fafb;
  --bg-card: #ffffff;
  --bg-light: #f3f4f6;
  --bg-dark: #111827;
  
  /* Border colors */
  --border-light: #e5e7eb;
  --border-medium: #d1d5db;
  --border-dark: #9ca3af;
  
  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 250ms ease-in-out;
  --transition-slow: 400ms ease-in-out;
  
  /* Font sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
}

/* ==================== */
/* ==== Dashboard Layout ==== */
/* ==================== */

.dashboard-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background-color: var(--bg-body);
}

.main-content {
  padding: var(--space-xl);
  overflow-x: hidden;
}

.section-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--space-2xl);
  position: relative;
  padding-bottom: var(--space-sm);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 4px;
  background-color: var(--primary);
  border-radius: var(--radius-full);
}

/* ==================== */
/* ==== Header & User Menu ==== */
/* ==================== */

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-xl);
  background-color: var(--bg-card);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.user-menu {
  position: relative;
}

#user-menu-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background-color: var(--primary-extra-light);
  color: var(--primary-dark);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-weight: 600;
  transition: all var(--transition-fast);
}

#user-menu-btn:hover {
  background-color: var(--primary-light);
  color: var(--text-white);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: calc(100% + var(--space-sm));
  min-width: 200px;
  background-color: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  opacity: 0;
  transform: translateY(-10px);
  visibility: hidden;
  transition: all var(--transition-normal);
  z-index: 1010;
}

.dropdown-menu.show {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--text-medium);
  transition: all var(--transition-fast);
}

.dropdown-item:hover {
  background-color: var(--bg-light);
  color: var(--primary);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-light);
  margin: var(--space-xs) 0;
}

/* ==================== */
/* ==== Dashboard Overview ==== */
/* ==================== */

.dashboard-overview {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-2xl);
  box-shadow: var(--shadow-sm);
}

.time-filter {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.time-filter select {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  background-color: var(--bg-card);
  color: var(--text-dark);
  font-size: var(--text-base);
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.stat-card {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  border-left: 4px solid var(--primary);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
}

.stat-card.sales {
  border-left-color: var(--success);
}

.stat-card.orders {
  border-left-color: var(--info);
}

.stat-card.products {
  border-left-color: var(--warning);
}

.stat-card.customers {
  border-left-color: var(--secondary);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--text-white);
  font-size: var(--text-xl);
}

.stat-card.sales .stat-icon {
  background-color: var(--success);
}

.stat-card.orders .stat-icon {
  background-color: var(--info);
}

.stat-card.products .stat-icon {
  background-color: var(--warning);
}

.stat-card.customers .stat-icon {
  background-color: var(--secondary);
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: var(--space-xs);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-medium);
}

.stat-change {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-sm);
  margin-top: var(--space-sm);
}

.stat-change.positive {
  color: var(--success);
}

.stat-change.negative {
  color: var(--error);
}

/* ==================== */
/* ==== Product Management ==== */
/* ==================== */

.product-management {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-2xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.section-header h2 {
  font-size: var(--text-2xl);
  color: var(--text-dark);
  margin: 0;
}

.product-actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex-grow: 1;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: var(--space-sm) var(--space-lg);
  padding-left: 40px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-dark);
  transition: border-color var(--transition-fast);
}

.search-box input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
}

.product-filters {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.filter-group label {
  font-size: var(--text-sm);
  color: var(--text-medium);
  font-weight: 500;
}

.filter-group select {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  min-width: 150px;
}

/* Product List */
.product-list-container {
  overflow-x: auto;
}

.product-list-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr 120px;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background-color: var(--bg-light);
  font-weight: 600;
  color: var(--text-medium);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.product-list {
  display: flex;
  flex-direction: column;
}

.product-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr 120px;
  gap: var(--space-md);
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-light);
  transition: background-color var(--transition-fast);
}

.product-row:hover {
  background-color: var(--bg-light);
}

.product-cell {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.product-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--border-light);
}

.product-name {
  font-weight: 600;
  color: var(--text-dark);
}

.product-category {
  font-size: var(--text-sm);
  color: var(--text-medium);
}

.product-price {
  font-weight: 600;
}

.stock-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.stock-bar {
  flex-grow: 1;
  height: 6px;
  background-color: var(--border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stock-level {
  height: 100%;
  border-radius: var(--radius-full);
}

.stock-level.high {
  background-color: var(--success);
  width: 80%;
}

.stock-level.medium {
  background-color: var(--warning);
  width: 40%;
}

.stock-level.low {
  background-color: var(--error);
  width: 10%;
}

.status-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: var(--success-light);
  color: var(--success-dark);
}

.status-badge.inactive {
  background-color: var(--error-light);
  color: var(--error-dark);
}

.status-badge.draft {
  background-color: var(--warning-light);
  color: var(--warning-dark);
}

.action-buttons {
  display: flex;
  gap: var(--space-xs);
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-medium);
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background-color: var(--bg-light);
  color: var(--primary);
}

.btn-icon.edit {
  color: var(--info);
}

.btn-icon.delete {
  color: var(--error);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  text-align: center;
}

.empty-state-icon {
  font-size: 3rem;
  color: var(--text-light);
  margin-bottom: var(--space-md);
}

.empty-state-title {
  font-size: var(--text-xl);
  color: var(--text-dark);
  margin-bottom: var(--space-sm);
}

.empty-state-description {
  color: var(--text-medium);
  margin-bottom: var(--space-lg);
  max-width: 400px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
}

.pagination-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  background-color: var(--bg-card);
  color: var(--text-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.pagination-btn.active {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--text-white);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== */
/* ==== Product Form ==== */
/* ==================== */

.product-form-section {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-2xl);
  box-shadow: var(--shadow-sm);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.form-title {
  font-size: var(--text-2xl);
  color: var(--text-dark);
  margin: 0;
}

.form-close-btn {
  background: none;
  border: none;
  font-size: var(--text-xl);
  color: var(--text-medium);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.form-close-btn:hover {
  color: var(--error);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--space-sm);
  font-weight: 600;
  color: var(--text-dark);
}

.form-control {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-control:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-xl);
}

/* File Upload */
.file-upload {
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.file-upload:hover {
  border-color: var(--primary);
  background-color: var(--primary-extra-light);
}

.file-upload-icon {
  font-size: 2.5rem;
  color: var(--primary);
  margin-bottom: var(--space-md);
}

.file-upload-text {
  font-weight: 600;
  color: var(--text-dark);
  margin-bottom: var(--space-xs);
}

.file-upload-hint {
  color: var(--text-medium);
  font-size: var(--text-sm);
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--error);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--text-sm);
  transition: background-color var(--transition-fast);
}

.remove-image-btn:hover {
  background-color: var(--error-dark);
}

/* ==================== */
/* ==== Modals ==== */
/* ==================== */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
}

.modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.modal-container {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  transform: translateY(-20px);
  transition: transform var(--transition-normal);
}

.modal-overlay.active .modal-container {
  transform: translateY(0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: var(--text-xl);
  color: var(--text-dark);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--text-xl);
  color: var(--text-medium);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--error);
}

.modal-body {
  padding: var(--space-lg);
}

.modal-message {
  color: var(--text-medium);
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid var(--border-light);
}

/* ==================== */
/* ==== Responsive Adjustments ==== */
/* ==================== */

@media (max-width: 1200px) {
  .dashboard-container {
    grid-template-columns: 240px 1fr;
  }
}

@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .product-list-header,
  .product-row {
    grid-template-columns: 2fr 1fr 1fr 1fr 120px;
  }
  
  .product-category-cell {
    display: none;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: var(--space-md);
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .product-list-header {
    display: none;
  }
  
  .product-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }
  
  .product-row {
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
  }
  
  .product-info {
    flex-direction: column;
    text-align: center;
    margin-bottom: var(--space-md);
  }
  
  .product-image {
    width: 80px;
    height: 80px;
    margin-bottom: var(--space-sm);
  }
  
  .action-buttons {
    justify-content: center;
    margin-top: var(--space-md);
  }
}

@media (max-width: 576px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .product-list {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-actions {
    width: 100%;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
// js/seller.js
import { sellerService } from "./api/seller-service.js";
import { showError, showSuccess } from "./ui/notifications.js";

const productsContainer = document.querySelector("#seller-products-container");

async function loadSellerProducts() {
  try {
    const { products } = await sellerService.getMyProducts();

    if (!products.length) {
      productsContainer.innerHTML = `<p>No products found. Add your first one!</p>`;
      return;
    }

    productsContainer.innerHTML = products.map(p => `
      <div class="product-card">
        <h4>${p.name}</h4>
        <p>Price: ₹${p.price}</p>
        <p>Stock: ${p.stock}</p>
        <button onclick="editProduct('${p._id}')">Edit</button>
        <button onclick="deleteProduct('${p._id}')">Delete</button>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    showError("Failed to load seller products");
  }
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    await sellerService.deleteProduct(productId);
    showSuccess("Product deleted successfully");
    loadSellerProducts();
  } catch (err) {
    console.error(err);
    showError("Failed to delete product");
  }
}

window.deleteProduct = deleteProduct;

document.addEventListener("DOMContentLoaded", loadSellerProducts);
