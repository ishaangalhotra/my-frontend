// js/api/categories-service.js
import { api } from "./api-client.js";

export const categoriesService = {
  async getAllCategories() {
    return api.get("/api/v1/categories");
  },
  async getProductsByCategory(categoryId) {
    return api.get(`/api/v1/categories/${categoryId}/products`);
  }
};
