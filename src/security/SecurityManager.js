/**
 * Security Manager - Centralized security management for Lahat
 * Coordinates credential management, encryption, and security policies
 */

import { EventEmitter } from 'events';
import { CredentialManager } from './CredentialManager.js';
import { SecureStorage } from './SecureStorage.js';

export class SecurityManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      serviceName: 'Lahat',
      encryptionEnabled: true,
      auditEnabled: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...options
    };
    
    this.credentialManager = new CredentialManager({
      serviceName: this.options.serviceName
    });
    
    this.secureStorage = new SecureStorage();
    this.sessionStartTime = null;
    this.auditLog = [];
    this.securityPolicies = new Map();
    
    this._initializeEventHandlers();
  }

  /**
   * Initialize the security manager
   * @param {string} masterPassword - Optional master password for additional encryption
   * @returns {Promise<boolean>} Success status
   */
  async initialize(masterPassword = null) {
    try {
      this.sessionStartTime = Date.now();
      
      // Initialize secure storage if master password provided
      if (masterPassword && this.options.encryptionEnabled) {
        await this.secureStorage.initialize(masterPassword);
      }
      
      this._auditLog('security:initialized', { 
        encryptionEnabled: this.options.encryptionEnabled,
        timestamp: new Date().toISOString()
      });
      
      this.emit('security:initialized');
      return true;
    } catch (error) {
      this._auditLog('security:init:failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get credential management interface
   * @returns {Object} Credential management interface
   */
  getCredentials() {
    return {
      /**
       * Set a credential
       * @param {string} name - Credential name
       * @param {string} value - Credential value
       * @param {Object} metadata - Optional metadata
       * @returns {Promise<boolean>} Success status
       */
      set: async (name, value, metadata = {}) => {
        this._checkSession();
        this._auditLog('credential:set', { name, timestamp: new Date().toISOString() });
        
        // Optionally encrypt value before storing
        let finalValue = value;
        if (this.options.encryptionEnabled && this.secureStorage.isStorageUnlocked()) {
          finalValue = await this.secureStorage.encrypt(value, name);
          metadata.encrypted = true;
        }
        
        return await this.credentialManager.setCredential(name, finalValue, metadata);
      },

      /**
       * Get a credential
       * @param {string} name - Credential name
       * @param {Object} options - Retrieval options
       * @returns {Promise<string|null>} Credential value
       */
      get: async (name, options = {}) => {
        this._checkSession();
        this._auditLog('credential:get', { name, timestamp: new Date().toISOString() });
        
        const value = await this.credentialManager.getCredential(name, options);
        
        if (value) {
          const metadata = this.credentialManager.getCredentialMetadata(name);
          
          // Decrypt if needed
          if (metadata && metadata.encrypted && this.secureStorage.isStorageUnlocked()) {
            return await this.secureStorage.decrypt(value, name);
          }
        }
        
        return value;
      },

      /**
       * Check if credential exists
       * @param {string} name - Credential name
       * @returns {Promise<boolean>} Whether credential exists
       */
      has: async (name) => {
        this._checkSession();
        return await this.credentialManager.hasCredential(name);
      },

      /**
       * Delete a credential
       * @param {string} name - Credential name
       * @returns {Promise<boolean>} Success status
       */
      delete: async (name) => {
        this._checkSession();
        this._auditLog('credential:delete', { name, timestamp: new Date().toISOString() });
        return await this.credentialManager.deleteCredential(name);
      },

      /**
       * List credentials
       * @param {Object} options - Filter options
       * @returns {Promise<Array<string>>} List of credential names
       */
      list: async (options = {}) => {
        this._checkSession();
        return await this.credentialManager.listCredentials(options);
      },

      /**
       * Get credential metadata
       * @param {string} name - Credential name
       * @returns {Object|null} Credential metadata
       */
      getMetadata: (name) => {
        this._checkSession();
        return this.credentialManager.getCredentialMetadata(name);
      },

      /**
       * Test a credential
       * @param {string} name - Credential name
       * @param {Function} testFunction - Test function
       * @returns {Promise<Object>} Test result
       */
      test: async (name, testFunction) => {
        this._checkSession();
        this._auditLog('credential:test', { name, timestamp: new Date().toISOString() });
        
        // Get the actual credential value for testing
        const value = await this.getCredentials().get(name);
        if (!value) {
          throw new Error(`Credential '${name}' not found`);
        }
        
        return await this.credentialManager.testCredential(name, () => testFunction(value));
      }
    };
  }

  /**
   * Get encryption utilities
   * @returns {Object} Encryption utilities
   */
  getEncryption() {
    return {
      /**
       * Encrypt data
       * @param {string} data - Data to encrypt
       * @param {string} context - Encryption context
       * @returns {Promise<string>} Encrypted data
       */
      encrypt: async (data, context = '') => {
        this._checkSession();
        if (!this.secureStorage.isStorageUnlocked()) {
          throw new Error('Secure storage is not unlocked');
        }
        return await this.secureStorage.encrypt(data, context);
      },

      /**
       * Decrypt data
       * @param {string} encryptedData - Encrypted data
       * @param {string} context - Encryption context
       * @returns {Promise<string>} Decrypted data
       */
      decrypt: async (encryptedData, context = '') => {
        this._checkSession();
        if (!this.secureStorage.isStorageUnlocked()) {
          throw new Error('Secure storage is not unlocked');
        }
        return await this.secureStorage.decrypt(encryptedData, context);
      },

      /**
       * Generate secure random string
       * @param {number} length - String length
       * @returns {string} Random string
       */
      generateRandom: (length = 32) => {
        return this.secureStorage.generateSecureRandom(length);
      },

      /**
       * Hash data
       * @param {string} data - Data to hash
       * @param {string} salt - Optional salt
       * @returns {Promise<string>} Hash
       */
      hash: async (data, salt = '') => {
        return await this.secureStorage.hash(data, salt);
      },

      /**
       * Generate key pair
       * @returns {Object} Key pair
       */
      generateKeyPair: () => {
        return this.secureStorage.generateKeyPair();
      }
    };
  }

  /**
   * Set security policy
   * @param {string} name - Policy name
   * @param {Object} policy - Policy configuration
   */
  setSecurityPolicy(name, policy) {
    this.securityPolicies.set(name, {
      ...policy,
      created: new Date().toISOString()
    });
    
    this._auditLog('policy:set', { name, policy });
    this.emit('policy:set', { name, policy });
  }

  /**
   * Get security policy
   * @param {string} name - Policy name
   * @returns {Object|null} Policy configuration
   */
  getSecurityPolicy(name) {
    return this.securityPolicies.get(name) || null;
  }

  /**
   * Check if action is allowed by security policies
   * @param {string} action - Action to check
   * @param {Object} context - Action context
   * @returns {boolean} Whether action is allowed
   */
  isActionAllowed(action, context = {}) {
    // Check each relevant policy
    for (const [name, policy] of this.securityPolicies) {
      if (policy.actions && policy.actions.includes(action)) {
        if (policy.condition && !policy.condition(context)) {
          this._auditLog('policy:denied', { action, policy: name, context });
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get security audit log
   * @param {Object} filter - Filter options
   * @returns {Array} Audit log entries
   */
  getAuditLog(filter = {}) {
    let logs = [...this.auditLog];
    
    if (filter.since) {
      const since = new Date(filter.since);
      logs = logs.filter(log => new Date(log.timestamp) >= since);
    }
    
    if (filter.action) {
      logs = logs.filter(log => log.action === filter.action);
    }
    
    if (filter.limit) {
      logs = logs.slice(-filter.limit);
    }
    
    return logs;
  }

  /**
   * Clear audit log
   */
  clearAuditLog() {
    this.auditLog = [];
    this._auditLog('audit:cleared', { timestamp: new Date().toISOString() });
  }

  /**
   * Get security status
   * @returns {Object} Security status
   */
  getSecurityStatus() {
    return {
      initialized: this.sessionStartTime !== null,
      sessionActive: this._isSessionActive(),
      sessionUptime: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
      encryptionEnabled: this.options.encryptionEnabled,
      encryptionUnlocked: this.secureStorage.isStorageUnlocked(),
      auditEnabled: this.options.auditEnabled,
      auditLogSize: this.auditLog.length,
      credentialCount: this.credentialManager.metadata.size,
      policyCount: this.securityPolicies.size
    };
  }

  /**
   * Lock the security manager
   */
  lock() {
    this.secureStorage.lock();
    this.credentialManager.clearCache();
    this.sessionStartTime = null;
    
    this._auditLog('security:locked', { timestamp: new Date().toISOString() });
    this.emit('security:locked');
  }

  /**
   * Check if session is still active
   * @returns {boolean} Whether session is active
   */
  _isSessionActive() {
    if (!this.sessionStartTime) return false;
    
    const sessionAge = Date.now() - this.sessionStartTime;
    return sessionAge < this.options.sessionTimeout;
  }

  /**
   * Check session validity and throw if expired
   */
  _checkSession() {
    if (!this._isSessionActive()) {
      this.lock();
      throw new Error('Security session has expired');
    }
  }

  /**
   * Add entry to audit log
   * @param {string} action - Action performed
   * @param {Object} details - Action details
   */
  _auditLog(action, details = {}) {
    if (!this.options.auditEnabled) return;
    
    const entry = {
      action,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionStartTime,
      ...details
    };
    
    this.auditLog.push(entry);
    
    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog.splice(0, this.auditLog.length - 10000);
    }
    
    this.emit('audit:entry', entry);
  }

  /**
   * Initialize event handlers
   */
  _initializeEventHandlers() {
    // Forward credential manager events
    this.credentialManager.on('credential:set', (data) => {
      this.emit('credential:set', data);
    });
    
    this.credentialManager.on('credential:accessed', (data) => {
      this.emit('credential:accessed', data);
    });
    
    this.credentialManager.on('credential:deleted', (data) => {
      this.emit('credential:deleted', data);
    });
    
    this.credentialManager.on('credential:error', (data) => {
      this._auditLog('credential:error', data);
      this.emit('credential:error', data);
    });
    
    // Forward secure storage events
    this.secureStorage.on('storage:unlocked', () => {
      this.emit('storage:unlocked');
    });
    
    this.secureStorage.on('storage:locked', () => {
      this.emit('storage:locked');
    });
    
    this.secureStorage.on('storage:error', (data) => {
      this._auditLog('storage:error', data);
      this.emit('storage:error', data);
    });
  }
}