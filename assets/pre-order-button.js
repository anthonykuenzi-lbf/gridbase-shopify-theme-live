/**
 * Pre-Order Button and Variant Script for Shopify
 * 
 * This script:
 * 1. Looks for "properties[Pre-order item]" in the line item properties
 *    and changes the "Add to Cart" button text to "Pre-Order" when found
 * 2. Adds "(Pre-order)" to the variant selector text for pre-order variants
 */

(function() {
  // Store original variant labels to restore them if needed
  const originalVariantLabels = new Map();
  
  // Function to update the button text and variant selectors
  function updatePreOrderElements() {
    // Find all Add to Cart buttons (excluding out of stock)
    const addToCartButtons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
    
    // Check if pre-order property exists
    const preOrderPropertyExists = !!document.querySelector('input[name="properties[Pre-order item]"]') || 
                                  !!document.querySelector('select[name="properties[Pre-order item]"]') ||
                                  !!document.querySelector('textarea[name="properties[Pre-order item]"]');
    
    // Update button text based on property existence
    if (addToCartButtons.length) {
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
    
    // Update variant selectors
    updateVariantSelectors(preOrderPropertyExists);
  }
  
  // Function to update variant selectors with pre-order text
  function updateVariantSelectors(isPreOrder) {
    // Find all selected variant options
    const selectedVariants = document.querySelectorAll('input[type="radio"]:checked');
    
    selectedVariants.forEach(input => {
      // Find the label for this input
      const variantName = input.getAttribute('value');
      const variantId = input.getAttribute('id');
      
      if (!variantName) return;
      
      // Find the label text element by using the 'for' attribute or closest label
      let variantLabel = document.querySelector(`[for="${variantId}"]`);
      
      // If we couldn't find by ID, try finding within the closest label element
      if (!variantLabel) {
        const label = input.closest('label');
        if (label) {
          variantLabel = label.querySelector('.product-variant-picker-button') || 
                         label.querySelector('.w-form-label');
        }
      }
      
      if (!variantLabel) return;
      
      // Store original text if we haven't already
      if (!originalVariantLabels.has(variantId)) {
        originalVariantLabels.set(variantId, variantLabel.textContent);
      }
      
      // Update the text if it's a pre-order and doesn't already have "(Pre-order)" text
      if (isPreOrder) {
        if (!variantLabel.textContent.includes('(Pre-order)')) {
          variantLabel.textContent = `${originalVariantLabels.get(variantId)} (Pre-order)`;
        }
      } else {
        // Restore original text if not a pre-order
        variantLabel.textContent = originalVariantLabels.get(variantId);
      }
    });
    
    // Also check the currently active variant in the product title area if it exists
    const activeVariantTitle = document.querySelector('.product-variant-title, .variant-title, .variant-selected');
    if (activeVariantTitle) {
      // Store original if needed
      if (!originalVariantLabels.has('active-variant-title')) {
        originalVariantLabels.set('active-variant-title', activeVariantTitle.textContent);
      }
      
      // Update text
      if (isPreOrder) {
        if (!activeVariantTitle.textContent.includes('(Pre-order)')) {
          activeVariantTitle.textContent = `${originalVariantLabels.get('active-variant-title')} (Pre-order)`;
        }
      } else {
        // Restore original
        activeVariantTitle.textContent = originalVariantLabels.get('active-variant-title');
      }
    }
  }
  
  // Run once on page load
  function initialize() {
    updatePreOrderElements();
    
    // Set up a mutation observer to detect changes to the form and variant selections
    const productForm = document.querySelector('form[action*="/cart/add"]') || 
                        document.querySelector('.product-header_form-block');
    
    if (productForm) {
      const observer = new MutationObserver(function() {
        updatePreOrderElements();
      });
      
      observer.observe(productForm, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    // Also observe the entire product area for any changes to variant selectors
    const productArea = document.querySelector('.product-header_product-details') || 
                        document.querySelector('[li-element="product-variant-container"]');
    
    if (productArea && productArea !== productForm) {
      const observer = new MutationObserver(function() {
        updatePreOrderElements();
      });
      
      observer.observe(productArea, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    // Also set up an interval as a fallback
    setInterval(updatePreOrderElements, 1000);
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();