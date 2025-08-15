// js/profile.js
import { profileService } from "./api/profile-service.js";
import { showError, showSuccess } from "./ui/notifications.js";

const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const phoneInput = document.querySelector("#phone");
const profileForm = document.querySelector("#profile-form");
const passwordForm = document.querySelector("#password-form");

async function loadProfile() {
  try {
    const { user } = await profileService.getProfile();
    nameInput.value = user.name || "";
    emailInput.value = user.email || "";
    phoneInput.value = user.phone || "";
  } catch (err) {
    showError("Failed to load profile");
  }
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await profileService.updateProfile({
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim()
    });
    showSuccess("Profile updated successfully");
  } catch (err) {
    showError("Failed to update profile");
  }
});

passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const currentPassword = document.querySelector("#currentPassword").value.trim();
  const newPassword = document.querySelector("#newPassword").value.trim();

  try {
    await profileService.changePassword({ currentPassword, newPassword });
    showSuccess("Password changed successfully");
    passwordForm.reset();
  } catch (err) {
    showError("Failed to change password");
  }
});

document.addEventListener("DOMContentLoaded", loadProfile);
