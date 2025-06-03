/**
 * Import Engine - Core import functionality
 * Self-contained import logic for app packages
 */

import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import extract from 'extract-zip';
import { app } from 'electron';

export class ImportEngine {
  constructor() {
    this.supportedFormats = ['.lahat', '.zip'];
    this.tempDir = path.join(app.getPath('temp'), 'lahat-import');
    this.appsDir = path.join(app.getPath('userData'), 'generated-apps');
  }

  /**
   * Import an app package from file path
   * @param {string} filePath - Path to the package file
   * @returns {Promise<Object>} Import result
   */
  async importFromFile(filePath) {
    try {
      // Validate file format
      if (!this.isValidFormat(filePath)) {
        throw new Error(`Unsupported format. Supported formats: ${this.supportedFormats.join(', ')}`);
      }

      // Create temp directory for extraction
      const extractPath = await this.createTempDirectory();

      try {
        // Extract the package
        await this.extractPackage(filePath, extractPath);

        // Validate package structure
        const metadata = await this.validatePackage(extractPath);

        // Generate unique app folder name
        const appFolderName = this.generateAppFolderName(metadata.name);
        const finalPath = path.join(this.appsDir, appFolderName);

        // Copy to final location
        await this.copyToFinalLocation(extractPath, finalPath);

        // Update metadata with new conversation ID
        await this.updateMetadata(finalPath, metadata);

        // Cleanup temp directory
        await this.cleanup(extractPath);

        return {
          success: true,
          name: metadata.name,
          path: finalPath,
          metadata: metadata
        };

      } catch (error) {
        // Cleanup on error
        await this.cleanup(extractPath);
        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import an app package from URL
   * @param {string} url - URL to the package file
   * @returns {Promise<Object>} Import result
   */
  async importFromUrl(url) {
    try {
      // Download the file to temp location
      const tempFilePath = await this.downloadFile(url);
      
      try {
        // Import from the downloaded file
        const result = await this.importFromFile(tempFilePath);
        
        // Cleanup downloaded file
        await fs.unlink(tempFilePath);
        
        return result;
      } catch (error) {
        // Cleanup on error
        await fs.unlink(tempFilePath).catch(() => {});
        throw error;
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if file format is supported
   * @param {string} filePath - Path to the file
   * @returns {boolean} True if format is supported
   */
  isValidFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedFormats.includes(ext);
  }

  /**
   * Create temporary directory for extraction
   * @returns {Promise<string>} Path to temp directory
   */
  async createTempDirectory() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const tempPath = path.join(this.tempDir, `import_${timestamp}_${random}`);
    
    await fs.mkdir(tempPath, { recursive: true });
    return tempPath;
  }

  /**
   * Extract package to directory
   * @param {string} filePath - Path to package file
   * @param {string} extractPath - Path to extract to
   */
  async extractPackage(filePath, extractPath) {
    try {
      await extract(filePath, { dir: extractPath });
    } catch (error) {
      throw new Error(`Failed to extract package: ${error.message}`);
    }
  }

  /**
   * Validate package structure and metadata
   * @param {string} extractPath - Path to extracted package
   * @returns {Promise<Object>} Package metadata
   */
  async validatePackage(extractPath) {
    // Check for metadata.json
    const metadataPath = path.join(extractPath, 'metadata.json');
    
    try {
      await fs.access(metadataPath);
    } catch (error) {
      throw new Error('Invalid package: metadata.json not found');
    }

    // Read and validate metadata
    let metadata;
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      throw new Error('Invalid package: corrupted metadata.json');
    }

    // Validate required metadata fields
    if (!metadata.name) {
      throw new Error('Invalid package: missing app name in metadata');
    }

    if (!metadata.version) {
      metadata.version = '1.0.0'; // Default version
    }

    // Check for main file (index.html)
    const mainFilePath = path.join(extractPath, 'index.html');
    try {
      await fs.access(mainFilePath);
    } catch (error) {
      throw new Error('Invalid package: index.html not found');
    }

    return metadata;
  }

  /**
   * Generate unique app folder name
   * @param {string} appName - Original app name
   * @returns {string} Unique folder name
   */
  generateAppFolderName(appName) {
    // Clean the app name for use as folder name
    const cleanName = appName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const timestamp = Date.now();
    return `${cleanName}_${timestamp}`;
  }

  /**
   * Copy extracted files to final location
   * @param {string} sourcePath - Source directory
   * @param {string} targetPath - Target directory
   */
  async copyToFinalLocation(sourcePath, targetPath) {
    try {
      await fs.mkdir(targetPath, { recursive: true });
      await this.copyDirectoryRecursive(sourcePath, targetPath);
    } catch (error) {
      throw new Error(`Failed to copy files: ${error.message}`);
    }
  }

  /**
   * Recursively copy directory contents
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   */
  async copyDirectoryRecursive(src, dest) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    await fs.mkdir(dest, { recursive: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectoryRecursive(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Update metadata with new conversation ID to avoid conflicts
   * @param {string} appPath - Path to app directory
   * @param {Object} metadata - Original metadata
   */
  async updateMetadata(appPath, metadata) {
    // Generate new conversation ID to avoid conflicts
    const newConversationId = 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const updatedMetadata = {
      ...metadata,
      conversationId: newConversationId,
      importedAt: new Date().toISOString(),
      originalConversationId: metadata.conversationId || null
    };

    const metadataPath = path.join(appPath, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
  }

  /**
   * Download file from URL to temp location
   * @param {string} url - URL to download from
   * @returns {Promise<string>} Path to downloaded file
   */
  async downloadFile(url) {
    const https = await import('https');
    const http = await import('http');
    
    return new Promise((resolve, reject) => {
      const fileName = path.basename(new URL(url).pathname) || 'download.zip';
      const tempFilePath = path.join(this.tempDir, fileName);
      
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          this.downloadFile(response.headers.location).then(resolve).catch(reject);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        const file = createWriteStream(tempFilePath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(tempFilePath);
        });
        
        file.on('error', (error) => {
          fs.unlink(tempFilePath).catch(() => {});
          reject(error);
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * Cleanup temporary files/directories
   * @param {string} path - Path to cleanup
   */
  async cleanup(path) {
    try {
      await fs.rm(path, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error.message);
    }
  }

  /**
   * Get list of imported apps
   * @returns {Promise<Array>} List of imported apps
   */
  async getImportedApps() {
    try {
      const apps = await fs.readdir(this.appsDir);
      const importedApps = [];

      for (const appFolder of apps) {
        const appPath = path.join(this.appsDir, appFolder);
        const metadataPath = path.join(appPath, 'metadata.json');

        try {
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          if (metadata.importedAt) {
            importedApps.push({
              name: metadata.name,
              path: appPath,
              importedAt: metadata.importedAt,
              metadata: metadata
            });
          }
        } catch (error) {
          // Skip apps with invalid metadata
          continue;
        }
      }

      return importedApps.sort((a, b) => new Date(b.importedAt) - new Date(a.importedAt));
    } catch (error) {
      console.error('Failed to get imported apps:', error);
      return [];
    }
  }
}

export default ImportEngine;