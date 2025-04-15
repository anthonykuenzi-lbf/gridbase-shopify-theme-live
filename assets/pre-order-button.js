/**
 * Pre-Order Button Script for Shopify product page
 * 
 * This script checks if the current variant has a property with "pre-order" 
 * in its name and changes the "Add to Cart" button to "Pre-Order" accordingly.
 */

// Function to check for pre-order properties and update button text
function checkForPreOrderAndUpdateButton() {
  // Get the current selected variant
  const currentVariant = window.currentVariant || {};
  
  // Check if this variant has properties and if any contain "pre-order" (case insensitive)
  const isPreOrder = checkIfVariantIsPreOrder(currentVariant);
  
  // Get all add to cart buttons
  const addToCartButtons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
  
  // Update button text based on pre-order status
  addToCartButtons.forEach(button => {
    if (isPreOrder) {
      button.textContent = "Pre-Order";
    } else {
      button.textContent = "Add to Cart";
    }
  });
}

// Helper function to check if a variant has pre-order in its properties
function checkIfVariantIsPreOrder(variant) {
  // If no variant or no properties, return false
  if (!variant || !variant.properties) return false;
  
  // Check if any property keys or values contain "pre-order"
  for (const key in variant.properties) {
    const propertyKey = key.toLowerCase();
    const propertyValue = String(variant.properties[key]).toLowerCase();
    
    if (propertyKey.includes('pre-order') || propertyValue.includes('pre-order')) {
      return true;
    }
  }
  
  return false;
}

// Integrate with the existing variant handling
document.addEventListener('DOMContentLoaded', function() {
  // Initial check when page loads
  checkForPreOrderAndUpdateButton();
  
  // Monitor for variant changes
  document.addEventListener('variant-changed', function(e) {
    // Update the current variant reference if available in the event
    if (e.detail && e.detail.variant) {
      window.currentVariant = e.detail.variant;
    }
    
    // Check and update button
    checkForPreOrderAndUpdateButton();
  });
  
  // Alternative method to detect variant changes - watch for mutations on the form
  const productForm = document.querySelector('form[action*="/cart/add"]');
  if (productForm) {
    // Set up a mutation observer to watch for variant changes
    const observer = new MutationObserver(function() {
      checkForPreOrderAndUpdateButton();
    });
    
    // Start observing the form for attribute changes
    observer.observe(productForm, { attributes: true, subtree: true });
  }
});

// Since your theme appears to use an x-data Alpine.js setup, integrate with that too
function extendHandleVariant() {
  // Get the original handleVariant function if it exists
  const originalHandleVariant = window.handleVariant || function() {};
  
  // Override or create handleVariant
  window.handleVariant = function(product, options_by_name, selected_or_first_available_variant) {
    // Call the original function to get its return value
    const originalReturn = originalHandleVariant(product, options_by_name, selected_or_first_available_variant);
    
    // Extend the return object with our own functionality
    const extendedReturn = {
      ...originalReturn,
      
      // Override setVariant method if it exists
      setVariant: function(event) {
        // Call original setVariant if it exists
        if (originalReturn.setVariant) {
          originalReturn.setVariant.call(this, event);
        }
        
        // Store the current variant
        if (this.selected_or_first_available_variant) {
          window.currentVariant = this.selected_or_first_available_variant;
          checkForPreOrderAndUpdateButton();
        }
      }
    };
    
    // Store initial variant
    if (selected_or_first_available_variant) {
      window.currentVariant = selected_or_first_available_variant;
      setTimeout(checkForPreOrderAndUpdateButton, 100); // Small delay to ensure DOM is ready
    }
    
    return extendedReturn;
  };
}

// Initialize the extension
extendHandleVariant();