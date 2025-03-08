# Lahat: Security Architecture

## Security Overview

Lahat implements a multi-layered security approach to protect against common vulnerabilities in Electron applications and ensure the safe execution of generated mini applications.

## Key Security Layers

### 1. Process Isolation

```javascript
// From main.js - Creating a window with security features
function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,     // Prevent direct access to Node APIs
      contextIsolation: true,     // Isolate window context
      sandbox: true,              // Enhanced sandboxing for mini app windows
      preload: path.join(__dirname, 'preload.cjs')  // Secure preload script
    }
  });
}
```

- **Context Isolation**: Prevents access to internal Electron and Node.js APIs from renderer processes
- **Disabled Node Integration**: Renderer processes can't access Node.js APIs directly
- **Sandboxed Execution**: Especially critical for mini app windows running user-generated code
- **Preload Scripts**: Carefully crafted to expose only necessary functionality via contextBridge

### 2. Content Security Policy

```html
<!-- From main.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               connect-src 'self';
               img-src 'self';
               font-src 'self';
               object-src 'none';
               base-uri 'none';
               form-action 'none';">
```

- **Strict CSP Rules**: Applied to all windows including generated mini apps
- **Limited Resource Origins**: Resources can only be loaded from the application itself
- **Script Restrictions**: Only scripts from the application bundle can execute
- **Plugin Blocking**: Prevents potentially dangerous plugins
- **Resource Type Restrictions**: Blocks object embedding and other risky resource types

### 3. Secure API Key Management

```javascript
// modules/security/keyManager.js
export async function securelyStoreApiKey(apiKey) {
  if (safeStorage.isEncryptionAvailable()) {
    // Encrypt using OS secure storage mechanisms
    const encryptedKey = safeStorage.encryptString(apiKey);
    store.set('encryptedApiKey', encryptedKey.toString('base64'));
    store.delete('apiKey'); // Remove any plaintext key
    return true;
  } else {
    // Fallback with warning
    console.warn('Safe storage not available, using basic protection');
    store.set('apiKey', apiKey);
    return false;
  }
}
```

- **OS-Level Encryption**: Uses Electron's safeStorage API which leverages:
  - macOS Keychain
  - Windows Data Protection API
  - Linux Secret Service API/libsecret
- **Secure Retrieval**: Keys are only decrypted when needed
- **Fallback Mechanism**: Graceful degradation when secure storage isn't available

### 4. Safe IPC Communication

```javascript
// preload.cjs - Exposing safe IPC channels
contextBridge.exposeInMainWorld('electronAPI', {
  // Expose specific functions, not the entire ipcRenderer
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  checkApiKey: () => ipcRenderer.invoke('check-api-key'),
  generateMiniApp: (params) => ipcRenderer.invoke('generate-mini-app', params),
  // More specific, controlled functions...
});
```

- **Limited API Surface**: Only specific functions are exposed, not entire APIs
- **Parameter Validation**: IPC handlers validate all parameters
- **Controlled Communication**: Main process controls what renderer can access
- **Typed Channels**: Well-defined IPC channels with consistent patterns

### 5. Mini App Sandboxing

```javascript
// Creating a mini app window with enhanced security
function createMiniAppWindow(appName, htmlContent) {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,                // Full sandbox for generated content
      preload: path.join(__dirname, 'miniAppPreload.cjs'),
      devTools: process.env.NODE_ENV === 'development'
    }
  });
  // Apply strict CSP for mini apps
  // Load content with security headers
}
```

- **Enhanced Sandboxing**: Mini app windows use full sandbox mode
- **Restricted Capabilities**: Mini apps have minimal access to system resources
- **Isolated Content**: Each mini app runs in its own isolated window
- **Limited APIs**: Only essential APIs are exposed to mini apps
- **DevTools Restriction**: DevTools disabled in production builds

### 6. File System Security

```javascript
// Safe file path handling in fileOperations.js
export async function writeFile(filePath, content) {
  try {
    // Ensure the directory exists and is within app boundaries
    const directory = path.dirname(filePath);
    // Validate path is within allowed boundaries
    if (!isPathWithinAppStorage(directory)) {
      throw new Error('Security violation: Attempted to write outside allowed directories');
    }
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, content);
    return { success: true, filePath };
  } catch (error) {
    logger.error('Error writing file', { error: error.message, filePath }, 'writeFile');
    return {
      success: false,
      error: `Failed to write file: ${error.message}`,
      filePath
    };
  }
}
```

- **Path Validation**: Prevents directory traversal attacks
- **Limited Access**: File operations restricted to specific directories
- **Error Handling**: Secure error handling that doesn't leak sensitive information
- **Safe File Names**: Sanitization of file names from user input

## Security Best Practices

1. **Input Validation**
   - All user inputs are validated before processing
   - Sanitization of user-provided content
   - Type checking and boundary validation

2. **Secure Defaults**
   - Security features enabled by default
   - Principle of least privilege applied throughout
   - Explicit security policies rather than implicit

3. **Error Handling**
   - Secure error messages that don't leak sensitive information
   - Centralized error logging for security monitoring
   - Graceful handling of security-related errors

4. **Regular Updates**
   - Regular updates to dependencies
   - Monitoring for security advisories
   - Process for addressing security vulnerabilities

## Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| XSS Attacks | Content Security Policy, input validation, contextIsolation |
| Remote Code Execution | Sandboxing, disabled nodeIntegration, restricted API surface |
| Data Exfiltration | Strict CSP connect-src directives, limited IPC channels |
| Sensitive Data Exposure | Secure storage, limited data access, encrypted storage |
| Path Traversal | Path validation, restricted file system access |
| Prototype Pollution | contextIsolation, controlled object passing |

## Security Verification

- Security protocols are validated during application startup
- Safety checks before executing generated code
- Monitoring of security-related events and errors
- Graceful degradation when security features are unavailable