import { ipcMain } from 'electron';
import { IpcChannels, createSuccessResponse, createErrorResponse } from './ipcTypes.js';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * Distribution Handlers Module
 * Responsible for managing app installation, packaging, and distribution through IPC
 */

let distributionManager = null;

/**
 * Set the distribution manager instance
 * @param {DistributionManager} manager - Distribution manager instance
 */
export function setDistributionManager(manager) {
  distributionManager = manager;
}

/**
 * Register all distribution-related IPC handlers
 */
export function registerHandlers() {
  console.log('Registering distribution IPC handlers...');
  
  // App management handlers
  ipcMain.handle(IpcChannels.GET_INSTALLED_APPS, handleGetInstalledApps);
  ipcMain.handle(IpcChannels.INSTALL_APP, handleInstallApp);
  ipcMain.handle(IpcChannels.UNINSTALL_APP, handleUninstallApp);
  ipcMain.handle(IpcChannels.START_APP, handleStartApp);
  ipcMain.handle(IpcChannels.STOP_APP, handleStopApp);
  ipcMain.handle(IpcChannels.UPDATE_APP, handleUpdateApp);
  
  // Package management handlers
  ipcMain.handle(IpcChannels.PACKAGE_APP, handlePackageApp);
  ipcMain.handle(IpcChannels.VALIDATE_PACKAGE, handleValidatePackage);
  ipcMain.handle(IpcChannels.GET_PACKAGE_METADATA, handleGetPackageMetadata);
  
  // Update management handlers
  ipcMain.handle(IpcChannels.CHECK_FOR_UPDATES, handleCheckForUpdates);
  ipcMain.handle(IpcChannels.GET_UPDATE_STATUS, handleGetUpdateStatus);
  
  // App search and filtering
  ipcMain.handle(IpcChannels.SEARCH_APPS, handleSearchApps);
  ipcMain.handle(IpcChannels.GET_RUNNING_APPS, handleGetRunningApps);
  
  console.log('Distribution IPC handlers registered');
}

/**
 * Get all installed apps
 */
async function handleGetInstalledApps(event, filter = {}) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const apps = await distributionManager.getApps(filter);
    return createSuccessResponse({ apps });
  } catch (error) {
    ErrorHandler.logError('handleGetInstalledApps', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Install an app from package
 */
async function handleInstallApp(event, packagePath, options = {}) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.installApp(packagePath, options);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleInstallApp', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Uninstall an app
 */
async function handleUninstallApp(event, appId, options = {}) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.uninstallApp(appId, options);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleUninstallApp', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Start an app
 */
async function handleStartApp(event, appId, options = {}) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.startApp(appId, options);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleStartApp', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Stop an app
 */
async function handleStopApp(event, appId) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.stopApp(appId);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleStopApp', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Update an app
 */
async function handleUpdateApp(event, appId, packagePath = null, options = {}) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.updateApp(appId, packagePath, options);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleUpdateApp', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Package an app
 */
async function handlePackageApp(event, projectPath, outputPath, options = {}) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.packageApp(projectPath, outputPath, options);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handlePackageApp', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Validate a package
 */
async function handleValidatePackage(event, packagePath) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.validatePackage(packagePath);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleValidatePackage', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Get package metadata
 */
async function handleGetPackageMetadata(event, packagePath) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.getPackageMetadata(packagePath);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleGetPackageMetadata', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Check for updates
 */
async function handleCheckForUpdates(event) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = await distributionManager.checkForUpdates();
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleCheckForUpdates', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Get update status for an app
 */
async function handleGetUpdateStatus(event, appId) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = distributionManager.updateManager.getUpdateStatus(appId);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleGetUpdateStatus', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Search apps
 */
async function handleSearchApps(event, query, options = {}) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = distributionManager.searchApps(query, options);
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleSearchApps', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Get running apps
 */
async function handleGetRunningApps(event) {
  try {
    if (!distributionManager) {
      throw new Error('Distribution manager not available');
    }
    
    const result = distributionManager.getRunningApps();
    return createSuccessResponse(result);
  } catch (error) {
    ErrorHandler.logError('handleGetRunningApps', error);
    return createErrorResponse(error.message);
  }
}