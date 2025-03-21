/**
 * CSP Utilities
 * Provides utilities for working with Content Security Policy
 */

import crypto from 'crypto';

/**
 * Generate a CSP hash for an inline script
 * @param {string} script - The script content to hash
 * @param {string} algorithm - The hashing algorithm to use (default: 'sha256')
 * @returns {string} - The CSP hash in the format 'sha256-...'
 */
export function generateScriptHash(script, algorithm = 'sha256') {
  // Remove any leading/trailing whitespace
  const trimmedScript = script.trim();
  
  // Create a hash of the script
  const hash = crypto
    .createHash(algorithm)
    .update(trimmedScript, 'utf8')
    .digest('base64');
  
  // Return the hash in the format required by CSP
  return `'${algorithm}-${hash}'`;
}

/**
 * Extract inline scripts from an HTML string
 * @param {string} html - The HTML content to parse
 * @returns {Array<string>} - Array of inline script contents
 */
export function extractInlineScripts(html) {
  const scripts = [];
  const scriptRegex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    // Check if it's an inline script (not having src attribute)
    const scriptTag = match[0];
    if (!scriptTag.includes('src=')) {
      scripts.push(match[1].trim());
    }
  }
  
  return scripts;
}

/**
 * Generate CSP hashes for all inline scripts in an HTML string
 * @param {string} html - The HTML content to parse
 * @param {string} algorithm - The hashing algorithm to use (default: 'sha256')
 * @returns {Array<string>} - Array of CSP hashes
 */
export function generateHashesForHtml(html, algorithm = 'sha256') {
  const scripts = extractInlineScripts(html);
  return scripts.map(script => generateScriptHash(script, algorithm));
}

/**
 * Update a CSP string to include hashes for inline scripts
 * @param {string} csp - The original CSP string
 * @param {Array<string>} hashes - Array of CSP hashes to add
 * @returns {string} - The updated CSP string
 */
export function updateCspWithHashes(csp, hashes) {
  // Find the script-src directive
  const scriptSrcRegex = /script-src\s+([^;]+)/i;
  const match = csp.match(scriptSrcRegex);
  
  if (match) {
    const scriptSrc = match[1];
    const updatedScriptSrc = scriptSrc + ' ' + hashes.join(' ');
    return csp.replace(scriptSrcRegex, `script-src ${updatedScriptSrc}`);
  }
  
  // If no script-src directive found, add one
  return csp + ` script-src ${hashes.join(' ')};`;
}
