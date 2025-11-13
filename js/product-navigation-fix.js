/**
 * Product Navigation Fix Verification Script
 * Ensures all product cards have proper navigation handlers
 */

console.log('🔧 Loading Product Navigation Fix...');

// Enhanced product ID extraction
function extractProductIdFromCard(card) {
  // Try multiple methods to get product ID
  let productId = null;
  
  // Method 1: Check data-product-id attribute
  productId = card.getAttribute('data-product-id');
  if (productId) return productId;
  
  // Method 2: Extract from onclick handler
  const onclick = card.getAttribute('onclick');
  if (onclick && onclick.includes('product-detail.html?id=')) {
    const match = onclick.match(/product-detail\.html\?id=([^'"]+)/);
    if (match) return match[1];
  }
  
  // Method 3: Check href if it's a link
  const link = card.querySelector('a');
  if (link) {
    const href = link.getAttribute('href');
    if (href && href.includes('product-detail.html?id=')) {
      const match = href.match(/product-detail\.html\?id=([^'"]+)/);
      if (match) return match[1];
    }
  }
  
  // Method 4: Check data attributes in child elements
  const dataElements = card.querySelector('[data-product-id]');
  if (dataElements) {
    return dataElements.getAttribute('data-product-id');
  }
  
  console.warn('Product card missing product ID:', card);
  return null;
}

// Function to verify and fix product card navigation
function verifyProductNavigation() {
    const productCards = document.querySelectorAll('.product-card, .carousel-card');
    let fixedCards = 0;
    
    productCards.forEach(card => {
        const productId = extractProductIdFromCard(card);
        
        if (!productId) {
            console.warn('Product card missing product ID:', card);
            return;
        }
        
        // Check if card already has click handler
        const hasClickHandler = card.onclick || card.getAttribute('onclick') || card.classList.contains('clickable-attached');
        
        if (!hasClickHandler) {
            console.log(`Adding navigation to product ${productId}`);
            
            // Remove existing click handlers to prevent duplicates
            card.removeAttribute('onclick');
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Add click handler
            newCard.addEventListener('click', (e) => {
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
            
            newCard.style.cursor = 'pointer';
            newCard.classList.add('clickable-attached');
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