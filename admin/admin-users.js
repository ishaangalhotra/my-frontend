document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const usersBody = document.getElementById('usersBody');
  const refreshBtn = document.getElementById('refreshBtn');
  
  // State
  let users = [];
  
  // Initialize
  fetchUsers();
  setupEventListeners();
  
  // Functions
  function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchUsers);
  }
  
  async function fetchUsers() {
    try {
      // In a real app, replace with your actual API endpoint
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        users = data.users || [];
        renderUsers();
      } else {
        console.error('Failed to fetch users:', data.message);
        // Fallback to mock data
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data
      loadMockData();
    }
  }
  
  function renderUsers() {
    usersBody.innerHTML = users.map(user => `
      <tr>
        <td class="user-name-cell">
          <img src="${user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" 
               alt="${user.name}" 
               class="user-avatar">
          ${user.name}
        </td>
        <td>${user.email}</td>
        <td><span class="role-badge role-${user.role}">${user.role}</span></td>
        <td class="status-${user.active ? 'active' : 'inactive'}">
          ${user.active ? 'Active' : 'Inactive'}
        </td>
        <td class="action-buttons">
          <button class="action-btn btn-view" data-id="${user._id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn btn-edit" data-id="${user._id}">
            <i class="fas fa-edit"></i>
          </button>
          ${user.active ? 
            `<button class="action-btn btn-deactivate" data-id="${user._id}">
              <i class="fas fa-user-slash"></i>
            </button>` :
            `<button class="action-btn btn-activate" data-id="${user._id}">
              <i class="fas fa-user-check"></i>
            </button>`
          }
        </td>
      </tr>
    `).join('');
    
    // Add event listeners
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => viewUserDetails(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editUser(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-deactivate').forEach(btn => {
      btn.addEventListener('click', () => toggleUserStatus(btn.dataset.id, false));
    });
    
    document.querySelectorAll('.btn-activate').forEach(btn => {
      btn.addEventListener('click', () => toggleUserStatus(btn.dataset.id, true));
    });
  }
  
  function viewUserDetails(userId) {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    alert(`User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.active ? 'Active' : 'Inactive'}`);
  }
  
  function editUser(userId) {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    const newRole = prompt('Enter new role (admin, editor, user):', user.role);
    if (newRole && ['admin', 'editor', 'user'].includes(newRole) && newRole !== user.role) {
      updateUserRole(userId, newRole);
    }
  }
  
  async function updateUserRole(userId, newRole) {
    try {
      // In a real app, replace with your API endpoint
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        const user = users.find(u => u._id === userId);
        if (user) {
          user.role = newRole;
          renderUsers();
          alert('User role updated successfully!');
        }
      } else {
        throw new Error('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  }
  
  async function toggleUserStatus(userId, activate) {
    const confirmation = confirm(`Are you sure you want to ${activate ? 'activate' : 'deactivate'} this user?`);
    if (!confirmation) return;
    
    try {
      // In a real app, replace with your API endpoint
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: activate })
      });
      
      if (response.ok) {
        const user = users.find(u => u._id === userId);
        if (user) {
          user.active = activate;
          renderUsers();
          alert(`User ${activate ? 'activated' : 'deactivated'} successfully!`);
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  }
  
  // Mock data for demonstration (remove in production)
  function loadMockData() {
    users = [
      {
        _id: 'user1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        active: true,
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        _id: 'user2',
        name: 'Content Editor',
        email: 'editor@example.com',
        role: 'editor',
        active: true,
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
      },
      {
        _id: 'user3',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
        active: true,
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
      },
      {
        _id: 'user4',
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'user',
        active: false,
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
      }
    ];
    
    renderUsers();
    console.log('Using mock user data');
  }
});