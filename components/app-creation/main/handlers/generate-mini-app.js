/**
 * Generate Mini App Handler
 * IPC handler for mini app generation
 */
import * as miniAppService from '../services/mini-app-service.js';
import * as apiHandlers from '../../../../modules/ipc/apiHandlers.js';
import { 
  DEFAULT_WIDGET_PROMPT, 
  INTERACTIVE_WIDGET_PROMPT, 
  UTILITY_WIDGET_PROMPT, 
  DATA_VIZ_WIDGET_PROMPT,
  determineWidgetSystemPrompt
} from '../../widget-system-prompts.js';

/**
 * Handle generating a mini app
 * @param {Object} event - IPC event
 * @param {Object} params - Parameters for generating the mini app
 * @returns {Promise<Object>} - Result object with success flag
 */
export async function handleGenerateMiniApp(event, params) {
  const claudeClient = apiHandlers.getClaudeClient();
  
  // If no system prompt is provided, determine one based on the description
  if (!params.systemPrompt && params.prompt) {
    try {
      // Use Claude to determine the appropriate widget type
      params.systemPrompt = await determineWidgetSystemPrompt(params.prompt);
    } catch (error) {
      console.error('Error determining widget type:', error);
      // Fall back to default widget prompt
      params.systemPrompt = DEFAULT_WIDGET_PROMPT;
    }
  }
  
  return await miniAppService.generateMiniApp(claudeClient, event, params);
}
