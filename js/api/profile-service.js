// js/api/profile-service.js
import { api } from "./api-client.js";

export const profileService = {
  async getProfile() {
    return api.get("/api/v1/users/me");
  },
  async updateProfile(data) {
    return api.put("/api/v1/users/me", data);
  },
  async changePassword(data) {
    return api.put("/api/v1/users/change-password", data);
  }
};
