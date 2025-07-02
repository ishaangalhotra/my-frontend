// config.js should be loaded before this script to define BACKEND_URL
// const BACKEND_URL = "https://ecommerce-backend-8ykq.onrender.com"; // This should come from config.js

// Function to load and display products on the main page
async function loadProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`);
    const data = await res.json();

    const productList = document.getElementById('product-list');
    if (productList) { // Only try to render if product-list element exists
        productList.innerHTML = ""; // Clear existing products
        data.forEach(product => {
            const div = document.createElement('div');
            div.className = "product-card";
            div.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" />
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <strong>₹${product.price.toFixed(2)}</strong>
                <br>
                <button onclick='addToCart(${JSON.stringify(product)})'>Add to Cart</button>
            `;
            productList.appendChild(div);
        });
    }
  } catch (err) {
    console.error("Failed to load products:", err);
    // Display a user-friendly message if products fail to load
    const productList = document.getElementById('product-list');
    if (productList) {
        productList.innerHTML = "<p style='text-align: center; color: red;'>Failed to load products. Please try again later.</p>";
    }
  }
}

// Function to add a product to the cart (in localStorage)
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  // Check if the product is already in the cart and update quantity
  const existingItemIndex = cart.findIndex(item => item._id === product._id);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].qty = (cart[existingItemIndex].qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 }); // Add new product with quantity 1
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${product.name} added to cart! Quantity: ${cart[existingItemIndex] ? cart[existingItemIndex].qty : 1}`);
  // If on cart page, re-render cart
  if (document.getElementById("cart-items")) {
      renderCart();
  }
}


// Function to handle user login
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageElement = document.getElementById("message");

  if (!email || !password) {
    messageElement.textContent = "Please enter all fields";
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      messageElement.textContent = ""; // Clear any previous error messages
      // Redirect based on role
      if (data.user.role === 'seller' || data.user.role === 'admin') {
        window.location.href = "seller.html"; // Redirect sellers/admins to seller portal
      } else {
        window.location.href = "index.html"; // Redirect regular users to home
      }
    } else {
      messageElement.textContent = data.message || "Login failed.";
    }

  } catch (err) {
    console.error("Error during login:", err);
    messageElement.textContent = "Network error or server unavailable.";
  }
}

// Function to handle user registration
async function register() {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageElement = document.getElementById("message");

  if (!username || !email || !password) {
    messageElement.textContent = "Please enter all fields";
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Registered successfully! Please log in.");
      window.location.href = "login.html";
    } else {
      messageElement.textContent = data.message || "Registration failed.";
    }

  } catch (err) {
    console.error("Error during registration:", err);
    messageElement.textContent = "Network error or server unavailable.";
  }
}

// Function to handle user logout
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html"; // Redirect to login after logout
}

// Seller Portal: Handle product upload form submission
document.addEventListener("DOMContentLoaded", function () {
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const description = document.getElementById("description").value.trim();
      const price = document.getElementById("price").value;
      const imageUrl = document.getElementById("imageUrl").value.trim();
      const countInStock = document.getElementById("countInStock").value;

      const uploadStatusElement = document.getElementById("uploadStatus");
      const token = localStorage.getItem("token");

      if (!token) {
        uploadStatusElement.innerText = "Login required to upload products.";
        window.location.href = "login.html";
        return;
      }

      if (!name || !description || !price || !imageUrl || countInStock === "") {
        uploadStatusElement.innerText = "Please fill all fields.";
        uploadStatusElement.style.color = "red";
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Send token for authentication
          },
          body: JSON.stringify({ name, description, price: Number(price), imageUrl, countInStock: Number(countInStock) }),
        });

        const data = await response.json();
        if (response.ok) {
          uploadStatusElement.innerText = "✅ Product uploaded!";
          uploadStatusElement.style.color = "green";
          uploadForm.reset(); // Clear form after successful upload
        } else {
          uploadStatusElement.innerText = "❌ Error: " + (data.message || "Product upload failed.");
          uploadStatusElement.style.color = "red";
        }
      } catch (err) {
        console.error("Error during product upload:", err);
        uploadStatusElement.innerText = "❌ Server error or network issue.";
        uploadStatusElement.style.color = "red";
      }
    });
  }

  // Initial load for products on index.html (if product-list exists)
  if (document.getElementById("product-list")) {
    loadProducts();
  }
});