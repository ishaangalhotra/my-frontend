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

  if (!window.__quicklocalFetchPatched && typeof window.fetch === 'function') {
    var originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      try {
        if (typeof input === 'string') {
          return originalFetch(rewriteUrl(input), init);
        }
        if (input && input.url) {
          var rewritten = rewriteUrl(input.url);
          if (rewritten !== input.url) {
            return originalFetch(new Request(rewritten, input), init);
          }
        }
      } catch (error) {
        console.warn('[QuickLocal] fetch URL rewrite failed:', error);
      }
      return originalFetch(input, init);
    };
    window.__quicklocalFetchPatched = true;
  }

  function patchHybridClient() {
    if (!window.HybridAuthClient) {
      return;
    }
    try {
      if (isLocal) {
        window.HybridAuthClient.backendUrl = apiBase;
      }
      if (!window.HybridAuthClient.__quicklocalPatched && typeof window.HybridAuthClient.apiCall === 'function') {
        var originalApiCall = window.HybridAuthClient.apiCall.bind(window.HybridAuthClient);
        window.HybridAuthClient.apiCall = function (endpoint, options) {
          if (typeof endpoint === 'string') {
            endpoint = rewriteUrl(endpoint);
          }
          return originalApiCall(endpoint, options);
        };
        window.HybridAuthClient.__quicklocalPatched = true;
      }
    } catch (error) {
      console.warn('[QuickLocal] HybridAuthClient patch failed:', error);
    }
  }

  function loadScript(src, onFail) {
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.crossOrigin = 'anonymous';
    script.onload = patchHybridClient;
    script.onerror = function () {
      if (typeof onFail === 'function') {
        onFail();
      }
    };
    document.head.appendChild(script);
  }

  loadScript(backendOrigin + '/hybrid-auth-client.js', function () {
    if (isLocal) {
      loadScript(remoteOrigin + '/hybrid-auth-client.js');
    }
  });
})();
