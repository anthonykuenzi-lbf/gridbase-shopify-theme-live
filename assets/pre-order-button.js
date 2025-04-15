/**
 * Pre-Order Button Script for Shopify product page - Direct Alpine.js Integration
 * 
 * This script directly extends the Alpine.js component to check for 
 * pre-order properties and update the button text accordingly.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Wait for Alpine.js to be available
  if (typeof window.Alpine === 'undefined') {
    // If Alpine isn't directly accessible, we'll need to wait for it
    let checkInterval = setInterval(function() {
      if (document.querySelector('[x-data]')) {
        clearInterval(checkInterval);
        injectPreOrderFunctionality();
      }
    }, 50);
  } else {
    injectPreOrderFunctionality();
  }
});

function injectPreOrderFunctionality() {
  // Get the container with the Alpine.js component
  const variantContainer = document.querySelector('[li-element="product-variant-container"]');
  
  if (!variantContainer) {
    console.error('Could not find product variant container');
    return;
  }
  
  // Find the add to cart button
  const addToCartButton = document.querySelector('.product-add-to-cart-button:not(.out-of-stock)');
  
  if (!addToCartButton) {
    console.error('Could not find add to cart button');
    return;
  }
  
  // Store the original text
  const originalButtonText = addToCartButton.textContent || 'Add to Cart';
  
  // Direct script injection to extend the Alpine.js component
  const script = document.createElement('script');
  script.textContent = `
    // Extend the handleVariant function with our pre-order check
    const originalHandleVariant = window.handleVariant;
    
    window.handleVariant = function(product, options_by_name, selected_or_first_available_variant) {
      // Get the original object
      const originalObj = originalHandleVariant(product, options_by_name, selected_or_first_available_variant);
      
      // Add our methods
      return {
        ...originalObj,
        
        // Flag to track if variant is a pre-order
        isPreOrder: false,
        
        // Extend the original addToCart method
        addToCart: function(event, redirect) {
          // Call the original method if it exists
          if (originalObj.addToCart) {
            originalObj.addToCart.call(this, event, redirect);
          } else {
            event.preventDefault();
          }
        },
        
        // Override the setVariant method
        setVariant: function(event) {
          // Call the original method
          if (originalObj.setVariant) {
            originalObj.setVariant.call(this, event);
          }
          
          // After setting the variant, check if it's a pre-order
          this.checkIfPreOrder();
        },
        
        // Check if the current variant is a pre-order
        checkIfPreOrder: function() {
          this.isPreOrder = false;
          
          // Get the current variant ID
          const variantId = this.selected_or_first_available_variant?.id;
          if (!variantId) return;
          
          // Look for pre-order in metadata or tags
          if (product.tags && Array.isArray(product.tags)) {
            for (const tag of product.tags) {
              if (String(tag).toLowerCase().includes('pre-order')) {
                this.isPreOrder = true;
                break;
              }
            }
          }
          
          // Check if this specific variant has pre-order in its title or SKU
          const variant = product.variants.find(v => v.id === variantId);
          if (variant) {
            const variantTitle = String(variant.title || '').toLowerCase();
            const variantSku = String(variant.sku || '').toLowerCase();
            
            if (
              variantTitle.includes('pre-order') || 
              variantTitle.includes('preorder') ||
              variantSku.includes('pre-order') ||
              variantSku.includes('preorder')
            ) {
              this.isPreOrder = true;
            }
          }
          
          // Also check if the product itself has pre-order in the title
          if (product.title && String(product.title).toLowerCase().includes('pre-order')) {
            this.isPreOrder = true;
          }
          
          // Update the button text
          this.updateButtonText();
        },
        
        // Update the button text based on pre-order status
        updateButtonText: function() {
          const buttons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
          buttons.forEach(button => {
            if (this.isPreOrder) {
              button.textContent = 'Pre-Order';
            } else {
              button.textContent = '${originalButtonText}';
            }
          });
        },
        
        // Initialize by checking pre-order status on load
        init: function() {
          // Call the original init if it exists
          if (originalObj.init) {
            originalObj.init.call(this);
          }
          
          // Initial check for pre-order status
          this.$nextTick(() => {
            this.checkIfPreOrder();
          });
        }
      };
    };
  `;
  
  // Add the script to the document
  document.head.appendChild(script);
  
  // Force re-initialization of the Alpine component
  if (variantContainer._x_dataStack) {
    // If possible, trigger Alpine to re-evaluate the component
    variantContainer._x_dataStack = null;
    variantContainer.setAttribute('x-data', variantContainer.getAttribute('x-data'));
  }
}