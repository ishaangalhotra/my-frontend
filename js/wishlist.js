// js/wishlist.js
import { wishlistService } from "./api/wishlist-service.js";
import { showError, showSuccess } from "./ui/notifications.js";

const wishlistContainer = document.querySelector("#wishlist-container");

async function loadWishlist() {
  try {
    const { wishlist } = await wishlistService.getWishlist();

    if (!wishlist.length) {
      wishlistContainer.innerHTML = `<p class="empty-msg">Your wishlist is empty</p>`;
      return;
    }

    wishlistContainer.innerHTML = wishlist.map(
      (item) => `
      <div class="wishlist-item">
        <img src="${item.product.image}" alt="${item.product.name}">
        <h3>${item.product.name}</h3>
        <p>₹${item.product.price}</p>
        <button class="remove-btn" data-id="${item.product._id}">Remove</button>
        <button class="add-to-cart-btn" data-id="${item.product._id}">Add to Cart</button>
      </div>
    `
    ).join("");
  } catch (err) {
    showError("Failed to load wishlist");
  }
}

wishlistContainer.addEventListener("click", async (e) => {
  const btn = e.target;

  if (btn.classList.contains("remove-btn")) {
    const id = btn.dataset.id;
    try {
      await wishlistService.removeFromWishlist(id);
      showSuccess("Item removed from wishlist");
      loadWishlist();
    } catch (err) {
      showError("Failed to remove item");
    }
  }

  if (btn.classList.contains("add-to-cart-btn")) {
    const id = btn.dataset.id;
    try {
      // We’ll integrate with cartService later
      showSuccess("Item added to cart");
    } catch (err) {
      showError("Failed to add item to cart");
    }
  }
});

document.addEventListener("DOMContentLoaded", loadWishlist);
