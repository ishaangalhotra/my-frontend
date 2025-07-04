const API_URL = config.API.BASE_URL;

// --- Toast Notification ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// --- Auth Functions ---
const auth = {
    login: async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));
            showToast('Login successful!', 'success');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } catch (error) {
            showToast(error.message, 'error');
        }
    },
    register: async (name, email, password) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast('Registration successful!', 'success');
            setTimeout(() => window.location.href = 'login.html', 1000);
        } catch (error) {
            showToast(error.message, 'error');
        }
    },
    logout: () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        window.location.href = 'login.html';
    },
    getUserInfo: () => {
        return JSON.parse(localStorage.getItem('userInfo'));
    },
    getToken: () => {
        return localStorage.getItem('userToken');
    }
};

// --- Render Nav Links ---
function renderNavLinks() {
    const nav = document.getElementById('nav-links');
    const user = auth.getUserInfo();
    const currentPage = window.location.pathname.split('/').pop();

    let links = '';
    if (user) {
        links = `
            <a href="profile.html" class="${currentPage === 'profile.html' ? 'active' : ''}">Hi, ${user.name}</a>
            <a href="cart.html" class="${currentPage === 'cart.html' ? 'active' : ''}">Cart</a>
            <a href="myorders.html" class="${currentPage === 'myorders.html' ? 'active' : ''}">Orders</a>
            ${user.role === 'seller' ? `<a href="seller.html" class="${currentPage === 'seller.html' ? 'active' : ''}">Seller Dashboard</a>` : ''}
            <a href="#" id="logoutBtn">Logout</a>
        `;
    } else {
        links = `
            <a href="cart.html" class="${currentPage === 'cart.html' ? 'active' : ''}">Cart</a>
            <a href="login.html" class="${currentPage === 'login.html' ? 'active' : ''}">Login</a>
        `;
    }
    nav.innerHTML = links;
    if(user) {
        document.getElementById('logoutBtn').addEventListener('click', auth.logout);
    }
}