/**
 * Session Manager
 * Consistent authentication state checks and token refresh handling
 */

(function() {
  const manager = {
    getConfig() {
      return window.APP_CONFIG || {};
    },

    getAccessToken() {
      const cfg = this.getConfig();
      return localStorage.getItem(cfg.TOKEN_STORAGE_KEY || 'token');
    },

    getRefreshToken() {
      const cfg = this.getConfig();
      return localStorage.getItem(cfg.REFRESH_TOKEN_KEY || 'refreshToken');
    },

    decodeJwt(token) {
      try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
      } catch (e) {
        return null;
      }
    },

    isTokenExpired(token) {
      const decoded = this.decodeJwt(token);
      if (!decoded || !decoded.exp) return false; // if unknown, assume not expired
      const nowSec = Math.floor(Date.now() / 1000);
      // Add small clock skew tolerance (30s)
      return decoded.exp <= (nowSec + 30);
    },

    async refreshToken() {
      const cfg = this.getConfig();
      const base = cfg.API_BASE_URL || (cfg.API && cfg.API.BASE_URL) || '';
      const refresh = this.getRefreshToken();
      if (!refresh || !base) return false;

      try {
        const res = await fetch(`${base}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh })
        });

        if (!res.ok) {
          window.dispatchEvent(new CustomEvent('auth:refresh:failed'));
          return false;
        }

        const data = await res.json();
        if (data && data.accessToken) {
          localStorage.setItem(cfg.TOKEN_STORAGE_KEY || 'token', data.accessToken);
          window.dispatchEvent(new CustomEvent('auth:refresh:success'));
          return true;
        }
        window.dispatchEvent(new CustomEvent('auth:refresh:failed'));
        return false;
      } catch (err) {
        window.dispatchEvent(new CustomEvent('auth:refresh:error', { detail: String(err) }));
        return false;
      }
    },

    async ensureSession({ required = false, redirectTo = 'login.html' } = {}) {
      const token = this.getAccessToken();
      if (!token) {
        window.dispatchEvent(new CustomEvent('auth:missing'));
        if (required) window.location.href = redirectTo;
        return false;
      }

      if (this.isTokenExpired(token)) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          window.dispatchEvent(new CustomEvent('auth:expired'));
          if (required) window.location.href = redirectTo;
          return false;
        }
      }

      window.dispatchEvent(new CustomEvent('auth:ready'));
      return true;
    },

    onAuthStateChanged(handler) {
      const events = ['auth:ready', 'auth:expired', 'auth:missing', 'auth:refresh:success', 'auth:refresh:failed'];
      events.forEach(evt => window.addEventListener(evt, handler));
      window.addEventListener('storage', (event) => {
        const cfg = this.getConfig();
        if (event.key === (cfg.TOKEN_STORAGE_KEY || 'token')) {
          handler(new CustomEvent('auth:token:changed', { detail: { token: event.newValue } }));
        }
      });
    }
  };

  window.SessionManager = manager;
})();

export default window.SessionManager;