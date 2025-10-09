/**
 * Product Navigation Fix Verification Script
 * Ensures all product cards have proper navigation handlers
 */

console.log('🔧 Loading Product Navigation Fix...');

// Function to verify and fix product card navigation
function verifyProductNavigation() {
    const productCards = document.querySelectorAll('.product-card, .carousel-card');
    let fixedCards = 0;
    
    productCards.forEach(card => {
        const productId = card.dataset.productId;
        
        if (!productId) {
            console.warn('Product card missing product ID:', card);
            return;
        }
        
        // Check if card already has click handler
        const hasClickHandler = card.onclick || card.getAttribute('onclick') || card.classList.contains('clickable-attached');
        
        if (!hasClickHandler) {
            console.log(`Adding navigation to product ${productId}`);
            
            // Add click handler
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons or interactive elements
                if (e.target.closest('.product-actions, .action-btn, button, .quick-action-btn')) {
                    return;
                }
                
                if (window.handleCardClick) {
                    window.handleCardClick(productId);
                } else if (window.productCardUtils && window.productCardUtils.viewProduct) {
                    window.productCardUtils.viewProduct(productId);
                } else {
                    // Direct fallback
                    window.location.href = `product-detail.html?id=${productId}`;
                }
            });
            
            card.style.cursor = 'pointer';
            card.classList.add('clickable-attached');
            fixedCards++;
        }
    });
    
    if (fixedCards > 0) {
        console.log(`✅ Fixed navigation for ${fixedCards} product cards`);
    } else {
        console.log('✅ All product cards already have proper navigation');
    }
}

// Auto-fix on DOM changes
const navigationObserver = new MutationObserver((mutations) => {
    let hasNewProducts = false;
    
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList?.contains('product-card') || 
                        node.classList?.contains('carousel-card') ||
                        node.querySelector?.('.product-card') ||
                        node.querySelector?.('.carousel-card')) {
                        hasNewProducts = true;
                    }
                }
            });
        }
    });
    
    if (hasNewProducts) {
        setTimeout(verifyProductNavigation, 100);
    }
});

// Start observing
navigationObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Run initial verification
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(verifyProductNavigation, 1000);
});

// Also run after page load
window.addEventListener('load', () => {
    setTimeout(verifyProductNavigation, 2000);
});

// Make function globally accessible for debug purposes
window.verifyProductNavigation = verifyProductNavigation;

console.log('✅ Product Navigation Fix loaded successfully!');
