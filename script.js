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
        <div style="border:1px solid #ccc; padding:10px; margin:10px;">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <strong>Price: ₹${product.price}</strong>
        </div>
      `;
      productList.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

window.onload = loadProducts;
