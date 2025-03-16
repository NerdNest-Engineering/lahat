/**
 * Generate Mini App Handler
 * IPC handler for mini app generation
 */
import * as miniAppService from '../services/mini-app-service.js';
import * as apiHandlers from '../../../../modules/ipc/apiHandlers.js';
import { 
  DEFAULT_SYSTEM_PROMPT, 
  GAME_SYSTEM_PROMPT, 
  UTILITY_SYSTEM_PROMPT, 
  DATA_VIZ_SYSTEM_PROMPT 
} from '../../system-prompts.js';

/**
 * Determine the appropriate system prompt based on the app description
 * @param {string} description - The app description
 * @returns {string} - The appropriate system prompt
 */
function determineSystemPrompt(description) {
  const lowerDesc = description.toLowerCase();
  
  // Check for game-related keywords
  if (
    lowerDesc.includes('game') || 
    lowerDesc.includes('play') || 
    lowerDesc.includes('score') || 
    lowerDesc.includes('player') ||
    lowerDesc.includes('win') ||
    lowerDesc.includes('lose') ||
    lowerDesc.includes('puzzle')
  ) {
    return GAME_SYSTEM_PROMPT;
  }
  
  // Check for utility-related keywords
  if (
    lowerDesc.includes('calculator') || 
    lowerDesc.includes('convert') || 
    lowerDesc.includes('utility') || 
    lowerDesc.includes('tool') ||
    lowerDesc.includes('calculate') ||
    lowerDesc.includes('measurement')
  ) {
    return UTILITY_SYSTEM_PROMPT;
  }
  
  // Check for data visualization keywords
  if (
    lowerDesc.includes('chart') || 
    lowerDesc.includes('graph') || 
    lowerDesc.includes('plot') || 
    lowerDesc.includes('visualization') ||
    lowerDesc.includes('dashboard') ||
    lowerDesc.includes('data') ||
    lowerDesc.includes('analytics')
  ) {
    return DATA_VIZ_SYSTEM_PROMPT;
  }
  
  // Default to the standard system prompt
  return DEFAULT_SYSTEM_PROMPT;
}

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
    params.systemPrompt = determineSystemPrompt(params.prompt);
  }
  
  return await miniAppService.generateMiniApp(claudeClient, event, params);
}
