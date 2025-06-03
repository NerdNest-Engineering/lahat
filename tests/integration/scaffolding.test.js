/**
 * Integration tests for project scaffolding system
 * Tests the end-to-end flow of generating mini app projects
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { 
  integrationTest, 
  assertFileExists, 
  assertDirectoryContains, 
  assertFileContains 
} from '../helpers/test-utils.js';
import { ProjectGenerator } from '../../src/scaffolding/ProjectGenerator.js';

describe('Project Scaffolding Integration', () => {
  test('should generate minimal project with all required files', integrationTest('minimal-project', async (t, { createTestDir }) => {
    // Setup
    const outputDir = await createTestDir('scaffolding-minimal');
    const generator = new ProjectGenerator({ outputDir });
    
    // Execute
    const projectPath = await generator.generateProject({
      name: 'test-minimal-app',
      template: 'minimal',
      description: 'A test minimal app',
      author: 'Test Author'
    });
    
    // Verify project structure
    await assertFileExists(projectPath, 'Project directory should exist');
    
    const expectedFiles = [
      'main.js',
      'package.json',
      'lahat.config.js',
      'README.md'
    ];
    
    await assertDirectoryContains(projectPath, expectedFiles);
    
    // Verify package.json content
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    assert.equal(packageJson.name, 'test-minimal-app');
    assert.equal(packageJson.type, 'module');
    assert(packageJson.dependencies['@lahat/runtime']);
    
    // Verify main.js contains LahatAPI import
    await assertFileContains(
      path.join(projectPath, 'main.js'),
      'import { LahatAPI } from \'@lahat/runtime\';'
    );
    
    // Verify config file
    await assertFileContains(
      path.join(projectPath, 'lahat.config.js'),
      'export default'
    );
    
    console.log(`✅ Minimal project generated successfully at: ${projectPath}`);
  }));

  test('should generate ui-focused project with additional files', integrationTest('ui-focused-project', async (t, { createTestDir }) => {
    // Setup
    const outputDir = await createTestDir('scaffolding-ui');
    const generator = new ProjectGenerator({ outputDir });
    
    // Execute
    const projectPath = await generator.generateProject({
      name: 'test-ui-app',
      template: 'ui-focused',
      description: 'A test UI-focused app',
      author: 'Test Author'
    });
    
    // Verify UI-specific files
    const expectedFiles = [
      'main.js',
      'package.json',
      'styles.css',
      'index.html'
    ];
    
    await assertDirectoryContains(projectPath, expectedFiles);
    
    // Verify HTML file
    await assertFileContains(
      path.join(projectPath, 'index.html'),
      '<html'
    );
    
    // Verify CSS file
    await assertFileContains(
      path.join(projectPath, 'styles.css'),
      'body'
    );
    
    console.log(`✅ UI-focused project generated successfully at: ${projectPath}`);
  }));

  test('should generate mcp-enabled project with MCP configuration', integrationTest('mcp-enabled-project', async (t, { createTestDir }) => {
    // Setup
    const outputDir = await createTestDir('scaffolding-mcp');
    const generator = new ProjectGenerator({ outputDir });
    
    // Execute
    const projectPath = await generator.generateProject({
      name: 'test-mcp-app',
      template: 'mcp-enabled',
      description: 'A test MCP-enabled app',
      author: 'Test Author',
      mcpRequirements: ['ai-text-generation', 'file-operations']
    });
    
    // Verify MCP-specific configuration
    const configPath = path.join(projectPath, 'lahat.config.js');
    await assertFileContains(configPath, 'mcpRequirements');
    
    // Verify main.js has MCP usage
    await assertFileContains(
      path.join(projectPath, 'main.js'),
      'this.lahat.mcp'
    );
    
    console.log(`✅ MCP-enabled project generated successfully at: ${projectPath}`);
  }));

  test('should handle custom permissions in generated projects', integrationTest('custom-permissions', async (t, { createTestDir }) => {
    // Setup
    const outputDir = await createTestDir('scaffolding-permissions');
    const generator = new ProjectGenerator({ outputDir });
    
    const customPermissions = ['lahat:storage', 'lahat:filesystem', 'lahat:network'];
    
    // Execute
    const projectPath = await generator.generateProject({
      name: 'test-permissions-app',
      template: 'minimal',
      permissions: customPermissions,
      author: 'Test Author'
    });
    
    // Verify permissions in config
    const configPath = path.join(projectPath, 'lahat.config.js');
    const configContent = await fs.readFile(configPath, 'utf8');
    
    // Import and check the config
    const configModule = await import(`file://${configPath}?t=${Date.now()}`);
    const config = configModule.default;
    
    assert.deepEqual(config.permissions, customPermissions);
    
    console.log(`✅ Custom permissions project generated successfully`);
  }));

  test('should prevent duplicate project names in same directory', integrationTest('duplicate-names', async (t, { createTestDir }) => {
    // Setup
    const outputDir = await createTestDir('scaffolding-duplicate');
    const generator = new ProjectGenerator({ outputDir });
    
    // Create first project
    await generator.generateProject({
      name: 'duplicate-test',
      template: 'minimal',
      author: 'Test Author'
    });
    
    // Try to create second project with same name
    try {
      await generator.generateProject({
        name: 'duplicate-test',
        template: 'minimal',
        author: 'Test Author'
      });
      assert.fail('Should have thrown error for duplicate project name');
    } catch (error) {
      assert(error.message.includes('already exists'));
    }
    
    console.log(`✅ Duplicate name prevention works correctly`);
  }));

  test('should validate required configuration fields', integrationTest('config-validation', async (t, { createTestDir }) => {
    // Setup
    const outputDir = await createTestDir('scaffolding-validation');
    const generator = new ProjectGenerator({ outputDir });
    
    // Test missing name
    try {
      await generator.generateProject({
        template: 'minimal',
        author: 'Test Author'
      });
      assert.fail('Should have thrown error for missing name');
    } catch (error) {
      assert(error.message.includes('name is required'));
    }
    
    // Test invalid template
    try {
      await generator.generateProject({
        name: 'test-app',
        template: 'nonexistent-template',
        author: 'Test Author'
      });
      assert.fail('Should have thrown error for invalid template');
    } catch (error) {
      assert(error.message.includes('Template') || error.message.includes('template'));
    }
    
    console.log(`✅ Configuration validation works correctly`);
  }));

  test('should replace template variables correctly', integrationTest('template-variables', async (t, { createTestDir }) => {
    // Setup
    const outputDir = await createTestDir('scaffolding-variables');
    const generator = new ProjectGenerator({ outputDir });
    
    const projectConfig = {
      name: 'my-awesome-app',
      template: 'minimal',
      description: 'My awesome test application',
      author: 'Jane Developer'
    };
    
    // Execute
    const projectPath = await generator.generateProject(projectConfig);
    
    // Verify variable substitution in package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    assert.equal(packageJson.name, 'my-awesome-app');
    assert.equal(packageJson.description, 'My awesome test application');
    assert.equal(packageJson.author, 'Jane Developer');
    
    // Verify class name conversion (my-awesome-app -> MyAwesomeApp)
    const mainJsContent = await fs.readFile(path.join(projectPath, 'main.js'), 'utf8');
    assert(mainJsContent.includes('class MyAwesomeApp'));
    
    // Verify README contains correct project name
    await assertFileContains(
      path.join(projectPath, 'README.md'),
      'my-awesome-app'
    );
    
    console.log(`✅ Template variable replacement works correctly`);
  }));
});