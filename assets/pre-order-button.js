/**
 * Simple Direct Pre-Order Button Script
 * This script directly modifies the add to cart button using DOM manipulation
 */

document.addEventListener('DOMContentLoaded', function() {
  // Function to check if a product is pre-order from meta fields or tags
  function isPreOrderProduct() {
    // Try to find pre-order indicators
    
    // 1. Check if there's a meta tag with pre-order information
    const metaTags = document.querySelectorAll('meta[property^="product:"]');
    for (const meta of metaTags) {
      if (meta.content && meta.content.toLowerCase().includes('pre-order')) {
        return true;
      }
    }
    
    // 2. Check product title for pre-order
    const productTitle = document.querySelector('.product-title');
    if (productTitle && productTitle.textContent.toLowerCase().includes('pre-order')) {
      return true;
    }
    
    // 3. Check for any data attributes that might indicate pre-order
    const productContainer = document.querySelector('[data-product-id]');
    if (productContainer) {
      const dataAttributes = productContainer.dataset;
      for (const key in dataAttributes) {
        if (dataAttributes[key].toLowerCase().includes('pre-order')) {
          return true;
        }
      }
    }
    
    // 4. Check for pre-order in the product description
    const productDescription = document.querySelector('.product-header_description');
    if (productDescription && productDescription.textContent.toLowerCase().includes('pre-order')) {
      return true;
    }
    
    return false;
  }
  
  // Function to update the button text
  function updateButtonText() {
    const addToCartButtons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
    
    if (isPreOrderProduct()) {
      addToCartButtons.forEach(button => {
        button.textContent = 'Pre-Order';
      });
    }
  }
  
  // Run on page load
  updateButtonText();
  
  // Also watch for any variant changes via a mutation observer
  const productForm = document.querySelector('form[action*="/cart/add"]') || 
                      document.querySelector('.product-header_form-block');
  
  if (productForm) {
    const observer = new MutationObserver(function(mutations) {
      updateButtonText();
    });
    
    observer.observe(productForm, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });
  }
  
  // Also check after Alpine.js might have initialized
  setTimeout(updateButtonText, 1000);
});