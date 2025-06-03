/**
 * Credentials Module - Secure credential and data management
 * Exports all credential-related functionality including providers
 */

export { CredentialManager } from './CredentialManager.js';
export { SecureStorage } from './SecureStorage.js';
export { SecurityManager } from './SecurityManager.js';

// Provider system exports
export { BaseProvider } from './providers/BaseProvider.js';
export { AnthropicProvider } from './providers/anthropic/AnthropicProvider.js';
export { OpenAIProvider } from './providers/openai/OpenAIProvider.js';
export { AmazonS3Provider } from './providers/amazon-s3/AmazonS3Provider.js';
export { ProviderRegistry, providerRegistry } from './providers/ProviderRegistry.js';

// Create default security manager instance
export const security = new SecurityManager();

export default security;