/**
 * Session Manager
 * Cookie-first auth checks and refresh flow.
 */

(function() {
  const manager = {
    getConfig() {
      return window.APP_CONFIG || {};
    },

    getApiBase() {
      const cfg = this.getConfig();
      return cfg.API_BASE_URL || (cfg.API && cfg.API.BASE_URL) || '';
    },

    async probeSession() {
      const base = this.getApiBase();
      if (!base) {
        return false;
      }

      try {
        const res = await fetch(`${base}/auth/me`, {
          method: 'GET',
          credentials: 'include'
        });
        return res.ok;
      } catch {
        return false;
      }
    },

    async refreshToken() {
      const base = this.getApiBase();
      if (!base) {
        return false;
      }

      try {
        const res = await fetch(`${base}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({})
        });

        if (!res.ok) {
          window.dispatchEvent(new CustomEvent('auth:refresh:failed'));
          return false;
        }

        window.dispatchEvent(new CustomEvent('auth:refresh:success'));
        return true;
      } catch (err) {
        window.dispatchEvent(new CustomEvent('auth:refresh:error', { detail: String(err) }));
        return false;
      }
    },

    async ensureSession({ required = false, redirectTo = 'login.html' } = {}) {
      const hasSession = await this.probeSession();
      if (hasSession) {
        window.dispatchEvent(new CustomEvent('auth:ready'));
        return true;
      }

      const refreshed = await this.refreshToken();
      if (refreshed) {
        const sessionAfterRefresh = await this.probeSession();
        if (sessionAfterRefresh) {
          window.dispatchEvent(new CustomEvent('auth:ready'));
          return true;
        }
      }

      window.dispatchEvent(new CustomEvent('auth:missing'));
      window.dispatchEvent(new CustomEvent('auth:expired'));

      if (required) {
        window.location.href = redirectTo;
      }
      return false;
    },

    onAuthStateChanged(handler) {
      const events = ['auth:ready', 'auth:expired', 'auth:missing', 'auth:refresh:success', 'auth:refresh:failed'];
      events.forEach(evt => window.addEventListener(evt, handler));
    }
  };

  window.SessionManager = manager;
})();