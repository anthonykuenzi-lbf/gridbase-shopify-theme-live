/**
 * Pre-Order Button Script for Shopify
 * 
 * This script looks for "properties[Pre-order item]" in the line item properties
 * and changes the "Add to Cart" button text to "Pre-Order" when found.
 */

(function() {
  // Function to update the button text
  function updateButtonText() {
    // Find all Add to Cart buttons (excluding out of stock)
    const addToCartButtons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
    
    // If no buttons found, exit
    if (!addToCartButtons.length) return;
    
    // Check if pre-order property exists
    const preOrderPropertyExists = !!document.querySelector('input[name="properties[Pre-order item]"]') || 
                                  !!document.querySelector('select[name="properties[Pre-order item]"]') ||
                                  !!document.querySelector('textarea[name="properties[Pre-order item]"]');
    
    // Update button text based on property existence
    addToCartButtons.forEach(button => {
      if (preOrderPropertyExists) {
        button.textContent = 'Pre-Order';
      } else {
        // Only change it back if it was "Pre-Order" (to avoid changing custom text)
        if (button.textContent === 'Pre-Order') {
          button.textContent = 'Add to Cart';
        }
      }
    });
  }
  
  // Run once on page load
  function initialize() {
    updateButtonText();
    
    // Set up a mutation observer to detect changes to the form
    const productForm = document.querySelector('form[action*="/cart/add"]') || 
                        document.querySelector('.product-header_form-block');
    
    if (productForm) {
      const observer = new MutationObserver(function() {
        updateButtonText();
      });
      
      observer.observe(productForm, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    // Also set up an interval as a fallback
    setInterval(updateButtonText, 1000);
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();