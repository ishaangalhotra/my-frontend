// frontend/js/api/api-client.js

import { APP_CONFIG } from '../config.js';
import cacheManager from '../cache-manager.js';
import SessionManager from '../session-manager.js';

// Optional global error handler (loaded on pages that include it)
const EH = typeof window !== 'undefined' ? window.ErrorHandler : null;

function resolveSessionManager() {
  if (typeof window !== 'undefined' && window.SessionManager) {
    return window.SessionManager;
  }
  return SessionManager;
}

// Generic request handler with automatic session refresh and optional caching for GET requests
async function request(endpoint, { method = 'GET', body = null, auth = true, cacheTTL = 0, cacheKey = null, showErrorToast = false, credentials = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;
  const finalOptions = {
    method,
    headers,
    credentials: credentials || (auth ? 'include' : 'same-origin'),
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
    if (EH) EH.handle({ error, toast: showErrorToast });
    window.dispatchEvent(new CustomEvent('api:error', { detail: { endpoint, method, error } }));
    throw error;
  }

  // If session expired, try refresh and retry once.
  if (res.status === 401 && auth) {
    const manager = resolveSessionManager();
    const refreshed = await manager.refreshToken();
    if (refreshed) {
      try {
        res = await fetch(url, finalOptions);
      } catch (error) {
        if (EH) EH.handle({ error, toast: showErrorToast });
        window.dispatchEvent(new CustomEvent('api:error', { detail: { endpoint, method, error } }));
        throw error;
      }
    } else {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData.message || `API Error: ${res.status}`;
    const err = new Error(msg);

    if (EH && showErrorToast) EH.handle({ response: res, toast: true });
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

// Main API client
export const apiClient = {
  get: (url, opts) => request(url, { ...opts, method: 'GET' }),
  post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
  put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
  delete: (url, opts) => request(url, { ...opts, method: 'DELETE' })
};

// Alias export used by some services
export const api = apiClient;