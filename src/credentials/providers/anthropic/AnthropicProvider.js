/**
 * Anthropic provider implementation
 * Handles Claude API credentials and configuration
 */

import { BaseProvider } from '../BaseProvider.js';

export class AnthropicProvider extends BaseProvider {
  constructor() {
    super({
      // Provider identification
      id: 'anthropic',
      name: 'Anthropic',
      displayName: 'Claude (Anthropic)',
      
      // Branding
      branding: {
        logo: './anthropic.svg',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 92.2 65" fill="currentColor">
          <path d="M66.5,0H52.4l25.7,65h14.1L66.5,0z M25.7,0L0,65h14.4l5.3-13.6h26.9L51.8,65h14.4L40.5,0C40.5,0,25.7,0,25.7,0z
           M24.3,39.3l8.8-22.8l8.8,22.8H24.3z"/>
        </svg>`,
        primaryColor: '#D97757', // Anthropic's orange/coral brand color
        secondaryColor: '#B85A3F',
        textColor: '#FFFFFF',
        css: {
          '--provider-primary': '#D97757',
          '--provider-primary-hover': '#B85A3F',
          '--provider-primary-disabled': '#F5D5CC',
          '--provider-text': '#FFFFFF',
          '--provider-border': '#E8A690'
        }
      },
      
      // Field definitions
      fields: [
        {
          name: 'apiKey',
          type: 'password',
          label: 'API Key',
          placeholder: 'sk-ant-api03-...',
          required: true,
          minLength: 100,
          maxLength: 150,
          pattern: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
          patternMessage: 'API key must start with "sk-ant-" and be at least 100 characters',
          helpText: 'Your Anthropic API key from the Anthropic Console'
        }
      ],
      
      // Provider metadata
      description: 'Constitutional AI assistant focused on being helpful, harmless, and honest',
      website: 'https://www.anthropic.com',
      helpUrl: 'https://console.anthropic.com/settings/keys',
      
      // UI text customization
      text: {
        saveButton: 'Save Claude API Key',
        clearButton: 'Clear Claude Key',
        testButton: 'Test Claude Connection',
        successMessage: 'Claude API key saved successfully!',
        errorMessage: 'Failed to save Claude API key',
        testSuccessMessage: 'Claude API key is working!',
        testErrorMessage: 'Claude API key test failed'
      }
    });
  }
  
  /**
   * Test Anthropic API credentials
   * @param {Object} credentials - { apiKey }
   * @returns {Promise<Object>} Test result
   */
  async testCredentials(credentials) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': credentials.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        })
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Claude API key is working correctly!'
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: `API test failed: ${error.error?.message || response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
  
  /**
   * Transform credentials for secure storage
   * @param {Object} credentials - Raw credentials
   * @returns {Object} Transformed credentials
   */
  transformForStorage(credentials) {
    return {
      apiKey: credentials.apiKey,
      // Add any Anthropic-specific transformations
      provider: 'anthropic',
      timestamp: new Date().toISOString()
    };
  }
}