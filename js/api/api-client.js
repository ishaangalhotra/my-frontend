// frontend/js/api/api-client.js

import { APP_CONFIG } from '../config.js';

// Generic request handler with automatic token refresh
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

// Refresh token handler
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

// Main API client
export const apiClient = {
  get: (url, opts) => request(url, { ...opts, method: 'GET' }),
  post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
  put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
  delete: (url, opts) => request(url, { ...opts, method: 'DELETE' })
};
