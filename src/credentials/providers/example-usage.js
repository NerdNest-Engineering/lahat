/**
 * Example usage of the provider system
 * This demonstrates how to use the flexible credential provider architecture
 */

import { providerRegistry } from './ProviderRegistry.js';

// Example 1: Get all providers and their UI configurations
console.log('=== All Providers ===');
const allProviders = providerRegistry.getAllProviders();
allProviders.forEach(provider => {
  console.log(`${provider.getDisplayName()} (${provider.getId()})`);
  console.log('Fields:', provider.getFields().map(f => f.name));
  console.log('Branding:', provider.getBranding().primaryColor);
  console.log('---');
});

// Example 2: Validate credentials for different providers
console.log('=== Validation Examples ===');

// Anthropic validation
const anthropicCredentials = {
  apiKey: 'sk-ant-api03-valid-key-here-with-100-characters-minimum-length-requirement-met-properly'
};
const anthropicValidation = providerRegistry.validateCredentials('anthropic', anthropicCredentials);
console.log('Anthropic validation:', anthropicValidation);

// OpenAI validation with organization
const openaiCredentials = {
  apiKey: 'sk-validopenaikeywith48pluscharactershere123456789',
  organization: 'org-example123'
};
const openaiValidation = providerRegistry.validateCredentials('openai', openaiCredentials);
console.log('OpenAI validation:', openaiValidation);

// S3 validation with multiple fields
const s3Credentials = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'us-west-2',
  bucketName: 'my-example-bucket'
};
const s3Validation = providerRegistry.validateCredentials('amazon-s3', s3Credentials);
console.log('S3 validation:', s3Validation);

// Example 3: Test credentials (async)
async function testCredentials() {
  console.log('=== Testing Credentials ===');
  
  // Test Anthropic (this would make an actual API call)
  try {
    const anthropicTest = await providerRegistry.testCredentials('anthropic', anthropicCredentials);
    console.log('Anthropic test:', anthropicTest);
  } catch (error) {
    console.log('Anthropic test error:', error.message);
  }
  
  // Test S3
  try {
    const s3Test = await providerRegistry.testCredentials('amazon-s3', s3Credentials);
    console.log('S3 test:', s3Test);
  } catch (error) {
    console.log('S3 test error:', error.message);
  }
}

// Example 4: Get UI configuration for rendering forms
console.log('=== UI Configuration ===');
const anthropicUI = providerRegistry.getProviderUIConfig('anthropic');
console.log('Anthropic UI config:', {
  displayName: anthropicUI.description,
  primaryColor: anthropicUI.branding.primaryColor,
  fields: anthropicUI.fields.map(f => ({
    name: f.name,
    type: f.type,
    label: f.label,
    required: f.required
  }))
});

// Example 5: Dynamic form generation example
function generateFormConfig(providerId) {
  const provider = providerRegistry.getProvider(providerId);
  if (!provider) return null;
  
  const branding = provider.getBranding();
  const fields = provider.getFields();
  const uiConfig = provider.getUIConfig();
  
  return {
    id: providerId,
    title: provider.getDisplayName(),
    description: uiConfig.description,
    styling: {
      primaryColor: branding.primaryColor,
      css: branding.css
    },
    fields: fields.map(field => ({
      name: field.name,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder,
      required: field.required,
      helpText: field.helpText,
      validation: {
        minLength: field.minLength,
        maxLength: field.maxLength,
        pattern: field.pattern?.toString(),
        patternMessage: field.patternMessage
      },
      options: field.options // For select fields
    })),
    actions: {
      save: uiConfig.text.saveButton,
      clear: uiConfig.text.clearButton,
      test: uiConfig.text.testButton
    }
  };
}

// Generate form configs for all providers
console.log('=== Dynamic Form Configurations ===');
providerRegistry.getProviderIds().forEach(providerId => {
  const formConfig = generateFormConfig(providerId);
  console.log(`${providerId} form config:`, formConfig);
});

// Run async tests
testCredentials();

export { generateFormConfig };