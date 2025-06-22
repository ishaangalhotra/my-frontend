const API_BASE = "https://ecommerce-backend-8ykq.onrender.com";

async function loadProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  const data = await res.json();

  const productList = document.getElementById('product-list');
  productList.innerHTML = "";

  data.forEach(product => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <strong>Price: ₹${product.price}</strong>
      <hr>
    `;
    productList.appendChild(div);
  });
}

window.onload = loadProducts;
