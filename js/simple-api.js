/**
 * QuickLocal - Full Featured API Client
 * -------------------------------------
 * - Backend-first with robust fallback to localStorage demo data when offline
 * - Health check with caching + event system (backend-available / backend-unavailable / fallback-mode)
 * - Retry with exponential backoff + request timeout
 * - Unified auth header handling (Authorization: Bearer <token>)
 * - Inline support for Auth, Products, Orders, Delivery, Payments
 *
 * Configuration precedence:
 *   1) process.env.NEXT_PUBLIC_API_BASE (Vercel / bundlers)
 *   2) window.APP_CONFIG.API.BASE_URL (runtime override)
 *   3) 'https://ecommerce-backend-mlik.onrender.com' (production default)
 *
 * Usage:
 *   import api from "./simple-api.js";
 *   await api.init(); // optional: warms up health check + demo data
 *   const products = await api.products.list();
 */

// ---------------------------
// Config
// ---------------------------
const resolveBaseUrl = () => {
  const envBase =
    (typeof process !== "undefined" &&
      process?.env?.NEXT_PUBLIC_API_BASE) ||
    null;
  const winBase = (typeof window !== "undefined" &&
    window.APP_CONFIG?.API?.BASE_URL) || null;
  
  // Updated default to use your production backend
  return envBase || winBase || "https://ecommerce-backend-mlik.onrender.com";
};

const getConfig = () => {
  const base = resolveBaseUrl();

  const cfg = {
    API: {
      BASE_URL: base,
      ENDPOINTS: {
        // Updated to use /api/v1 prefix to match your backend
        LOGIN: "/api/v1/auth/login",
        REGISTER: "/api/v1/auth/register",
        PROFILE: "/api/v1/auth/profile",
        PRODUCTS: "/api/v1/products", // ✅ Fixed: was /api/products
        ORDERS: "/api/v1/orders",
        DELIVERY_ORDERS: "/api/v1/delivery/orders",
        PAYMENT_CREATE_SESSION: "/api/v1/payment/create-session",
        HEALTH: "/health", // ✅ Fixed: your backend uses /health not /healthcheck
        ...(typeof window !== "undefined"
          ? window.APP_CONFIG?.API?.ENDPOINTS
          : {}),
      },
      DEFAULT_HEADERS: {
        "Content-Type": "application/json",
        ...(typeof window !== "undefined"
          ? window.APP_CONFIG?.API?.DEFAULT_HEADERS
          : {}),
      },
      TIMEOUT:
        (typeof window !== "undefined"
          ? window.APP_CONFIG?.API?.TIMEOUT
          : null) || 10000,
      RETRY_ATTEMPTS:
        (typeof window !== "undefined"
          ? window.APP_CONFIG?.API?.RETRY_ATTEMPTS
          : null) || 3,
      RETRY_DELAY:
        (typeof window !== "undefined"
          ? window.APP_CONFIG?.API?.RETRY_DELAY
          : null) || 800,
    },
  };
  return cfg;
};

// ---------------------------
// Errors
// ---------------------------
class NetworkError extends Error {
  constructor(message, status = null, code = null) {
    super(message);
    this.name = "NetworkError";
    this.status = status;
    this.code = code;
  }
}
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

// ---------------------------
// Utils
// ---------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------
// Health checker (cached)
// ---------------------------
class HealthChecker {
  constructor() {
    this.lastCheck = 0;
    this.status = null;
    this.cacheMs = 30_000; // 30s
  }
  async isBackendAvailable() {
    const now = Date.now();
    if (this.status !== null && now - this.lastCheck < this.cacheMs) {
      return this.status;
    }
    const { API } = getConfig();
    try {
      const res = await fetch(`${API.BASE_URL}${API.ENDPOINTS.HEALTH}`, {
        method: "GET",
      });
      this.status = !!res.ok;
    } catch {
      this.status = false;
    }
    this.lastCheck = now;
    return this.status;
  }
  invalidate() {
    this.status = null;
    this.lastCheck = 0;
  }
}

// ---------------------------
// Storage
// ---------------------------
class StorageManager {
  constructor(prefix = "quicklocal_") {
    this.prefix = prefix;
  }
  _k(k) { return `${this.prefix}${k}`; }
  get(k) {
    try {
      const raw = localStorage.getItem(this._k(k));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  set(k, v) {
    try {
      localStorage.setItem(this._k(k), JSON.stringify(v));
      return true;
    } catch { return false; }
  }
  remove(k) { try { localStorage.removeItem(this._k(k)); } catch {} }
  clear() {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(this.prefix)) localStorage.removeItem(k);
      });
    } catch {}
  }
}

// ---------------------------
// Sample data (fallback only)
// ---------------------------
const SampleData = {
  products: [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 5999,
      originalPrice: 7999,
      description:
        "Active Noise Cancellation, 30-hour battery life, Bluetooth 5.0 connectivity with premium sound quality.",
      category: "Electronics",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      inStock: true,
      rating: 4.5,
      reviews: 156,
      tags: ["wireless", "noise-cancelling", "bluetooth"],
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: 8999,
      originalPrice: 12999,
      description:
        "Advanced health monitoring with heart rate, GPS tracking, and 7-day battery life.",
      category: "Wearables",
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      inStock: true,
      rating: 4.3,
      reviews: 89,
      tags: ["fitness", "smartwatch", "health"],
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Organic Coffee Beans",
      price: 1299,
      originalPrice: 1599,
      description:
        "Premium single-origin coffee beans, ethically sourced and freshly roasted.",
      category: "Food & Beverages",
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
      inStock: true,
      rating: 4.8,
      reviews: 234,
      tags: ["organic", "coffee", "fair-trade"],
      createdAt: new Date().toISOString(),
    },
  ],
  orders: [],
};

// ---------------------------
// Fetch with retry + timeout
// ---------------------------
async function fetchWithRetry(resource, options = {}) {
  const { API } = getConfig();
  const {
    timeout = API.TIMEOUT,
    retries = API.RETRY_ATTEMPTS,
    retryDelay = API.RETRY_DELAY,
    ...fetchOptions
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch {}
        throw new NetworkError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || null
        );
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const status = err?.status;
      if (
        err instanceof ValidationError ||
        (status && status >= 400 && status < 500 && status !== 408)
      ) {
        throw err;
      }
      if (attempt < retries) {
        await sleep(retryDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}

// ---------------------------
// Event system
// ---------------------------
const _events = {
  "backend-available": [],
  "backend-unavailable": [],
  "fallback-mode": [],
};
function on(event, handler) {
  if (_events[event]) _events[event].push(handler);
}
function off(event, handler) {
  if (!_events[event]) return;
  const i = _events[event].indexOf(handler);
  if (i > -1) _events[event].splice(i, 1);
}
function emit(event, data) {
  if (!_events[event]) return;
  _events[event].forEach((h) => {
    try { h(data); } catch (e) { console.error("Event handler error:", e); }
  });
}

// ---------------------------
// Auth header helper
// ---------------------------
function buildHeaders(extra = {}) {
  const { API } = getConfig();
  const token =
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("qk_token") ||
        localStorage.getItem("quicklocal_auth_token"))) ||
    null;
  return {
    ...API.DEFAULT_HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ---------------------------
// ApiClient
// ---------------------------
const ApiClient = (function () {
  const config = getConfig();
  const storage = new StorageManager();
  const healthChecker = new HealthChecker();

  async function makeApiCall(endpoint, options = {}) {
    const url = `${config.API.BASE_URL}${endpoint}`;
    const finalOptions = {
      headers: buildHeaders(),
      credentials: "include",
      ...options,
    };
    return await fetchWithRetry(url, finalOptions);
  }

  // Validation helpers
  function validateProduct(product) {
    const req = ["name", "price", "description"];
    const miss = req.filter((f) => !product?.[f]);
    if (miss.length) throw new ValidationError(`Missing: ${miss.join(", ")}`);
    if (typeof product.price !== "number" || product.price <= 0) {
      throw new ValidationError("Price must be a positive number", "price");
    }
    return true;
  }
  function validateOrder(order) {
    const req = ["items", "customerInfo"];
    const miss = req.filter((f) => !order?.[f]);
    if (miss.length) throw new ValidationError(`Missing: ${miss.join(", ")}`);
    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new ValidationError("Order must contain at least one item", "items");
    }
    return true;
  }

  // Public API
  return {
    on, off,

    async init() {
      if (!storage.get("products")) storage.set("products", SampleData.products);
      if (!storage.get("orders")) storage.set("orders", SampleData.orders);

      const ok = await healthChecker.isBackendAvailable();
      emit(ok ? "backend-available" : "backend-unavailable", { available: ok });
      return ok;
    },

    async checkHealth() {
      healthChecker.invalidate();
      const ok = await healthChecker.isBackendAvailable();
      emit(ok ? "backend-available" : "backend-unavailable", { available: ok });
      return ok;
    },

    // -------- AUTH --------
    async login(email, password) {
      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }
      const res = await makeApiCall(config.API.ENDPOINTS.LOGIN, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data?.token) {
        localStorage.setItem("qk_token", data.token);
        storage.set("user", data.user || null);
      }
      return data;
    },

    async register(userData) {
      const required = ["email", "password", "name"];
      const miss = required.filter((f) => !userData?.[f]);
      if (miss.length) {
        throw new ValidationError(`Missing required fields: ${miss.join(", ")}`);
      }
      const res = await makeApiCall(config.API.ENDPOINTS.REGISTER, {
        method: "POST",
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data?.token) {
        localStorage.setItem("qk_token", data.token);
        storage.set("user", data.user || null);
      }
      return data;
    },

    async profile() {
      const res = await makeApiCall(config.API.ENDPOINTS.PROFILE, { method: "GET" });
      const data = await res.json();
      storage.set("user", data || null);
      return data;
    },

    logout() {
      localStorage.removeItem("qk_token");
      storage.remove("user");
    },

    // -------- PRODUCTS --------
    products: {
      list: async (opts = {}) => {
        const { forceRefresh = false, category = null } = opts;
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend || forceRefresh) {
            const res = await makeApiCall(config.API.ENDPOINTS.PRODUCTS, { method: "GET" });
            const response = await res.json();
            
            // ✅ FIXED: Properly unwrap your backend response
            let products = [];
            
            if (response.success && response.data && Array.isArray(response.data.products)) {
              // Your backend format: { success: true, data: { products: [...] } }
              products = response.data.products;
            } else if (response.success && Array.isArray(response.data)) {
              // Alternative format: { success: true, data: [...] }
              products = response.data;
            } else if (Array.isArray(response)) {
              // Direct array format: [...]
              products = response;
            } else {
              console.warn('Unexpected response format:', response);
              products = [];
            }
            
            // Cache the products
            storage.set("products", products);
            
            // Filter by category if requested
            const filtered = category 
              ? products.filter((p) => p.category?.name === category || p.category === category) 
              : products;
            
            console.log(`✅ Successfully fetched ${products.length} products from backend`);
            return filtered; // ✅ ALWAYS return array, never the wrapped response
          }
        } catch (e) {
          console.warn("products.list backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "products.list", error: String(e?.message || e) });
        }
        
        // Fallback to cached/demo data
        const cached = storage.get("products") || [];
        const filtered = category 
          ? cached.filter((p) => p.category?.name === category || p.category === category) 
          : cached;
        
        console.log(`📦 Using cached data: ${cached.length} products`);
        return filtered; // ✅ ALWAYS return array
      },

      get: async (id) => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(`${config.API.ENDPOINTS.PRODUCTS}/${id}`, { method: "GET" });
            const response = await res.json();
            
            // ✅ Handle your backend's response format
            if (response.success && response.data && response.data.product) {
              return response.data.product;
            } else if (response.success && response.data) {
              return response.data;
            }
            return response;
          }
        } catch (e) {
          console.warn("products.get backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "products.get", error: String(e?.message || e) });
        }
        const cached = (storage.get("products") || []).find((p) => `${p.id}` === `${id}`);
        return cached || null;
      },

      add: async (product) => {
        validateProduct(product);
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(config.API.ENDPOINTS.PRODUCTS, {
              method: "POST",
              body: JSON.stringify(product),
            });
            const response = await res.json();
            const created = response.success && response.data ? response.data : response;
            const list = storage.get("products") || [];
            list.push(created);
            storage.set("products", list);
            return created;
          }
        } catch (e) {
          console.warn("products.add backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "products.add", error: String(e?.message || e) });
        }
        const local = { ...product, id: product.id || Date.now(), createdAt: new Date().toISOString() };
        const list = storage.get("products") || [];
        list.push(local);
        storage.set("products", list);
        return local;
      },

      update: async (id, updates) => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(`${config.API.ENDPOINTS.PRODUCTS}/${id}`, {
              method: "PUT",
              body: JSON.stringify(updates),
            });
            const response = await res.json();
            const updated = response.success && response.data ? response.data : response;
            const list = storage.get("products") || [];
            const idx = list.findIndex((p) => `${p.id}` === `${id}`);
            if (idx > -1) list[idx] = updated;
            storage.set("products", list);
            return updated;
          }
        } catch (e) {
          console.warn("products.update backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "products.update", error: String(e?.message || e) });
        }
        const list = storage.get("products") || [];
        const idx = list.findIndex((p) => `${p.id}` === `${id}`);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
          storage.set("products", list);
          return list[idx];
        }
        return null;
      },

      remove: async (id) => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            await makeApiCall(`${config.API.ENDPOINTS.PRODUCTS}/${id}`, { method: "DELETE" });
            const list = storage.get("products") || [];
            storage.set("products", list.filter((p) => `${p.id}` !== `${id}`));
            return { success: true };
          }
        } catch (e) {
          console.warn("products.remove backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "products.remove", error: String(e?.message || e) });
        }
        const list = storage.get("products") || [];
        storage.set("products", list.filter((p) => `${p.id}` !== `${id}`));
        return { success: true, offline: true };
      },

      // ✅ Add search functionality to match your backend
      search: async (query, options = {}) => {
        const { page = 1, limit = 20 } = options;
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const searchParams = new URLSearchParams({
              q: query,
              page: page.toString(),
              limit: limit.toString()
            });
            const res = await makeApiCall(`${config.API.ENDPOINTS.PRODUCTS}/search?${searchParams}`, { 
              method: "GET" 
            });
            const response = await res.json();
            if (response.success && response.data) {
              return response.data;
            }
            return response;
          }
        } catch (e) {
          console.warn("products.search backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "products.search", error: String(e?.message || e) });
        }
        // Fallback: search in cached products
        const cached = storage.get("products") || [];
        const filtered = cached.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
        );
        return { products: filtered, query };
      }
    },

    // -------- ORDERS --------
    orders: {
      list: async () => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(config.API.ENDPOINTS.ORDERS, { method: "GET" });
            const response = await res.json();
            const orders = response.success && response.data ? response.data : response;
            storage.set("orders", orders);
            return orders;
          }
        } catch (e) {
          console.warn("orders.list backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "orders.list", error: String(e?.message || e) });
        }
        return storage.get("orders") || [];
      },

      get: async (id) => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(`${config.API.ENDPOINTS.ORDERS}/${id}`, { method: "GET" });
            const response = await res.json();
            return response.success && response.data ? response.data : response;
          }
        } catch (e) {
          console.warn("orders.get backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "orders.get", error: String(e?.message || e) });
        }
        const cached = (storage.get("orders") || []).find((o) => `${o.id}` === `${id}`);
        return cached || null;
      },

      create: async (order) => {
        validateOrder(order);
        const localOrder = {
          ...order,
          id: order.id || Date.now(),
          status: "pending",
          createdAt: new Date().toISOString(),
          total: order.items.reduce((s, i) => s + i.price * i.quantity, 0),
        };
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(config.API.ENDPOINTS.ORDERS, {
              method: "POST",
              body: JSON.stringify(localOrder),
            });
            const response = await res.json();
            const created = response.success && response.data ? response.data : response;
            const list = storage.get("orders") || [];
            list.push(created);
            storage.set("orders", list);
            return created;
          }
        } catch (e) {
          console.warn("orders.create backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "orders.create", error: String(e?.message || e) });
        }
        const list = storage.get("orders") || [];
        list.push(localOrder);
        storage.set("orders", list);
        return localOrder;
      },

      update: async (id, updates) => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(`${config.API.ENDPOINTS.ORDERS}/${id}`, {
              method: "PUT",
              body: JSON.stringify(updates),
            });
            const response = await res.json();
            const updated = response.success && response.data ? response.data : response;
            const list = storage.get("orders") || [];
            const idx = list.findIndex((o) => `${o.id}` === `${id}`);
            if (idx > -1) list[idx] = updated;
            storage.set("orders", list);
            return updated;
          }
        } catch (e) {
          console.warn("orders.update backend failed → fallback:", e?.message || e);
          emit("fallback-mode", { operation: "orders.update", error: String(e?.message || e) });
        }
        const list = storage.get("orders") || [];
        const idx = list.findIndex((o) => `${o.id}` === `${id}`);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
          storage.set("orders", list);
          return list[idx];
        }
        return null;
      },
    },

    // -------- DELIVERY --------
    delivery: {
      list: async () => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(config.API.ENDPOINTS.DELIVERY_ORDERS, { method: "GET" });
            return await res.json();
          }
        } catch (e) {
          console.warn("delivery.list backend failed:", e?.message || e);
          emit("fallback-mode", { operation: "delivery.list", error: String(e?.message || e) });
        }
        return [];
      },
      update: async (id, updates) => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(`${config.API.ENDPOINTS.DELIVERY_ORDERS}/${id}`, {
              method: "PUT",
              body: JSON.stringify(updates),
            });
            return await res.json();
          }
        } catch (e) {
          console.warn("delivery.update backend failed:", e?.message || e);
          emit("fallback-mode", { operation: "delivery.update", error: String(e?.message || e) });
        }
        return { success: false, offline: true };
      },
    },

    // -------- PAYMENTS --------
    payments: {
      createSession: async (payload) => {
        try {
          const backend = await healthChecker.isBackendAvailable();
          if (backend) {
            const res = await makeApiCall(config.API.ENDPOINTS.PAYMENT_CREATE_SESSION, {
              method: "POST",
              body: JSON.stringify(payload),
            });
            return await res.json();
          }
        } catch (e) {
          console.warn("payments.createSession failed:", e?.message || e);
          emit("fallback-mode", { operation: "payments.createSession", error: String(e?.message || e) });
        }
        return { success: false, offline: true };
      },
    },
  };
})();

export default ApiClient;