// js/api/categories-service.js
import { api } from "./api-client.js";

export const categoriesService = {
  async getAllCategories() {
    // Cache categories for 10 minutes to reduce repeated fetches
    return api.get("/api/v1/categories", { cacheTTL: 10 * 60 * 1000 });
  },
  async getProductsByCategory(categoryId) {
    // Cache category product lists for 5 minutes
    return api.get(`/api/v1/categories/${categoryId}/products`, { cacheTTL: 5 * 60 * 1000 });
  }
};
