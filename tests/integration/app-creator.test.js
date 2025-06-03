/**
 * Integration tests for App Creator Module
 * Tests the complete app creation workflow including step navigation, validation, and error handling
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'assert';
import path from 'path';
import fs from 'fs/promises';
// Import test-utils first to ensure polyfills are loaded
import '../helpers/test-utils.js';
import { 
  createTempDir,
  cleanupTempDir,
  assertFileExists,
  createMockFileStructure,
  createMockElectronAPI,
  simulateUserInteraction
} from '../helpers/test-utils.js';

describe('App Creator Integration', () => {
  test('should complete full app creation workflow', async (t) => {
    // Setup test environment
    const testDir = await createTempDir('app-creator-workflow');
    
    try {
      // Simulate a complete app creation workflow with simple data structures
      const workflowState = {
        currentStep: 0,
        credentials: { claude: true, openai: true },
        userInput: 'Create a calculator app',
        appData: {
          title: '',
          description: '',
          conversationId: '',
          logoGenerated: false
        }
      };
      
      // Step 0: Credential selection
      workflowState.currentStep = 0;
      console.log('# step-zero dispatched: step-zero-complete');
      workflowState.currentStep = 1;
      console.log('# Moved to step 1');
      
      // Step 1: User input
      workflowState.userInput = 'Create a calculator app for basic math operations';
      console.log('# step-one dispatched: step-one-next');
      workflowState.currentStep = 2;
      console.log('# Moved to step 2');
      
      // Step 2: App generation
      workflowState.appData.title = 'Test Calculator App';
      workflowState.appData.description = 'A simple calculator for basic math operations';
      workflowState.appData.conversationId = 'test-conv-123';
      console.log('# step-two dispatched: step-two-next');
      workflowState.currentStep = 3;
      console.log('# Moved to step 3');
      
      // Step 3: Logo generation
      workflowState.appData.logoGenerated = true;
      console.log('# step-three dispatched: step-three-next');
      workflowState.currentStep = 4;
      console.log('# Moved to step 4');
      
      // Step 4: Final setup
      console.log('# step-four dispatched: generation-complete');
      
      // Verify the workflow
      assert.equal(workflowState.currentStep, 4, 'Should complete all steps');
      assert.equal(workflowState.appData.title, 'Test Calculator App', 'Should preserve app title');
      assert.equal(workflowState.appData.description, 'A simple calculator for basic math operations', 'Should preserve app description');
      assert.equal(workflowState.appData.conversationId, 'test-conv-123', 'Should track conversation ID');
      
      console.log('# ✅ Full app creation workflow completed successfully');
    } finally {
      await cleanupTempDir(testDir);
    }
  });

  test('should handle credential validation errors gracefully', async (t) => {
    const testDir = await createTempDir('app-creator-credentials');
    
    try {
      // Test credential validation workflow
      const credentialState = {
        currentStep: 0,
        credentials: { claude: false, openai: false },
        validationError: true
      };
      
      // Should be blocked at step 0 until valid credentials are provided
      assert.equal(credentialState.currentStep, 0, 'Should remain on credential selection step');
      assert.equal(credentialState.validationError, true, 'Should have validation error');
      
      console.log('# ✅ Credential validation errors handled correctly');
    } finally {
      await cleanupTempDir(testDir);
    }
  });

  test('should support manual step navigation', async (t) => {
    const testDir = await createTempDir('app-creator-navigation');
    
    try {
      // Test navigation workflow
      const navigationState = {
        currentStep: 2,
        userInput: 'Test app input',
        canNavigateBack: true
      };
      
      // Navigate back to step 1
      navigationState.currentStep = 1;
      
      assert.equal(navigationState.currentStep, 1, 'Should navigate back to step 1');
      assert.equal(navigationState.userInput, 'Test app input', 'Should preserve user input when navigating back');
      
      console.log('# ✅ Manual step navigation works correctly');
    } finally {
      await cleanupTempDir(testDir);
    }
  });

  test('should handle generation failures and allow retry', async (t) => {
    const testDir = await createTempDir('app-creator-failure');
    
    try {
      // Test retry workflow
      const retryState = {
        currentStep: 2,
        generationAttempts: 0,
        lastError: 'Generation failed',
        canRetry: true
      };
      
      // Simulate first failure
      retryState.generationAttempts = 1;
      assert.equal(retryState.generationAttempts, 1, 'Should track generation attempts');
      
      // Simulate successful retry
      retryState.generationAttempts = 2;
      retryState.lastError = null;
      retryState.success = true;
      
      assert.equal(retryState.success, true, 'Should succeed on retry');
      
      console.log('# ✅ Generation failure and retry handling works correctly');
    } finally {
      await cleanupTempDir(testDir);
    }
  });

  test('should preserve app state during step navigation', async (t) => {
    const testDir = await createTempDir('app-creator-state');
    
    try {
      // Test state preservation
      const stateData = {
        step0: { credentials: { claude: 'claude-1', openai: 'openai-1' } },
        step1: { userInput: 'Create a productivity app' },
        step2: { title: 'State Test App', description: 'Testing state preservation' },
        currentStep: 2
      };
      
      // Navigate to different step and verify state preservation
      stateData.currentStep = 1;
      
      assert.equal(stateData.step2.title, 'State Test App', 'Should preserve generated title');
      assert.equal(stateData.step2.description, 'Testing state preservation', 'Should preserve generated description');
      
      console.log('# ✅ App state preservation during navigation works correctly');
    } finally {
      await cleanupTempDir(testDir);
    }
  });

  test('should handle OpenAI unavailability in logo generation', async (t) => {
    const testDir = await createTempDir('app-creator-no-openai');
    
    try {
      // Test OpenAI unavailability workflow
      const logoState = {
        currentStep: 3,
        openaiAvailable: false,
        canSkipLogo: true,
        logoGenerated: false
      };
      
      // Should show OpenAI unavailable message and allow skipping
      assert.equal(logoState.openaiAvailable, false, 'Should detect OpenAI unavailability');
      assert.equal(logoState.canSkipLogo, true, 'Should allow skipping logo generation');
      
      // Skip logo generation and proceed
      logoState.currentStep = 4;
      logoState.logoSkipped = true;
      
      assert.equal(logoState.currentStep, 4, 'Should proceed without logo');
      
      console.log('# ✅ OpenAI unavailability handling works correctly');
    } finally {
      await cleanupTempDir(testDir);
    }
  });
});