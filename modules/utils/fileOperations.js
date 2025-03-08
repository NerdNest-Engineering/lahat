import fs from 'fs/promises';
import path from 'path';
import { dialog, app } from 'electron';
import logger from './logger.js';

/**
 * Utility module for file operations
 * Provides functions for reading, writing, and exporting files
 * with proper error handling and metadata caching
 */

// Metadata cache to reduce disk reads for frequently accessed metadata
class MetadataCache {
  constructor() {
    this.cache = new Map();
    this.dirty = new Set();
    this.maxCacheSize = 50; // Maximum number of items to cache
  }
  
  /**
   * Get metadata from the cache
   * @param {string} conversationId - The conversation ID
   * @returns {Object|undefined} - The cached metadata or undefined
   */
  get(conversationId) {
    return this.cache.get(conversationId);
  }
  
  /**
   * Check if metadata exists in the cache
   * @param {string} conversationId - The conversation ID
   * @returns {boolean} - True if metadata exists
   */
  has(conversationId) {
    return this.cache.has(conversationId);
  }
  
  /**
   * Store metadata in the cache
   * @param {string} conversationId - The conversation ID
   * @param {Object} metadata - The metadata to cache
   */
  set(conversationId, metadata) {
    // If cache is at max size, remove the oldest entry
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(conversationId)) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.dirty.delete(oldestKey);
    }
    
    this.cache.set(conversationId, metadata);
    this.dirty.add(conversationId);
  }
  
  /**
   * Flush dirty metadata to disk
   * @param {string} appStoragePath - The app storage path
   * @returns {Promise<number>} - Number of items flushed
   */
  async flush(appStoragePath) {
    let flushed = 0;
    
    for (const conversationId of this.dirty) {
      const metadata = this.cache.get(conversationId);
      if (metadata) {
        try {
          const metaPath = path.join(appStoragePath, `${metadata.filename}.meta.json`);
          await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
          flushed++;
        } catch (error) {
          logger.error('Failed to flush metadata to disk', {
            conversationId,
            error: error.message
          }, 'MetadataCache');
        }
      }
    }
    
    this.dirty.clear();
    return flushed;
  }
}

// Create a singleton instance of the metadata cache
export const metadataCache = new MetadataCache();

/**
 * Write content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @returns {Promise<Object>} - Result object with success flag and error if applicable
 */
export async function writeFile(filePath, content) {
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    
    // Write the file
    await fs.writeFile(filePath, content);
    
    // If this is a metadata file, update cache
    if (filePath.endsWith('.meta.json')) {
      try {
        const metadata = JSON.parse(content);
        if (metadata.conversationId) {
          metadataCache.set(metadata.conversationId, metadata);
          logger.debug('Updated metadata cache', { conversationId: metadata.conversationId }, 'writeFile');
        }
      } catch (e) {
        logger.warn('Failed to parse metadata for caching', { error: e.message, filePath }, 'writeFile');
      }
    }
    
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

/**
 * Read content from a file
 * @param {string} filePath - Path to the file
 * @param {boolean} useCache - Whether to use cache for metadata files
 * @returns {Promise<Object>} - Result object with content or error
 */
export async function readFile(filePath, useCache = true) {
  try {
    // Check if this is a metadata file and we should check cache
    if (useCache && filePath.endsWith('.meta.json')) {
      // Extract conversation ID from filename
      const basename = path.basename(filePath, '.meta.json');
      const match = basename.match(/([a-zA-Z0-9-]+)$/);
      if (match && match[1]) {
        const conversationId = match[1];
        if (metadataCache.has(conversationId)) {
          const cachedMetadata = metadataCache.get(conversationId);
          logger.debug('Using cached metadata', { conversationId }, 'readFile');
          return {
            success: true,
            content: JSON.stringify(cachedMetadata, null, 2),
            filePath,
            fromCache: true
          };
        }
      }
    }
    
    // Check if file exists
    await fs.access(filePath);
    
    // Read the file
    const content = await fs.readFile(filePath, 'utf-8');
    
    // If this is a metadata file, cache it
    if (filePath.endsWith('.meta.json')) {
      try {
        const metadata = JSON.parse(content);
        if (metadata.conversationId) {
          // Store in cache but don't mark as dirty since we just read it
          metadataCache.cache.set(metadata.conversationId, metadata);
          logger.debug('Cached metadata from file', { conversationId: metadata.conversationId }, 'readFile');
        }
      } catch (e) {
        logger.warn('Failed to parse metadata for caching', { error: e.message, filePath }, 'readFile');
      }
    }
    
    return { success: true, content, filePath };
  } catch (error) {
    logger.error('Error reading file', { error: error.message, filePath }, 'readFile');
    return {
      success: false,
      error: `Failed to read file: ${error.message}`,
      filePath
    };
  }
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - Result object with success flag and error if applicable
 */
export async function deleteFile(filePath) {
  try {
    // Check if file exists
    await fs.access(filePath);
    
    // If this is a metadata file, remove from cache
    if (filePath.endsWith('.meta.json')) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);
        if (metadata.conversationId) {
          metadataCache.cache.delete(metadata.conversationId);
          metadataCache.dirty.delete(metadata.conversationId);
          logger.debug('Removed metadata from cache', { conversationId: metadata.conversationId }, 'deleteFile');
        }
      } catch (e) {
        logger.warn('Failed to read metadata for cache removal', { error: e.message, filePath }, 'deleteFile');
      }
    }
    
    // Delete the file
    await fs.unlink(filePath);
    
    return { success: true, filePath };
  } catch (error) {
    logger.error('Error deleting file', { error: error.message, filePath }, 'deleteFile');
    return {
      success: false,
      error: `Failed to delete file: ${error.message}`,
      filePath
    };
  }
}

/**
 * Export a file to a user-selected location
 * @param {string} sourceFilePath - Path to the source file
 * @param {string} defaultName - Default name for the exported file
 * @returns {Promise<Object>} - Result object with success flag and saved path or error
 */
export async function exportFile(sourceFilePath, defaultName = 'exported-file.html') {
  try {
    // Check if source file exists
    const readResult = await readFile(sourceFilePath);
    if (!readResult.success) {
      return readResult;
    }
    
    // Show save dialog
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      title: 'Export File',
      defaultPath: path.join(app.getPath('documents'), defaultName),
      filters: [
        { name: 'HTML Files', extensions: ['html'] }
      ]
    });
    
    if (canceled) {
      return { success: false, canceled: true };
    }
    
    // Write to the selected location
    const writeResult = await writeFile(savePath, readResult.content);
    if (!writeResult.success) {
      return writeResult;
    }
    
    return { success: true, filePath: savePath };
  } catch (error) {
    console.error('Error exporting file:', error);
    return {
      success: false,
      error: `Failed to export file: ${error.message}`
    };
  }
}

/**
 * Create a temporary file
 * @param {string} content - Content to write
 * @param {string} extension - File extension (default: html)
 * @returns {Promise<Object>} - Result object with success flag and file path or error
 */
export async function createTempFile(content, extension = 'html') {
  try {
    const tempFilePath = path.join(app.getPath('temp'), `${Date.now()}.${extension}`);
    const result = await writeFile(tempFilePath, content);
    
    return result;
  } catch (error) {
    console.error('Error creating temp file:', error);
    return {
      success: false,
      error: `Failed to create temp file: ${error.message}`
    };
  }
}
