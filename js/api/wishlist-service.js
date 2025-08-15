// js/api/wishlist-service.js
import { api } from "./api-client.js";

export const wishlistService = {
  async getWishlist() {
    return api.get("/api/v1/wishlist");
  },
  async addToWishlist(productId) {
    return api.post("/api/v1/wishlist", { productId });
  },
  async removeFromWishlist(productId) {
    return api.delete(`/api/v1/wishlist/${productId}`);
  }
};
