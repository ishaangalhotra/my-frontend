/**
 * Advanced Pagination System
 * Enhanced pagination utilities for better UX
 */

class AdvancedPagination {
    constructor(options = {}) {
        this.options = {
            container: options.container || '#paginationContainer',
            itemsPerPage: options.itemsPerPage || 20,
            maxVisiblePages: options.maxVisiblePages || 5,
            showFirstLast: options.showFirstLast || true,
            showPrevNext: options.showPrevNext || true,
            showPageInfo: options.showPageInfo || true,
            onPageChange: options.onPageChange || (() => {}),
            ...options
        };
        
        this.currentPage = 1;
        this.totalItems = 0;
        this.totalPages = 0;
        
        this.init();
    }
    
    init() {
        this.container = document.querySelector(this.options.container);
        if (!this.container) {
            console.warn('Pagination container not found:', this.options.container);
            return;
        }
        
        this.render();
        this.attachEventListeners();
    }
    
    setData(totalItems, currentPage = 1) {
        this.totalItems = totalItems;
        this.totalPages = Math.ceil(totalItems / this.options.itemsPerPage);
        this.currentPage = Math.min(currentPage, this.totalPages);
        this.render();
    }
    
    render() {
        if (!this.container || this.totalPages <= 1) {
            if (this.container) this.container.style.display = 'none';
            return;
        }
        
        this.container.style.display = 'flex';
        this.container.innerHTML = this.generateHTML();
        this.attachEventListeners();
    }
    
    generateHTML() {
        const pageNumbers = this.generatePageNumbers();
        const start = (this.currentPage - 1) * this.options.itemsPerPage + 1;
        const end = Math.min(start + this.options.itemsPerPage - 1, this.totalItems);
        
        return `
            <div class="pagination-wrapper">
                ${this.options.showPageInfo ? `
                    <div class="pagination-info">
                        Showing ${start}-${end} of ${this.totalItems.toLocaleString()} items
                    </div>
                ` : ''}
                
                <div class="pagination-controls">
                    ${this.options.showFirstLast && this.currentPage > 1 ? `
                        <button class="page-btn page-first" data-page="1" title="First page">
                            <i class="fas fa-angle-double-left"></i>
                        </button>
                    ` : ''}
                    
                    ${this.options.showPrevNext && this.currentPage > 1 ? `
                        <button class="page-btn page-prev" data-page="${this.currentPage - 1}" title="Previous page">
                            <i class="fas fa-angle-left"></i>
                        </button>
                    ` : ''}
                    
                    <div class="page-numbers">
                        ${pageNumbers.map(page => {
                            if (page === '...') {
                                return '<span class="page-ellipsis">...</span>';
                            }
                            
                            const isActive = page === this.currentPage;
                            return `
                                <button class="page-btn page-number ${isActive ? 'active' : ''}" 
                                        data-page="${page}" 
                                        ${isActive ? 'aria-current="page"' : ''}>
                                    ${page}
                                </button>
                            `;
                        }).join('')}
                    </div>
                    
                    ${this.options.showPrevNext && this.currentPage < this.totalPages ? `
                        <button class="page-btn page-next" data-page="${this.currentPage + 1}" title="Next page">
                            <i class="fas fa-angle-right"></i>
                        </button>
                    ` : ''}
                    
                    ${this.options.showFirstLast && this.currentPage < this.totalPages ? `
                        <button class="page-btn page-last" data-page="${this.totalPages}" title="Last page">
                            <i class="fas fa-angle-double-right"></i>
                        </button>
                    ` : ''}
                </div>
                
                <div class="pagination-size-selector">
                    <select class="items-per-page-select" title="Items per page">
                        ${[10, 20, 50, 100].map(size => `
                            <option value="${size}" ${size === this.options.itemsPerPage ? 'selected' : ''}>
                                ${size} per page
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `;
    }
    
    generatePageNumbers() {
        const delta = Math.floor(this.options.maxVisiblePages / 2);
        const pages = [];
        
        // Always show first page
        pages.push(1);
        
        // Calculate range around current page
        let start = Math.max(2, this.currentPage - delta);
        let end = Math.min(this.totalPages - 1, this.currentPage + delta);
        
        // Adjust range if we're near the beginning or end
        if (this.currentPage <= delta + 2) {
            end = Math.min(this.totalPages - 1, this.options.maxVisiblePages);
        }
        
        if (this.currentPage >= this.totalPages - delta - 1) {
            start = Math.max(2, this.totalPages - this.options.maxVisiblePages + 1);
        }
        
        // Add ellipsis after first page if needed
        if (start > 2) {
            pages.push('...');
        }
        
        // Add pages in range
        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }
        
        // Add ellipsis before last page if needed
        if (end < this.totalPages - 1) {
            pages.push('...');
        }
        
        // Always show last page if there's more than one page
        if (this.totalPages > 1 && !pages.includes(this.totalPages)) {
            pages.push(this.totalPages);
        }
        
        return pages;
    }
    
    attachEventListeners() {
        if (!this.container) return;
        
        // Page button clicks
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('.page-btn');
            if (!button || button.disabled) return;
            
            const page = parseInt(button.dataset.page);
            if (page && page !== this.currentPage) {
                this.goToPage(page);
            }
        });
        
        // Items per page change
        const sizeSelect = this.container.querySelector('.items-per-page-select');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', (e) => {
                this.changeItemsPerPage(parseInt(e.target.value));
            });
        }
    }
    
    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
            return;
        }
        
        this.currentPage = page;
        this.render();
        this.options.onPageChange(page);
        
        // Smooth scroll to top of container
        const scrollTarget = document.querySelector('#products') || this.container;
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    changeItemsPerPage(newSize) {
        const oldSize = this.options.itemsPerPage;
        this.options.itemsPerPage = newSize;
        
        // Adjust current page to maintain position
        const currentFirstItem = (this.currentPage - 1) * oldSize + 1;
        this.currentPage = Math.ceil(currentFirstItem / newSize);
        
        this.totalPages = Math.ceil(this.totalItems / newSize);
        this.currentPage = Math.min(this.currentPage, this.totalPages);
        
        this.render();
        this.options.onPageChange(this.currentPage, newSize);
    }
    
    // Public API methods
    getCurrentPage() {
        return this.currentPage;
    }
    
    getTotalPages() {
        return this.totalPages;
    }
    
    getItemsPerPage() {
        return this.options.itemsPerPage;
    }
    
    refresh() {
        this.render();
    }
}

// Make available globally
window.AdvancedPagination = AdvancedPagination;

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#paginationContainer')) {
        console.log('✅ Advanced Pagination System loaded');
    }
});
