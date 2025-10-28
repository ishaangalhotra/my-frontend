import { apiClient } from './api-client';

export const ProductService = {
  async getProducts(sellerId) {
    // Cache product lists for 5 minutes
    return apiClient.get(`/products?seller=${sellerId}`, { cacheTTL: 5 * 60 * 1000 });
  },

  async getProductById(id) {
    // Cache individual product for 1 minute
    return apiClient.get(`/products/${id}`, { cacheTTL: 60 * 1000 });
  },

  async createProduct(productData) {
    return apiClient.post('/products', productData);
  },

  async updateProduct(id, productData) {
    return apiClient.put(`/products/${id}`, productData);
  },

  async deleteProduct(id) {
    return apiClient.delete(`/products/${id}`);
  },

  async getProductsForCustomer() {
    // Cache customer-visible catalog for 5 minutes
    return apiClient.get('/products/customer', { cacheTTL: 5 * 60 * 1000 });
  }
};
// js/api/products-service.js
import { api } from "./api-client.js";

export const productsService = {
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    // Cache general products listing for 5 minutes
    return api.get(`/api/v1/products${query ? `?${query}` : ""}`, { cacheTTL: 5 * 60 * 1000 });
  },
  async getProductById(id) {
    return api.get(`/api/v1/products/${id}`, { cacheTTL: 60 * 1000 });
  },
  async getCategories() {
    // Cache categories longer since they rarely change (10 minutes)
    return api.get(`/api/v1/categories`, { cacheTTL: 10 * 60 * 1000 });
  },
  async searchProducts(keyword) {
    // Cache search results briefly (30 seconds) to avoid stale results
    return api.get(`/api/v1/products/search?keyword=${encodeURIComponent(keyword)}`, { cacheTTL: 30 * 1000 });
  }
};
