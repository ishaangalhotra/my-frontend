// js/api/admin-service.js
import { api } from "./api-client.js";

export const adminService = {
  async getStats() {
    return api.get("/api/v1/admin/stats");
  },
  async getUsers() {
    return api.get("/api/v1/admin/users");
  },
  async blockUser(userId) {
    return api.put(`/api/v1/admin/users/${userId}/block`);
  },
  async unblockUser(userId) {
    return api.put(`/api/v1/admin/users/${userId}/unblock`);
  },
  async deleteUser(userId) {
    return api.delete(`/api/v1/admin/users/${userId}`);
  }
};
