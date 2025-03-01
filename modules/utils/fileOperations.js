import fs from 'fs/promises';
import path from 'path';
import { dialog, app } from 'electron';

/**
 * Utility module for file operations
 * Provides functions for reading, writing, and exporting files
 * with proper error handling
 */

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
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error writing file:', error);
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
 * @returns {Promise<Object>} - Result object with content or error
 */
export async function readFile(filePath) {
  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Read the file
    const content = await fs.readFile(filePath, 'utf-8');
    
    return { success: true, content, filePath };
  } catch (error) {
    console.error('Error reading file:', error);
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
    
    // Delete the file
    await fs.unlink(filePath);
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error deleting file:', error);
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
