/**
 * Test script to verify centralized navigation handling
 * Run this in the browser console on marketplace.html to verify functionality
 */

function testCentralizedNavigation() {
    console.log('🧪 Testing centralized navigation handling...');
    
    // Test 1: Check if product cards have data-product-id attributes
    const productCards = document.querySelectorAll('.product-card, .carousel-card');
    console.log(`Found ${productCards.length} product cards`);
    
    let cardsWithoutIds = 0;
    productCards.forEach((card, index) => {
        const productId = card.getAttribute('data-product-id');
        if (!productId) {
            console.warn(`Card ${index} missing data-product-id:`, card);
            cardsWithoutIds++;
        }
    });
    
    if (cardsWithoutIds === 0) {
        console.log('✅ All product cards have data-product-id attributes');
    } else {
        console.warn(`⚠️ ${cardsWithoutIds} cards missing data-product-id`);
    }
    
    // Test 2: Check if inline onclick handlers are removed
    let cardsWithInlineHandlers = 0;
    productCards.forEach((card, index) => {
        if (card.getAttribute('onclick') || card.onclick) {
            console.warn(`Card ${index} still has inline onclick:`, card);
            cardsWithInlineHandlers++;
        }
    });
    
    if (cardsWithInlineHandlers === 0) {
        console.log('✅ No product cards have inline onclick handlers');
    } else {
        console.warn(`⚠️ ${cardsWithInlineHandlers} cards still have inline onclick handlers`);
    }
    
    // Test 3: Check if add-to-cart buttons have inline handlers removed
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    let buttonsWithInlineHandlers = 0;
    addToCartButtons.forEach((btn, index) => {
        if (btn.getAttribute('onclick') || btn.onclick) {
            console.warn(`Add-to-cart button ${index} still has inline onclick:`, btn);
            buttonsWithInlineHandlers++;
        }
    });
    
    if (buttonsWithInlineHandlers === 0) {
        console.log('✅ No add-to-cart buttons have inline onclick handlers');
    } else {
        console.warn(`⚠️ ${buttonsWithInlineHandlers} buttons still have inline onclick handlers`);
    }
    
    // Test 4: Check if pagination buttons have data attributes
    const paginationButtons = document.querySelectorAll('.page-number[data-page]');
    console.log(`Found ${paginationButtons.length} pagination buttons with data-page attributes`);
    
    // Test 5: Check if navigation handlers are available
    const handleCardClick = typeof window.handleCardClick === 'function';
    const handleAddToCart = typeof window.handleAddToCart === 'function';
    
    console.log('Handler functions available:');
    console.log(`- handleCardClick: ${handleCardClick ? '✅' : '❌'}`);
    console.log(`- handleAddToCart: ${handleAddToCart ? '✅' : '❌'}`);
    
    // Test 6: Test event delegation
    console.log('\n🔬 Testing event delegation...');
    
    const testCard = document.querySelector('.product-card[data-product-id]');
    if (testCard) {
        const productId = testCard.getAttribute('data-product-id');
        console.log(`Testing with product ID: ${productId}`);
        
        // Simulate click on product card (should navigate to product detail)
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        console.log('Simulating click on product card...');
        testCard.dispatchEvent(clickEvent);
    } else {
        console.warn('No product card found for testing');
    }
    
    console.log('\n📊 Test Summary:');
    console.log(`- Product cards found: ${productCards.length}`);
    console.log(`- Cards missing IDs: ${cardsWithoutIds}`);
    console.log(`- Cards with inline handlers: ${cardsWithInlineHandlers}`);
    console.log(`- Buttons with inline handlers: ${buttonsWithInlineHandlers}`);
    console.log(`- Pagination buttons: ${paginationButtons.length}`);
    console.log(`- Navigation handlers available: ${handleCardClick && handleAddToCart ? 'Yes' : 'No'}`);
    
    const allTestsPassed = cardsWithoutIds === 0 && 
                          cardsWithInlineHandlers === 0 && 
                          buttonsWithInlineHandlers === 0 && 
                          handleCardClick && 
                          handleAddToCart;
    
    console.log(`\n🏁 Overall result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return {
        passed: allTestsPassed,
        details: {
            productCards: productCards.length,
            cardsWithoutIds,
            cardsWithInlineHandlers,
            buttonsWithInlineHandlers,
            paginationButtons: paginationButtons.length,
            handlersAvailable: handleCardClick && handleAddToCart
        }
    };
}

// Make function globally available
window.testCentralizedNavigation = testCentralizedNavigation;

console.log('🧪 Navigation test script loaded. Run testCentralizedNavigation() to test.');
