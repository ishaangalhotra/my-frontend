(function () {
  'use strict';

  var DEFAULT_BACKEND = (function () {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return 'https://ecommerce-backend-mlik.onrender.com';
  })();

  function normalizeBackendUrl(url) {
    return (url || DEFAULT_BACKEND).replace(/\/$/, '');
  }

  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  class QuickLocalHybridAuth {
    constructor() {
      this.backendUrl = normalizeBackendUrl(
        window.QUICKLOCAL_BACKEND_ORIGIN ||
        window.REACT_APP_BACKEND_URL ||
        DEFAULT_BACKEND
      );

      this.currentUser = null;
      this.authMethod = null;
      this.listeners = [];
      this.maxRetryAttempts = 1;

      this.initialize().catch(function () {
        // Ignore boot errors; user can still log in manually.
      });
    }

    _normalizeEndpoint(endpoint) {
      if (typeof endpoint !== 'string') {
        throw new Error('Endpoint must be a string');
      }

      if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
      }

      var path = endpoint;
      if (!path.startsWith('/')) {
        path = '/' + path;
      }

      if (!path.startsWith('/api/')) {
        path = '/api/v1' + path;
      }

      return this.backendUrl + path;
    }

    async _fetch(endpoint, options) {
      var init = Object.assign({}, options || {});
      init.credentials = 'include';

      var method = (init.method || 'GET').toUpperCase();
      var headers = Object.assign({}, init.headers || {});

      var isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
      var isBlob = typeof Blob !== 'undefined' && init.body instanceof Blob;

      if (init.body && isPlainObject(init.body) && !isFormData && !isBlob) {
        init.body = JSON.stringify(init.body);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      if (!headers.Accept) {
        headers.Accept = 'application/json';
      }

      if (method !== 'GET' && method !== 'HEAD' && init.body && !isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      init.headers = headers;

      return fetch(this._normalizeEndpoint(endpoint), init);
    }

    async _parseJsonSafe(response) {
      try {
        return await response.json();
      } catch (_error) {
        return {};
      }
    }

    _setUser(user, method) {
      this.currentUser = user || null;
      this.authMethod = user ? (method || 'cookie') : null;
      this._notifyAuthState();
    }

    _clearUser() {
      this.currentUser = null;
      this.authMethod = null;
      this._notifyAuthState();
    }

    _notifyAuthState() {
      var user = this.currentUser;
      this.listeners.forEach(function (listener) {
        try {
          listener(user);
        } catch (_error) {}
      });

      try {
        document.dispatchEvent(new CustomEvent('auth-ready', { detail: { user: user } }));
      } catch (_error) {}
    }

    async initialize() {
      await this.refreshCurrentUser();
    }

    async refreshCurrentUser() {
      try {
        var response = await this._fetch('/api/v1/auth/me', { method: 'GET' });
        if (!response.ok) {
          this._clearUser();
          return false;
        }

        var data = await this._parseJsonSafe(response);
        this._setUser(data.user || null, 'cookie');
        return !!this.currentUser;
      } catch (_error) {
        this._clearUser();
        return false;
      }
    }

    onAuthStateChange(callback) {
      if (typeof callback !== 'function') {
        return function () {};
      }

      this.listeners.push(callback);
      try {
        callback(this.currentUser);
      } catch (_error) {}

      var self = this;
      return function unsubscribe() {
        self.listeners = self.listeners.filter(function (listener) {
          return listener !== callback;
        });
      };
    }

    getCurrentUser() {
      return this.currentUser;
    }

    getAuthMethod() {
      return this.authMethod;
    }

    getAuthHeader() {
      // Cookie-first auth does not expose bearer tokens to browser code.
      return '';
    }

    async isAuthenticated() {
      if (this.currentUser) {
        return true;
      }
      return this.refreshCurrentUser();
    }

    async login(identifier, password) {
      try {
        var response = await this._fetch('/api/v1/auth/login', {
          method: 'POST',
          body: { identifier: identifier, password: password }
        });

        var data = await this._parseJsonSafe(response);
        if (!response.ok || !data.success) {
          return {
            success: false,
            message: data.message || 'Login failed'
          };
        }

        if (data.user) {
          this._setUser(data.user, 'cookie');
        } else {
          await this.refreshCurrentUser();
        }

        return {
          success: true,
          user: this.currentUser,
          message: data.message || 'Login successful'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Login failed'
        };
      }
    }

    async register(emailOrPayload, password, name, role) {
      try {
        var payload;
        if (isPlainObject(emailOrPayload)) {
          payload = emailOrPayload;
        } else {
          payload = {
            email: emailOrPayload,
            password: password,
            name: name,
            role: role || 'customer'
          };
        }

        var response = await this._fetch('/api/v1/auth/register', {
          method: 'POST',
          body: payload
        });

        var data = await this._parseJsonSafe(response);
        if (!response.ok || data.success === false) {
          return {
            success: false,
            message: data.message || 'Registration failed'
          };
        }

        return {
          success: true,
          message: data.message || 'Registration successful'
        };
      } catch (error) {
        return {
          success: false,
          message: error.message || 'Registration failed'
        };
      }
    }

    async logout() {
      try {
        await this._fetch('/api/v1/auth/logout', { method: 'POST' });
      } catch (_error) {
        // Ignore logout transport errors.
      }

      this._clearUser();
      return { success: true };
    }

    async refreshToken() {
      try {
        var response = await this._fetch('/api/v1/auth/refresh', {
          method: 'POST',
          body: {}
        });

        if (!response.ok) {
          return false;
        }

        await this.refreshCurrentUser();
        return true;
      } catch (_error) {
        return false;
      }
    }

    async apiCall(endpoint, options) {
      var retryCount = Number((options && options._retryCount) || 0);
      var safeOptions = Object.assign({}, options || {});
      delete safeOptions._retryCount;

      var response = await this._fetch(endpoint, safeOptions);
      if (response.status === 401 && retryCount < this.maxRetryAttempts) {
        var refreshed = await this.refreshToken();
        if (refreshed) {
          response = await this._fetch(endpoint, safeOptions);
        }
      }

      return response;
    }

    async addToCart(productId, quantity) {
      return this.apiCall('/api/v1/cart/items', {
        method: 'POST',
        body: {
          productId: productId,
          quantity: Number(quantity || 1)
        }
      });
    }
  }

  // Prefer backend-served client when available, but always expose a fallback alias.
  if (window.HybridAuthClient && typeof window.HybridAuthClient.apiCall === 'function') {
    window.quickLocalAuth = window.HybridAuthClient;
    if (!window.QuickLocalHybridAuth) {
      window.QuickLocalHybridAuth = window.HybridAuthClientClass || QuickLocalHybridAuth;
    }
    return;
  }

  var client = new QuickLocalHybridAuth();
  window.quickLocalAuth = client;
  window.HybridAuthClient = client;
  window.QuickLocalHybridAuth = QuickLocalHybridAuth;
})();
