/**
 * OpenAI Client Module
 * Handles OpenAI API interactions, specifically for DALL-E logo generation
 */

import OpenAI from 'openai';
import logger from './logger.js';
import { ErrorHandler } from './errorHandler.js';

class OpenAIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: this.apiKey
    });
  }

  /**
   * Generate a logo using DALL-E 3
   * @param {string} appName - Name of the app
   * @param {string} appDescription - Description of the app
   * @returns {Promise<Object>} - Result object with success flag and image URL
   */
  async generateLogo(appName, appDescription) {
    try {
      // Create Apple-style logo prompt
      const prompt = this.createLogoPrompt(appName, appDescription);
      
      logger.info('Generating logo with DALL-E 3', { appName, prompt }, 'OpenAIClient');
      
      const response = await this.client.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      });

      if (response.data && response.data.length > 0) {
        const imageUrl = response.data[0].url;
        const revisedPrompt = response.data[0].revised_prompt;
        
        logger.info('Logo generated successfully', { 
          appName, 
          imageUrl: imageUrl.substring(0, 50) + '...',
          revisedPrompt 
        }, 'OpenAIClient');
        
        return {
          success: true,
          imageUrl,
          revisedPrompt,
          originalPrompt: prompt
        };
      } else {
        throw new Error('No image data received from DALL-E');
      }
    } catch (error) {
      logger.error('Failed to generate logo', error, 'OpenAIClient');
      ErrorHandler.logError('generateLogo', error);
      
      return {
        success: false,
        error: error.message || 'Failed to generate logo'
      };
    }
  }

  /**
   * Create an Apple-style logo prompt
   * @param {string} appName        – Name of the app
   * @param {string} appDescription – Short description of the app
   * @returns {string}              – Prompt formatted for DALL-E / SDXL
   */
  createLogoPrompt(appName, appDescription) {
  const positive = `
Design a vibrant macOS/iOS app icon for “${appName}”.

• Shape  : Rounded-square (Sonoma style)
• Symbol : ONE centered metaphor of ${appDescription}
• Palette: Saturated, smooth gradient
• Finish : Flat/matte, crisp edges
• Inspiration: Pixelmator Pro brush, Warp gradient, Slack logo
• Output : 1024×1024 PNG, transparent background
`.trim();

  const negative = `
### Negative prompt
3d, bevel, extrude, drop shadow, lens flare, dull colors, washed-out,
busy layout, text, watermark, realistic photo
`.trim();

  return `${positive}\n\n${negative}`;
  }

  /**
   * Download an image from a URL
   * @param {string} imageUrl - URL of the image to download
   * @returns {Promise<Buffer>} - Image data as buffer
   */
  async downloadImage(imageUrl) {
    try {
      logger.info('Downloading image from URL', { url: imageUrl.substring(0, 50) + '...' }, 'OpenAIClient');
      
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      logger.info('Image downloaded successfully', { size: buffer.length }, 'OpenAIClient');
      
      return buffer;
    } catch (error) {
      logger.error('Failed to download image', error, 'OpenAIClient');
      ErrorHandler.logError('downloadImage', error);
      throw error;
    }
  }

  /**
   * Test the OpenAI API connection
   * @returns {Promise<Object>} - Result object with success flag
   */
  async testConnection() {
    try {
      // Make a simple API call to test the connection
      const response = await this.client.models.list();
      
      if (response && response.data) {
        logger.info('OpenAI API connection test successful', {}, 'OpenAIClient');
        return {
          success: true,
          message: 'OpenAI API connection successful'
        };
      } else {
        throw new Error('Invalid response from OpenAI API');
      }
    } catch (error) {
      logger.error('OpenAI API connection test failed', error, 'OpenAIClient');
      ErrorHandler.logError('testConnection', error);
      
      return {
        success: false,
        error: error.message || 'Failed to connect to OpenAI API'
      };
    }
  }
}

export default OpenAIClient;
