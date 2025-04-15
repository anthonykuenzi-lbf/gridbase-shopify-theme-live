/**
 * Simplified Pre-Order Script for Shopify
 * Adds "(Pre-order)" label to variant selectors and changes button text
 */
(function() {
  // Configuration
  const PRE_ORDER_LABEL = " (Pre-order)";
  const PRE_ORDER_BUTTON_TEXT = "Pre-Order";
  const REGULAR_BUTTON_TEXT = "Add to Cart";
  
  // Wait for Alpine.js to initialize
  function waitForAlpine(callback) {
    // Check if window.Alpine exists or if the handleVariant setup is complete
    if (window.Alpine || document.querySelector('[x-data="handleVariant"]')) {
      callback();
    } else {
      setTimeout(() => waitForAlpine(callback), 50);
    }
  }
  
  // Function to directly access the Alpine.js data
  function getAlpineData() {
    // Try different methods to access Alpine data
    const container = document.querySelector('[x-data*="handleVariant"]');
    if (!container) return null;
    
    // Try to get Alpine.js data using __x
    if (container.__x && container.__x.getUnobservedData) {
      return container.__x.getUnobservedData();
    }
    
    // Fallback: Parse the data attribute
    try {
      const dataAttr = container.getAttribute('x-data');
      if (!dataAttr) return null;
      
      // Extract the JSON product data - this is tricky as it's in a function call
      // We'll use a simple approach to extract the first JSON object
      const match = dataAttr.match(/handleVariant\((.*?),/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch (e) {
      console.error("Error accessing Alpine data:", e);
    }
    
    return null;
  }
  
  // Directly use the product data from the page
  function getProductData() {
    // First try Alpine data
    const alpineData = getAlpineData();
    if (alpineData && alpineData.product) {
      return alpineData.product;
    }
    
    // Try another approach - look for JSON data in script tags
    const jsonScripts = document.querySelectorAll('script[type="application/json"]');
    for (const script of jsonScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data && data.product) {
          return data.product;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Last resort - use the window object if Shopify has added the product there
    if (window.product) {
      return window.product;
    }
    
    // If all else fails, check if there's a global meta field
    if (window.meta && window.meta.product) {
      return window.meta.product;
    }
    
    return null;
  }
  
  // Determine pre-order variants - simplified approach
  function identifyPreOrderVariants() {
    const product = getProductData();
    if (!product || !product.variants) {
      console.log("Product data not found");
      return [];
    }
    
    console.log("Found product data:", product.title);
    
    // Check if entire product is pre-order (via tags)
    const isProductPreOrder = product.tags && 
      (Array.isArray(product.tags) ? 
        product.tags.some(tag => tag.toLowerCase().includes('pre-order')) :
        typeof product.tags === 'string' && product.tags.toLowerCase().includes('pre-order'));
    
    // Identify pre-order variants (simplified logic)
    return product.variants
      .filter(variant => {
        // Consider a variant pre-order if:
        // 1. The whole product is pre-order, OR
        // 2. Inventory quantity is 0 but inventory_policy allows selling ("continue")
        return isProductPreOrder || 
          (variant.inventory_quantity <= 0 && variant.inventory_policy === 'continue');
      })
      .map(variant => variant.id.toString());
  }
  
  // Add "(Pre-order)" to variant selectors
  function addPreOrderLabelsToVariants(preOrderVariantIds) {
    if (!preOrderVariantIds.length) {
      console.log("No pre-order variants found");
      return;
    }
    
    console.log("Pre-order variants:", preOrderVariantIds);
    
    // Get all variant selectors
    const variantLabels = document.querySelectorAll('.product-variant-picker-button');
    if (!variantLabels.length) {
      console.log("No variant labels found");
      return;
    }
    
    // Get product data
    const product = getProductData();
    if (!product || !product.options || !product.variants) return;
    
    // For each option (like "Size", "Color", etc.)
    product.options.forEach((option, optionIndex) => {
      // Get all unique values for this option (like "S", "M", "L" for "Size")
      const optionValues = [...new Set(product.variants.map(v => 
        v.options ? v.options[optionIndex] : null).filter(Boolean))];
      
      // For each value of this option
      optionValues.forEach(optionValue => {
        // Find all variants with this option value
        const variantsWithThisValue = product.variants.filter(v => 
          v.options && v.options[optionIndex] === optionValue);
        
        // Check if ALL variants with this option value are pre-order
        const allArePreOrder = variantsWithThisValue.length > 0 && 
          variantsWithThisValue.every(v => preOrderVariantIds.includes(v.id.toString()));
        
        if (allArePreOrder) {
          // Find corresponding labels in the DOM and add "(Pre-order)"
          variantLabels.forEach(label => {
            // Match the label text with the option value
            if (label.textContent.trim() === optionValue && 
                !label.textContent.includes(PRE_ORDER_LABEL)) {
              
              console.log("Adding pre-order label to:", optionValue);
              label.textContent = label.textContent + PRE_ORDER_LABEL;
            }
          });
        }
      });
    });
  }
  
  // Update the Add to Cart button
  function updateAddToCartButton(preOrderVariantIds) {
    // Find the Add to Cart button
    const addToCartButtons = document.querySelectorAll('.product-add-to-cart-button:not(.out-of-stock)');
    if (!addToCartButtons.length) return;
    
    // Find the currently selected variant
    let currentVariantId = '';
    
    // Try to get it from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const variantParam = urlParams.get('variant');
    if (variantParam) {
      currentVariantId = variantParam;
    } else {
      // Try to get it from the form
      const variantInput = document.querySelector('input[name="id"]');
      if (variantInput) {
        currentVariantId = variantInput.value;
      } else {
        // Try to get it from Alpine.js data
        const container = document.querySelector('[x-data*="handleVariant"]');
        if (container && container.__x) {
          const data = container.__x.getUnobservedData();
          if (data && data.selected_or_first_available_variant) {
            currentVariantId = data.selected_or_first_available_variant.id.toString();
          }
        }
      }
    }
    
    // Update button text if the current variant is a pre-order variant
    if (currentVariantId && preOrderVariantIds.includes(currentVariantId)) {
      addToCartButtons.forEach(button => {
        button.textContent = PRE_ORDER_BUTTON_TEXT;
      });
    } else {
      // Only change it back if it was "Pre-Order"
      addToCartButtons.forEach(button => {
        if (button.textContent === PRE_ORDER_BUTTON_TEXT) {
          button.textContent = REGULAR_BUTTON_TEXT;
        }
      });
    }
  }
  
  // Main initialization function
  function initialize() {
    console.log("Pre-order script initializing...");
    
    // Identify pre-order variants
    const preOrderVariantIds = identifyPreOrderVariants();
    
    // Add pre-order labels to variant selectors
    addPreOrderLabelsToVariants(preOrderVariantIds);
    
    // Update the Add to Cart button
    updateAddToCartButton(preOrderVariantIds);
    
    // Set up observers and event listeners
    
    // Watch for variant changes
    document.addEventListener('change', function(e) {
      // Check if the change event is from a variant selector
      if (e.target.matches('input[type="radio"][name^="option"]') || 
          e.target.matches('select[name^="option"]')) {
        setTimeout(() => updateAddToCartButton(preOrderVariantIds), 100);
      }
    });
    
    // Also setup a mutation observer to catch Alpine.js updates
    const productContainer = document.querySelector('.product-header_product-details') || 
                            document.querySelector('[x-data*="handleVariant"]');
    
    if (productContainer) {
      const observer = new MutationObserver(function() {
        updateAddToCartButton(preOrderVariantIds);
      });
      
      observer.observe(productContainer, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    // Also run periodically as a fallback
    setInterval(() => updateAddToCartButton(preOrderVariantIds), 1000);
  }
  
  // Wait for Alpine.js to initialize, then run our script
  waitForAlpine(function() {
    // Give a little extra time for everything to be ready
    setTimeout(initialize, 200);
  });
  
})();