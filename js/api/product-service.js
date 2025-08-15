import { apiClient } from './api-client';

export const ProductService = {
  async getProducts(sellerId) {
    return apiClient.get(`/products?seller=${sellerId}`);
  },

  async getProductById(id) {
    return apiClient.get(`/products/${id}`);
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
    return apiClient.get('/products/customer');
  }
};
// js/api/products-service.js
import { api } from "./api-client.js";

export const productsService = {
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/v1/products${query ? `?${query}` : ""}`);
  },
  async getProductById(id) {
    return api.get(`/api/v1/products/${id}`);
  },
  async getCategories() {
    return api.get(`/api/v1/categories`);
  },
  async searchProducts(keyword) {
    return api.get(`/api/v1/products/search?keyword=${encodeURIComponent(keyword)}`);
  }
};
