// Authentication Service for QuickLocal (unified + prod-safe)
import { APP_CONFIG } from './config.js';
import { socketClient } from './socket-client.js';

const ACCESS_KEY = APP_CONFIG.TOKEN_STORAGE_KEY;        // 'quicklocal_access_token'
const REFRESH_KEY = APP_CONFIG.REFRESH_TOKEN_KEY;       // 'quicklocal_refresh_token'

const BASE = APP_CONFIG.API_BASE_URL;                   // e.g. https://quicklocal-backend.onrender.com/api/v1
const EP = {
  login: `${BASE}/auth/login`,
  register: `${BASE}/auth/register`,
  logout: `${BASE}/auth/logout`,
  refresh: `${BASE}/auth/refresh`,
  me: `${BASE}/auth/me`,
  verify: `${BASE}/auth/verify-email`,
  forgot: `${BASE}/auth/forgot-password`,
  reset: `${BASE}/auth/reset-password`
};

function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY) || null;
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || null;
}

async function jsonFetch(url, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

async function tryRefresh() {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const data = await jsonFetch(EP.refresh, { method: 'POST', body: { refreshToken: rt } });
    setTokens({ accessToken: data.accessToken });
    return true;
  } catch {
    return false;
  }
}

class AuthService {
  constructor() {
    this.user = null;
    this._refreshTimer = null;
    this.initAutoRefresh();
  }

  isAuthenticated() {
    return !!getAccessToken();
  }

  // Decode JWT exp (no crypto; base64 only)
  _decodeJwt(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  initAutoRefresh() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(async () => {
      const token = getAccessToken();
      if (!token) return;
      const payload = this._decodeJwt(token);
      if (!payload?.exp) return;

      const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
      if (secondsLeft > 0 && secondsLeft < 300) {
        // refresh 5 minutes before expiry
        await tryRefresh().catch(() => {});
      }
    }, 60_000);
  }

  async register({ name, email, password }) {
    const data = await jsonFetch(EP.register, { method: 'POST', body: { name, email, password } });
    // depending on backend, you may or may not receive tokens here
    if (data.accessToken || data.refreshToken) {
      setTokens(data);
      socketClient.authenticate(getAccessToken()); // handshake sockets if token present
    }
    return data;
  }

  async login({ email, password }) {
    try {
      const data = await jsonFetch(EP.login, { method: 'POST', body: { email, password } });
      setTokens(data);
      this.user = await this.fetchMe().catch(() => null);
      socketClient.authenticate(getAccessToken()); // auth socket after login
      return { user: this.user, ...data };
    } catch (err) {
      throw err;
    }
  }

  async logout() {
    try {
      await jsonFetch(EP.logout, { method: 'POST', auth: true });
    } catch (_) {
      // ignore network errors on logout
    } finally {
      clearTokens();
      this.user = null;
      socketClient.disconnect();
    }
  }

  async fetchMe() {
    try {
      return await jsonFetch(EP.me, { auth: true });
    } catch (err) {
      // attempt refresh once on 401 path
      if (String(err.message).includes('401') || String(err.message).toLowerCase().includes('unauthorized')) {
        const ok = await tryRefresh();
        if (ok) return jsonFetch(EP.me, { auth: true });
      }
      throw err;
    }
  }

  // helpers for forms
  attachAuthGuard() {
    // redirect to login.html if not authenticated
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
    }
  }
}

export const authService = new AuthService();

// Optional: expose to window for non-module pages
if (typeof window !== 'undefined') {
  window.authService = authService;
}
