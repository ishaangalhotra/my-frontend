const API_BASE = "https://ecommerce-backend-8ykq.onrender.com";

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();

    const productList = document.getElementById('product-list');
    productList.innerHTML = "";

    data.forEach(product => {
      const div = document.createElement('div');
      div.innerHTML = `
        <img src="${product.image}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <strong>₹${product.price}</strong>
      `;
      productList.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

window.onload = loadProducts;
