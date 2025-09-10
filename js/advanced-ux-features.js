/**
 * Advanced UX Features
 * Enhanced user experience utilities and interactions
 */

class AdvancedUXFeatures {
    constructor() {
        this.intersectionObserver = null;
        this.scrollObserver = null;
        this.imageLoadObserver = null;
        
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupScrollEffects();
        this.setupImageLazyLoading();
        this.setupKeyboardShortcuts();
        this.setupProgressIndicator();
        this.setupTooltips();
        this.setupFocusManagement();
        
        console.log('✅ Advanced UX Features initialized');
    }
    
    // Intersection Observer for animations
    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, options);
        
        // Observe elements with animation class
        this.observeElements();
    }
    
    observeElements() {
        // Observe product cards
        setTimeout(() => {
            document.querySelectorAll('.product-card, .category-item, .filter-group').forEach(el => {
                if (!el.classList.contains('observed')) {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(30px)';
                    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    el.classList.add('observed');
                    this.intersectionObserver.observe(el);
                }
            });
        }, 100);
    }
    
    // Enhanced scroll effects
    setupScrollEffects() {
        let ticking = false;
        
        const updateScrollEffects = () => {
            const scrollY = window.scrollY;
            const header = document.getElementById('header');
            const scrollToTopBtn = document.getElementById('scrollToTop');
            const hero = document.getElementById('hero');
            
            // Header background opacity
            if (header) {
                const opacity = Math.min(scrollY / 100, 0.95);
                header.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
                header.style.backdropFilter = scrollY > 50 ? 'blur(10px)' : 'none';
            }
            
            // Parallax effect for hero
            if (hero) {
                hero.style.transform = `translateY(${scrollY * 0.3}px)`;
            }
            
            // Scroll to top button
            if (scrollToTopBtn) {
                scrollToTopBtn.style.opacity = scrollY > 300 ? '1' : '0';
                scrollToTopBtn.style.pointerEvents = scrollY > 300 ? 'auto' : 'none';
            }
            
            // Update progress bar
            this.updateProgressBar();
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        });
    }
    
    // Lazy loading for images
    setupImageLazyLoading() {
        const imageOptions = {
            threshold: 0.1,
            rootMargin: '50px 0px'
        };
        
        this.imageLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        img.removeAttribute('data-src');
                        this.imageLoadObserver.unobserve(img);
                    }
                }
            });
        }, imageOptions);
        
        // Observe existing lazy images
        this.observeLazyImages();
    }
    
    observeLazyImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.imageLoadObserver.observe(img);
        });
    }
    
    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere if user is typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case '/':
                    e.preventDefault();
                    this.focusSearch();
                    break;
                case 'Escape':
                    this.clearFocus();
                    break;
                case 'c':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.navigateToCart();
                    }
                    break;
                case 'h':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.scrollToTop();
                    }
                    break;
            }
        });
    }
    
    focusSearch() {
        const searchInput = document.getElementById('globalSearchInput') || 
                           document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    clearFocus() {
        document.activeElement?.blur();
        const modals = document.querySelectorAll('.modal, .dropdown-menu, .user-menu');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }
    
    navigateToCart() {
        window.location.href = 'cart.html';
    }
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Progress indicator
    setupProgressIndicator() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.innerHTML = '<div class="scroll-progress-bar"></div>';
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .scroll-progress {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: rgba(0, 0, 0, 0.1);
                z-index: 10000;
                pointer-events: none;
            }
            .scroll-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, var(--primary), var(--secondary));
                width: 0%;
                transition: width 0.1s ease;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(progressBar);
        
        this.progressBar = progressBar.querySelector('.scroll-progress-bar');
    }
    
    updateProgressBar() {
        if (!this.progressBar) return;
        
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        this.progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
    }
    
    // Enhanced tooltips
    setupTooltips() {
        const style = document.createElement('style');
        style.textContent = `
            .tooltip {
                position: relative;
            }
            .tooltip::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                font-size: 12px;
                border-radius: 4px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease, transform 0.3s ease;
                margin-bottom: 5px;
                z-index: 10000;
            }
            .tooltip::before {
                content: '';
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: rgba(0, 0, 0, 0.9);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .tooltip:hover::after,
            .tooltip:hover::before {
                opacity: 1;
                transform: translateX(-50%) translateY(-5px);
            }
        `;
        
        document.head.appendChild(style);
        
        // Add tooltips to elements
        this.addTooltips();
    }
    
    addTooltips() {
        // Add tooltips to common elements
        const tooltipElements = [
            { selector: '.add-to-cart', text: 'Add item to cart' },
            { selector: '.wishlist-btn', text: 'Add to wishlist' },
            { selector: '.quick-view', text: 'Quick view product' },
            { selector: '#scrollToTop', text: 'Scroll to top' },
            { selector: '.filter-clear', text: 'Clear all filters' },
            { selector: '.cart-icon', text: 'View shopping cart' }
        ];
        
        tooltipElements.forEach(({ selector, text }) => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el.hasAttribute('data-tooltip')) {
                    el.classList.add('tooltip');
                    el.setAttribute('data-tooltip', text);
                }
            });
        });
    }
    
    // Focus management for accessibility
    setupFocusManagement() {
        // Track focus for keyboard navigation
        let isKeyboardUser = false;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isKeyboardUser = true;
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            isKeyboardUser = false;
            document.body.classList.remove('keyboard-navigation');
        });
        
        // Enhanced focus styles
        const focusStyle = document.createElement('style');
        focusStyle.textContent = `
            .keyboard-navigation *:focus {
                outline: 2px solid var(--primary) !important;
                outline-offset: 2px !important;
            }
            .keyboard-navigation button:focus,
            .keyboard-navigation a:focus,
            .keyboard-navigation input:focus,
            .keyboard-navigation select:focus {
                box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.3) !important;
            }
        `;
        
        document.head.appendChild(focusStyle);
    }
    
    // Utility methods
    showLoadingState(element, show = true) {
        if (!element) return;
        
        if (show) {
            element.classList.add('loading');
            element.style.pointerEvents = 'none';
        } else {
            element.classList.remove('loading');
            element.style.pointerEvents = 'auto';
        }
    }
    
    animateNumber(element, start, end, duration = 1000) {
        if (!element) return;
        
        const range = end - start;
        const startTime = Date.now();
        
        const updateNumber = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (range * this.easeOutCubic(progress));
            
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        updateNumber();
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // Refresh observers (call after dynamic content changes)
    refresh() {
        this.observeElements();
        this.observeLazyImages();
        this.addTooltips();
    }
    
    // Cleanup
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        if (this.imageLoadObserver) {
            this.imageLoadObserver.disconnect();
        }
        
        // Remove progress bar
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            progressBar.remove();
        }
    }
}

// Initialize globally
const advancedUX = new AdvancedUXFeatures();

// Make available globally
window.AdvancedUXFeatures = AdvancedUXFeatures;
window.advancedUX = advancedUX;

// Auto-refresh on content changes
const originalAppendChild = Element.prototype.appendChild;
Element.prototype.appendChild = function(child) {
    const result = originalAppendChild.call(this, child);
    if (window.advancedUX) {
        setTimeout(() => window.advancedUX.refresh(), 100);
    }
    return result;
};
