/**
 * Generate Title and Description Handler
 * IPC handler for generating title and description
 */
import * as widgetService from '../services/mini-app-service.js';
import * as apiHandlers from '../../../../modules/ipc/apiHandlers.js';

/**
 * Handle generating title and description for a widget
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating title and description
 * @returns {Promise<Object>} - Result object with title and description
 */
export async function handleGenerateTitleAndDescription(event, params) {
  const claudeClient = apiHandlers.getClaudeClient();
  return await widgetService.generateTitleAndDescription(claudeClient, event, params);
}
