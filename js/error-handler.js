// Lightweight global error handler for consistent user feedback
// Provides parsing helpers and UI notifications without coupling to frameworks

(function () {
  const ErrorHandler = {
    parse(response, error) {
      if (response) {
        const status = response.status;
        return {
          code: status,
          message:
            status === 401 ? 'Session expired. Please log in.' :
            status === 403 ? 'You do not have permission to perform this action.' :
            status === 404 ? 'Requested resource was not found.' :
            status >= 500 ? 'Server is unavailable. Please try again shortly.' :
            'Request failed. Please try again.',
        };
      }
      if (error) {
        const isNetwork = error.name === 'TypeError' || error.message?.includes('Network');
        return {
          code: isNetwork ? 'NETWORK' : 'CLIENT',
          message: isNetwork ? 'Network error. Check your connection and retry.' : (error.message || 'Unexpected error occurred.'),
        };
      }
      return { code: 'UNKNOWN', message: 'An unknown error occurred.' };
    },

    showToast(message, type = 'error') {
      if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
      }
      // Minimal fallback toast
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = 'position:fixed;right:16px;bottom:16px;background:#111;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:9999;opacity:.95';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    },

    showBanner(targetSelector, message, type = 'error') {
      const target = document.querySelector(targetSelector) || document.body;
      const banner = document.createElement('div');
      banner.textContent = message;
      banner.style.cssText = 'margin:0 0 16px 0;padding:12px 16px;border-radius:12px;font-weight:600';
      const color = type === 'warning' ? '#f59e0b' : type === 'success' ? '#22c55e' : '#ef4444';
      banner.style.background = color + '20';
      banner.style.color = color;
      target.prepend(banner);
      setTimeout(() => banner.remove(), 6000);
    },

    handle({ response, error, toast = true, bannerSelector = null }) {
      const parsed = this.parse(response, error);
      if (toast) this.showToast(parsed.message, parsed.code === 'NETWORK' ? 'warning' : 'error');
      if (bannerSelector) this.showBanner(bannerSelector, parsed.message);
      return parsed;
    },
  };

  window.ErrorHandler = ErrorHandler;
})();