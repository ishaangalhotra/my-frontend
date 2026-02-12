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
  var backendOrigin = isLocal ? localOrigin : remoteOrigin;
  var apiBase = backendOrigin + '/api/v1';

  window.QUICKLOCAL_BACKEND_ORIGIN = backendOrigin;
  window.QUICKLOCAL_API_BASE = apiBase;
  window.APP_CONFIG = window.APP_CONFIG || {};

  if (!window.APP_CONFIG.API_BASE_URL || isLocal) {
    window.APP_CONFIG.API_BASE_URL = apiBase;
  }
  if (!window.APP_CONFIG.SOCKET_URL || isLocal) {
    window.APP_CONFIG.SOCKET_URL = backendOrigin;
  }

  function rewriteUrl(url) {
    if (!isLocal || typeof url !== 'string') {
      return url;
    }
    if (url.indexOf(remoteOrigin) === 0) {
      return localOrigin + url.slice(remoteOrigin.length);
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
      return;
    }

    try {
      if (!window.quickLocalAuth) {
        window.quickLocalAuth = window.HybridAuthClient;
      }

      if (isLocal) {
        window.HybridAuthClient.backendUrl = backendOrigin;
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
    }
  }

  function loadScript(src, onFail, options) {
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      patchHybridClient();

      // Runtime errors inside script may still trigger onload; ensure fallback when client is missing.
      if (options && options.expectHybridClient && !window.HybridAuthClient && typeof onFail === 'function') {
        onFail();
      }
    };
    script.onerror = function () {
      if (typeof onFail === 'function') {
        onFail();
      }
    };
    document.head.appendChild(script);
  }

  function loadLocalHybridFallback() {
    if (!window.HybridAuthClient) {
      loadScript('js/hybrid-auth.js');
    }
  }

  loadScript(backendOrigin + '/hybrid-auth-client.js', function () {
    if (isLocal) {
      loadScript(remoteOrigin + '/hybrid-auth-client.js', loadLocalHybridFallback, { expectHybridClient: true });
    } else {
      loadLocalHybridFallback();
    }
  }, { expectHybridClient: true });
})();
