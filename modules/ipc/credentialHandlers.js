import { ipcMain } from 'electron';
import keytar from 'keytar';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

/**
 * Credential Handlers Module
 * Provides secure storage for user credentials using keytar (system keychain)
 */

// Service name for keytar (used to group credentials in the system keychain)
const KEYTAR_SERVICE = 'lahat-app';

// Get the credentials metadata storage path (non-sensitive data only)
const credentialsMetadataPath = path.join(app.getPath('userData'), 'credentials-metadata.json');

/**
 * Save a credential securely using keytar
 * @param {Object} event - IPC event
 * @param {Object} credentialData - The credential data to save
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleSaveCredential(event, credentialData) {
  try {
    console.log(`[CREDENTIAL-SAVE] Saving credential with name: ${credentialData.name}, type: ${credentialData.type}`);
    
    // Load existing credential metadata
    const metadataList = await loadCredentialMetadata();
    
    // Create metadata entry (non-sensitive data)
    const metadata = {
      id: credentialData.id,
      name: credentialData.name,
      type: credentialData.type,
      description: credentialData.description || '',
      createdAt: credentialData.createdAt || new Date().toISOString(),
      lastUsed: credentialData.lastUsed || null,
      username: credentialData.type === 'username-password' ? credentialData.username : undefined
    };
    
    // Store sensitive data in system keychain using keytar
    if (credentialData.type === 'username-password') {
      // For username/password, store password in keychain
      if (credentialData.password) {
        await keytar.setPassword(KEYTAR_SERVICE, `${credentialData.id}_password`, credentialData.password);
      }
    } else if (credentialData.value) {
      // For other types, store the value in keychain
      await keytar.setPassword(KEYTAR_SERVICE, `${credentialData.id}_value`, credentialData.value);
    }
    
    // Update or add metadata
    const existingIndex = metadataList.findIndex(c => c.id === credentialData.id);
    if (existingIndex >= 0) {
      metadataList[existingIndex] = metadata;
    } else {
      metadataList.push(metadata);
    }
    
    // Save metadata to disk
    await saveCredentialMetadata(metadataList);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error saving credential:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Load credential metadata (non-sensitive data only)
 * @param {Object} event - IPC event
 * @returns {Promise<Object>} - Result object with credentials array
 */
async function handleLoadCredentials(event) {
  try {
    const metadataList = await loadCredentialMetadata();
    
    // Return metadata with hasValue indicator
    const safeCredentials = metadataList.map(metadata => ({
      ...metadata,
      hasValue: true // We assume all stored credentials have values
    }));
    
    return {
      success: true,
      credentials: safeCredentials
    };
    
  } catch (error) {
    console.error('Error loading credentials:', error);
    return {
      success: false,
      error: error.message,
      credentials: []
    };
  }
}

/**
 * Get a decrypted credential value from keytar
 * @param {Object} event - IPC event
 * @param {string} credentialId - The ID of the credential to decrypt
 * @returns {Promise<Object>} - Result object with decrypted value
 */
async function handleGetCredentialValue(event, credentialId) {
  try {
    console.log(`[GET-CREDENTIAL-VALUE] Looking for credential ID: ${credentialId}`);
    
    const metadataList = await loadCredentialMetadata();
    const metadata = metadataList.find(c => c.id === credentialId);
    
    if (!metadata) {
      console.log(`[GET-CREDENTIAL-VALUE] Credential metadata not found for ID: ${credentialId}`);
      return {
        success: false,
        error: 'Credential not found'
      };
    }
    
    let decryptedValue = {};
    
    // Retrieve from keytar based on credential type
    if (metadata.type === 'username-password') {
      decryptedValue.username = metadata.username;
      const password = await keytar.getPassword(KEYTAR_SERVICE, `${credentialId}_password`);
      if (password) {
        decryptedValue.password = password;
      }
    } else {
      const value = await keytar.getPassword(KEYTAR_SERVICE, `${credentialId}_value`);
      console.log(`[GET-CREDENTIAL-VALUE] Retrieved value exists: ${value !== null}`);
      if (value) {
        decryptedValue.value = value;
      }
    }
    
    // Update last used timestamp in metadata
    metadata.lastUsed = new Date().toISOString();
    await saveCredentialMetadata(metadataList);
    
    return {
      success: true,
      value: decryptedValue
    };
    
  } catch (error) {
    console.error('Error getting credential value:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a credential
 * @param {Object} event - IPC event
 * @param {string} credentialId - The ID of the credential to delete
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleDeleteCredential(event, credentialId) {
  try {
    const metadataList = await loadCredentialMetadata();
    const metadata = metadataList.find(c => c.id === credentialId);
    
    if (!metadata) {
      return {
        success: false,
        error: 'Credential not found'
      };
    }
    
    // Delete from keytar based on credential type
    if (metadata.type === 'username-password') {
      await keytar.deletePassword(KEYTAR_SERVICE, `${credentialId}_password`);
    } else {
      await keytar.deletePassword(KEYTAR_SERVICE, `${credentialId}_value`);
    }
    
    // Remove from metadata
    const filteredMetadata = metadataList.filter(c => c.id !== credentialId);
    await saveCredentialMetadata(filteredMetadata);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting credential:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update the last used timestamp for a credential
 * @param {Object} event - IPC event
 * @param {string} credentialId - The ID of the credential to update
 * @returns {Promise<Object>} - Result object with success flag
 */
async function handleUpdateCredentialLastUsed(event, credentialId) {
  try {
    const metadataList = await loadCredentialMetadata();
    const metadata = metadataList.find(c => c.id === credentialId);
    
    if (!metadata) {
      return {
        success: false,
        error: 'Credential not found'
      };
    }
    
    metadata.lastUsed = new Date().toISOString();
    await saveCredentialMetadata(metadataList);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error updating credential last used:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Load credential metadata from disk (non-sensitive data only)
 * @returns {Promise<Array>} - Array of credential metadata
 */
async function loadCredentialMetadata() {
  try {
    const data = await fs.readFile(credentialsMetadataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return [];
    }
    throw error;
  }
}

/**
 * Save credential metadata to disk (non-sensitive data only)
 * @param {Array} metadataList - Array of credential metadata to save
 * @returns {Promise<void>}
 */
async function saveCredentialMetadata(metadataList) {
  // Ensure the directory exists
  await fs.mkdir(path.dirname(credentialsMetadataPath), { recursive: true });
  
  // Save metadata to disk
  await fs.writeFile(credentialsMetadataPath, JSON.stringify(metadataList, null, 2), 'utf8');
}

/**
 * Register credential-related IPC handlers
 */
export function registerHandlers() {
  // Credential management IPC handlers
  ipcMain.handle('save-credential', handleSaveCredential);
  ipcMain.handle('load-credentials', handleLoadCredentials);
  ipcMain.handle('get-credential-value', handleGetCredentialValue);
  ipcMain.handle('delete-credential', handleDeleteCredential);
  ipcMain.handle('update-credential-last-used', handleUpdateCredentialLastUsed);
  
  console.log('Credential handlers registered with keytar support');
}

// Export functions for internal use
export { handleGetCredentialValue, handleUpdateCredentialLastUsed };