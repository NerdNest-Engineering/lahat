/**
 * Security Island - Secure credential and data management
 * Exports all security-related functionality
 */

export { CredentialManager } from './CredentialManager.js';
export { SecureStorage } from './SecureStorage.js';
export { SecurityManager } from './SecurityManager.js';

// Create default security manager instance
export const security = new SecurityManager();

export default security;