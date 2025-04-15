/**
 * Lightweight Pre-Order Button and Variant Script for Shopify
 * 
 * This script:
 * 1. Changes the "Add to Cart" button text to "Pre-Order" when pre-order property exists
 * 2. Adds "(Pre-order)" to selected variant labels
 */

(function() {
  // Store original texts to avoid repeated DOM updates
  const originalTexts = {};
  let lastUpdateTime = 0;
  let updateScheduled = false;
  
  // Function to check if pre-order property exists
  function isPreOrderVariant() {
    return !!document.querySelector('input[name="properties[Pre-order item]"]') || 
           !!document.querySelector('select[name="properties[Pre-order item]"]') ||
           !!document.querySelector('textarea[name="properties[Pre-order item]"]');
  }
  
  // Function to update the button text
  function updateButtonText(isPreOrder) {
    const addToCartButtons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
    
    addToCartButtons.forEach(button => {
      // Store original text if not already stored
      if (!originalTexts['button']) {
        originalTexts['button'] = button.textContent;
      }
      
      // Update text based on pre-order status
      if (isPreOrder) {
        button.textContent = 'Pre-Order';
      } else if (button.textContent === 'Pre-Order') {
        // Only change back if it was changed by our script
        button.textContent = originalTexts['button'];
      }
    });
  }
  
  // Function to update selected variant label
  function updateSelectedVariantLabel(isPreOrder) {
    // Find checked radio button
    const selectedInput = document.querySelector('input[type="radio"]:checked');
    if (!selectedInput) return;
    
    // Find its label
    const variantId = selectedInput.getAttribute('id');
    const variantLabel = document.querySelector(`[for="${variantId}"]`);
    
    // If found, update the label
    if (variantLabel) {
      // Store original text
      if (!originalTexts[variantId]) {
        originalTexts[variantId] = variantLabel.textContent;
      }
      
      // Update or restore text
      if (isPreOrder && !variantLabel.textContent.includes('(Pre-order)')) {
        variantLabel.textContent = `${originalTexts[variantId]} (Pre-order)`;
      } else if (!isPreOrder && variantLabel.textContent.includes('(Pre-order)')) {
        variantLabel.textContent = originalTexts[variantId];
      }
    }
  }
  
  // Function to update everything with throttling
  function updatePreOrderElements() {
    // Check if we need to throttle updates (max once per 250ms)
    const now = Date.now();
    if (now - lastUpdateTime < 250) {
      if (!updateScheduled) {
        updateScheduled = true;
        setTimeout(function() {
          updatePreOrderElements();
          updateScheduled = false;
        }, 250);
      }
      return;
    }
    
    // Update timestamp
    lastUpdateTime = now;
    
    // Check pre-order status once
    const isPreOrder = isPreOrderVariant();
    
    // Update elements
    updateButtonText(isPreOrder);
    updateSelectedVariantLabel(isPreOrder);
  }
  
  // Initialize
  function initialize() {
    // Initial update
    updatePreOrderElements();
    
    // Listen for clicks on variant options
    document.addEventListener('click', function(e) {
      if (e.target.closest('input[type="radio"]') || 
          e.target.closest('.product-variant-picker-button')) {
        // Wait a bit for the variant to actually change
        setTimeout(updatePreOrderElements, 50);
      }
    });
    
    // Also set up a lightweight interval for cases where the click isn't caught
    setInterval(updatePreOrderElements, 1000);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();