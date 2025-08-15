// js/api/cart-service.js
import { API_BASE_URL } from "../config.js";
import { jsonFetch } from "./helpers.js"; 
import { getAccessToken } from "../auth-helpers.js";

export const cartService = {
  async getCart() {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
  },

  async addItem(productId, quantity = 1) {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      body: JSON.stringify({ productId, quantity })
    });
  },

  async updateItem(productId, quantity) {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart/${productId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      body: JSON.stringify({ quantity })
    });
  },

  async removeItem(productId) {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
  },

  async clearCart() {
    return jsonFetch(`${API_BASE_URL}/api/v1/cart/clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
  }
};
