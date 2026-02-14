(function () {
  var hostname = window.location.hostname;
  var isLocal = hostname === '' || hostname === 'localhost' || hostname === '127.0.0.1';
  var debugFlag = window.location.search.indexOf('debug=1') !== -1;

  if (typeof window.QL_DEBUG !== 'boolean') {
    window.QL_DEBUG = isLocal || debugFlag;
  }

  if (!window.__quicklocalConsoleGuard && !window.QL_DEBUG && window.console) {
    var noop = function () {};
    window.console.log = noop;
    window.console.debug = noop;
    window.console.info = noop;
    window.__quicklocalConsoleGuard = true;
  }

  if (typeof window.QUICKLOCAL_SUPABASE_ANON_KEY !== 'string') {
    window.QUICKLOCAL_SUPABASE_ANON_KEY = '';
  }
})();

(function () {
  var LEGACY_AUTH_STORAGE_KEYS = {
    adminUser: true,
    quicklocal_user: true,
    sellerId: true,
    sellerInfo: true,
    userEmail: true
  };

  if (!window.localStorage || window.__quicklocalAuthStorageGuard) {
    return;
  }

  var originalGetItem = window.localStorage.getItem.bind(window.localStorage);
  var originalSetItem = window.localStorage.setItem.bind(window.localStorage);
  var originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage);

  window.localStorage.getItem = function (key) {
    if (LEGACY_AUTH_STORAGE_KEYS[key]) return null;
    return originalGetItem(key);
  };

  window.localStorage.setItem = function (key, value) {
    if (LEGACY_AUTH_STORAGE_KEYS[key]) return;
    return originalSetItem(key, value);
  };

  window.localStorage.removeItem = function (key) {
    if (LEGACY_AUTH_STORAGE_KEYS[key]) return;
    return originalRemoveItem(key);
  };

  window.__quicklocalAuthStorageGuard = true;
})();

(function () {
  var hostname = window.location.hostname;
  var isLocal = hostname === '' || hostname === 'localhost' || hostname === '127.0.0.1';
  var localOrigin = 'http://127.0.0.1:10000';
  var remoteOrigin = 'https://ecommerce-backend-mlik.onrender.com';
  var siteOrigin = window.location.origin || '';
  var backendOrigin = isLocal ? localOrigin : (siteOrigin || remoteOrigin);
  var apiBase = backendOrigin + '/api/v1';

  var AUTH_READY_TIMEOUT_MS = 15000;
  var authInitPromise = null;
  var authReadyResolved = false;
  var authReadyTimer = null;
  var sessionProbePromise = null;
  var sessionProbeTimestamp = 0;
  var DEFAULT_SESSION_PROBE_TTL_MS = 8000;

  window.QUICKLOCAL_BACKEND_ORIGIN = backendOrigin;
  window.QUICKLOCAL_API_BASE = apiBase;
  window.APP_CONFIG = window.APP_CONFIG || {};

  if (!window.APP_CONFIG.API_BASE_URL || isLocal) {
    window.APP_CONFIG.API_BASE_URL = apiBase;
  }
  if (!window.APP_CONFIG.SOCKET_URL || isLocal) {
    window.APP_CONFIG.SOCKET_URL = backendOrigin;
  }

  if (typeof window.__quicklocalResolveAuthReady !== 'function' || !window.__quicklocalAuthReady || typeof window.__quicklocalAuthReady.then !== 'function') {
    window.__quicklocalAuthReady = new Promise(function (resolve) {
      window.__quicklocalResolveAuthReady = resolve;
    });
  }

  function rewriteUrl(url) {
    if (typeof url !== 'string') {
      return url;
    }

    // Always route hardcoded hosted-backend calls through the active backend origin.
    // This keeps production auth same-origin (cookie/session compatible).
    if (url.indexOf(remoteOrigin) === 0) {
      return backendOrigin + url.slice(remoteOrigin.length);
    }

    if (!isLocal) {
      return url;
    }

    return url;
  }

  function isBackendUrl(url) {
    return typeof url === 'string' && (
      url.indexOf(localOrigin) === 0 ||
      url.indexOf(remoteOrigin) === 0 ||
      url.indexOf('/api/') === 0 ||
      /^https?:\/\/[^/]+\/api\//.test(url)
    );
  }

  function getRequestUrl(input) {
    if (typeof input === 'string') {
      return input;
    }
    if (input && typeof input.url === 'string') {
      return input.url;
    }
    return '';
  }

  function getCurrentUserSafe() {
    try {
      if (window.HybridAuthClient && typeof window.HybridAuthClient.getCurrentUser === 'function') {
        return window.HybridAuthClient.getCurrentUser() || null;
      }
    } catch (_error) {}
    return null;
  }

  function finalizeAuthReady(detail) {
    if (authReadyResolved) {
      return;
    }

    authReadyResolved = true;
    if (authReadyTimer) {
      clearTimeout(authReadyTimer);
      authReadyTimer = null;
    }

    var payload = Object.assign({
      clientReady: !!window.HybridAuthClient,
      user: getCurrentUserSafe(),
      backendOrigin: backendOrigin
    }, detail || {});

    window.__quicklocalSessionUserCache = {
      user: payload.user || null,
      expiresAt: Date.now() + DEFAULT_SESSION_PROBE_TTL_MS
    };

    try {
      if (typeof window.__quicklocalResolveAuthReady === 'function') {
        window.__quicklocalResolveAuthReady(payload);
      }
    } catch (_error) {}

    try {
      document.dispatchEvent(new CustomEvent('quicklocal-auth-ready', { detail: payload }));
    } catch (_error) {}
  }

  window.waitForQuickLocalAuth = function (timeoutMs) {
    var timeout = typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : AUTH_READY_TIMEOUT_MS;
    return Promise.race([
      window.__quicklocalAuthReady,
      new Promise(function (resolve) {
        setTimeout(function () {
          resolve({
            timeout: true,
            clientReady: !!window.HybridAuthClient,
            user: getCurrentUserSafe()
          });
        }, timeout);
      })
    ]);
  };

  window.quickLocalInvalidateSessionCache = function () {
    window.__quicklocalSessionUserCache = null;
    sessionProbeTimestamp = 0;
    sessionProbePromise = null;
  };

  window.quickLocalGetSessionUser = function (options) {
    var opts = options || {};
    var force = !!opts.force;
    var ttlMs = typeof opts.ttlMs === 'number' && opts.ttlMs >= 0
      ? opts.ttlMs
      : DEFAULT_SESSION_PROBE_TTL_MS;
    var now = Date.now();
    var cache = window.__quicklocalSessionUserCache || null;

    if (!force && cache && cache.expiresAt > now) {
      return Promise.resolve(cache.user || null);
    }

    if (!force && sessionProbePromise) {
      return sessionProbePromise;
    }

    if (!force && sessionProbeTimestamp && (now - sessionProbeTimestamp) < ttlMs && cache) {
      return Promise.resolve(cache.user || null);
    }

    sessionProbeTimestamp = now;
    sessionProbePromise = fetch(apiBase + '/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        if (!response || !response.ok) {
          window.__quicklocalSessionUserCache = {
            user: null,
            expiresAt: Date.now() + ttlMs
          };
          return null;
        }

        return response.json()
          .catch(function () { return {}; })
          .then(function (payload) {
            var user = payload.user || (payload.data && payload.data.user) || payload.data || null;
            window.__quicklocalSessionUserCache = {
              user: user || null,
              expiresAt: Date.now() + ttlMs
            };
            return user || null;
          });
      })
      .catch(function () {
        window.__quicklocalSessionUserCache = {
          user: null,
          expiresAt: Date.now() + ttlMs
        };
        return null;
      })
      .finally(function () {
        sessionProbePromise = null;
      });

    return sessionProbePromise;
  };

  authReadyTimer = setTimeout(function () {
    finalizeAuthReady({ timeout: true, reason: 'auth-init-timeout' });
  }, AUTH_READY_TIMEOUT_MS);

  if (!window.__quicklocalFetchPatched && typeof window.fetch === 'function') {
    var originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var finalInput = input;
      var finalInit = init ? Object.assign({}, init) : {};

      try {
        var inputUrl = getRequestUrl(input);
        var rewrittenUrl = rewriteUrl(inputUrl);

        if (typeof input === 'string') {
          finalInput = rewrittenUrl;
        } else if (input && input.url && rewrittenUrl !== input.url) {
          finalInput = new Request(rewrittenUrl, input);
        }

        var targetUrl = typeof finalInput === 'string' ? finalInput : getRequestUrl(finalInput);
        if (isBackendUrl(targetUrl) && !finalInit.credentials) {
          finalInit.credentials = 'include';
        }
      } catch (error) {
        console.warn('[QuickLocal] fetch URL rewrite failed:', error);
      }

      return originalFetch(finalInput, finalInit);
    };
    window.__quicklocalFetchPatched = true;
  }

  function patchHybridClient() {
    if (!window.HybridAuthClient) {
      return false;
    }

    try {
      if (!window.quickLocalAuth) {
        window.quickLocalAuth = window.HybridAuthClient;
      }

      // Always align HybridAuthClient with the selected backend origin
      // (same-origin in production, localhost in local dev).
      window.HybridAuthClient.backendUrl = backendOrigin;

      if (!window.HybridAuthClient.__quicklocalNormalizePatched && typeof window.HybridAuthClient._normalizeEndpoint === 'function') {
        var originalNormalizeEndpoint = window.HybridAuthClient._normalizeEndpoint.bind(window.HybridAuthClient);
        window.HybridAuthClient._normalizeEndpoint = function (endpoint) {
          var normalized = originalNormalizeEndpoint(endpoint);
          return rewriteUrl(normalized);
        };
        window.HybridAuthClient.__quicklocalNormalizePatched = true;
      }

      if (!window.HybridAuthClient.__quicklocalPatched && typeof window.HybridAuthClient.apiCall === 'function') {
        var originalApiCall = window.HybridAuthClient.apiCall.bind(window.HybridAuthClient);
        window.HybridAuthClient.apiCall = function (endpoint, options) {
          var nextEndpoint = endpoint;
          if (typeof nextEndpoint === 'string') {
            nextEndpoint = rewriteUrl(nextEndpoint);
          }

          var nextOptions = options ? Object.assign({}, options) : {};
          if (!nextOptions.credentials) {
            nextOptions.credentials = 'include';
          }

          return originalApiCall(nextEndpoint, nextOptions);
        };

        window.HybridAuthClient.__quicklocalPatched = true;
      }
    } catch (error) {
      console.warn('[QuickLocal] HybridAuthClient patch failed:', error);
      return false;
    }

    return true;
  }

  async function ensureHybridClientReady() {
    if (authReadyResolved) {
      return window.HybridAuthClient || null;
    }

    if (authInitPromise) {
      return authInitPromise;
    }

    authInitPromise = (async function () {
      var patched = patchHybridClient();
      if (!patched || !window.HybridAuthClient) {
        authInitPromise = null;
        return null;
      }

      var client = window.HybridAuthClient;

      try {
        if (typeof client.initializeAuth === 'function') {
          await client.initializeAuth();
        } else if (typeof client.refreshCurrentUser === 'function') {
          await client.refreshCurrentUser();
        } else if (typeof client.isAuthenticated === 'function') {
          await client.isAuthenticated();
        }
      } catch (error) {
        console.warn('[QuickLocal] HybridAuthClient init check failed:', error);
      }

      finalizeAuthReady({
        clientReady: true,
        user: getCurrentUserSafe(),
        authMethod: typeof client.getAuthMethod === 'function' ? client.getAuthMethod() : null
      });

      return client;
    })().catch(function (error) {
      console.warn('[QuickLocal] HybridAuthClient readiness failed:', error);
      authInitPromise = null;
      return null;
    });

    return authInitPromise;
  }

  function loadScript(src, onFail, options) {
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      ensureHybridClientReady().finally(function () {
        if (options && options.expectHybridClient && !window.HybridAuthClient && typeof onFail === 'function') {
          onFail();
        }
      });
    };
    script.onerror = function () {
      if (typeof onFail === 'function') {
        onFail();
        return;
      }

      finalizeAuthReady({
        clientReady: false,
        reason: 'script-load-failed',
        src: src
      });
    };
    document.head.appendChild(script);
  }

  function loadLocalHybridFallback() {
    if (window.HybridAuthClient) {
      ensureHybridClientReady();
      return;
    }

    loadScript('js/hybrid-auth.js', function () {
      finalizeAuthReady({
        clientReady: false,
        reason: 'local-fallback-load-failed'
      });
    }, { expectHybridClient: true });
  }

  document.addEventListener('auth-ready', function () {
    if (!authReadyResolved) {
      finalizeAuthReady({
        clientReady: !!window.HybridAuthClient,
        user: getCurrentUserSafe(),
        reason: 'auth-ready-event'
      });
    }
  });

  loadScript(backendOrigin + '/hybrid-auth-client.js', function () {
    // Keep production auth same-origin so session cookies stay valid.
    // Only local development can fall back to the hosted client.
    if (isLocal) {
      loadScript(remoteOrigin + '/hybrid-auth-client.js', loadLocalHybridFallback, { expectHybridClient: true });
    } else {
      loadLocalHybridFallback();
    }
  }, { expectHybridClient: true });
})();
