/**
 * IPC Types
 * Defines constants for IPC channel names and message types
 */

/**
 * IPC Channel names
 * Used for communication between main and renderer processes
 */
export const IpcChannels = {
  // Claude API related
  SET_API_KEY: 'set-api-key',
  CHECK_API_KEY: 'check-api-key',
  
  // OpenAI API related
  SET_OPENAI_API_KEY: 'set-openai-api-key',
  CHECK_OPENAI_API_KEY: 'check-openai-api-key',
  DELETE_OPENAI_API_KEY: 'delete-openai-api-key',
  
  // General API
  OPEN_APP_DIRECTORY: 'open-app-directory',
  
  // Logo generation
  GENERATE_LOGO: 'generate-logo',
  REGENERATE_LOGO: 'regenerate-logo',
  TEST_LOGO_GENERATION: 'test-logo-generation',
  
  // Mini app related
  GENERATE_MINI_APP: 'generate-mini-app',
  GENERATE_TITLE_DESCRIPTION: 'generate-title-and-description',
  LIST_MINI_APPS: 'list-mini-apps',
  OPEN_MINI_APP: 'open-mini-app',
  UPDATE_MINI_APP: 'update-mini-app',
  DELETE_MINI_APP: 'delete-mini-app',
  EXPORT_MINI_APP: 'export-mini-app',
  
  // Window related
  OPEN_WINDOW: 'open-window',
  CLOSE_WINDOW: 'close-current-window',
  GET_WINDOW_PARAMS: 'get-window-params',
  NOTIFY_APP_UPDATED: 'notify-app-updated',
  
  // Distribution management (new island architecture)
  GET_INSTALLED_APPS: 'get-installed-apps',
  INSTALL_APP: 'install-app',
  UNINSTALL_APP: 'uninstall-app',
  START_APP: 'start-app',
  STOP_APP: 'stop-app',
  UPDATE_APP: 'update-app',
  PACKAGE_APP: 'package-app',
  VALIDATE_PACKAGE: 'validate-package',
  GET_PACKAGE_METADATA: 'get-package-metadata',
  CHECK_FOR_UPDATES: 'check-for-updates',
  GET_UPDATE_STATUS: 'get-update-status',
  SEARCH_APPS: 'search-apps',
  GET_RUNNING_APPS: 'get-running-apps',
  
  // Events
  GENERATION_STATUS: 'generation-status',
  GENERATION_CHUNK: 'generation-chunk',
  TITLE_DESCRIPTION_CHUNK: 'title-description-chunk',
  LOGO_GENERATION_PROGRESS: 'logo-generation-progress'
};

/**
 * IPC Response status codes
 */
export const IpcResponseStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  CANCELED: 'canceled'
};

/**
 * Generation status types
 */
export const GenerationStatus = {
  GENERATING: 'generating',
  UPDATING: 'updating',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELED: 'canceled'
};

/**
 * Window types
 */
export const WindowTypes = {
  MAIN: 'main',
  MAIN_WEB_COMPONENTS: 'main-web-components',
  APP_CREATION: 'app-creation',
  CREDENTIAL_MANAGER: 'credential-manager',
  MINI_APP: 'mini-app'
};

/**
 * Create a standard success response
 * @param {any} data - Response data
 * @returns {Object} - Standard success response
 */
export function createSuccessResponse(data = {}) {
  return {
    success: true,
    status: IpcResponseStatus.SUCCESS,
    ...data
  };
}

/**
 * Create a standard error response
 * @param {string|Error} error - Error message or object
 * @param {string} operation - Operation that failed
 * @returns {Object} - Standard error response
 */
export function createErrorResponse(error, operation = '') {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorCode = error instanceof Error ? error.code : undefined;
  
  return {
    success: false,
    status: IpcResponseStatus.ERROR,
    error: errorMessage,
    code: errorCode,
    operation
  };
}
