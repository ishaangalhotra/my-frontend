// config.js should be loaded before this script to define BACKEND_URL
// const BACKEND_URL = "https://ecommerce-backend-8ykq.onrender.com"; // This comes from config.js

// Function to load and display products on the main page
async function loadProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`);
    const data = await res.json();

    const productList = document.getElementById('product-list');
    if (productList) { // Only try to render if product-list element exists
        productList.innerHTML = ""; // Clear existing products
        if (data.length === 0) {
            productList.innerHTML = "<p style='text-align: center; color: #555;'>No products available yet.</p>";
            return;
        }
        data.forEach(product => {
            const div = document.createElement('div');
            div.className = "product-card";
            div.innerHTML = `
                <img src="${product.imageUrl || 'https://placehold.co/180x180/cccccc/333333?text=No+Image'}" alt="${product.name}" />
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
  // Use a more subtle notification instead of alert
  // alert(`${product.name} added to cart! Quantity: ${cart[existingItemIndex] ? cart[existingItemIndex].qty : 1}`);
  console.log(`${product.name} added to cart! Quantity: ${cart[existingItemIndex] ? cart[existingItemIndex].qty : 1}`);

  // If on cart page, re-render cart
  if (document.getElementById("cart-items")) {
      renderCart();
  }
}

// Function to render the cart items on cart.html
function renderCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const container = document.getElementById("cart-items");
    const totalElement = document.getElementById("total");
    let total = 0;

    if (!container || !totalElement) return; // Exit if elements not found (e.g., not on cart page)

    container.innerHTML = ""; // Clear existing items

    if (cart.length === 0) {
        container.innerHTML = "<p style='text-align: center; color: #555;'>Your cart is empty.</p>";
        totalElement.textContent = "Total: ₹0.00";
        return;
    }

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <img src="${item.imageUrl || 'https://placehold.co/80x80/cccccc/333333?text=No+Image'}" alt="${item.name}" />
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>Price: ₹${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateQuantity(${index}, -1)">-</button>
                <span>${item.qty}</span>
                <button onclick="updateQuantity(${index}, 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
        container.appendChild(div);
        total += item.price * item.qty;
    });

    totalElement.textContent = `Total: ₹${total.toFixed(2)}`;
}

// Function to update item quantity in cart
function updateQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1); // Remove if quantity becomes 0 or less
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart(); // Re-render the cart
    }
}

// Function to remove item from cart
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart[index]) {
        cart.splice(index, 1); // Remove the item
        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart(); // Re-render the cart
    }
}

// Function to handle proceeding to checkout (sending order to backend)
async function goToCheckout() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (cart.length === 0) {
    alert("Your cart is empty!"); // Using alert for critical user feedback
    return;
  }

  if (!user || !token) {
    alert("Please log in to proceed to checkout.");
    window.location.href = "login.html";
    return;
  }

  // Prepare order data
  const orderItems = cart.map(item => ({
    product: item._id, // Assuming product._id is available from backend
    name: item.name,
    qty: item.qty,
    imageUrl: item.imageUrl,
    price: item.price
  }));

  const totalItemsPrice = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Example calculations for tax and shipping (re-calculate on backend for production)
  const taxRate = 0.05; // 5% tax
  const shippingThreshold = 1000; // Free shipping over 1000
  const baseShippingCost = 50;

  const calculatedTaxPrice = (totalItemsPrice * taxRate);
  const calculatedShippingPrice = (totalItemsPrice > shippingThreshold ? 0 : baseShippingCost);
  const calculatedTotalPrice = totalItemsPrice + calculatedTaxPrice + calculatedShippingPrice;


  const orderData = {
    orderItems: orderItems,
    shippingAddress: { // Placeholder for now, you'd add a form for this
      address: "123 Main St",
      city: "Anytown",
      postalCode: "12345",
      country: "USA"
    },
    paymentMethod: "Cash On Delivery", // Placeholder
    itemsPrice: calculatedItemsPrice.toFixed(2),
    taxPrice: calculatedTaxPrice.toFixed(2),
    shippingPrice: calculatedShippingPrice.toFixed(2),
    totalPrice: calculatedTotalPrice.toFixed(2)
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Send token for authentication
      },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();

    if (res.ok) {
      alert("Order placed successfully!"); // Using alert for critical user feedback
      localStorage.removeItem("cart"); // Clear cart after successful order
      window.location.href = "checkout.html"; // Redirect to a confirmation page
    } else {
      alert(`Order failed: ${data.message || 'Something went wrong.'}`);
    }
  } catch (err) {
    console.error("Error placing order:", err);
    alert("Network error or server unavailable during order placement.");
  }
}


// Function to handle user login
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageElement = document.getElementById("message"); // Assuming a message div exists

  if (!email || !password) {
    if (messageElement) messageElement.textContent = "Please enter all fields";
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
      if (messageElement) messageElement.textContent = ""; // Clear any previous error messages
      // Redirect based on role
      if (data.user.role === 'seller' || data.user.role === 'admin') {
        window.location.href = "seller.html"; // Redirect sellers/admins to seller portal
      } else {
        window.location.href = "index.html"; // Redirect regular users to home
      }
    } else {
      if (messageElement) messageElement.textContent = data.message || "Login failed.";
    }

  } catch (err) {
    console.error("Error during login:", err);
    if (messageElement) messageElement.textContent = "Network error or server unavailable.";
  }
}

// Function to handle user registration
async function register() {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageElement = document.getElementById("message"); // Assuming a message div exists

  if (!username || !email || !password) {
    if (messageElement) messageElement.textContent = "Please enter all fields";
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
      alert("✅ Registered successfully! Please log in."); // Using alert for critical user feedback
      window.location.href = "login.html";
    } else {
      if (messageElement) messageElement.textContent = data.message || "Registration failed.";
    }

  } catch (err) {
    console.error("Error during registration:", err);
    if (messageElement) messageElement.textContent = "Network error or server unavailable.";
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
      const imageUrl = document.getElementById("imageUrl").value.trim(); // Corrected ID
      const countInStock = document.getElementById("countInStock").value; // New field

      const uploadStatusElement = document.getElementById("uploadStatus");
      const token = localStorage.getItem("token");

      if (!token) {
        if (uploadStatusElement) {
            uploadStatusElement.innerText = "Login required to upload products.";
            uploadStatusElement.style.color = "red";
        }
        window.location.href = "login.html";
        return;
      }

      if (!name || !description || !price || !imageUrl || countInStock === "") {
        if (uploadStatusElement) {
            uploadStatusElement.innerText = "Please fill all fields.";
            uploadStatusElement.style.color = "red";
        }
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
          if (uploadStatusElement) {
              uploadStatusElement.innerText = "✅ Product uploaded!";
              uploadStatusElement.style.color = "green";
          }
          uploadForm.reset(); // Clear form after successful upload
        } else {
          if (uploadStatusElement) {
              uploadStatusElement.innerText = "❌ Error: " + (data.message || "Product upload failed.");
              uploadStatusElement.style.color = "red";
          }
        }
      } catch (err) {
        console.error("Error during product upload:", err);
        if (uploadStatusElement) {
            uploadStatusElement.innerText = "❌ Server error or network issue.";
            uploadStatusElement.style.color = "red";
        }
      }
    });
  }

  // Initial load for products on index.html (if product-list exists)
  if (document.getElementById("product-list")) {
    loadProducts();
  }
});