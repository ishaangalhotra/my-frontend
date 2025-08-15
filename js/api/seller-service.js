// js/api/seller-service.js
import { api } from "./api-client.js";

export const sellerService = {
  async getMyProducts() {
    return api.get("/api/v1/seller/products");
  },
  async createProduct(productData) {
    return api.post("/api/v1/seller/products", productData);
  },
  async updateProduct(productId, updates) {
    return api.put(`/api/v1/seller/products/${productId}`, updates);
  },
  async deleteProduct(productId) {
    return api.delete(`/api/v1/seller/products/${productId}`);
  },
  async getOrders() {
    return api.get("/api/v1/seller/orders");
  }
};
