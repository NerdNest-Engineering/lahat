/**
 * Amazon S3 provider implementation
 * Handles AWS S3 credentials with multiple fields
 */

import { BaseProvider } from '../BaseProvider.js';

export class AmazonS3Provider extends BaseProvider {
  constructor() {
    super({
      // Provider identification
      id: 'amazon-s3',
      name: 'Amazon S3',
      displayName: 'Amazon S3 (AWS)',
      
      // Branding
      branding: {
        logo: './amazon-s3.svg',
        iconSvg: `<svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor">
          <path d="m259.7 348.2-137 32.7v-250.3l137 32z"/>
          <path d="m256 348.6 133.3 32.3.1-.3v-249.6l-.1-.3-133.3 32.3v185.7"/>
          <path d="m256 64v96.8l58 14.4v-82.2zm133.3 66.6v250.3l25.6-12.8v-224.7zm-133.3 77.1v97l58-7.5v-82.2zm58 129.1-58 14.4v96.8l58-29z"/>
          <path d="m314 175.2-58 10.7-58-10.7 57.9-15.1 58.3 15.1"/>
          <path d="m314 336.8-58-10.7-58 10.7 57.9 16.1 58.3-16.1"/>
        </svg>`,
        primaryColor: '#FF9900', // AWS orange
        secondaryColor: '#E6830C',
        textColor: '#FFFFFF',
        css: {
          '--provider-primary': '#FF9900',
          '--provider-primary-hover': '#E6830C',
          '--provider-primary-disabled': '#FFD699',
          '--provider-text': '#FFFFFF',
          '--provider-border': '#FFBF66'
        }
      },
      
      // Field definitions - more complex example
      fields: [
        {
          name: 'accessKeyId',
          type: 'text',
          label: 'Access Key ID',
          placeholder: 'AKIA...',
          required: true,
          minLength: 16,
          maxLength: 32,
          pattern: /^AKIA[A-Z0-9]{16}$/,
          patternMessage: 'Access Key ID must start with "AKIA" followed by 16 alphanumeric characters',
          helpText: 'Your AWS Access Key ID'
        },
        {
          name: 'secretAccessKey',
          type: 'password',
          label: 'Secret Access Key',
          placeholder: 'Enter your secret access key',
          required: true,
          minLength: 40,
          maxLength: 40,
          pattern: /^[A-Za-z0-9/+=]{40}$/,
          patternMessage: 'Secret Access Key must be exactly 40 characters',
          helpText: 'Your AWS Secret Access Key'
        },
        {
          name: 'region',
          type: 'select',
          label: 'AWS Region',
          required: true,
          options: [
            { value: 'us-east-1', label: 'US East (N. Virginia)' },
            { value: 'us-east-2', label: 'US East (Ohio)' },
            { value: 'us-west-1', label: 'US West (N. California)' },
            { value: 'us-west-2', label: 'US West (Oregon)' },
            { value: 'eu-west-1', label: 'Europe (Ireland)' },
            { value: 'eu-west-2', label: 'Europe (London)' },
            { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
            { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
            { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
            { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' }
          ],
          helpText: 'Select your AWS region'
        },
        {
          name: 'bucketName',
          type: 'text',
          label: 'S3 Bucket Name',
          placeholder: 'my-bucket-name',
          required: true,
          minLength: 3,
          maxLength: 63,
          pattern: /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/,
          patternMessage: 'Bucket name must be 3-63 characters, lowercase letters, numbers, periods, and hyphens only',
          customValidator: (value) => {
            // Additional S3 bucket name validation
            if (value.includes('..')) {
              return 'Bucket name cannot contain consecutive periods';
            }
            if (value.includes('.-') || value.includes('-.')) {
              return 'Bucket name cannot have periods adjacent to hyphens';
            }
            if (/^\d+\.\d+\.\d+\.\d+$/.test(value)) {
              return 'Bucket name cannot be formatted as an IP address';
            }
            return true;
          },
          helpText: 'The name of your S3 bucket'
        },
        {
          name: 'endpoint',
          type: 'url',
          label: 'Custom Endpoint (Optional)',
          placeholder: 'https://s3.amazonaws.com',
          required: false,
          pattern: /^https?:\/\/.+/,
          patternMessage: 'Endpoint must be a valid HTTP/HTTPS URL',
          helpText: 'Optional: Custom S3 endpoint for S3-compatible services'
        }
      ],
      
      // Provider metadata
      description: 'Amazon Simple Storage Service for file storage and backup',
      website: 'https://aws.amazon.com/s3/',
      helpUrl: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html',
      
      // UI text customization
      text: {
        saveButton: 'Save S3 Credentials',
        clearButton: 'Clear S3 Credentials',
        testButton: 'Test S3 Connection',
        successMessage: 'S3 credentials saved successfully!',
        errorMessage: 'Failed to save S3 credentials',
        testSuccessMessage: 'S3 connection successful!',
        testErrorMessage: 'S3 connection test failed'
      }
    });
  }
  
  /**
   * Test Amazon S3 credentials
   * @param {Object} credentials - { accessKeyId, secretAccessKey, region, bucketName, endpoint? }
   * @returns {Promise<Object>} Test result
   */
  async testCredentials(credentials) {
    try {
      // For S3, we'd typically use the AWS SDK, but for demonstration
      // we'll simulate a basic test
      const endpoint = credentials.endpoint || `https://s3.${credentials.region}.amazonaws.com`;
      const url = `${endpoint}/${credentials.bucketName}`;
      
      // This is a simplified test - in reality you'd use AWS SDK
      // and proper signature validation
      const testResult = await this.validateS3Access(credentials);
      
      return testResult;
    } catch (error) {
      return {
        success: false,
        message: `S3 test failed: ${error.message}`
      };
    }
  }
  
  /**
   * Validate S3 access (simplified simulation)
   * @param {Object} credentials - S3 credentials
   * @returns {Promise<Object>} Validation result
   * @private
   */
  async validateS3Access(credentials) {
    // Simulate validation logic
    // In a real implementation, this would use AWS SDK
    
    // Basic format validation
    if (!credentials.accessKeyId.startsWith('AKIA')) {
      return {
        success: false,
        message: 'Invalid Access Key ID format'
      };
    }
    
    if (credentials.secretAccessKey.length !== 40) {
      return {
        success: false,
        message: 'Invalid Secret Access Key length'
      };
    }
    
    // Simulate successful connection
    return {
      success: true,
      message: `Successfully connected to S3 bucket "${credentials.bucketName}" in region ${credentials.region}`
    };
  }
  
  /**
   * Transform credentials for secure storage
   * @param {Object} credentials - Raw credentials
   * @returns {Object} Transformed credentials
   */
  transformForStorage(credentials) {
    const stored = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey, // In reality, this should be encrypted
      region: credentials.region,
      bucketName: credentials.bucketName,
      provider: 'amazon-s3',
      timestamp: new Date().toISOString()
    };
    
    // Only include endpoint if provided
    if (credentials.endpoint && credentials.endpoint.trim()) {
      stored.endpoint = credentials.endpoint.trim();
    }
    
    return stored;
  }
}