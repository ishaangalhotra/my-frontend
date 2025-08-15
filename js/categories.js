// js/categories.js
import { categoriesService } from "./api/categories-service.js";
import { showError } from "./ui/notifications.js";

const categoriesContainer = document.querySelector("#categories-container");
const productsContainer = document.querySelector("#category-products");

async function loadCategories() {
  try {
    const { categories } = await categoriesService.getAllCategories();
    categoriesContainer.innerHTML = categories.map(cat => `
      <button class="category-btn" data-id="${cat._id}">
        ${cat.name}
      </button>
    `).join("");
  } catch (err) {
    showError("Failed to load categories");
  }
}

async function loadProducts(categoryId) {
  try {
    const { products } = await categoriesService.getProductsByCategory(categoryId);
    productsContainer.innerHTML = products.map(prod => `
      <div class="product-card">
        <img src="${prod.image}" alt="${prod.name}" />
        <h4>${prod.name}</h4>
        <p>${prod.price}</p>
      </div>
    `).join("");
  } catch (err) {
    showError("Failed to load products");
  }
}

categoriesContainer?.addEventListener("click", (e) => {
  if (e.target.classList.contains("category-btn")) {
    const categoryId = e.target.getAttribute("data-id");
    loadProducts(categoryId);
  }
});

document.addEventListener("DOMContentLoaded", loadCategories);
