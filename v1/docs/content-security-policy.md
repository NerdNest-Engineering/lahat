# Content Security Policy (CSP) Implementation

This document explains how Content Security Policy (CSP) is implemented in Lahat, particularly focusing on the use of CSP hashes for inline scripts.

## Overview

Content Security Policy (CSP) is a security feature that helps prevent cross-site scripting (XSS) and other code injection attacks. It works by specifying which content sources are considered trusted, and instructing the browser to only execute or render resources from those trusted sources.

In Lahat, we use CSP to secure our mini apps and main application. One challenge with CSP is that it typically blocks inline scripts by default, which can be problematic for web applications that use inline scripts for initialization or other purposes.

## CSP Hash Implementation

To allow specific inline scripts to run while maintaining security, we use CSP hashes. A CSP hash is a base64-encoded SHA-256 hash of the script content. When included in the CSP, it tells the browser that a specific inline script with that exact content is allowed to run.

### How It Works

1. The browser calculates a hash of each inline script on the page.
2. The browser checks if any of these hashes match the hashes specified in the CSP.
3. If a match is found, the script is allowed to run. Otherwise, it's blocked.

### Benefits of Using CSP Hashes

- **Security**: Only specific, known scripts are allowed to run.
- **Flexibility**: Allows inline scripts without compromising security.
- **Compatibility**: Works across all modern browsers.
- **Maintainability**: Easier to maintain than nonces, which require server-side generation.

## Implementation in Lahat

In Lahat, we've implemented CSP hashes in the following files:

- `templates/mini-app-template.html`
- `main.html`
- `main-web-components.html`
- `components/app-creation/app-creation.html`
- `api-setup.html`
- `examples/mini-apps/calculator-test.html`

Each of these files includes a CSP meta tag with hashes for the inline scripts they contain.

Example:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self';
               script-src 'self' 'sha256-hPPsdAZF3UZJeMnYzdh7FkbYhux6NBVafRWhTp9LED0=' 'sha256-PHuWYXnijsAq5tGKOeaEHMLU043JUMCiB0qo02HrrSk=';
               style-src 'self' 'unsafe-inline';
               connect-src 'self';
               img-src 'self';
               font-src 'self';
               object-src 'none';
               base-uri 'none';
               form-action 'none';">
```

## Generating CSP Hashes

We've created a utility script to generate CSP hashes for inline scripts in HTML files. This script is useful when you need to add or modify inline scripts.

### Using the Script

```bash
node scripts/generate-csp-hashes.js <path-to-html-file>
```

Example:

```bash
node scripts/generate-csp-hashes.js templates/mini-app-template.html
```

The script will:

1. Extract all inline scripts from the HTML file.
2. Generate a SHA-256 hash for each script.
3. Check if the current CSP includes these hashes.
4. Suggest an updated CSP if needed.

### Utility Functions

We've also created utility functions for working with CSP hashes in the `modules/utils/cspUtils.js` file:

- `generateScriptHash(script, algorithm = 'sha256')`: Generates a CSP hash for a script.
- `extractInlineScripts(html)`: Extracts inline scripts from an HTML string.
- `generateHashesForHtml(html, algorithm = 'sha256')`: Generates CSP hashes for all inline scripts in an HTML string.
- `updateCspWithHashes(csp, hashes)`: Updates a CSP string to include hashes for inline scripts.

These functions can be imported from the `modules/utils` module:

```javascript
import { generateScriptHash } from '../modules/utils/index.js';
```

## Updating CSP Hashes

When you modify an inline script or add a new one, you need to update the CSP hash. Here's the process:

1. Make your changes to the inline script.
2. Run the generate-csp-hashes.js script on the HTML file.
3. Update the CSP meta tag with the new hash.

## Troubleshooting

If you encounter CSP errors in the browser console, such as:

```
Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'". Either the 'unsafe-inline' keyword, a hash ('sha256-...'), or a nonce ('nonce-...') is required to enable inline execution.
```

This means that the inline script is being blocked by CSP. To fix this:

1. Run the generate-csp-hashes.js script on the HTML file.
2. Add the generated hash to the CSP meta tag.
3. Reload the page.

## Best Practices

- **Minimize Inline Scripts**: When possible, prefer external scripts over inline scripts.
- **Keep Inline Scripts Simple**: Simple initialization code is easier to maintain and less likely to change.
- **Update Hashes When Scripts Change**: Always update the CSP hash when you modify an inline script.
- **Use the Script**: Always use the generate-csp-hashes.js script to generate hashes, rather than calculating them manually.
