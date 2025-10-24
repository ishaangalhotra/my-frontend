document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://ecommerce-backend-mlik.onrender.com/api/v1/admin/users';
  const token = localStorage.getItem('qk_token');

  // DOM Elements
  const loadingIndicator = document.getElementById('loading-indicator');
  const usersTableBody = document.getElementById('users-table-body');
  const refreshBtn = document.getElementById('refresh-users');
  const userModal = document.getElementById('user-modal');
  const modalContent = document.getElementById('user-modal-content');
  const modalClose = document.getElementById('user-modal-close');
  const searchInput = document.getElementById('search-users');
  const paginationEl = document.getElementById('users-pagination');

  let allUsers = [];
  let filteredUsers = [];
  let currentPage = 1;
  const usersPerPage = 8;

  // Init
  fetchUsers();

  // -------------------------
  // Fetch Users (with retry)
  // -------------------------
  async function fetchUsers(retryCount = 0) {
    showLoading(true);
    try {
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        allUsers = data.users || [];
        applyFilters();
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      if (retryCount < 3) {
        console.log(`Retrying fetch users... (${retryCount + 1})`);
        setTimeout(() => fetchUsers(retryCount + 1), 1000);
      } else {
        loadMockData();
      }
    } finally {
      showLoading(false);
    }
  }

  // -------------------------
  // Filtering (Search)
  // -------------------------
  function applyFilters() {
    const search = searchInput?.value.toLowerCase() || '';

    filteredUsers = allUsers.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );

    renderUsers();
  }

  // -------------------------
  // Render Users
  // -------------------------
  function renderUsers() {
    const start = (currentPage - 1) * usersPerPage;
    const end = start + usersPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    if (paginatedUsers.length === 0) {
      usersTableBody.innerHTML = `
        <tr><td colspan="5" class="text-center py-6 text-gray-500">No users found</td></tr>
      `;
      paginationEl.innerHTML = '';
      return;
    }

    usersTableBody.innerHTML = paginatedUsers.map(user => `
      <tr>
        <td>
          <img src="${user.avatar || 'https://via.placeholder.com/40'}" class="h-10 w-10 rounded-full object-cover inline-block mr-2">
          ${user.name}
        </td>
        <td>${user.email}</td>
        <td>
          <span class="px-2 py-1 rounded text-xs font-medium
            ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
              user.role === 'Seller' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'}">
            ${user.role}
          </span>
        </td>
        <td>
          <span class="px-2 py-1 rounded text-xs font-medium
            ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
            ${user.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn-view" data-id="${user._id}">View</button>
          <button class="btn-edit" data-id="${user._id}">Edit</button>
          <button class="btn-toggle text-red-600" data-id="${user._id}">
            ${user.active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    `).join('');

    renderPagination();
    attachUserActions();
  }

  // -------------------------
  // Pagination
  // -------------------------
  function renderPagination() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => `
      <button class="px-3 py-1 border rounded ${i + 1 === currentPage ? 'bg-blue-500 text-white' : ''}" data-page="${i + 1}">
        ${i + 1}
      </button>
    `).join('');

    paginationEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderUsers();
      });
    });
  }

  // -------------------------
  // User Actions
  // -------------------------
  function attachUserActions() {
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => viewUser(btn.dataset.id));
    });
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editUser(btn.dataset.id));
    });
    document.querySelectorAll('.btn-toggle').forEach(btn => {
      btn.addEventListener('click', () => toggleUser(btn.dataset.id));
    });
  }

  function viewUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;

    modalContent.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${user.name}</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Status:</strong> ${user.active ? 'Active' : 'Inactive'}</p>
    `;
    userModal.classList.remove('hidden');
  }

  function editUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;

    modalContent.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">Edit ${user.name}</h3>
      <label class="block mb-2">Role</label>
      <select id="edit-role" class="border rounded px-2 py-1 w-full mb-4">
        <option value="User" ${user.role === 'User' ? 'selected' : ''}>User</option>
        <option value="Seller" ${user.role === 'Seller' ? 'selected' : ''}>Seller</option>
        <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
      </select>
      <button id="save-user-role" class="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
    `;
    userModal.classList.remove('hidden');

    document.getElementById('save-user-role').addEventListener('click', async () => {
      const newRole = document.getElementById('edit-role').value;
      await updateUser(userId, { role: newRole });
      userModal.classList.add('hidden');
    });
  }

  async function toggleUser(userId) {
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to ${user.active ? 'deactivate' : 'activate'} this user?`)) return;
    await updateUser(userId, { active: !user.active });
  }

  async function updateUser(userId, updates) {
    showLoading(true);
    try {
      const res = await fetch(`${API_URL}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();

      if (res.ok) {
        const index = allUsers.findIndex(u => u._id === userId);
        if (index !== -1) allUsers[index] = { ...allUsers[index], ...updates };
        applyFilters();
        alert('✅ User updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Update user error:', err);
      alert('❌ Failed to update user');
    } finally {
      showLoading(false);
    }
  }

  // -------------------------
  // Helpers
  // -------------------------
  if (refreshBtn) refreshBtn.addEventListener('click', fetchUsers);
  if (searchInput) searchInput.addEventListener('input', () => {
    currentPage = 1;
    applyFilters();
  });
  if (modalClose) modalClose.addEventListener('click', () => userModal.classList.add('hidden'));

  function showLoading(show) {
    if (!loadingIndicator) return;
    loadingIndicator.classList.toggle('hidden', !show);
  }

  function loadMockData() {
    allUsers = [
      { _id: 'U1', name: 'John Doe', email: 'john@example.com', role: 'Admin', active: true },
      { _id: 'U2', name: 'Jane Smith', email: 'jane@example.com', role: 'Seller', active: false },
      { _id: 'U3', name: 'Mike Ross', email: 'mike@example.com', role: 'User', active: true },
      { _id: 'U4', name: 'Rachel Zane', email: 'rachel@example.com', role: 'User', active: true }
    ];
    applyFilters();
    console.log('⚠️ Using mock user data');
  }
});
