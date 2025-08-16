document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://quicklocal-backend.onrender.com/api/v1/categories';
  const token = localStorage.getItem('qk_token');

  // DOM elements
  const grid = document.getElementById('categories-grid');
  const tableBody = document.getElementById('categories-table-body');
  const form = document.getElementById('add-category-form');
  const loadingIndicator = document.getElementById('loading-indicator');

  let categories = [];

  // Initialize
  fetchCategories();

  // ------------------------
  // Fetch Categories (with retry)
  // ------------------------
  async function fetchCategories(retryCount = 0) {
    showLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        categories = data.categories || [];
        renderCategories();
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (retryCount < 3) {
        console.log(`Retrying... (${retryCount + 1})`);
        setTimeout(() => fetchCategories(retryCount + 1), 1000);
      } else {
        loadMockData();
      }
    } finally {
      showLoading(false);
    }
  }

  // ------------------------
  // Render Categories
  // ------------------------
  function renderCategories() {
    // Render Grid
    grid.innerHTML = categories.map(cat => `
      <div class="category-card">
        <img src="${cat.image || '/images/placeholder.jpg'}" alt="${cat.name}">
        <div class="category-info">
          <h3>${cat.name}</h3>
          <p>${cat.description || 'No description'}</p>
          <span class="slug">/${cat.slug}</span>
          <span class="count">${cat.productCount || 0} products</span>
        </div>
        <div class="actions">
          <button class="action-btn btn-edit" data-id="${cat._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn btn-delete" data-id="${cat._id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Render Table
    tableBody.innerHTML = categories.length > 0 ? categories.map(cat => `
      <tr>
        <td>${cat.name}</td>
        <td>${cat.slug}</td>
        <td>${cat.description || '—'}</td>
        <td><img src="${cat.image || '/images/placeholder.jpg'}" class="w-12 h-12 rounded"></td>
        <td>${cat.productCount || 0}</td>
        <td>
          <button class="action-btn btn-edit" data-id="${cat._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn btn-delete" data-id="${cat._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="6" class="text-center py-6 text-gray-500">No categories found</td>
      </tr>
    `;

    attachActionHandlers();
  }

  // ------------------------
  // Action Handlers
  // ------------------------
  function attachActionHandlers() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editCategory(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });
  }

  function editCategory(categoryId) {
    const cat = categories.find(c => c._id === categoryId);
    if (!cat) return;
    alert(`Edit category: ${cat.name}`);
    // TODO: Fill category modal with cat data and open modal
  }

  async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`${API_URL}/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        categories = categories.filter(c => c._id !== categoryId);
        renderCategories();
        alert('Category deleted successfully!');
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete category. Please try again.');
    }
  }

  // ------------------------
  // Add Category Form
  // ------------------------
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('category-name').value.trim();
      const slug = document.getElementById('category-slug').value.trim();
      const description = document.getElementById('category-description').value.trim();
      const image = document.getElementById('category-image').value.trim();

      if (!name) return alert('Category name is required');

      showLoading(true);
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, slug, description, image })
        });

        const data = await res.json();

        if (res.ok) {
          categories.push(data.category);
          renderCategories();
          form.reset();
          alert('Category added successfully!');
        } else {
          throw new Error(data.message || 'Failed to add category');
        }
      } catch (err) {
        console.error('Add category error:', err);
        alert('Failed to add category. Please try again.');
      } finally {
        showLoading(false);
      }
    });
  }

  // ------------------------
  // Helpers
  // ------------------------
  function showLoading(show) {
    if (!loadingIndicator) return;
    loadingIndicator.classList.toggle('hidden', !show);
  }

  function loadMockData() {
    categories = [
      {
        _id: 'cat1',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Phones, Laptops, and more',
        image: '/images/electronics.jpg',
        productCount: 120
      },
      {
        _id: 'cat2',
        name: 'Fashion',
        slug: 'fashion',
        description: 'Clothing and Accessories',
        image: '/images/fashion.jpg',
        productCount: 80
      }
    ];
    renderCategories();
    console.log('⚠️ Using mock category data');
  }
});
