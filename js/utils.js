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
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// Event Delegation Helper
export const delegate = (parent, event, selector, handler) => {
  parent.addEventListener(event, (e) => {
    if (e.target.matches(selector)) handler(e);
  });
};