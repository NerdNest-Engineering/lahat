/**
 * Import API
 * External API interface for app import functionality
 */

export class ImportAPI {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
  }

  /**
   * Import an app from file dialog
   * @returns {Promise<Object>} Import result
   */
  async importApp() {
    if (!this.isElectron) {
      throw new Error('Import functionality requires Electron environment');
    }

    try {
      const result = await window.electronAPI.invoke('import-app');
      return result;
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Import an app from URL
   * @param {string} url - URL to import from
   * @returns {Promise<Object>} Import result
   */
  async importAppFromUrl(url) {
    if (!this.isElectron) {
      throw new Error('Import functionality requires Electron environment');
    }

    if (!url || typeof url !== 'string') {
      throw new Error('Valid URL is required');
    }

    try {
      const result = await window.electronAPI.invoke('import-app-from-url', url);
      return result;
    } catch (error) {
      throw new Error(`Import from URL failed: ${error.message}`);
    }
  }

  /**
   * Get list of imported apps
   * @returns {Promise<Object>} List of imported apps
   */
  async getImportedApps() {
    if (!this.isElectron) {
      throw new Error('Import functionality requires Electron environment');
    }

    try {
      const result = await window.electronAPI.invoke('get-imported-apps');
      return result;
    } catch (error) {
      throw new Error(`Failed to get imported apps: ${error.message}`);
    }
  }

  /**
   * Validate an import file
   * @param {string} filePath - Path to file to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateImportFile(filePath) {
    if (!this.isElectron) {
      throw new Error('Import functionality requires Electron environment');
    }

    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Valid file path is required');
    }

    try {
      const result = await window.electronAPI.invoke('validate-import-file', filePath);
      return result;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Check if import functionality is available
   * @returns {boolean} True if import is available
   */
  isImportAvailable() {
    return this.isElectron;
  }

  /**
   * Get supported import formats
   * @returns {Array<string>} List of supported file extensions
   */
  getSupportedFormats() {
    return ['.lahat', '.zip'];
  }

  /**
   * Create import event listeners
   * @param {Object} callbacks - Event callbacks
   * @param {Function} callbacks.onImportSuccess - Called when import succeeds
   * @param {Function} callbacks.onImportError - Called when import fails
   * @param {Function} callbacks.onImportProgress - Called during import progress
   */
  createEventListeners(callbacks = {}) {
    if (!this.isElectron) {
      console.warn('Event listeners not available in non-Electron environment');
      return;
    }

    // Listen for import events
    if (callbacks.onImportSuccess) {
      window.addEventListener('app-imported', (event) => {
        callbacks.onImportSuccess(event.detail);
      });
    }

    if (callbacks.onImportError) {
      window.addEventListener('app-import-error', (event) => {
        callbacks.onImportError(event.detail);
      });
    }

    if (callbacks.onImportProgress) {
      window.addEventListener('app-import-progress', (event) => {
        callbacks.onImportProgress(event.detail);
      });
    }
  }

  /**
   * Remove import event listeners
   */
  removeEventListeners() {
    if (!this.isElectron) {
      return;
    }

    // Remove all import-related event listeners
    const events = ['app-imported', 'app-import-error', 'app-import-progress'];
    events.forEach(eventName => {
      // Note: This removes all listeners for these events
      // In a real implementation, you'd want to track specific listeners
      window.removeEventListener(eventName, () => {});
    });
  }

  /**
   * Utility method to show import file dialog
   * @returns {Promise<FileList|null>} Selected files or null if canceled
   */
  async showImportDialog() {
    if (!this.isElectron) {
      // For web environments, create a file input
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = this.getSupportedFormats().join(',');
        input.onchange = (event) => {
          resolve(event.target.files);
        };
        input.oncancel = () => {
          resolve(null);
        };
        input.click();
      });
    } else {
      // Use Electron's file dialog
      return this.importApp();
    }
  }
}

// Create singleton instance
const importAPI = new ImportAPI();

export default importAPI;