/**
 * Component Utilities
 * Utility functions for working with components
 */

/**
 * Generate a component name from a title
 * @param {string} title - The component title
 * @returns {string} - The component name
 */
export function generateComponentName(title) {
  // Convert to PascalCase
  return title
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Generate a tag name from a title
 * @param {string} title - The component title
 * @returns {string} - The tag name
 */
export function generateTagName(title) {
  // Convert to kebab-case
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a component ID from a title
 * @param {string} title - The component title
 * @returns {string} - The component ID
 */
export function generateComponentId(title) {
  // Convert to kebab-case and add a timestamp
  const timestamp = Date.now();
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${base}-${timestamp}`;
}

/**
 * Validate a component name
 * @param {string} name - The component name
 * @returns {boolean} - Whether the name is valid
 */
export function validateComponentName(name) {
  // Component names must be PascalCase
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Validate a tag name
 * @param {string} name - The tag name
 * @returns {boolean} - Whether the name is valid
 */
export function validateTagName(name) {
  // Tag names must be kebab-case and contain a hyphen
  return /^[a-z][a-z0-9]*-[a-z0-9-]*$/.test(name);
}

/**
 * Extract events from component code
 * @param {string} code - The component code
 * @returns {Array<Object>} - The extracted events
 */
export function extractEvents(code) {
  const events = [];
  
  // Look for dispatchEvent calls
  const dispatchEventRegex = /dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{([^}]+)\}\s*\)\s*\)/g;
  let match;
  
  while ((match = dispatchEventRegex.exec(code)) !== null) {
    const eventName = match[1];
    const eventOptions = match[2];
    
    // Extract bubbles and composed properties
    const bubblesMatch = eventOptions.match(/bubbles\s*:\s*(true|false)/);
    const composedMatch = eventOptions.match(/composed\s*:\s*(true|false)/);
    const detailMatch = eventOptions.match(/detail\s*:\s*(\{[^}]+\})/);
    
    const event = {
      name: eventName,
      bubbles: bubblesMatch ? bubblesMatch[1] === 'true' : false,
      composed: composedMatch ? composedMatch[1] === 'true' : false,
      detail: detailMatch ? detailMatch[1] : '{}'
    };
    
    events.push(event);
  }
  
  return events;
}

/**
 * Extract properties from component code
 * @param {string} code - The component code
 * @returns {Array<Object>} - The extracted properties
 */
export function extractProperties(code) {
  const properties = [];
  
  // Look for static get observedAttributes
  const observedAttributesRegex = /static\s+get\s+observedAttributes\s*\(\s*\)\s*\{\s*return\s*\[\s*([^\]]+)\s*\]\s*;\s*\}/;
  const observedAttributesMatch = code.match(observedAttributesRegex);
  
  if (observedAttributesMatch) {
    const attributesString = observedAttributesMatch[1];
    const attributesRegex = /['"]([^'"]+)['"]/g;
    let attributeMatch;
    
    while ((attributeMatch = attributesRegex.exec(attributesString)) !== null) {
      const attributeName = attributeMatch[1];
      
      // Look for attributeChangedCallback to determine type
      const attributeChangedRegex = new RegExp(`attributeChangedCallback\\s*\\(\\s*name\\s*,\\s*oldValue\\s*,\\s*newValue\\s*\\)\\s*\\{[^}]*?name\\s*===\\s*['"]${attributeName}['"][^}]*?\\}`, 's');
      const attributeChangedMatch = code.match(attributeChangedRegex);
      
      let type = 'string';
      
      if (attributeChangedMatch) {
        const attributeChangedCode = attributeChangedMatch[0];
        
        if (attributeChangedCode.includes('JSON.parse')) {
          type = 'object';
        } else if (attributeChangedCode.includes('=== "true"') || attributeChangedCode.includes('!== "false"')) {
          type = 'boolean';
        } else if (attributeChangedCode.includes('parseInt') || attributeChangedCode.includes('parseFloat')) {
          type = 'number';
        }
      }
      
      properties.push({
        name: attributeName,
        type
      });
    }
  }
  
  return properties;
}

/**
 * Extract methods from component code
 * @param {string} code - The component code
 * @returns {Array<Object>} - The extracted methods
 */
export function extractMethods(code) {
  const methods = [];
  
  // Look for method definitions
  const methodRegex = /(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*([^)]*)\s*\)\s*\{/g;
  let match;
  
  while ((match = methodRegex.exec(code)) !== null) {
    const methodName = match[1];
    const paramsString = match[2];
    
    // Skip constructor and lifecycle methods
    if (['constructor', 'connectedCallback', 'disconnectedCallback', 'adoptedCallback', 'attributeChangedCallback'].includes(methodName)) {
      continue;
    }
    
    // Skip private methods (starting with underscore)
    if (methodName.startsWith('_')) {
      continue;
    }
    
    // Parse parameters
    const params = paramsString.split(',').map(param => {
      const trimmedParam = param.trim();
      if (!trimmedParam) return null;
      
      const paramName = trimmedParam.split('=')[0].trim();
      return {
        name: paramName,
        type: 'any'
      };
    }).filter(Boolean);
    
    methods.push({
      name: methodName,
      params
    });
  }
  
  return methods;
}

/**
 * Generate metadata for a component
 * @param {string} componentName - The component name
 * @param {string} tagName - The tag name
 * @param {string} code - The component code
 * @returns {Object} - The metadata
 */
export function generateMetadata(componentName, tagName, code) {
  const events = extractEvents(code);
  const properties = extractProperties(code);
  const methods = extractMethods(code);
  
  return {
    componentName,
    tagName,
    version: '1.0.0',
    events,
    properties,
    methods
  };
}

/**
 * Save a component
 * @param {string} componentName - The component name
 * @param {string} code - The component code
 * @param {Object} metadata - The component metadata
 * @returns {Promise<boolean>} - Whether the save was successful
 */
export async function saveComponent(componentName, code, metadata) {
  try {
    // In a real app, this would save the component to the file system
    // For now, we'll just log it
    console.log(`Saving component ${componentName}...`);
    console.log('Code:', code);
    console.log('Metadata:', metadata);
    
    return true;
  } catch (error) {
    console.error(`Failed to save component ${componentName}:`, error);
    return false;
  }
}
