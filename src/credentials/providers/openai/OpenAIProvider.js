/**
 * OpenAI provider implementation
 * Handles OpenAI API credentials and configuration
 */

import { BaseProvider } from '../BaseProvider.js';

export class OpenAIProvider extends BaseProvider {
  constructor() {
    super({
      // Provider identification
      id: 'openai',
      name: 'OpenAI',
      displayName: 'ChatGPT (OpenAI)',
      
      // Branding
      branding: {
        logo: './openai.svg',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 79.9 81" fill="currentColor">
          <path d="M74.6,33.1c1.8-5.5,1.2-11.6-1.7-16.6c-4.4-7.7-13.3-11.6-22-9.8C47.1,2.4,41.5,0,35.7,0C26.8,0,19,5.7,16.2,14.1
            c-5.7,1.2-10.6,4.7-13.5,9.8c-4.4,7.7-3.4,17.3,2.5,23.9C3.4,53.4,4.1,59.4,7,64.4c4.4,7.7,13.3,11.7,22,9.8
            c3.9,4.3,9.4,6.8,15.2,6.8c8.9,0,16.7-5.7,19.5-14.1c5.7-1.2,10.6-4.7,13.5-9.8C81.6,49.4,80.6,39.7,74.6,33.1z M44.2,75.7
            c-3.6,0-7-1.2-9.7-3.5c0.1-0.1,0.4-0.2,0.5-0.3l16.1-9.3c0.8-0.5,1.3-1.3,1.3-2.3V37.6l6.8,3.9c0.1,0,0.1,0.1,0.1,0.2v18.8
            C59.4,68.9,52.6,75.7,44.2,75.7z M11.6,61.8c-1.8-3.1-2.4-6.7-1.8-10.2c0.1,0.1,0.3,0.2,0.5,0.3l16.1,9.3c0.8,0.5,1.8,0.5,2.6,0
            l19.7-11.4v7.9c0,0.1,0,0.2-0.1,0.2l-16.3,9.4C25.1,71.5,15.8,69,11.6,61.8L11.6,61.8z M7.4,26.6c1.8-3.1,4.6-5.4,7.9-6.7v19.2
            c0,0.9,0.5,1.8,1.3,2.3l19.7,11.4l-6.8,3.9c-0.1,0-0.2,0.1-0.2,0l-16.3-9.4C5.6,43.1,3.2,33.8,7.4,26.6L7.4,26.6z M63.4,39.6
            L43.7,28.2l6.8-3.9c0.1,0,0.2-0.1,0.2,0L67,33.7c7.3,4.2,9.7,13.5,5.5,20.7c-1.8,3.1-4.6,5.4-7.9,6.6V41.9
            C64.7,41,64.2,40.1,63.4,39.6L63.4,39.6z M70.1,29.4c-0.1-0.1-0.3-0.2-0.5-0.3l-16.1-9.3c-0.8-0.5-1.8-0.5-2.6,0L31.2,31.2v-7.9
            c0-0.1,0-0.2,0.1-0.2l16.3-9.4c7.3-4.2,16.5-1.7,20.7,5.6C70.1,22.3,70.7,25.9,70.1,29.4L70.1,29.4z M27.5,43.4l-6.8-3.9
            c-0.1,0-0.1-0.1-0.1-0.2V20.5c0-8.4,6.8-15.2,15.2-15.2c3.6,0,7,1.2,9.7,3.5c-0.1,0.1-0.3,0.2-0.5,0.3l-16.1,9.3
            c-0.8,0.5-1.3,1.3-1.3,2.3V43.4z M31.2,35.4l8.8-5.1l8.8,5.1v10.1l-8.8,5.1l-8.8-5.1L31.2,35.4z"/>
        </svg>`,
        primaryColor: '#10a37f', // OpenAI's signature green
        secondaryColor: '#0d8a6b',
        textColor: '#FFFFFF',
        css: {
          '--provider-primary': '#10a37f',
          '--provider-primary-hover': '#0d8a6b',
          '--provider-primary-disabled': '#A8D5C9',
          '--provider-text': '#FFFFFF',
          '--provider-border': '#7BC5B5'
        }
      },
      
      // Field definitions
      fields: [
        {
          name: 'apiKey',
          type: 'password',
          label: 'API Key',
          placeholder: 'sk-...',
          required: true,
          minLength: 50,
          maxLength: 60,
          pattern: /^sk-[a-zA-Z0-9]{48,}$/,
          patternMessage: 'API key must start with "sk-" and be at least 50 characters',
          helpText: 'Your OpenAI API key from the OpenAI Platform'
        },
        {
          name: 'organization',
          type: 'text',
          label: 'Organization ID (Optional)',
          placeholder: 'org-...',
          required: false,
          pattern: /^org-[a-zA-Z0-9]+$/,
          patternMessage: 'Organization ID must start with "org-"',
          helpText: 'Optional: Your OpenAI organization ID'
        }
      ],
      
      // Provider metadata
      description: 'Advanced AI models including GPT-4, GPT-3.5, and DALL-E',
      website: 'https://openai.com',
      helpUrl: 'https://platform.openai.com/api-keys',
      
      // UI text customization
      text: {
        saveButton: 'Save OpenAI API Key',
        clearButton: 'Clear OpenAI Key',
        testButton: 'Test OpenAI Connection',
        successMessage: 'OpenAI API key saved successfully!',
        errorMessage: 'Failed to save OpenAI API key',
        testSuccessMessage: 'OpenAI API key is working!',
        testErrorMessage: 'OpenAI API key test failed'
      }
    });
  }
  
  /**
   * Test OpenAI API credentials
   * @param {Object} credentials - { apiKey, organization? }
   * @returns {Promise<Object>} Test result
   */
  async testCredentials(credentials) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.apiKey}`
      };
      
      // Add organization header if provided
      if (credentials.organization) {
        headers['OpenAI-Organization'] = credentials.organization;
      }
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        const modelCount = data.data?.length || 0;
        return {
          success: true,
          message: `OpenAI API key is working! Found ${modelCount} available models.`
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
    const stored = {
      apiKey: credentials.apiKey,
      provider: 'openai',
      timestamp: new Date().toISOString()
    };
    
    // Only include organization if provided
    if (credentials.organization && credentials.organization.trim()) {
      stored.organization = credentials.organization.trim();
    }
    
    return stored;
  }
}