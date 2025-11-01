/**
 * Image Optimization Utility
 * Provides lazy loading and responsive image optimization
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      lazyLoadClass: 'lazy-load',
      loadedClass: 'loaded',
      threshold: 0.1,
      rootMargin: '50px 0px',
      placeholderColor: '#f0f0f0',
      ...options
    };
    
    this.observer = null;
    this.initialized = false;
  }

  /**
   * Initialize the image optimizer
   */
  init() {
    if (this.initialized) return;
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      });
      
      // Find all images with the lazy-load class
      const lazyImages = document.querySelectorAll(`img.${this.options.lazyLoadClass}`);
      lazyImages.forEach(image => this.observer.observe(image));
      
      console.log(`🖼️ Lazy loading initialized for ${lazyImages.length} images`);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      this.loadAllImages();
      console.warn('⚠️ IntersectionObserver not supported, all images loaded immediately');
    }
    
    this.initialized = true;
  }

  /**
   * Handle intersection events
   */
  onIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Load a specific image
   */
  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    const sizes = img.dataset.sizes;
    
    if (src) {
      img.src = src;
    }
    
    if (srcset) {
      img.srcset = srcset;
    }
    
    if (sizes) {
      img.sizes = sizes;
    }
    
    img.classList.add(this.options.loadedClass);
    img.classList.remove(this.options.lazyLoadClass);
    
    // Dispatch event when image is loaded
    img.addEventListener('load', () => {
      img.dispatchEvent(new CustomEvent('imageLoaded', { bubbles: true }));
    });
  }

  /**
   * Load all images immediately (fallback)
   */
  loadAllImages() {
    const lazyImages = document.querySelectorAll(`img.${this.options.lazyLoadClass}`);
    lazyImages.forEach(img => this.loadImage(img));
  }

  /**
   * Convert existing images to lazy-loaded images
   */
  convertExistingImages() {
    const images = document.querySelectorAll('img:not(.lazy-load):not(.no-lazy)');
    
    images.forEach(img => {
      // Skip images that are already processed or should be excluded
      if (img.classList.contains(this.options.lazyLoadClass) || 
          img.classList.contains(this.options.loadedClass) ||
          img.classList.contains('no-lazy')) {
        return;
      }
      
      // Store original attributes in data attributes
      const src = img.src;
      img.dataset.src = src;
      
      // Set placeholder
      img.src = this.getPlaceholderImage(img.width, img.height);
      
      // Add lazy load class
      img.classList.add(this.options.lazyLoadClass);
      
      // Observe the image
      if (this.observer) {
        this.observer.observe(img);
      } else {
        // If no observer, load immediately
        this.loadImage(img);
      }
    });
  }

  /**
   * Generate a placeholder image
   */
  getPlaceholderImage(width = 100, height = 100) {
    // Create a tiny SVG placeholder
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3Crect width="${width}" height="${height}" fill="${this.options.placeholderColor.replace('#', '%23')}"%3E%3C/rect%3E%3C/svg%3E`;
  }

  /**
   * Optimize an image URL for responsive loading
   */
  getOptimizedImageUrl(url, width) {
    // Check if URL is from common CDNs that support resizing
    if (url.includes('cloudinary.com')) {
      // Cloudinary optimization
      return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
    } else if (url.includes('unsplash.com')) {
      // Unsplash optimization
      return `${url}&w=${width}&q=80`;
    } else if (url.includes('images.unsplash.com') && !url.includes('&w=')) {
      // Unsplash direct links
      return `${url}?w=${width}&q=80`;
    }
    
    // Return original URL if no optimization is possible
    return url;
  }
}

// Create global instance
window.imageOptimizer = new ImageOptimizer();

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.imageOptimizer.init();
});

// Export for module usage
// Removed ES module export for compatibility with non-module script loading
if (typeof module !== 'undefined' && module.exports) { module.exports = window.imageOptimizer; }