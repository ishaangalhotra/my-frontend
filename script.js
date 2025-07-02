// Add product upload for sellers
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("uploadForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const description = document.getElementById("description").value;
      const price = document.getElementById("price").value;
      const image = document.getElementById("image").value;
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Login required");
        window.location.href = "login.html";
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description, price, image }),
        });

        const data = await response.json();
        if (response.ok) {
          document.getElementById("uploadStatus").innerText = "✅ Product uploaded!";
        } else {
          document.getElementById("uploadStatus").innerText = "❌ Error: " + data.message;
        }
      } catch (err) {
        document.getElementById("uploadStatus").innerText = "❌ Server error.";
      }
    });
  }
});

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}