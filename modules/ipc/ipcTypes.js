/**
 * IPC Types
 * Defines constants for IPC channel names and message types
 */

/**
 * IPC Channel names
 * Used for communication between main and renderer processes
 */
export const IpcChannels = {
  // API related
  SET_API_KEY: 'set-api-key',
  CHECK_API_KEY: 'check-api-key',
  OPEN_APP_DIRECTORY: 'open-app-directory',
  
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
  CREATE_EXTERNAL_WINDOW: 'create-external-window',
  CLOSE_WINDOW: 'close-current-window',
  GET_WINDOW_PARAMS: 'get-window-params',
  NOTIFY_APP_UPDATED: 'notify-app-updated',
  
  // Events
  GENERATION_STATUS: 'generation-status',
  GENERATION_CHUNK: 'generation-chunk',
  TITLE_DESCRIPTION_CHUNK: 'title-description-chunk'
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
  API_SETUP: 'api-setup',
  APP_CREATION: 'app-creation',
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
