/**
 * App Generation Service
 * Handles the generation of apps
 */

import { logError, ErrorLevel } from '../utils/error-utils.js';
import { ClaudeService } from './claude-service.js';
import { 
  createTitleDescriptionPrompt,
  createWebComponentPrompt,
  createComponentAnalysisPrompt,
  createComponentStructurePrompt,
  createEventCommunicationPrompt,
  parseJsonResponse
} from '../utils/prompt-utils.js';
import {
  generateComponentName,
  generateTagName,
  generateComponentId,
  generateMetadata,
  saveComponent
} from '../utils/component-utils.js';

/**
 * App Generation Service
 * Handles the generation of apps
 */
export class AppGenerationService {
  /**
   * Create a new AppGenerationService
   * @param {EventBus} eventBus - The event bus for communication
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.claudeService = new ClaudeService(eventBus);
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
  }
  
  /**
   * Initialize the service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      return await this.claudeService.initialize();
    } catch (error) {
      logError('AppGenerationService.initialize', error, ErrorLevel.ERROR);
      return false;
    }
  }
  
  /**
   * Generate title and description
   * @param {string} prompt - The user prompt
   * @param {Function} onChunk - Callback for receiving chunks
   * @returns {Promise<Object>} - The generation result
   */
  async generateTitleAndDescription(prompt, onChunk) {
    try {
      // Create the prompt
      const titleDescriptionPrompt = createTitleDescriptionPrompt(prompt);
      
      // Generate title and description
      return await this.claudeService.generateTitleAndDescription(prompt, onChunk);
    } catch (error) {
      logError('AppGenerationService.generateTitleAndDescription', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate app
   * @param {string} title - The app title
   * @param {string} description - The app description
   * @param {Function} onChunk - Callback for receiving chunks
   * @returns {Promise<Object>} - The generation result
   */
  async generateApp(title, description, onChunk) {
    try {
      // Create the prompt
      const webComponentPrompt = createWebComponentPrompt(title, description);
      
      // Generate app
      const result = await this.claudeService.generateApp(title, description, onChunk);
      
      if (result.success) {
        // Generate component name and tag name
        const componentName = generateComponentName(title);
        const tagName = generateTagName(title);
        
        // Generate metadata
        const metadata = generateMetadata(componentName, tagName, result.code);
        
        // Save the component
        await saveComponent(componentName, result.code, metadata);
      }
      
      return result;
    } catch (error) {
      logError('AppGenerationService.generateApp', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Analyze component requirements
   * @param {string} title - The app title
   * @param {string} description - The app description
   * @returns {Promise<Object>} - The analysis result
   */
  async analyzeComponentRequirements(title, description) {
    try {
      // Create the prompt
      const analysisPrompt = createComponentAnalysisPrompt(title, description);
      
      // Generate analysis
      const response = await this.claudeService.generateAnalysis(analysisPrompt);
      
      // Parse the response
      const analysisResult = parseJsonResponse(response);
      
      return {
        success: true,
        analysis: analysisResult
      };
    } catch (error) {
      logError('AppGenerationService.analyzeComponentRequirements', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Define component structure
   * @param {Object} analysisResult - The result of the component analysis
   * @returns {Promise<Object>} - The structure result
   */
  async defineComponentStructure(analysisResult) {
    try {
      // Create the prompt
      const structurePrompt = createComponentStructurePrompt(analysisResult);
      
      // Generate structure
      const response = await this.claudeService.generateStructure(structurePrompt);
      
      // Parse the response
      const structureResult = parseJsonResponse(response);
      
      return {
        success: true,
        structure: structureResult
      };
    } catch (error) {
      logError('AppGenerationService.defineComponentStructure', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Define event communication
   * @param {Object} structureResult - The result of the component structure definition
   * @returns {Promise<Object>} - The event communication result
   */
  async defineEventCommunication(structureResult) {
    try {
      // Create the prompt
      const eventPrompt = createEventCommunicationPrompt(structureResult);
      
      // Generate event communication
      const response = await this.claudeService.generateEventCommunication(eventPrompt);
      
      // Parse the response
      const eventResult = parseJsonResponse(response);
      
      return {
        success: true,
        events: eventResult
      };
    } catch (error) {
      logError('AppGenerationService.defineEventCommunication', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate components
   * @param {Object} eventResult - The result of the event communication definition
   * @param {Function} onChunk - Callback for receiving chunks
   * @returns {Promise<Object>} - The generation result
   */
  async generateComponents(eventResult, onChunk) {
    try {
      // Generate components
      const components = eventResult.components;
      const generatedComponents = [];
      
      for (const component of components) {
        // Generate component
        const result = await this.claudeService.generateComponent(component, onChunk);
        
        if (result.success) {
          // Generate metadata
          const metadata = generateMetadata(component.name, component.tagName, result.code);
          
          // Save the component
          await saveComponent(component.name, result.code, metadata);
          
          generatedComponents.push({
            name: component.name,
            tagName: component.tagName,
            code: result.code,
            metadata
          });
        } else {
          throw new Error(`Failed to generate component ${component.name}: ${result.error}`);
        }
      }
      
      return {
        success: true,
        components: generatedComponents
      };
    } catch (error) {
      logError('AppGenerationService.generateComponents', error, ErrorLevel.ERROR);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}
