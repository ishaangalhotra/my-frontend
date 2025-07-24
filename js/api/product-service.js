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