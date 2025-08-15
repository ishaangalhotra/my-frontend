// js/products.js
import { productsService } from "./api/products-service.js";
import { showError } from "./ui/notifications.js";

const productsContainer = document.querySelector("#products-container");
const categoryFilter = document.querySelector("#category-filter");
const searchInput = document.querySelector("#search-input");
const paginationContainer = document.querySelector("#pagination");

let currentPage = 1;
let selectedCategory = "";
let searchKeyword = "";

async function loadCategories() {
  try {
    const categories = await productsService.getCategories();
    categoryFilter.innerHTML = `
      <option value="">All Categories</option>
      ${categories.map(c => `<option value="${c._id}">${c.name}</option>`).join("")}
    `;
  } catch (err) {
    showError("Failed to load categories");
  }
}

async function loadProducts() {
  try {
    const { products, totalPages } = await productsService.getProducts({
      page: currentPage,
      category: selectedCategory,
      keyword: searchKeyword
    });

    productsContainer.innerHTML = products.map(
      (p) => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button data-id="${p._id}" class="view-product">View</button>
      </div>
    `
    ).join("");

    renderPagination(totalPages);
  } catch (err) {
    showError("Failed to load products");
  }
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }
  paginationContainer.innerHTML = Array.from({ length: totalPages }, (_, i) => `
    <button class="page-btn ${i + 1 === currentPage ? "active" : ""}" data-page="${i + 1}">
      ${i + 1}
    </button>
  `).join("");
}

categoryFilter.addEventListener("change", (e) => {
  selectedCategory = e.target.value;
  currentPage = 1;
  loadProducts();
});

searchInput.addEventListener("input", (e) => {
  searchKeyword = e.target.value.trim();
  currentPage = 1;
  loadProducts();
});

paginationContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("page-btn")) {
    currentPage = Number(e.target.dataset.page);
    loadProducts();
  }
});

productsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("view-product")) {
    const id = e.target.dataset.id;
    window.location.href = `/product.html?id=${id}`;
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await loadProducts();
});
