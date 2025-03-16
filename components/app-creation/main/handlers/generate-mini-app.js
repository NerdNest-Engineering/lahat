/**
 * Generate Mini App Handler
 * IPC handler for mini app generation
 */
import * as miniAppService from '../services/mini-app-service.js';
import * as apiHandlers from '../../../../modules/ipc/apiHandlers.js';

/**
 * Handle generating a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function handleGenerateMiniApp(event, params) {
  const claudeClient = apiHandlers.getClaudeClient();
  return await miniAppService.generateMiniApp(claudeClient, event, params);
}
