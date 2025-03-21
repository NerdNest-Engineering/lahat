#!/usr/bin/env node
/**
 * Generate CSP Hashes Script
 * 
 * This script generates CSP hashes for inline scripts in HTML files.
 * It can be used to update the CSP in HTML files when inline scripts are changed.
 * 
 * Usage:
 *   node scripts/generate-csp-hashes.js <path-to-html-file>
 * 
 * Example:
 *   node scripts/generate-csp-hashes.js templates/mini-app-template.html
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractInlineScripts, generateScriptHash } from '../modules/utils/cspUtils.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main function
async function main() {
  try {
    // Get the HTML file path from command line arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Error: No HTML file specified');
      console.log('Usage: node scripts/generate-csp-hashes.js <path-to-html-file>');
      process.exit(1);
    }
    
    const htmlFilePath = path.resolve(process.cwd(), args[0]);
    
    // Read the HTML file
    console.log(`Reading HTML file: ${htmlFilePath}`);
    const html = await fs.readFile(htmlFilePath, 'utf8');
    
    // Extract inline scripts
    const scripts = extractInlineScripts(html);
    console.log(`Found ${scripts.length} inline script(s)`);
    
    // Generate hashes for each script
    const hashes = scripts.map((script, index) => {
      const hash = generateScriptHash(script);
      console.log(`Script ${index + 1}: ${hash}`);
      return hash;
    });
    
    // Print instructions for updating CSP
    console.log('\nTo update your CSP, add the following hash(es) to the script-src directive:');
    console.log(hashes.join(' '));
    
    // Check if the HTML file already has a CSP
    const cspRegex = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i;
    const cspMatch = html.match(cspRegex);
    
    if (cspMatch) {
      console.log('\nCurrent CSP found:');
      console.log(cspMatch[1]);
      
      // Check if the CSP already includes the hashes
      const missingHashes = hashes.filter(hash => !cspMatch[1].includes(hash));
      
      if (missingHashes.length > 0) {
        console.log('\nMissing hashes that need to be added:');
        console.log(missingHashes.join(' '));
        
        // Suggest an updated CSP
        const scriptSrcRegex = /script-src\s+([^;]+)/i;
        const scriptSrcMatch = cspMatch[1].match(scriptSrcRegex);
        
        if (scriptSrcMatch) {
          const updatedScriptSrc = scriptSrcMatch[1] + ' ' + missingHashes.join(' ');
          const updatedCsp = cspMatch[1].replace(scriptSrcRegex, `script-src ${updatedScriptSrc}`);
          
          console.log('\nSuggested updated CSP:');
          console.log(updatedCsp);
        }
      } else {
        console.log('\nAll hashes are already included in the CSP.');
      }
    } else {
      console.log('\nNo CSP found in the HTML file. Add a meta tag with the following content:');
      console.log(`<meta http-equiv="Content-Security-Policy" content="script-src 'self' ${hashes.join(' ')};">`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
