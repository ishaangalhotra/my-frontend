// frontend/js/api/api-client.js

import { APP_CONFIG } from '../config.js';
import cacheManager from '../cache-manager.js';
import SessionManager from '../session-manager.js';

// Optional global error handler (loaded on pages that include it)
const EH = typeof window !== 'undefined' ? window.ErrorHandler : null;

// Generic request handler with automatic token refresh and optional caching for GET requests
async function request(endpoint, { method = 'GET', body = null, auth = true, cacheTTL = 0, cacheKey = null, showErrorToast = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;
  const finalOptions = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };

  // Try cache first for GET requests if TTL provided
  if (method === 'GET' && cacheTTL && cacheTTL > 0) {
    const key = cacheKey || `GET:${endpoint}`;
    const cached = cacheManager.getItem(key);
    if (cached) {
      return cached;
    }
  }

  let res;
  try {
    res = await fetch(url, finalOptions);
  } catch (error) {
    // Network failure
    if (EH) EH.handle({ error, toast: showErrorToast });
    // Emit global event for diagnostics
    window.dispatchEvent(new CustomEvent('api:error', { detail: { endpoint, method, error } }));
    throw error;
  }

  // If token expired → try refresh via SessionManager
  if (res.status === 401 && auth) {
    const refreshed = await SessionManager.refreshToken();
    if (refreshed) {
      const token = localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
      headers['Authorization'] = `Bearer ${token}`;
      try {
        res = await fetch(url, finalOptions);
      } catch (error) {
        if (EH) EH.handle({ error, toast: showErrorToast });
        window.dispatchEvent(new CustomEvent('api:error', { detail: { endpoint, method, error } }));
        throw error;
      }
    } else {
      // Emit global event for listeners
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData.message || `API Error: ${res.status}`;
    const err = new Error(msg);
    // Provide user feedback when requested
    if (EH && showErrorToast) EH.handle({ response: res, toast: true });
    // Emit global event for diagnostics and UI hooks
    window.dispatchEvent(new CustomEvent('api:error', { detail: { endpoint, method, status: res.status, body, error: err } }));
    throw err;
  }

  const data = await res.json();

  // Store successful GET responses in cache
  if (method === 'GET' && cacheTTL && cacheTTL > 0) {
    const key = cacheKey || `GET:${endpoint}`;
    cacheManager.setItem(key, data, cacheTTL);
  }

  return data;
}

// Refresh token handler
// Deprecated: refreshToken moved to SessionManager

// Main API client
export const apiClient = {
  get: (url, opts) => request(url, { ...opts, method: 'GET' }),
  post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
  put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
  delete: (url, opts) => request(url, { ...opts, method: 'DELETE' })
};

// Alias export used by some services
export const api = apiClient;
