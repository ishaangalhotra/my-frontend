
import { apiClient } from './api/api-client.js';

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('globalSearchInput');
  const suggestions = document.getElementById('searchSuggestions');
  let timeout = null;
  if (!input) return;
  input.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    if (timeout) clearTimeout(timeout);
    if (q.length < 2) {
      suggestions.style.display = 'none';
      suggestions.innerHTML = '';
      return;
    }
    timeout = setTimeout(async () => {
      try {
        const res = await apiClient.get('/en.../products/suggest?q=' + encodeURIComponent(q));
        const arr = res.suggestions || [];
        suggestions.innerHTML = arr.map(p => `<div class="suggest-item" data-id="${p._id||p.id}" onclick="window.location.href='product-detail.html?id=${p._id||p.id}'">${p.name}</div>`).join('');
        suggestions.style.display = arr.length ? 'block' : 'none';
      } catch (err) {
        // fallback to local products
        const matches = (window.appState && window.appState.products) ? window.appState.products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())).slice(0,8) : [];
        suggestions.innerHTML = matches.map(p => `<div class="suggest-item" onclick="viewProduct('${p.id}')">${p.name}</div>`).join('');
        suggestions.style.display = matches.length ? 'block' : 'none';
      }
    }, 250);
  });
});
