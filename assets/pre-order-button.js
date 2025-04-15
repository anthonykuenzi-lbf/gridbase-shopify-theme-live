/**
 * Enhanced Pre-Order Button Script for Shopify
 * 
 * This script:
 * 1. Looks for "properties[Pre-order item]" in the line item properties
 * 2. Changes the "Add to Cart" button text to "Pre-Order" when found
 * 3. Labels variant options with "(Pre-order)" when they're pre-order items
 */
(function() {
  // Configuration
  const PRE_ORDER_LABEL = "(Pre-order)";
  const PRE_ORDER_BUTTON_TEXT = "Pre-Order";
  const REGULAR_BUTTON_TEXT = "Add to Cart";
  
  // Store pre-order variant IDs
  let preOrderVariantIds = [];
  
  // Function to get product data from the page
  function getProductData() {
    // Try to get product data from the x-data attribute
    const productContainer = document.querySelector('[x-data*="handleVariant"]');
    if (!productContainer) return null;
    
    // Extract product JSON from the x-data attribute
    const xDataAttr = productContainer.getAttribute('x-data');
    if (!xDataAttr) return null;
    
    // Regex to extract the product JSON
    const productMatch = xDataAttr.match(/handleVariant\((.*?),.*?\)/);
    if (!productMatch || !productMatch[1]) return null;
    
    try {
      // Parse the product JSON
      return JSON.parse(productMatch[1]);
    } catch (e) {
      console.error("Error parsing product data:", e);
      return null;
    }
  }
  
  // Function to identify pre-order variants
  function identifyPreOrderVariants() {
    const product = getProductData();
    if (!product || !product.variants) return;
    
    // Look for pre-order tag in product tags or metafields
    const isProductPreOrder = product.tags && Array.isArray(product.tags) && 
                             product.tags.some(tag => tag.toLowerCase().includes('pre-order'));
    
    // Check for pre-order in variant inventory policy or metafields
    preOrderVariantIds = product.variants
      .filter(variant => {
        // A variant is pre-order if:
        // 1. The whole product is marked as pre-order, OR
        // 2. The variant has zero inventory AND "continue" selling policy, OR
        // 3. The variant has a pre-order tag or metafield
        return isProductPreOrder || 
               (variant.inventory_quantity <= 0 && variant.inventory_policy === 'continue') ||
               (variant.metafields && variant.metafields.some(mf => 
                 mf.key && mf.key.toLowerCase().includes('pre-order')));
      })
      .map(variant => variant.id.toString());
    
    return preOrderVariantIds;
  }
  
  // Function to update the button text
  function updateButtonText() {
    // Find all Add to Cart buttons (excluding out of stock)
    const addToCartButtons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
    
    // If no buttons found, exit
    if (!addToCartButtons.length) return;
    
    // Get the current selected variant ID
    const variantIdInput = document.querySelector('input[name="id"]');
    const currentVariantId = variantIdInput ? variantIdInput.value : null;
    
    // Check if current variant is a pre-order variant
    const isPreOrder = currentVariantId && preOrderVariantIds.includes(currentVariantId);
    
    // Also check if pre-order property exists (for backward compatibility)
    const preOrderPropertyExists = !!document.querySelector('input[name="properties[Pre-order item]"]') || 
                                  !!document.querySelector('select[name="properties[Pre-order item]"]') ||
                                  !!document.querySelector('textarea[name="properties[Pre-order item]"]');
    
    // Update button text based on property existence or variant ID
    addToCartButtons.forEach(button => {
      if (isPreOrder || preOrderPropertyExists) {
        button.textContent = PRE_ORDER_BUTTON_TEXT;
      } else {
        // Only change it back if it was "Pre-Order" (to avoid changing custom text)
        if (button.textContent === PRE_ORDER_BUTTON_TEXT) {
          button.textContent = REGULAR_BUTTON_TEXT;
        }
      }
    });
  }
  
  // Function to add pre-order labels to variant selectors
  function addPreOrderLabelsToVariants() {
    const product = getProductData();
    if (!product || !product.variants || !product.options) return;
    
    // Get all variant selectors
    const variantRadios = document.querySelectorAll('.product-header_radio input[type="radio"]');
    if (!variantRadios.length) return;
    
    // For each variant option value, determine if all its variants are pre-order
    product.options.forEach((option, optionIndex) => {
      // Get unique values for this option
      const optionValues = [...new Set(product.variants.map(v => v.options[optionIndex]))];
      
      optionValues.forEach(optionValue => {
        // Find variants that have this option value
        const variantsWithThisOption = product.variants.filter(v => 
          v.options[optionIndex] === optionValue);
        
        // Check if all these variants are pre-order
        const allArePreOrder = variantsWithThisOption.every(v => 
          preOrderVariantIds.includes(v.id.toString()));
        
        if (allArePreOrder) {
          // Find the label for this option value and add the pre-order label
          variantRadios.forEach(radio => {
            if (radio.value === optionValue && radio.getAttribute('name') === option) {
              const label = radio.parentElement.querySelector('.product-variant-picker-button');
              if (label && !label.textContent.includes(PRE_ORDER_LABEL)) {
                label.textContent = `${label.textContent} ${PRE_ORDER_LABEL}`;
              }
            }
          });
        }
      });
    });
  }
  
  // Run once on page load
  function initialize() {
    // Identify pre-order variants
    identifyPreOrderVariants();
    
    // Add pre-order labels to variant selectors
    addPreOrderLabelsToVariants();
    
    // Update the button text
    updateButtonText();
    
    // Set up a mutation observer to detect changes to the form
    const productForm = document.querySelector('form[action*="/cart/add"]') || 
                        document.querySelector('.product-header_form-block');
    
    if (productForm) {
      const observer = new MutationObserver(function(mutations) {
        // If variant selection changes, update the button text
        updateButtonText();
      });
      
      observer.observe(productForm, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    // Listen for Alpine.js variant change events
    document.addEventListener('variant-changed', function() {
      updateButtonText();
    });
    
    // Also set up an interval as a fallback
    setInterval(updateButtonText, 1000);
  }
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 100); // Small delay to ensure Alpine.js has initialized
  }
})();