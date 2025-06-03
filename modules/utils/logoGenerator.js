/**
 * Logo Generator Module
 * Handles the complete workflow of generating and saving app logos
 */

import path from 'path';
import fs from 'fs/promises';
import OpenAIClient from './openAIClient.js';
import { getCredentialValue } from '../ipc/apiHandlers.js';
import logger from './logger.js';
import { ErrorHandler } from './errorHandler.js';

export class LogoGenerator {
  constructor() {
    this.openAIClient = null;
    this.initializeClient();
  }

  /**
   * Initialize the OpenAI client
   * @private
   */
  async initializeClient() {
    try {
      const apiKey = await getCredentialValue('openai');
      if (apiKey) {
        this.openAIClient = new OpenAIClient(apiKey);
        logger.info('Logo generator initialized with OpenAI client', {}, 'LogoGenerator');
      } else {
        logger.warn('OpenAI API key not found, logo generation will not be available', {}, 'LogoGenerator');
      }
    } catch (error) {
      logger.error('Failed to initialize OpenAI client', error, 'LogoGenerator');
      this.openAIClient = null;
    }
  }

  /**
   * Check if logo generation is available
   * @returns {boolean} - True if OpenAI client is available
   */
  isAvailable() {
    return this.openAIClient !== null;
  }

  /**
   * Generate and save a logo for an app
   * @param {string} appName - Name of the app
   * @param {string} appDescription - Description of the app
   * @param {string} appFolderPath - Path to the app's folder
   * @returns {Promise<Object>} - Result object with success flag and logo info
   */
  async generateAppLogo(appName, appDescription, appFolderPath) {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'OpenAI API key not configured. Please set your OpenAI API key in settings.'
        };
      }

      logger.info('Starting logo generation', { appName, appFolderPath }, 'LogoGenerator');

      // Generate the logo using DALL-E 3
      const logoResult = await this.openAIClient.generateLogo(appName, appDescription);
      
      if (!logoResult.success) {
        return logoResult;
      }

      // Download the generated image
      const imageBuffer = await this.openAIClient.downloadImage(logoResult.imageUrl);

      // Ensure assets directory exists
      const assetsPath = path.join(appFolderPath, 'assets');
      await fs.mkdir(assetsPath, { recursive: true });

      // Save the logo as PNG
      const logoFileName = 'logo.png';
      const logoFilePath = path.join(assetsPath, logoFileName);
      await fs.writeFile(logoFilePath, imageBuffer);

      logger.info('Logo saved successfully', { 
        appName, 
        logoFilePath,
        fileSize: imageBuffer.length 
      }, 'LogoGenerator');

      return {
        success: true,
        logo: {
          filePath: path.join('assets', logoFileName), // Relative path for metadata
          absolutePath: logoFilePath,
          generatedAt: new Date().toISOString(),
          prompt: logoResult.originalPrompt,
          revisedPrompt: logoResult.revisedPrompt,
          retryCount: 0
        }
      };
    } catch (error) {
      logger.error('Failed to generate app logo', error, 'LogoGenerator');
      ErrorHandler.logError('generateAppLogo', error);
      
      return {
        success: false,
        error: `Failed to generate logo: ${error.message}`
      };
    }
  }

  /**
   * Regenerate a logo for an existing app
   * @param {string} appName - Name of the app
   * @param {string} appDescription - Description of the app
   * @param {string} appFolderPath - Path to the app's folder
   * @param {number} currentRetryCount - Current retry count
   * @returns {Promise<Object>} - Result object with success flag and logo info
   */
  async regenerateAppLogo(appName, appDescription, appFolderPath, currentRetryCount = 0) {
    try {
      logger.info('Regenerating logo', { 
        appName, 
        appFolderPath, 
        retryCount: currentRetryCount + 1 
      }, 'LogoGenerator');

      const result = await this.generateAppLogo(appName, appDescription, appFolderPath);
      
      if (result.success) {
        // Update retry count
        result.logo.retryCount = currentRetryCount + 1;
        
        logger.info('Logo regenerated successfully', { 
          appName, 
          retryCount: result.logo.retryCount 
        }, 'LogoGenerator');
      }

      return result;
    } catch (error) {
      logger.error('Failed to regenerate app logo', error, 'LogoGenerator');
      ErrorHandler.logError('regenerateAppLogo', error);
      
      return {
        success: false,
        error: `Failed to regenerate logo: ${error.message}`
      };
    }
  }

  /**
   * Generate logos for multiple apps (batch operation)
   * @param {Array} apps - Array of app objects with name, description, and folderPath
   * @param {Function} progressCallback - Optional callback for progress updates
   * @returns {Promise<Object>} - Result object with success count and errors
   */
  async batchGenerateLogos(apps, progressCallback = null) {
    const results = {
      total: apps.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    logger.info('Starting batch logo generation', { totalApps: apps.length }, 'LogoGenerator');

    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      
      try {
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: apps.length,
            appName: app.name,
            status: 'generating'
          });
        }

        const result = await this.generateAppLogo(app.name, app.description, app.folderPath);
        
        if (result.success) {
          results.successful++;
          logger.info('Batch logo generation successful', { 
            appName: app.name,
            progress: `${i + 1}/${apps.length}` 
          }, 'LogoGenerator');
        } else {
          results.failed++;
          results.errors.push({
            appName: app.name,
            error: result.error
          });
          logger.error('Batch logo generation failed', { 
            appName: app.name,
            error: result.error 
          }, 'LogoGenerator');
        }

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: apps.length,
            appName: app.name,
            status: result.success ? 'completed' : 'failed'
          });
        }

        // Add a small delay between requests to avoid rate limiting
        if (i < apps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          appName: app.name,
          error: error.message
        });
        logger.error('Batch logo generation error', error, 'LogoGenerator');
      }
    }

    logger.info('Batch logo generation completed', results, 'LogoGenerator');
    return results;
  }

  /**
   * Test logo generation with a sample request
   * @returns {Promise<Object>} - Result object with success flag
   */
  async testLogoGeneration() {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'OpenAI API key not configured'
        };
      }

      logger.info('Testing logo generation', {}, 'LogoGenerator');

      const testResult = await this.openAIClient.generateLogo(
        'Test App',
        'A simple test application for logo generation'
      );

      if (testResult.success) {
        logger.info('Logo generation test successful', {}, 'LogoGenerator');
        return {
          success: true,
          message: 'Logo generation is working correctly'
        };
      } else {
        return testResult;
      }
    } catch (error) {
      logger.error('Logo generation test failed', error, 'LogoGenerator');
      ErrorHandler.logError('testLogoGeneration', error);
      
      return {
        success: false,
        error: `Logo generation test failed: ${error.message}`
      };
    }
  }

  /**
   * Refresh the OpenAI client (useful when API key is updated)
   */
  async refreshClient() {
    await this.initializeClient();
    logger.info('Logo generator client refreshed', {}, 'LogoGenerator');
  }
}

// Create a singleton instance
const logoGenerator = new LogoGenerator();

export default logoGenerator;
