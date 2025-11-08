/**
 * UX/UI Polish - Skeleton Loading, Micro-interactions, Performance
 * Enhances user experience with smooth animations and loading states
 */

class UXPolish {
  constructor() {
    this.skeletonElements = [];
    this.intersectionObserver = null;
    this.init();
  }

  init() {
    // Setup skeleton loading
    this.setupSkeletonLoading();
    
    // Setup lazy loading
    this.setupLazyLoading();
    
    // Setup micro-interactions
    this.setupMicroInteractions();
    
    // Setup performance optimizations
    this.setupPerformanceOptimizations();
    
    // Setup scroll animations
    this.setupScrollAnimations();
    
    console.log('✨ UX Polish initialized');
  }

  // ==================== SKELETON LOADING ====================
  setupSkeletonLoading() {
    // Create skeleton loader utility
    window.showSkeleton = (containerId, count = 6) => {
      const container = document.getElementById(containerId) || 
                      document.querySelector(containerId);
      if (!container) return;

      container.innerHTML = this.generateProductSkeletons(count);
      this.skeletonElements.push(container);
    };

    window.hideSkeleton = (containerId) => {
      const container = document.getElementById(containerId) || 
                      document.querySelector(containerId);
      if (container) {
        container.classList.add('fade-out');
        setTimeout(() => {
          container.innerHTML = '';
          container.classList.remove('fade-out');
        }, 300);
      }
    };
  }

  generateProductSkeletons(count) {
    return Array.from({ length: count }, () => `
      <div class="skeleton-product-card">
        <div class="skeleton-product-image"></div>
        <div class="skeleton-product-content">
          <div class="skeleton skeleton-product-title"></div>
          <div class="skeleton skeleton-product-price"></div>
          <div class="skeleton skeleton-product-rating"></div>
        </div>
      </div>
    `).join('');
  }

  // ==================== LAZY LOADING ====================
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('fade-in');
                this.intersectionObserver.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );

      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        this.intersectionObserver.observe(img);
      });
    }
  }

  // ==================== MICRO-INTERACTIONS ====================
  setupMicroInteractions() {
    // Add to cart button animation
    document.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('.add-to-cart, [data-add-to-cart]');
      if (addToCartBtn) {
        this.animateAddToCart(addToCartBtn);
      }
    });

    // Product card hover effects
    document.querySelectorAll('.product-card').forEach(card => {
      card.classList.add('product-card-interactive', 'hover-lift');
    });

    // Button ripple effects
    document.querySelectorAll('.btn, button').forEach(btn => {
      if (!btn.classList.contains('no-ripple')) {
        btn.classList.add('ripple', 'btn-interactive');
      }
    });

    // Image zoom on hover
    document.querySelectorAll('.product-image, .product-card img').forEach(img => {
      const container = img.closest('.product-image-zoom') || 
                       img.parentElement;
      if (container) {
        container.classList.add('product-image-zoom');
      }
    });
  }

  animateAddToCart(button) {
    button.classList.add('add-to-cart-animation');
    
    setTimeout(() => {
      button.classList.add('added');
    }, 10);

    setTimeout(() => {
      button.classList.remove('added', 'add-to-cart-animation');
    }, 500);

    // Animate cart badge
    const cartBadge = document.getElementById('cart-count') || 
                     document.querySelector('.cart-badge');
    if (cartBadge) {
      cartBadge.classList.add('bounce');
      setTimeout(() => {
        cartBadge.classList.remove('bounce');
      }, 1000);
    }
  }

  // ==================== PERFORMANCE OPTIMIZATIONS ====================
  setupPerformanceOptimizations() {
    // Debounce function
    window.debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // Throttle function
    window.throttle = (func, limit) => {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    // Optimize scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = window.requestAnimationFrame(() => {
        this.handleScroll();
      });
    }, { passive: true });

    // Preload critical resources
    this.preloadCriticalResources();
  }

  handleScroll() {
    const header = document.querySelector('.header');
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Show/hide scroll to top button
    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (scrollTopBtn) {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    }
  }

  preloadCriticalResources() {
    // Preload fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800;900&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);

    // Preconnect to API
    const apiPreconnect = document.createElement('link');
    apiPreconnect.rel = 'preconnect';
    apiPreconnect.href = window.APP_CONFIG?.API_BASE_URL?.replace('/api/v1', '') || 
                        'https://ecommerce-backend-mlik.onrender.com';
    document.head.appendChild(apiPreconnect);
  }

  // ==================== SCROLL ANIMATIONS ====================
  setupScrollAnimations() {
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('fade-in');
              animationObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );

      // Observe elements with animation classes
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        animationObserver.observe(el);
      });
    }
  }

  // ==================== LOADING STATES ====================
  showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId) || 
                     document.querySelector(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="loading-container" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        gap: 1rem;
      ">
        <div class="spinner"></div>
        <p style="color: #64748b; font-size: 0.875rem;">${message}</p>
      </div>
    `;
  }

  hideLoading(containerId) {
    const container = document.getElementById(containerId) || 
                     document.querySelector(containerId);
    if (container) {
      container.innerHTML = '';
    }
  }

  // ==================== TOAST NOTIFICATIONS ====================
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: ${this.getToastColor(type)};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    `;

    const icon = this.getToastIcon(type);
    toast.innerHTML = `
      <i class="${icon}" style="font-size: 1.25rem;"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  getToastColor(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    return colors[type] || colors.info;
  }

  getToastIcon(type) {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  // ==================== SCROLL TO TOP ====================
  createScrollToTopButton() {
    const button = document.createElement('button');
    button.id = 'scroll-to-top';
    button.className = 'fab';
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      cursor: pointer;
      transition: all 0.3s;
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    `;

    button.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // Show/hide on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        button.style.display = 'flex';
        button.classList.add('fade-in');
      } else {
        button.style.display = 'none';
      }
    });

    document.body.appendChild(button);
  }

  // ==================== PROGRESS BAR ====================
  createProgressBar() {
    const progressBar = document.createElement('div');
    progressBar.id = 'page-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      z-index: 10001;
      transition: width 0.1s ease-out;
    `;

    document.body.appendChild(progressBar);

    // Update on scroll
    window.addEventListener('scroll', () => {
      const windowHeight = document.documentElement.scrollHeight - 
                          document.documentElement.clientHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      progressBar.style.width = `${scrolled}%`;
    });
  }
}

// Initialize UX Polish
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.uxPolish = new UXPolish();
    
    // Create scroll to top button
    window.uxPolish.createScrollToTopButton();
    
    // Create progress bar
    window.uxPolish.createProgressBar();
    
    // Export utilities
    window.showToast = (message, type, duration) => 
      window.uxPolish.showToast(message, type, duration);
  });
}

