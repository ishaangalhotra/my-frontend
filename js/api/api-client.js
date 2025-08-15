class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'https://quicklocal-backend.onrender.com/api/v1';
    this.defaultRetry = 1;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };

    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient();
import { APP_CONFIG } from '../config.js';

async function request(endpoint, { method = 'GET', body = null, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  // If token expired → try refresh
  if (res.status === 401 && auth) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const token = localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
      headers['Authorization'] = `Bearer ${token}`;
      res = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${res.status}`);
  }

  return res.json();
}

async function refreshToken() {
  const refreshToken = localStorage.getItem(APP_CONFIG.REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  const res = await fetch(`${APP_CONFIG.API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem(APP_CONFIG.TOKEN_STORAGE_KEY, data.accessToken);
    return true;
  }
  return false;
}

export const apiClient = {
  get: (url, opts) => request(url, { ...opts, method: 'GET' }),
  post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
  put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
  delete: (url, opts) => request(url, { ...opts, method: 'DELETE' })
};
