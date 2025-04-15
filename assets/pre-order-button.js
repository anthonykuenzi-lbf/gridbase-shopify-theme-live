/**
 * Debug Script to Display All Variant Properties
 * This script creates a debug panel showing all available properties for the current product and variants
 */

(function() {
  // Create a styled debug panel
  function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-properties-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      width: 400px;
      max-height: 400px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.85);
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;
    
    // Add a title
    const title = document.createElement('h3');
    title.textContent = 'Product & Variant Debug Info';
    title.style.cssText = 'color: white; margin-top: 0; border-bottom: 1px solid #00ff00; padding-bottom: 5px;';
    panel.appendChild(title);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ff3333;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 3px 8px;
      cursor: pointer;
    `;
    closeBtn.onclick = function() {
      document.body.removeChild(panel);
    };
    panel.appendChild(closeBtn);
    
    // Create a content container
    const content = document.createElement('div');
    content.id = 'debug-properties-content';
    panel.appendChild(content);
    
    document.body.appendChild(panel);
    return content;
  }
  
  // Format an object for display
  function formatObject(obj, indent = 0) {
    if (!obj) return 'null';
    if (typeof obj !== 'object') return String(obj);
    
    const indentStr = '  '.repeat(indent);
    let output = '{\n';
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        output += `${indentStr}  "${key}": `;
        
        if (value === null) {
          output += 'null';
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            output += '[\n';
            value.forEach((item, index) => {
              output += `${indentStr}    ${formatObject(item, indent + 2)}${index < value.length - 1 ? ',' : ''}\n`;
            });
            output += `${indentStr}  ]`;
          } else {
            output += formatObject(value, indent + 1);
          }
        } else if (typeof value === 'string') {
          output += `"${value}"`;
        } else {
          output += value;
        }
        
        output += ',\n';
      }
    }
    
    if (output.endsWith(',\n')) {
      output = output.slice(0, -2) + '\n';
    }
    
    output += `${indentStr}}`;
    return output;
  }
  
  // Get all product data from page
  function extractProductData() {
    const data = {
      productJSON: null,
      variantContainer: null,
      currentVariant: null,
      metafields: [],
      lineItemProperties: []
    };
    
    // Try to find the product JSON
    try {
      // Look for product JSON in script tags
      const scriptTags = document.querySelectorAll('script[type="application/json"]');
      scriptTags.forEach(script => {
        try {
          const json = JSON.parse(script.textContent);
          if (json && json.product) {
            data.productJSON = json.product;
          }
        } catch (e) {
          // Not a valid JSON or doesn't contain product
        }
      });
      
      // Look for product in window object
      if (window.product) {
        data.productJSON = window.product;
      }
      
      // Check for window Shopify object
      if (window.Shopify && window.Shopify.product) {
        data.productJSON = window.Shopify.product;
      }
    } catch (e) {
      console.error('Error extracting product JSON:', e);
    }
    
    // Try to find Alpine.js variant container
    try {
      const container = document.querySelector('[li-element="product-variant-container"]');
      if (container && container._x_dataStack) {
        data.variantContainer = "Alpine.js container found";
        
        // Try to access Alpine.js data
        if (container._x_dataStack[0]) {
          data.currentVariant = container._x_dataStack[0].selected_or_first_available_variant;
        }
      }
    } catch (e) {
      console.error('Error extracting Alpine data:', e);
    }
    
    // Look for metafields
    try {
      document.querySelectorAll('meta[property^="product:"]').forEach(meta => {
        data.metafields.push({
          property: meta.getAttribute('property'),
          content: meta.getAttribute('content')
        });
      });
    } catch (e) {
      console.error('Error extracting metafields:', e);
    }
    
    // Find line item properties inputs
    try {
      document.querySelectorAll('input[name^="properties["], select[name^="properties["]').forEach(input => {
        data.lineItemProperties.push({
          name: input.name,
          value: input.value
        });
      });
    } catch (e) {
      console.error('Error extracting line item properties:', e);
    }
    
    return data;
  }
  
  // Find the "handleVariant" data in Alpine.js
  function getAlpineVariantData() {
    const data = {};
    
    // Try to find Alpine.js component data
    try {
      const container = document.querySelector('[x-data*="handleVariant"]');
      if (container && container._x_dataStack) {
        const alpine = container._x_dataStack[0];
        if (alpine) {
          // Extract data properties
          data.product = alpine.product;
          data.options_by_name = alpine.options_by_name;
          data.selected_or_first_available_variant = alpine.selected_or_first_available_variant;
          
          // Also check for any functions
          const functions = [];
          for (const key in alpine) {
            if (typeof alpine[key] === 'function') {
              functions.push(key);
            }
          }
          data.available_functions = functions;
        }
      }
    } catch (e) {
      console.error('Error getting Alpine data:', e);
      data.error = e.message;
    }
    
    return data;
  }
  
  // Monitor for variant changes
  function setupVariantMonitoring(contentElement) {
    const updateDebugInfo = () => {
      displayDebugInfo(contentElement);
    };
    
    // Set up a mutation observer on the product form
    const productForm = document.querySelector('form[action*="/cart/add"]') || 
                        document.querySelector('.product-header_form-block');
    
    if (productForm) {
      const observer = new MutationObserver(updateDebugInfo);
      observer.observe(productForm, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
    
    // Also check periodically
    setInterval(updateDebugInfo, 2000);
  }
  
  // Display the debug info
  function displayDebugInfo(contentElement) {
    const productData = extractProductData();
    const alpineData = getAlpineVariantData();
    
    let html = '';
    
    // Add the current time
    html += `<p><strong>Last Updated:</strong> ${new Date().toLocaleTimeString()}</p>`;
    
    // Display current variant
    if (alpineData.selected_or_first_available_variant) {
      html += `<h4>Current Selected Variant:</h4>`;
      html += `<pre>${formatObject(alpineData.selected_or_first_available_variant)}</pre>`;
    } else if (productData.currentVariant) {
      html += `<h4>Current Selected Variant:</h4>`;
      html += `<pre>${formatObject(productData.currentVariant)}</pre>`;
    }
    
    // Display line item properties
    if (productData.lineItemProperties && productData.lineItemProperties.length > 0) {
      html += `<h4>Line Item Properties:</h4>`;
      html += `<pre>${formatObject(productData.lineItemProperties)}</pre>`;
    }
    
    // Display available functions if any
    if (alpineData.available_functions && alpineData.available_functions.length > 0) {
      html += `<h4>Available Alpine.js Functions:</h4>`;
      html += `<ul>`;
      alpineData.available_functions.forEach(fn => {
        html += `<li>${fn}</li>`;
      });
      html += `</ul>`;
    }
    
    // Display product metafields
    if (productData.metafields && productData.metafields.length > 0) {
      html += `<h4>Product Metafields:</h4>`;
      html += `<pre>${formatObject(productData.metafields)}</pre>`;
    }
    
    // Display full product JSON if available
    if (alpineData.product) {
      html += `<h4>Full Product JSON:</h4>`;
      html += `<pre>${formatObject(alpineData.product)}</pre>`;
    } else if (productData.productJSON) {
      html += `<h4>Full Product JSON:</h4>`;
      html += `<pre>${formatObject(productData.productJSON)}</pre>`;
    }
    
    contentElement.innerHTML = html;
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const contentElement = createDebugPanel();
    displayDebugInfo(contentElement);
    setupVariantMonitoring(contentElement);
  });
  
  // If DOM is already loaded, run immediately
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    const contentElement = createDebugPanel();
    displayDebugInfo(contentElement);
    setupVariantMonitoring(contentElement);
  }
})();