/**
 * Storage API - Persistent storage for mini apps
 * Provides key-value storage with app-specific isolation
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class StorageAPI {
  constructor(runtime) {
    this.runtime = runtime;
    this.storageDir = path.join(os.homedir(), '.lahat', 'storage');
    this._ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  async _ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Get app-specific storage path
   * @param {string} appId - App identifier
   * @returns {string} App storage directory path
   */
  _getAppStoragePath(appId) {
    return path.join(this.storageDir, appId);
  }

  /**
   * Ensure app storage directory exists
   * @param {string} appId - App identifier
   */
  async _ensureAppStorageDir(appId) {
    const appStoragePath = this._getAppStoragePath(appId);
    await fs.mkdir(appStoragePath, { recursive: true });
  }

  /**
   * Store data for an app
   * @param {string} appId - App identifier
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  async set(appId, key, value) {
    try {
      await this._ensureAppStorageDir(appId);
      
      const filePath = path.join(this._getAppStoragePath(appId), `${key}.json`);
      const data = JSON.stringify(value, null, 2);
      
      await fs.writeFile(filePath, data, 'utf8');
    } catch (error) {
      throw new Error(`Failed to store data: ${error.message}`);
    }
  }

  /**
   * Retrieve data for an app
   * @param {string} appId - App identifier
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {Promise<any>} Stored value or default
   */
  async get(appId, key, defaultValue = null) {
    try {
      const filePath = path.join(this._getAppStoragePath(appId), `${key}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return defaultValue;
      }
      throw new Error(`Failed to retrieve data: ${error.message}`);
    }
  }

  /**
   * Check if key exists for an app
   * @param {string} appId - App identifier
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Whether key exists
   */
  async has(appId, key) {
    try {
      const filePath = path.join(this._getAppStoragePath(appId), `${key}.json`);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete data for an app
   * @param {string} appId - App identifier
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Whether key was deleted
   */
  async delete(appId, key) {
    try {
      const filePath = path.join(this._getAppStoragePath(appId), `${key}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw new Error(`Failed to delete data: ${error.message}`);
    }
  }

  /**
   * List all keys for an app
   * @param {string} appId - App identifier
   * @returns {Promise<Array<string>>} List of storage keys
   */
  async keys(appId) {
    try {
      const appStoragePath = this._getAppStoragePath(appId);
      const files = await fs.readdir(appStoragePath);
      
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.slice(0, -5)); // Remove .json extension
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to list keys: ${error.message}`);
    }
  }

  /**
   * Clear all storage for an app
   * @param {string} appId - App identifier
   * @returns {Promise<void>}
   */
  async clear(appId) {
    try {
      const appStoragePath = this._getAppStoragePath(appId);
      const files = await fs.readdir(appStoragePath);
      
      await Promise.all(
        files.map(file => fs.unlink(path.join(appStoragePath, file)))
      );
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to clear storage: ${error.message}`);
      }
    }
  }

  /**
   * Get storage size for an app
   * @param {string} appId - App identifier
   * @returns {Promise<number>} Storage size in bytes
   */
  async getSize(appId) {
    try {
      const appStoragePath = this._getAppStoragePath(appId);
      const files = await fs.readdir(appStoragePath);
      
      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(appStoragePath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return totalSize;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return 0;
      }
      throw new Error(`Failed to get storage size: ${error.message}`);
    }
  }

  /**
   * Create app-specific storage interface
   * @param {string} appId - App identifier
   * @returns {Object} App-specific storage interface
   */
  createAppStorage(appId) {
    return {
      set: (key, value) => this.set(appId, key, value),
      get: (key, defaultValue) => this.get(appId, key, defaultValue),
      has: (key) => this.has(appId, key),
      delete: (key) => this.delete(appId, key),
      keys: () => this.keys(appId),
      clear: () => this.clear(appId),
      getSize: () => this.getSize(appId)
    };
  }
}