// js/api/cart-service.js
import { API_BASE_URL } from "../config.js";
import { jsonFetch } from "./helpers.js";

const authFetchOptions = (options = {}) => ({
  credentials: "include",
  ...options
});

export const cartService = {
  async getCart() {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart`, authFetchOptions());
  },

  async addItem(productId, quantity = 1) {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart`, authFetchOptions({
      method: "POST",
      body: JSON.stringify({ productId, quantity })
    }));
  },

  async updateItem(productId, quantity) {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart/${productId}`, authFetchOptions({
      method: "PUT",
      body: JSON.stringify({ quantity })
    }));
  },

  async removeItem(productId) {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart/${productId}`, authFetchOptions({
      method: "DELETE"
    }));
  },

  async clearCart() {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart/clear`, authFetchOptions({
      method: "POST"
    }));
  }
};