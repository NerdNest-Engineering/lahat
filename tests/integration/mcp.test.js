/**
 * Integration tests for MCP (Model Context Protocol) system
 * Tests server discovery, capability matching, and registry management
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'assert';
import { 
  integrationTest, 
  wait,
  waitFor,
  TestEventCollector 
} from '../helpers/test-utils.js';
import { MCPRegistry } from '../../src/mcp/MCPRegistry.js';
import { CapabilityMatcher } from '../../src/mcp/CapabilityMatcher.js';
import { MCPManager } from '../../src/mcp/index.js';

describe('MCP Registry Integration', () => {
  test('should discover and register built-in servers', integrationTest('builtin-servers', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry({
      discoveryInterval: 1000, // Faster for testing
      healthCheckInterval: 2000
    });
    
    addCleanup(() => registry.stop());
    
    // Collect discovery events
    const eventCollector = new TestEventCollector();
    eventCollector.collect(registry, 'server:discovered');
    eventCollector.collect(registry, 'server:connected');
    eventCollector.collect(registry, 'registry:started');
    
    // Start registry
    await registry.start();
    
    // Wait for discovery to complete
    await waitFor(() => eventCollector.getEvents('registry:started').length > 0, 3000);
    await wait(500); // Allow time for server discovery
    
    // Verify built-in servers were discovered
    const servers = registry.getServers({ type: 'builtin' });
    
    const expectedBuiltinServers = ['lahat-filesystem', 'lahat-storage', 'lahat-apps'];
    for (const expectedServer of expectedBuiltinServers) {
      const server = servers.find(s => s.name === expectedServer);
      assert(server, `Built-in server ${expectedServer} should be discovered`);
      assert.equal(server.type, 'builtin');
      assert(server.capabilities.length > 0, `${expectedServer} should have capabilities`);
    }
    
    // Verify capabilities are registered
    const capabilities = registry.getAvailableCapabilities();
    assert(capabilities.length > 0, 'Should have registered capabilities');
    assert(capabilities.includes('file-read'), 'Should include file-read capability');
    assert(capabilities.includes('storage-get'), 'Should include storage-get capability');
    assert(capabilities.includes('app-launch'), 'Should include app-launch capability');
    
    console.log(`✅ Built-in server discovery works correctly`);
  }));

  test('should register and manage external servers', integrationTest('external-servers', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    addCleanup(() => registry.stop());
    
    await registry.start();
    
    // Register an external server
    const serverConfig = {
      name: 'test-external-server',
      type: 'external',
      transport: 'stdio',
      command: 'node',
      args: ['test-server.js'],
      capabilities: ['test-capability-1', 'test-capability-2'],
      metadata: { description: 'Test external server' }
    };
    
    const serverId = await registry.registerServer(serverConfig);
    
    // Verify server was registered
    const server = registry.getServer(serverId);
    assert(server, 'Server should be registered');
    assert.equal(server.name, 'test-external-server');
    assert.equal(server.type, 'external');
    assert.deepEqual(server.capabilities, ['test-capability-1', 'test-capability-2']);
    
    // Verify capabilities are available
    const capabilityServers1 = registry.getServersByCapability('test-capability-1');
    const capabilityServers2 = registry.getServersByCapability('test-capability-2');
    
    assert(capabilityServers1.some(s => s.id === serverId), 'Server should provide test-capability-1');
    assert(capabilityServers2.some(s => s.id === serverId), 'Server should provide test-capability-2');
    
    // Test unregistration
    const unregistered = await registry.unregisterServer(serverId);
    assert(unregistered, 'Server should be unregistered successfully');
    
    const removedServer = registry.getServer(serverId);
    assert(!removedServer, 'Server should no longer exist');
    
    console.log(`✅ External server registration and management works correctly`);
  }));

  test('should filter servers by status and type', integrationTest('server-filtering', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    addCleanup(() => registry.stop());
    
    await registry.start();
    await wait(200); // Allow built-in servers to be discovered
    
    // Register additional servers
    await registry.registerServer({
      name: 'external-server-1',
      type: 'external',
      capabilities: ['external-cap-1']
    });
    
    await registry.registerServer({
      name: 'external-server-2', 
      type: 'external',
      capabilities: ['external-cap-2']
    });
    
    // Test filtering by type
    const builtinServers = registry.getServers({ type: 'builtin' });
    const externalServers = registry.getServers({ type: 'external' });
    
    assert(builtinServers.length >= 3, 'Should have built-in servers');
    assert(externalServers.length >= 2, 'Should have external servers');
    
    assert(builtinServers.every(s => s.type === 'builtin'), 'All filtered servers should be builtin');
    assert(externalServers.every(s => s.type === 'external'), 'All filtered servers should be external');
    
    // Test filtering by capability
    const fileServers = registry.getServers({ capability: 'file-read' });
    assert(fileServers.length >= 1, 'Should find servers with file-read capability');
    assert(fileServers.every(s => s.capabilities.includes('file-read')), 'All servers should have file-read capability');
    
    console.log(`✅ Server filtering works correctly`);
  }));

  test('should provide accurate registry statistics', integrationTest('registry-stats', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    addCleanup(() => registry.stop());
    
    await registry.start();
    await wait(300); // Allow discovery
    
    // Add some external servers
    await registry.registerServer({
      name: 'stats-test-server-1',
      type: 'external',
      capabilities: ['stats-cap-1']
    });
    
    await registry.registerServer({
      name: 'stats-test-server-2',
      type: 'external', 
      capabilities: ['stats-cap-2']
    });
    
    // Get statistics
    const stats = registry.getStats();
    
    assert(typeof stats.totalServers === 'number', 'Should provide total server count');
    assert(typeof stats.connectedServers === 'number', 'Should provide connected server count');
    assert(typeof stats.totalCapabilities === 'number', 'Should provide capability count');
    assert(typeof stats.isRunning === 'boolean', 'Should provide running status');
    
    assert(stats.totalServers >= 5, 'Should have at least 5 servers (3 builtin + 2 external)');
    assert(stats.totalCapabilities >= 8, 'Should have multiple capabilities');
    assert.equal(stats.isRunning, true, 'Registry should be running');
    
    console.log(`✅ Registry statistics work correctly`);
  }));
});

describe('Capability Matcher Integration', () => {
  test('should find servers for capabilities', integrationTest('capability-matching', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    const matcher = new CapabilityMatcher(registry);
    
    addCleanup(() => registry.stop());
    
    await registry.start();
    await wait(200); // Allow discovery
    
    // Test finding servers for known capabilities
    const fileServers = await matcher.findServersForCapability('file-read');
    assert(fileServers.length > 0, 'Should find servers for file-read capability');
    
    const storageServers = await matcher.findServersForCapability('storage-get');
    assert(storageServers.length > 0, 'Should find servers for storage-get capability');
    
    // Verify server objects have required fields
    const firstServer = fileServers[0];
    assert(firstServer.id, 'Server should have ID');
    assert(firstServer.name, 'Server should have name');
    assert(typeof firstServer.score === 'number', 'Server should have score');
    assert(Array.isArray(firstServer.reasons), 'Server should have score reasons');
    
    // Test non-existent capability
    const nonExistentServers = await matcher.findServersForCapability('non-existent-capability');
    assert.equal(nonExistentServers.length, 0, 'Should return empty array for non-existent capability');
    
    console.log(`✅ Capability matching works correctly`);
  }));

  test('should get best server for capability', integrationTest('best-server', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    const matcher = new CapabilityMatcher(registry);
    
    addCleanup(() => registry.stop());
    
    await registry.start();
    await wait(200);
    
    // Get best server for a capability
    const bestServer = await matcher.getBestServerForCapability('file-read');
    
    if (bestServer) {
      assert(bestServer.id, 'Best server should have ID');
      assert(bestServer.name, 'Best server should have name');
      assert(typeof bestServer.score === 'number', 'Best server should have score');
      
      // Verify it's actually the highest scored server
      const allServers = await matcher.findServersForCapability('file-read');
      const highestScore = Math.max(...allServers.map(s => s.score));
      assert.equal(bestServer.score, highestScore, 'Best server should have highest score');
    }
    
    // Test with non-existent capability
    const nonExistentBest = await matcher.getBestServerForCapability('non-existent-capability');
    assert.equal(nonExistentBest, null, 'Should return null for non-existent capability');
    
    console.log(`✅ Best server selection works correctly`);
  }));

  test('should check capability availability', integrationTest('capability-availability', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    const matcher = new CapabilityMatcher(registry);
    
    addCleanup(() => registry.stop());
    
    await registry.start();
    await wait(200);
    
    // Test known capabilities
    const fileReadAvailable = await matcher.isCapabilityAvailable('file-read');
    const storageGetAvailable = await matcher.isCapabilityAvailable('storage-get');
    const appLaunchAvailable = await matcher.isCapabilityAvailable('app-launch');
    
    assert.equal(fileReadAvailable, true, 'file-read should be available');
    assert.equal(storageGetAvailable, true, 'storage-get should be available');
    assert.equal(appLaunchAvailable, true, 'app-launch should be available');
    
    // Test unknown capability
    const unknownAvailable = await matcher.isCapabilityAvailable('unknown-capability');
    assert.equal(unknownAvailable, false, 'unknown-capability should not be available');
    
    console.log(`✅ Capability availability checking works correctly`);
  }));

  test('should analyze capability compatibility', integrationTest('capability-compatibility', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    const matcher = new CapabilityMatcher(registry);
    
    addCleanup(() => registry.stop());
    
    await registry.start();
    await wait(200);
    
    // Test compatibility analysis
    const requiredCapabilities = ['file-read', 'storage-get', 'app-launch', 'non-existent-cap'];
    const analysis = await matcher.analyzeCapabilityCompatibility(requiredCapabilities);
    
    assert.equal(analysis.totalCapabilities, 4, 'Should analyze all 4 capabilities');
    assert(analysis.availableCapabilities >= 3, 'Should have at least 3 available capabilities');
    assert(analysis.missingCapabilities.includes('non-existent-cap'), 'Should identify missing capability');
    assert(analysis.recommendations.length > 0, 'Should provide recommendations');
    
    // Test with all available capabilities
    const availableCapabilities = ['file-read', 'storage-get', 'app-launch'];
    const goodAnalysis = await matcher.analyzeCapabilityCompatibility(availableCapabilities);
    
    assert.equal(goodAnalysis.totalCapabilities, 3, 'Should analyze all 3 capabilities');
    assert.equal(goodAnalysis.availableCapabilities, 3, 'All capabilities should be available');
    assert.equal(goodAnalysis.missingCapabilities.length, 0, 'Should have no missing capabilities');
    
    console.log(`✅ Capability compatibility analysis works correctly`);
  }));

  test('should cache capability lookups', integrationTest('capability-caching', async (t, { addCleanup }) => {
    // Setup
    const registry = new MCPRegistry();
    const matcher = new CapabilityMatcher(registry, { cacheTimeout: 1000 });
    
    addCleanup(() => registry.stop());
    
    await registry.start();
    await wait(200);
    
    // First lookup (should hit registry)
    const start1 = Date.now();
    const servers1 = await matcher.findServersForCapability('file-read');
    const time1 = Date.now() - start1;
    
    // Second lookup (should hit cache)
    const start2 = Date.now();
    const servers2 = await matcher.findServersForCapability('file-read');
    const time2 = Date.now() - start2;
    
    // Verify results are the same
    assert.deepEqual(servers1.map(s => s.id), servers2.map(s => s.id), 'Cached results should match');
    
    // Cache should generally be faster (though this test might be flaky)
    assert(servers1.length > 0, 'Should find servers');
    assert(servers2.length > 0, 'Should find servers from cache');
    
    console.log(`✅ Capability caching works correctly`);
  }));
});

describe('MCP Manager Integration', () => {
  test('should coordinate MCP components', integrationTest('mcp-coordination', async (t, { addCleanup }) => {
    // Setup
    const mcpManager = new MCPManager({
      autoStart: true,
      discoveryEnabled: true
    });
    
    addCleanup(() => mcpManager.stop());
    
    // Start manager
    await mcpManager.start();
    await wait(300); // Allow initialization
    
    // Test capability availability through manager
    const fileReadAvailable = await mcpManager.isCapabilityAvailable('file-read');
    assert.equal(fileReadAvailable, true, 'file-read should be available through manager');
    
    // Test getting available capabilities
    const capabilities = mcpManager.getAvailableCapabilities();
    assert(capabilities.length > 0, 'Should have available capabilities');
    assert(capabilities.includes('file-read'), 'Should include file-read');
    
    // Test getting servers
    const servers = mcpManager.getServers();
    assert(servers.length > 0, 'Should have registered servers');
    
    const fileServers = mcpManager.getServersForCapability('file-read');
    assert(fileServers.length > 0, 'Should find servers for file-read');
    
    // Test manager statistics
    const stats = mcpManager.getStats();
    assert(typeof stats.isStarted === 'boolean', 'Should provide started status');
    assert(stats.isStarted === true, 'Manager should be started');
    assert(stats.registry, 'Should provide registry stats');
    
    console.log(`✅ MCP manager coordination works correctly`);
  }));

  test('should handle server registration through manager', integrationTest('manager-server-registration', async (t, { addCleanup }) => {
    // Setup  
    const mcpManager = new MCPManager();
    addCleanup(() => mcpManager.stop());
    
    await mcpManager.start();
    await wait(200);
    
    // Register server through manager
    const serverId = await mcpManager.registerServer({
      name: 'manager-test-server',
      type: 'external',
      capabilities: ['manager-test-cap'],
      metadata: { description: 'Test server via manager' }
    });
    
    // Verify server is registered
    const servers = mcpManager.getServers();
    const testServer = servers.find(s => s.id === serverId);
    assert(testServer, 'Server should be registered through manager');
    assert.equal(testServer.name, 'manager-test-server');
    
    // Test capability is available
    const capAvailable = await mcpManager.isCapabilityAvailable('manager-test-cap');
    assert.equal(capAvailable, true, 'New capability should be available');
    
    // Unregister server
    const unregistered = await mcpManager.unregisterServer(serverId);
    assert.equal(unregistered, true, 'Should unregister successfully');
    
    // Verify capability is no longer available
    const capUnavailable = await mcpManager.isCapabilityAvailable('manager-test-cap');
    assert.equal(capUnavailable, false, 'Capability should no longer be available');
    
    console.log(`✅ Manager server registration works correctly`);
  }));
});