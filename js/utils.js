// DOM Helper Functions
export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// Modal Functions
export const showModal = (content) => {
  const modal = $('#modal-container');
  $('.modal-body', modal).innerHTML = content;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

export const hideModal = () => {
  $('#modal-container').classList.add('hidden');
  document.body.style.overflow = '';
};

// Toast Notifications
export const showToast = (message, type = 'success') => {
  const container = document.getElementById('toastContainer') || document.body;
  
  const toast = document.createElement('div');
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <div class="toast-content">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
  
  // Remove on click
  toast.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  });
};

// Star rendering utility
export const renderStars = (rating, container) => {
  if (!container) {
    const starsContainer = document.getElementById('product-stars');
    if (starsContainer) {
      container = starsContainer;
    } else {
      return;
    }
  }
  
  container.innerHTML = '';
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('i');
    if (i <= fullStars) {
      star.className = 'fas fa-star';
    } else if (i === fullStars + 1 && hasHalfStar) {
      star.className = 'fas fa-star-half-alt';
    } else {
      star.className = 'far fa-star';
    }
    container.appendChild(star);
  }
};
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let stars = '';
  for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
  if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
  
  return stars;
};

// Event Delegation Helper
export const delegate = (parent, event, selector, handler) => {
  parent.addEventListener(event, (e) => {
    if (e.target.matches(selector)) handler(e);
  });
};