/**
 * Integration tests for MCP server functionality
 * Tests Lahat's capabilities when exposed as an MCP server
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'assert';
import { 
  integrationTest, 
  wait,
  createMockFileStructure
} from '../helpers/test-utils.js';
import { LahatMCPServer } from '../../src/mcp-server/LahatMCPServer.js';
import { MCPServerManager } from '../../src/mcp-server/index.js';
import { LahatRuntime } from '../../src/runtime/LahatRuntime.js';

describe('MCP Server Integration', () => {
  test('should expose Lahat capabilities as MCP server', integrationTest('mcp-server-basic', async (t, { createTestDir }) => {
    // Setup
    const runtime = new LahatRuntime({ mode: 'test', mockMCP: true });
    const mcpServer = new LahatMCPServer(runtime, {
      name: 'test-lahat-server',
      port: 8765
    });
    
    // Start the MCP server
    await mcpServer.start();
    
    // Verify server is running
    const status = mcpServer.getStatus();
    assert.equal(status.isRunning, true);
    assert.equal(status.name, 'test-lahat-server');
    assert(status.capabilities.length > 0);
    
    // Test tool listing
    const tools = mcpServer._getAvailableTools();
    assert(tools.length > 0);
    
    // Verify we have core tools
    const toolNames = tools.map(t => t.name);
    assert(toolNames.includes('lahat:app:create'));
    assert(toolNames.includes('lahat:app:launch'));
    assert(toolNames.includes('lahat:app:install'));
    assert(toolNames.includes('lahat:project:package'));
    
    // Test resource listing
    const resources = mcpServer._getAvailableResources();
    assert(resources.length > 0);
    
    const resourceUris = resources.map(r => r.uri);
    assert(resourceUris.includes('lahat://apps/list'));
    assert(resourceUris.includes('lahat://platform/status'));
    
    // Test prompts listing
    const prompts = mcpServer._getAvailablePrompts();
    assert(prompts.length > 0);
    
    const promptNames = prompts.map(p => p.name);
    assert(promptNames.includes('create-app-prompt'));
    assert(promptNames.includes('debug-app-prompt'));
    
    // Cleanup
    await mcpServer.stop();
    
    console.log('✅ MCP server exposes Lahat capabilities correctly');
  }));

  test('should handle app creation via MCP tools', integrationTest('mcp-app-creation', async (t, { createTestDir }) => {
    // Setup
    const runtime = new LahatRuntime({ mode: 'test', mockMCP: true });
    const mcpServer = new LahatMCPServer(runtime);
    
    await mcpServer.start();
    
    // Test app creation tool with unique name
    const createArgs = {
      name: `test-mcp-app-${Date.now()}`,
      template: 'minimal',
      description: 'App created via MCP',
      author: 'MCP Test',
      permissions: ['lahat:storage']
    };
    
    const result = await mcpServer._executeTool('lahat:app:create', createArgs);
    
    assert.equal(result.success, true);
    assert.equal(result.projectName, createArgs.name);
    assert(result.projectPath);
    assert.equal(result.template, 'minimal');
    assert(result.createdAt);
    assert(Array.isArray(result.files));
    
    await mcpServer.stop();
    
    console.log('✅ MCP app creation tool works correctly');
  }));

  test('should handle project packaging via MCP tools', integrationTest('mcp-project-packaging', async (t, { createTestDir }) => {
    // Setup
    const projectDir = await createTestDir('mcp-package-test');
    
    // Create a mock project structure
    await createMockFileStructure(projectDir, {
      'package.json': JSON.stringify({
        name: 'test-package-app',
        version: '1.0.0',
        type: 'module',
        main: 'main.js'
      }),
      'lahat.config.js': 'export default { name: "test-package-app", permissions: ["lahat:storage"] };',
      'main.js': 'import { lahat } from "@lahat/runtime"; console.log("Hello from test app");'
    });
    
    const runtime = new LahatRuntime({ mode: 'test', mockMCP: true });
    const mcpServer = new LahatMCPServer(runtime);
    
    await mcpServer.start();
    
    // Test project packaging tool
    const packageArgs = {
      projectPath: projectDir,
      version: '1.0.0'
    };
    
    const result = await mcpServer._executeTool('lahat:project:package', packageArgs);
    
    assert.equal(result.success, true);
    assert.equal(result.projectPath, projectDir);
    assert(result.packagePath);
    assert.equal(result.version, '1.0.0');
    assert(result.packagedAt);
    
    await mcpServer.stop();
    
    console.log('✅ MCP project packaging tool works correctly');
  }));

  test('should provide resource access via MCP', integrationTest('mcp-resources', async (t, { createTestDir }) => {
    // Setup
    const runtime = new LahatRuntime({ mode: 'test', mockMCP: true });
    const mcpServer = new LahatMCPServer(runtime);
    
    await mcpServer.start();
    
    // Test platform status resource
    const statusResource = await mcpServer._readResource('lahat://platform/status');
    
    assert(statusResource.contents);
    assert(statusResource.contents.length > 0);
    assert.equal(statusResource.contents[0].type, 'text');
    
    const statusData = JSON.parse(statusResource.contents[0].text);
    assert.equal(statusData.isRunning, true);
    assert(statusData.version);
    assert(typeof statusData.uptime === 'number');
    assert(statusData.memoryUsage);
    
    // Test apps list resource
    const appsResource = await mcpServer._readResource('lahat://apps/list');
    
    assert(appsResource.contents);
    assert(appsResource.contents.length > 0);
    
    const appsData = JSON.parse(appsResource.contents[0].text);
    assert.equal(appsData.success, true);
    assert(Array.isArray(appsData.apps));
    
    await mcpServer.stop();
    
    console.log('✅ MCP resource access works correctly');
  }));

  test('should generate prompts via MCP', integrationTest('mcp-prompts', async (t, { createTestDir }) => {
    // Setup
    const runtime = new LahatRuntime({ mode: 'test', mockMCP: true });
    const mcpServer = new LahatMCPServer(runtime);
    
    await mcpServer.start();
    
    // Test create app prompt
    const createPromptArgs = {
      description: 'build a weather dashboard',
      complexity: 'medium'
    };
    
    const createPromptResult = await mcpServer._executePrompt('create-app-prompt', createPromptArgs);
    
    assert(createPromptResult.messages);
    assert(createPromptResult.messages.length > 0);
    assert.equal(createPromptResult.messages[0].role, 'user');
    assert(createPromptResult.messages[0].content.text.includes('weather dashboard'));
    assert(createPromptResult.messages[0].content.text.includes('@lahat/runtime'));
    
    // Test debug app prompt
    const debugPromptArgs = {
      appId: 'problematic-app',
      issue: 'app crashes on startup'
    };
    
    const debugPromptResult = await mcpServer._executePrompt('debug-app-prompt', debugPromptArgs);
    
    assert(debugPromptResult.messages);
    assert(debugPromptResult.messages.length > 0);
    assert(debugPromptResult.messages[0].content.text.includes('problematic-app'));
    assert(debugPromptResult.messages[0].content.text.includes('crashes on startup'));
    assert(debugPromptResult.messages[0].content.text.includes('lahat.config.js'));
    
    await mcpServer.stop();
    
    console.log('✅ MCP prompt generation works correctly');
  }));

  test('should handle MCP server manager lifecycle', integrationTest('mcp-server-manager', async (t, { createTestDir }) => {
    // Setup
    const runtime = new LahatRuntime({ mode: 'test', mockMCP: true });
    const manager = new MCPServerManager(runtime, {
      autoStart: false,
      enableDiscovery: false // Disable for testing
    });
    
    // Test initial state
    let status = manager.getStatus();
    assert.equal(status.isRunning, false);
    assert.equal(status.mcpServer, null);
    
    // Start the manager
    const startResult = await manager.start();
    
    assert.equal(startResult.success, true);
    assert(startResult.mcpServer);
    
    status = manager.getStatus();
    assert.equal(status.isRunning, true);
    assert(status.mcpServer);
    assert(status.capabilities.length > 0);
    
    // Get MCP server instance
    const mcpServer = manager.getMCPServer();
    assert(mcpServer);
    assert.equal(mcpServer.isRunning, true);
    
    // Stop the manager
    const stopResult = await manager.stop();
    
    assert.equal(stopResult.success, true);
    
    status = manager.getStatus();
    assert.equal(status.isRunning, false);
    assert.equal(status.mcpServer, null);
    
    console.log('✅ MCP server manager lifecycle works correctly');
  }));

  test('should handle errors gracefully in MCP operations', integrationTest('mcp-error-handling', async (t, { createTestDir }) => {
    // Setup
    const runtime = new LahatRuntime({ mode: 'test', mockMCP: true });
    const mcpServer = new LahatMCPServer(runtime);
    
    await mcpServer.start();
    
    // Test unknown tool error
    try {
      await mcpServer._executeTool('unknown:tool', {});
      assert.fail('Should have thrown error for unknown tool');
    } catch (error) {
      assert(error.message.includes('Unknown tool'));
    }
    
    // Test invalid resource error
    try {
      await mcpServer._readResource('lahat://invalid/resource');
      assert.fail('Should have thrown error for invalid resource');
    } catch (error) {
      assert(error.message.includes('Unknown resource'));
    }
    
    // Test unknown prompt error
    try {
      await mcpServer._executePrompt('unknown-prompt', {});
      assert.fail('Should have thrown error for unknown prompt');
    } catch (error) {
      assert(error.message.includes('Unknown prompt'));
    }
    
    // Test invalid app creation
    try {
      await mcpServer._executeTool('lahat:app:create', {
        // Missing required 'name' field
        template: 'minimal'
      });
      assert.fail('Should have thrown error for missing name');
    } catch (error) {
      assert(error.message.includes('name') || error.message.includes('required'));
    }
    
    await mcpServer.stop();
    
    console.log('✅ MCP error handling works correctly');
  }));
});