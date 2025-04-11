# Lahat: Security Checklist

## Overview

This document provides a comprehensive security checklist for the Lahat application, covering Electron-specific considerations, API key management, content security, file system operations, and mini app sandboxing.

## Electron Security Considerations

Lahat is built on Electron, which combines Chromium and Node.js. This powerful combination requires careful security configuration.

### Window Creation Security

✅ **Use contextIsolation**
```javascript
const win = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,  // REQUIRED
    nodeIntegration: false,  // REQUIRED
    sandbox: true,           // Recommended for mini apps
    preload: path.join(__dirname, 'preload.cjs')
  }
});
```

✅ **Validate webPreferences in all BrowserWindow creation**
- Ensure all window creation includes proper security settings
- Double-check inherited options
- Apply stricter settings for mini app windows

❌ **NEVER enable nodeIntegration**
- Allowing nodeIntegration gives renderer processes full Node.js access
- This would be a critical security vulnerability

### Preload Scripts

✅ **Use contextBridge correctly**
```javascript
// Correct usage with specific exposed functions
contextBridge.exposeInMainWorld('electronAPI', {
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  generateMiniApp: (params) => ipcRenderer.invoke('generate-mini-app', params)
});

// AVOID exposing entire modules
// ❌ contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
```

✅ **Validate all parameters in IPC handlers**
```javascript
async function handleSetApiKey(event, apiKey) {
  // Validate the API key format
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
    return { success: false, error: 'Invalid API key format' };
  }
  
  // Process the valid key
  // ...
}
```

### Content Security Policy

✅ **Implement strict CSP in HTML files**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               connect-src 'self' https://api.anthropic.com https://api.lahat.nerdnest.engineering;
               img-src 'self' data:;
               font-src 'self';
               object-src 'none';
               base-uri 'none';">
```

✅ **Review CSP regularly**
- Audit the CSP directives for each HTML file
- Remove unnecessary permissions
- Keep 'unsafe-inline' usage to a minimum
- Consider using nonces for inline scripts when possible

## API Key Management

Secure storage of API keys is critical for maintaining user trust and security.

### Secure Storage

✅ **Use Electron's safeStorage API**
```javascript
// Encrypt API key using OS secure mechanisms
if (safeStorage.isEncryptionAvailable()) {
  const encryptedKey = safeStorage.encryptString(apiKey);
  store.set('encryptedApiKey', encryptedKey.toString('base64'));
  store.delete('apiKey'); // Remove any plaintext key
} else {
  // Fallback with warning (should be avoided)
}
```

✅ **Never store API keys in plaintext**
- Always use encryption
- Implement secure fallback when encryption is unavailable
- Clearly communicate security status to users

### API Communication

✅ **Use HTTPS for all API requests**
```javascript
// Always use HTTPS URLs
const client = new Anthropic({
  apiKey: apiKey,
  baseURL: 'https://api.anthropic.com/v1'
});
```

✅ **Implement request/response validation**
- Validate all outbound request data
- Validate and sanitize all response data before processing
- Implement request timeouts and retry limits

## File System Security

Safe file system operations are essential to prevent data leakage and tampering.

### Path Validation

✅ **Validate file paths before operations**
```javascript
function isPathWithinAppStorage(filePath) {
  const storageDir = path.resolve(app.getPath('userData'));
  const normalizedPath = path.normalize(filePath);
  return normalizedPath.startsWith(storageDir);
}

async function writeFile(filePath, content) {
  // Validate path is within allowed boundaries
  if (!isPathWithinAppStorage(filePath)) {
    throw new Error('Security violation: Attempted to write outside allowed directories');
  }
  
  // Proceed with write
  // ...
}
```

✅ **Use absolute paths consistently**
- Always use absolute paths for file operations
- Normalize paths to prevent directory traversal
- Limit file operations to specific directories

### File Content Security

✅ **Sanitize user-generated file names**
```javascript
function getSafeFilename(name) {
  // Remove path traversal characters and invalid filename chars
  return name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\./g, '_')
    .toLowerCase();
}
```

✅ **Validate file content before operations**
- Implement size limits for file operations
- Verify file types match expected formats
- Scan for malicious content in untrusted files

## Mini App Sandboxing

Mini apps are a key feature of Lahat, but they also represent a significant security challenge.

### Enhanced Isolation

✅ **Use full sandbox mode for mini app windows**
```javascript
const win = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,               // Critical for mini apps
    preload: path.join(__dirname, 'miniAppPreload.cjs')
  }
});
```

✅ **Implement strict CSP for mini apps**
```javascript
// Add CSP header when loading mini app content
win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self'; object-src 'none';"
      ]
    }
  });
});
```

### Limited Capabilities

✅ **Restrict mini app IPC capabilities**
```javascript
// Minimal API exposure for mini apps
contextBridge.exposeInMainWorld('miniAppAPI', {
  // Only expose what's absolutely necessary
  close: () => ipcRenderer.invoke('close-mini-app'),
  minimize: () => ipcRenderer.invoke('minimize-mini-app'),
  maximize: () => ipcRenderer.invoke('maximize-mini-app')
});
```

✅ **Limit resource usage**
- Set memory limits for mini app windows
- Implement CPU throttling for background windows
- Disable DevTools in production mode

## User Input Validation

All user input must be treated as untrusted and properly validated.

### Input Sanitization

✅ **Validate and sanitize all user inputs**
```javascript
// Validate prompt input
function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return false;
  }
  
  // Check length limits
  if (prompt.length < 3 || prompt.length > 2000) {
    return false;
  }
  
  // Additional validation as needed
  return true;
}
```

✅ **Use content filtering for AI prompts**
- Implement content filtering for AI prompts
- Scan for malicious or inappropriate content
- Reject or sanitize problematic input

### Output Sanitization

✅ **Sanitize AI-generated content before display**
```javascript
// Sanitize HTML content from AI
function sanitizeHtml(html) {
  // Implement HTML sanitization
  // Remove potentially dangerous tags and attributes
  // Use a library like DOMPurify
  
  return sanitizedHtml;
}
```

✅ **Restrict mini app capabilities**
- Limit network access for mini apps
- Prevent access to sensitive APIs
- Apply sandbox restrictions consistently

## Error Handling

Secure error handling prevents information leakage and improves reliability.

### Secure Error Responses

✅ **Implement centralized error handling**
```javascript
// From errorHandler.js
export function formatErrorForClient(error) {
  // Log the complete error internally
  console.error('Error:', error);
  
  // Return limited information to client
  return {
    message: getUserFriendlyMessage(error),
    code: error.code || 'UNKNOWN_ERROR'
  };
}
```

✅ **Avoid exposing stack traces to users**
- Never return raw error objects to users
- Provide user-friendly error messages
- Log detailed errors server-side only

## Regular Security Audits

Maintain security through regular audits and updates.

### Dependency Management

✅ **Keep dependencies updated**
```bash
# Regularly check for vulnerabilities
npm audit

# Update dependencies
npm update
```

✅ **Review dependency changes carefully**
- Audit new dependencies before adding them
- Review the security implications of major updates
- Consider using dependency locking (npm shrinkwrap)

### Security Review Process

✅ **Implement a security review checklist**
- Review all new features for security implications
- Check window creation for proper security settings
- Verify all IPC channels have proper validation
- Ensure CSP headers are applied consistently

## Security Testing

Implement security testing as part of the development process.

### Penetration Testing

✅ **Test for common Electron vulnerabilities**
- Check for nodeIntegration misconfigurations
- Verify contextIsolation is working correctly
- Test for CSP bypass vulnerabilities

✅ **Test sandbox escape vectors**
- Verify mini app sandboxing is effective
- Test for IPC message manipulation
- Check for unintended API exposures

### Automated Security Scanning

✅ **Implement automated security checks**
```javascript
// Example: script to verify window security settings
function auditWindowCreation() {
  // Scan codebase for new BrowserWindow(
  // Verify all instances have proper security settings
}
```

✅ **Add security linting rules**
- Implement ESLint rules for security patterns
- Check for common security mistakes
- Verify proper Node.js API usage

## Incident Response Plan

Be prepared for security incidents.

### Response Procedures

✅ **Establish a security incident response plan**
- Define roles and responsibilities
- Create communication channels
- Document remediation procedures

✅ **Implement app update mechanisms**
- Ensure the auto-updater is working correctly
- Test emergency update deployment
- Maintain ability to revoke compromised API keys

## Conclusion

Security is an ongoing process that requires vigilance and regular review. This checklist provides a starting point for securing the Lahat application, but it should be regularly revisited and expanded as new features are added and security best practices evolve.

Remember the following guiding principles:
1. Minimize attack surface
2. Apply defense in depth
3. Practice least privilege
4. Validate all inputs
5. Sanitize all outputs
6. Keep dependencies updated
7. Monitor for security issues
8. Respond quickly to vulnerabilities