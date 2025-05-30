/**
 * Credential Manager - Secure credential storage using OS keychain
 * Provides centralized, secure storage for API keys and secrets
 */

import keytar from 'keytar';
import { EventEmitter } from 'events';

export class CredentialManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      serviceName: 'Lahat',
      encryptionKey: null, // Optional additional encryption layer
      ...options
    };
    
    this.credentials = new Map(); // Cache for recently accessed credentials
    this.metadata = new Map(); // Store metadata about credentials
  }

  /**
   * Store a credential securely
   * @param {string} name - Credential name (e.g., 'aws.default', 'claude.production')
   * @param {string} value - Credential value
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<boolean>} Success status
   */
  async setCredential(name, value, metadata = {}) {
    try {
      if (!name || typeof name !== 'string') {
        throw new Error('Credential name must be a non-empty string');
      }

      if (!value || typeof value !== 'string') {
        throw new Error('Credential value must be a non-empty string');
      }

      // Validate credential name format
      this._validateCredentialName(name);

      // Store in OS keychain
      await keytar.setPassword(this.options.serviceName, name, value);

      // Store metadata separately
      const credentialMetadata = {
        name,
        created: new Date().toISOString(),
        lastAccessed: null,
        lastModified: new Date().toISOString(),
        description: metadata.description || '',
        tags: metadata.tags || [],
        expiresAt: metadata.expiresAt || null,
        ...metadata
      };

      this.metadata.set(name, credentialMetadata);

      // Update cache
      this.credentials.set(name, value);

      this.emit('credential:set', { name, metadata: credentialMetadata });

      return true;
    } catch (error) {
      this.emit('credential:error', { operation: 'set', name, error });
      throw new Error(`Failed to store credential '${name}': ${error.message}`);
    }
  }

  /**
   * Retrieve a credential
   * @param {string} name - Credential name
   * @param {Object} options - Retrieval options
   * @returns {Promise<string|null>} Credential value or null if not found
   */
  async getCredential(name, options = {}) {
    try {
      if (!name || typeof name !== 'string') {
        throw new Error('Credential name must be a non-empty string');
      }

      // Check cache first if enabled
      if (options.useCache !== false && this.credentials.has(name)) {
        this._updateLastAccessed(name);
        return this.credentials.get(name);
      }

      // Retrieve from OS keychain
      const value = await keytar.getPassword(this.options.serviceName, name);

      if (value) {
        // Update cache and metadata
        this.credentials.set(name, value);
        this._updateLastAccessed(name);
        
        this.emit('credential:accessed', { name, timestamp: new Date().toISOString() });
      }

      return value;
    } catch (error) {
      this.emit('credential:error', { operation: 'get', name, error });
      throw new Error(`Failed to retrieve credential '${name}': ${error.message}`);
    }
  }

  /**
   * Check if a credential exists
   * @param {string} name - Credential name
   * @returns {Promise<boolean>} Whether credential exists
   */
  async hasCredential(name) {
    try {
      const value = await keytar.getPassword(this.options.serviceName, name);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a credential
   * @param {string} name - Credential name
   * @returns {Promise<boolean>} Success status
   */
  async deleteCredential(name) {
    try {
      if (!name || typeof name !== 'string') {
        throw new Error('Credential name must be a non-empty string');
      }

      // Delete from OS keychain
      const deleted = await keytar.deletePassword(this.options.serviceName, name);

      if (deleted) {
        // Remove from cache and metadata
        this.credentials.delete(name);
        this.metadata.delete(name);

        this.emit('credential:deleted', { name });
      }

      return deleted;
    } catch (error) {
      this.emit('credential:error', { operation: 'delete', name, error });
      throw new Error(`Failed to delete credential '${name}': ${error.message}`);
    }
  }

  /**
   * List all credential names
   * @param {Object} options - Filter options
   * @returns {Promise<Array<string>>} List of credential names
   */
  async listCredentials(options = {}) {
    try {
      const credentials = await keytar.findCredentials(this.options.serviceName);
      let names = credentials.map(cred => cred.account);

      // Apply filters
      if (options.prefix) {
        names = names.filter(name => name.startsWith(options.prefix));
      }

      if (options.tags && options.tags.length > 0) {
        names = names.filter(name => {
          const metadata = this.metadata.get(name);
          return metadata && metadata.tags && 
                 options.tags.some(tag => metadata.tags.includes(tag));
        });
      }

      return names.sort();
    } catch (error) {
      this.emit('credential:error', { operation: 'list', error });
      throw new Error(`Failed to list credentials: ${error.message}`);
    }
  }

  /**
   * Get credential metadata
   * @param {string} name - Credential name
   * @returns {Object|null} Credential metadata
   */
  getCredentialMetadata(name) {
    return this.metadata.get(name) || null;
  }

  /**
   * Update credential metadata
   * @param {string} name - Credential name
   * @param {Object} metadata - New metadata
   * @returns {Promise<boolean>} Success status
   */
  async updateCredentialMetadata(name, metadata) {
    try {
      const existing = this.metadata.get(name);
      if (!existing) {
        throw new Error(`Credential '${name}' not found`);
      }

      const updated = {
        ...existing,
        ...metadata,
        lastModified: new Date().toISOString()
      };

      this.metadata.set(name, updated);
      this.emit('credential:metadata:updated', { name, metadata: updated });

      return true;
    } catch (error) {
      this.emit('credential:error', { operation: 'updateMetadata', name, error });
      throw error;
    }
  }

  /**
   * Test a credential by calling a validation function
   * @param {string} name - Credential name
   * @param {Function} testFunction - Function to test the credential
   * @returns {Promise<Object>} Test result
   */
  async testCredential(name, testFunction) {
    try {
      const value = await this.getCredential(name);
      if (!value) {
        throw new Error(`Credential '${name}' not found`);
      }

      const result = await testFunction(value);
      
      const testResult = {
        name,
        success: true,
        result,
        timestamp: new Date().toISOString()
      };

      this.emit('credential:tested', testResult);
      return testResult;
    } catch (error) {
      const testResult = {
        name,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.emit('credential:tested', testResult);
      return testResult;
    }
  }

  /**
   * Migrate credentials from old storage format
   * @param {Object} oldCredentials - Old credentials object
   * @returns {Promise<Array>} Migration results
   */
  async migrateCredentials(oldCredentials) {
    const results = [];

    for (const [oldKey, value] of Object.entries(oldCredentials)) {
      try {
        // Convert old key format to new namespace format
        const newName = this._convertOldKeyToNewName(oldKey);
        
        await this.setCredential(newName, value, {
          description: `Migrated from ${oldKey}`,
          tags: ['migrated'],
          migrated: true,
          originalKey: oldKey
        });

        results.push({
          oldKey,
          newName,
          success: true
        });
      } catch (error) {
        results.push({
          oldKey,
          success: false,
          error: error.message
        });
      }
    }

    this.emit('credentials:migrated', { results });
    return results;
  }

  /**
   * Export credentials metadata (not values) for backup
   * @returns {Promise<Object>} Metadata export
   */
  async exportMetadata() {
    const names = await this.listCredentials();
    const metadata = {};

    for (const name of names) {
      const meta = this.getCredentialMetadata(name);
      if (meta) {
        metadata[name] = {
          ...meta,
          // Never export the actual credential value
          hasValue: true
        };
      }
    }

    return {
      exportedAt: new Date().toISOString(),
      service: this.options.serviceName,
      credentials: metadata
    };
  }

  /**
   * Clear all cached credentials
   */
  clearCache() {
    this.credentials.clear();
    this.emit('cache:cleared');
  }

  /**
   * Get credential usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStats() {
    const stats = {
      totalCredentials: this.metadata.size,
      recentlyAccessed: 0,
      expiringSoon: 0,
      neverAccessed: 0,
      byTags: {}
    };

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const [name, metadata] of this.metadata) {
      // Recently accessed
      if (metadata.lastAccessed) {
        const lastAccessed = new Date(metadata.lastAccessed);
        if (lastAccessed > oneDayAgo) {
          stats.recentlyAccessed++;
        }
      } else {
        stats.neverAccessed++;
      }

      // Expiring soon
      if (metadata.expiresAt) {
        const expiresAt = new Date(metadata.expiresAt);
        if (expiresAt <= oneWeekFromNow) {
          stats.expiringSoon++;
        }
      }

      // By tags
      if (metadata.tags) {
        for (const tag of metadata.tags) {
          stats.byTags[tag] = (stats.byTags[tag] || 0) + 1;
        }
      }
    }

    return stats;
  }

  /**
   * Validate credential name format
   * @param {string} name - Credential name
   */
  _validateCredentialName(name) {
    // Allow alphanumeric, dots, hyphens, and underscores
    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      throw new Error('Credential name must contain only letters, numbers, dots, hyphens, and underscores');
    }

    if (name.length > 100) {
      throw new Error('Credential name must be 100 characters or less');
    }
  }

  /**
   * Update last accessed timestamp for a credential
   * @param {string} name - Credential name
   */
  _updateLastAccessed(name) {
    const metadata = this.metadata.get(name);
    if (metadata) {
      metadata.lastAccessed = new Date().toISOString();
      this.metadata.set(name, metadata);
    }
  }

  /**
   * Convert old credential key format to new namespace format
   * @param {string} oldKey - Old credential key
   * @returns {string} New credential name
   */
  _convertOldKeyToNewName(oldKey) {
    const conversions = {
      'claude_api_key': 'claude.default',
      'dev_claude_api_key': 'claude.development',
      'openai_api_key': 'openai.default',
      'dev_openai_api_key': 'openai.development',
      'apiKey': 'claude.legacy',
      'openAIKey': 'openai.legacy'
    };

    return conversions[oldKey] || oldKey.replace(/_/g, '.');
  }
}